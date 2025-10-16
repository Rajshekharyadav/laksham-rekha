import type { Express } from "express";
import { createServer, type Server } from "http";
import { parseSchemesCSV, parseCrimePDF, getStateCoordinates } from "./lib/data-parser";
import { analyzeSafetyRisk, getCropRecommendations, predictDisasterRisk } from "./lib/gemini";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

// Cache for parsed data
let schemesCache: any[] = [];
let crimeDataCache: any[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data on server start
  try {
    schemesCache = await parseSchemesCSV();
    const crimeData = await parseCrimePDF();
    crimeDataCache = crimeData.map(crime => ({
      ...crime,
      location: getStateCoordinates(crime.state),
    }));
    console.log(`✅ Loaded ${schemesCache.length} schemes and ${crimeDataCache.length} crime zones`);
  } catch (error) {
    console.error('❌ Data loading error:', error);
    // Set fallback data to prevent crashes
    schemesCache = [];
    crimeDataCache = [];
  }

  // POST /api/auth/signup - User registration
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, phoneNumber, password, authProvider } = req.body;

      // Validate required fields based on auth provider
      if (authProvider === 'username' && (!username || !password)) {
        return res.status(400).json({ error: 'Username and password required' });
      }
      if (authProvider === 'google' && !email) {
        return res.status(400).json({ error: 'Email required for Google auth' });
      }
      if (authProvider === 'phone' && !phoneNumber) {
        return res.status(400).json({ error: 'Phone number required' });
      }

      // Check if user already exists
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(409).json({ error: 'Username already exists' });
        }
      }
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }
      if (phoneNumber) {
        const existingUser = await storage.getUserByPhone(phoneNumber);
        if (existingUser) {
          return res.status(409).json({ error: 'Phone number already exists' });
        }
      }

      // Hash password if provided
      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      // Create user
      const userData = insertUserSchema.parse({
        username: username || null,
        email: email || null,
        phoneNumber: phoneNumber || null,
        passwordHash,
        displayName: username || email?.split('@')[0] || null,
        authProvider: authProvider || 'username',
      });

      const user = await storage.createUser(userData);
      
      // Don't send password hash to client
      const { passwordHash: _, ...userResponse } = user;
      res.status(201).json({ user: userResponse });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ error: error.message || 'Failed to create user' });
    }
  });

  // POST /api/auth/login - User login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, email, phoneNumber, password } = req.body;

      // Find user by username, email, or phone
      let user;
      if (username) {
        user = await storage.getUserByUsername(username);
      } else if (email) {
        user = await storage.getUserByEmail(email);
      } else if (phoneNumber) {
        user = await storage.getUserByPhone(phoneNumber);
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password if user has password auth
      if (user.passwordHash && password) {
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      } else if (user.passwordHash && !password) {
        return res.status(401).json({ error: 'Password required' });
      }

      // Don't send password hash to client
      const { passwordHash: _, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message || 'Failed to login' });
    }
  });

  // GET /api/schemes - Fetch government schemes with filters
  app.get("/api/schemes", async (req, res) => {
    try {
      const { search, category, level } = req.query;
      
      let filtered = [...schemesCache];
      
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(s => 
          s.name.toLowerCase().includes(searchLower) ||
          s.details.toLowerCase().includes(searchLower)
        );
      }
      
      if (category && category !== 'all') {
        filtered = filtered.filter(s => 
          s.category?.toLowerCase() === (category as string).toLowerCase()
        );
      }
      
      if (level && level !== 'all') {
        filtered = filtered.filter(s => 
          s.level?.toLowerCase() === (level as string).toLowerCase()
        );
      }
      
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch schemes' });
    }
  });

  // GET /api/crime-zones - Fetch danger zones with optional filters
  app.get("/api/crime-zones", async (req, res) => {
    try {
      const { state, search, riskLevel } = req.query;
      
      let filtered = [...crimeDataCache];
      
      // Filter by state
      if (state && state !== 'all') {
        filtered = filtered.filter(zone => 
          zone.state.toLowerCase() === (state as string).toLowerCase()
        );
      }
      
      // Search across state names
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(zone => 
          zone.state.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by risk level
      if (riskLevel && riskLevel !== 'all') {
        filtered = filtered.filter(zone => 
          zone.riskLevel === riskLevel
        );
      }
      
      // Sort by total crimes (descending)
      filtered.sort((a, b) => b.totalCrimes - a.totalCrimes);
      
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch crime zones' });
    }
  });
  
  // GET /api/crime-zones/:state - Get specific state crime data
  app.get("/api/crime-zones/:state", async (req, res) => {
    try {
      const stateName = req.params.state.toUpperCase();
      const stateData = crimeDataCache.find(zone => 
        zone.state.toUpperCase() === stateName
      );
      
      if (!stateData) {
        return res.status(404).json({ error: 'State data not found' });
      }
      
      res.json(stateData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch state data' });
    }
  });

  // POST /api/analyze-location - Analyze safety risk for location
  app.post("/api/analyze-location", async (req, res) => {
    try {
      const { lat, lng, state } = req.body;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Location coordinates required' });
      }
      
      const analysis = await analyzeSafetyRisk({ lat, lng, state });
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: 'Failed to analyze location' });
    }
  });

  // POST /api/safety-checkin - Save safety check-in (handled by Firebase client SDK)
  app.post("/api/safety-checkin", async (req, res) => {
    try {
      const { userId, location, status, zoneRiskLevel } = req.body;
      
      if (!userId || !location || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Safety check-ins are handled by Firebase client SDK on frontend
      res.json({ success: true, message: 'Check-in acknowledged' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process check-in' });
    }
  });

  // GET /api/safety-history/:userId - Get user's safety history (handled by Firebase client SDK)
  app.get("/api/safety-history/:userId", async (req, res) => {
    try {
      // Safety history is accessed through Firebase client SDK on frontend
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // GET /api/weather - Fetch weather data from OpenWeatherMap
  app.get("/api/weather", async (req, res) => {
    try {
      const { lat, lng, location } = req.query;
      const apiKey = process.env.OPENWEATHER_API_KEY;
      
      if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY_HERE') {
        console.log('Using fallback weather data - API key not configured');
        // Fallback weather data
        return res.json({
          location: location || 'New Delhi, IN',
          temperature: 28,
          condition: 'Clear',
          description: 'clear sky',
          humidity: 65,
          windSpeed: 12,
          pressure: 1013,
          visibility: 10,
          icon: '01d',
          coords: { lat: lat || 28.7041, lng: lng || 77.1025 }
        });
      }
      
      let weatherUrl;
      if (lat && lng) {
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      } else if (location) {
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;
      } else {
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=New Delhi&appid=${apiKey}&units=metric`;
      }
      
      const response = await fetch(weatherUrl);
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }
      
      const data = await response.json();
      
      const weatherData = {
        location: data.name + ', ' + data.sys.country,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
        icon: data.weather[0].icon,
        coords: { lat: data.coord.lat, lng: data.coord.lon }
      };
      
      res.json(weatherData);
    } catch (error) {
      console.error('Weather API error:', error);
      const { lat, lng, location } = req.query;
      // Return fallback data on error
      res.json({
        location: (location as string) || 'New Delhi, IN',
        temperature: 28,
        condition: 'Clear',
        description: 'clear sky',
        humidity: 65,
        windSpeed: 12,
        pressure: 1013,
        visibility: 10,
        icon: '01d',
        coords: { lat: parseFloat((lat as string) || '28.7041'), lng: parseFloat((lng as string) || '77.1025') }
      });
    }
  });

  // POST /api/predict-disaster - AI disaster prediction
  app.post("/api/predict-disaster", async (req, res) => {
    try {
      const { location, temperature, humidity, rainfall } = req.body;
      
      const prediction = await predictDisasterRisk({
        location,
        temperature,
        humidity,
        rainfall
      });
      
      res.json(prediction);
    } catch (error) {
      res.status(500).json({ error: 'Failed to predict disaster' });
    }
  });

  // GET /api/crop-recommendations - Get AI crop recommendations
  app.get("/api/crop-recommendations", async (req, res) => {
    try {
      const { district, state, soilType, fertilityRating } = req.query;
      
      if (!district || !state) {
        return res.status(400).json({ error: 'District and state required' });
      }
      
      const recommendations = await getCropRecommendations({
        district: district as string,
        state: state as string,
        soilType: (soilType as string) || 'Loam',
        fertilityRating: parseFloat(fertilityRating as string) || 8.0
      });
      
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  });

  // POST /api/analyze-crop-disease - Crop disease detection (placeholder)
  app.post("/api/analyze-crop-disease", async (req, res) => {
    try {
      // This would use OpenAI vision API to analyze leaf images
      // Placeholder for now
      res.json({
        disease: 'Feature coming soon',
        confidence: 0,
        treatment: 'Upload functionality will be available in next update'
      });
    } catch (error) {
      res.status(500).json({ error: 'Feature not available' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
