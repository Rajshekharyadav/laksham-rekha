# Sarthi - Predictive AI Safety Net

## Overview

Sarthi is a comprehensive safety platform designed to protect vulnerable communities through AI-powered predictions and real-time alerts. The system focuses on three core areas:

1. **Women Safety & Empowerment** - Government schemes database, danger zone mapping, and emergency alert system
2. **Disaster Management** - Weather forecasting, disaster risk prediction, and location-based alerts
3. **Farmer Support** - AI-powered crop recommendations based on soil fertility and weather predictions

The platform uses predictive AI models to forecast potential risks before they happen, enabling proactive safety measures and informed decision-making.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 + TypeScript with Vite as the build tool

**UI Component Library**: Radix UI primitives with Shadcn/ui components for consistent, accessible design

**Styling**: Tailwind CSS with custom design system following Material Design principles adapted for emergency/safety contexts

**State Management**: 
- TanStack Query (React Query) for server state management with infinite stale time
- React Context API for authentication state
- Local React state for component-level UI state

**Routing**: Wouter (lightweight client-side routing)

**Key Design Patterns**:
- Protected routes requiring authentication before access
- Real-time location tracking with geolocation API
- Responsive mobile-first design optimized for emergency access
- Dark/light mode support with theme persistence

### Backend Architecture

**Runtime**: Node.js with Express.js server

**API Design**: RESTful endpoints with JSON responses

**Data Processing**:
- CSV parsing with Papa Parse for government schemes and crime data
- Custom coordinate mapping for Indian states and districts
- In-memory data caching for performance (schemes, crime zones, disaster data)

**Server Structure**:
- Vite middleware integration for development HMR
- Custom error handling middleware
- Request/response logging for API routes
- Static file serving in production

### Authentication & User Management

**Primary Auth**: Firebase Authentication with multiple providers:
- Google Sign-In (popup for desktop, redirect for mobile)
- Username/password authentication
- Phone number authentication (planned)

**User Storage**: 
- In-memory storage implementation (`MemStorage`) for development
- User data includes: id, username, email, phone number, display name, photo URL, auth provider, location
- Schema supports PostgreSQL migration path via Drizzle ORM

**Session Management**: 
- Firebase client-side session tokens
- User data cached in localStorage for persistence
- Auth state synchronized via Firebase `onAuthStateChanged`

### AI & Prediction Models

**AI Provider**: Google Gemini (primary) with OpenAI GPT-4 fallback

**AI Capabilities**:
- Safety risk analysis based on location and crime data
- Crop recommendations using soil type, fertility, and weather predictions
- Disaster risk prediction from weather patterns

**Model Configuration**:
- Gemini Pro for general predictions
- Structured JSON output for consistent parsing
- Error handling with fallback responses

### Data Storage & Schema

**Database**: PostgreSQL via Drizzle ORM (configured but optional for development)

**Schema Tables**:
- `users` - Multi-auth user profiles with location data
- `schemes` - Government women empowerment schemes
- `crime_zones` - Crime statistics with risk levels and coordinates
- `disasters` - Weather and disaster event data with severity ratings

**Data Sources**:
- Government schemes CSV (150+ schemes)
- Crime statistics CSV with state/district data
- Disaster records CSV with location mapping
- Weather API integration for real-time forecasts

### Maps & Geolocation

**Mapping Library**: Leaflet.js with OpenStreetMap tiles

**Location Features**:
- Real-time user location tracking
- Crime danger zones with color-coded risk levels (low/medium/high/critical)
- Distance calculations using Haversine formula
- Automatic safety alerts when entering high-risk zones

**Risk Detection**:
- Continuous location monitoring via Geolocation API
- 5km radius danger zone detection
- Visual and audio emergency alerts
- 30-second countdown with auto-SOS if no response

### Emergency Alert System

**Alert Mechanism**:
- Modal-based emergency countdown system
- Audio alarm playback for critical alerts
- Automatic SOS call trigger after timeout
- Safety check-in history (planned Firebase Firestore integration)

**User Interaction**:
- "I'm Safe" confirmation to cancel alert
- "Send Help" for immediate emergency response
- Location data included in emergency notifications

## External Dependencies

### Third-party APIs

**Firebase Services**:
- Firebase Authentication (Google, email/password, phone)
- Firebase Firestore (planned for safety check-ins and user data)
- Firebase Admin SDK (server-side operations)

**Weather Data**:
- Weather API integration for real-time forecasts
- 5-day weather predictions
- Location-based weather alerts

**Google Services**:
- Google Gemini AI API for predictions
- Google Maps coordinate services (implicit)

### Key NPM Packages

**UI & Styling**:
- `@radix-ui/*` - Accessible UI primitives (20+ components)
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Component variant management
- `lucide-react` - Icon library

**Data & State**:
- `@tanstack/react-query` - Server state management
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `drizzle-orm` - Database ORM

**Mapping & Visualization**:
- `leaflet` - Interactive maps
- `@types/leaflet` - TypeScript definitions
- `papaparse` - CSV parsing

**AI & APIs**:
- `@google/generative-ai` - Gemini AI SDK
- `openai` - OpenAI SDK (fallback)

**Authentication & Security**:
- `firebase` - Firebase client SDK
- `firebase-admin` - Firebase server SDK
- `bcrypt` - Password hashing

**Build & Development**:
- `vite` - Build tool and dev server
- `typescript` - Type safety
- `esbuild` - Production bundler
- `tsx` - TypeScript execution

### Environment Configuration

**Required Variables**:
- `DATABASE_URL` - PostgreSQL connection (optional in development)
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENAI_API_KEY` - OpenAI API key (fallback)
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase Admin credentials (production)
- `VITE_FIREBASE_*` - Firebase client configuration

**Development Defaults**:
- Local PostgreSQL fallback: `postgresql://localhost:5432/sarthi_dev`
- NODE_ENV detection for dev/production modes
- Dummy API keys for graceful degradation