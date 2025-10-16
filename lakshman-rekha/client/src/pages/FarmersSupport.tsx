import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sprout, 
  TrendingUp, 
  MapPin, 
  Cloud, 
  Droplets,
  FileImage,
  Sparkles
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Sample crop data for Punjab districts
const punjabDistricts = [
  {
    id: '1',
    district: 'Ludhiana',
    fertilityRating: 9.2,
    soilType: 'Alluvial Loam',
    recommendedCrops: ['Wheat', 'Rice', 'Maize', 'Cotton'],
    profitabilityScore: 88,
    bestSeason: 'Rabi & Kharif',
    weatherOutlook: 'Favorable rainfall expected'
  },
  {
    id: '2',
    district: 'Amritsar',
    fertilityRating: 8.7,
    soilType: 'Sandy Loam',
    recommendedCrops: ['Wheat', 'Rice', 'Vegetables'],
    profitabilityScore: 85,
    bestSeason: 'Rabi',
    weatherOutlook: 'Good monsoon predicted'
  },
  {
    id: '3',
    district: 'Jalandhar',
    fertilityRating: 8.9,
    soilType: 'Alluvial',
    recommendedCrops: ['Rice', 'Wheat', 'Sugarcane'],
    profitabilityScore: 82,
    bestSeason: 'Kharif',
    weatherOutlook: 'Adequate water availability'
  },
  {
    id: '4',
    district: 'Patiala',
    fertilityRating: 8.5,
    soilType: 'Clay Loam',
    recommendedCrops: ['Cotton', 'Wheat', 'Pulses'],
    profitabilityScore: 79,
    bestSeason: 'Rabi',
    weatherOutlook: 'Moderate rainfall'
  },
  {
    id: '5',
    district: 'Bathinda',
    fertilityRating: 7.8,
    soilType: 'Sandy',
    recommendedCrops: ['Cotton', 'Bajra', 'Guar'],
    profitabilityScore: 75,
    bestSeason: 'Kharif',
    weatherOutlook: 'Below average rainfall'
  },
];

const getFertilityColor = (rating: number) => {
  if (rating >= 9) return 'text-safe';
  if (rating >= 8) return 'text-primary';
  if (rating >= 7) return 'text-warning';
  return 'text-muted-foreground';
};

export default function FarmersSupport() {
  const [selectedDistrict, setSelectedDistrict] = useState(punjabDistricts[0].id);
  const selectedData = punjabDistricts.find(d => d.id === selectedDistrict) || punjabDistricts[0];

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-md bg-safe/10 flex items-center justify-center">
          <Sprout className="w-6 h-6 text-safe" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Farmers Support</h1>
          <p className="text-muted-foreground mt-1">AI crop recommendations and agricultural intelligence</p>
        </div>
      </div>

      {/* District Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Select Your District</CardTitle>
          <CardDescription>Currently showing data for Punjab state</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="w-full md:w-80" data-testid="select-district">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Choose district" />
            </SelectTrigger>
            <SelectContent>
              {punjabDistricts.map(district => (
                <SelectItem key={district.id} value={district.id}>
                  {district.district} - Fertility: {district.fertilityRating}/10
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Fertility and Soil Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <CardDescription>Fertility Rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${getFertilityColor(selectedData.fertilityRating)}`}>
                  {selectedData.fertilityRating}
                </span>
                <span className="text-muted-foreground">/10</span>
              </div>
              <Progress value={selectedData.fertilityRating * 10} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {selectedData.fertilityRating >= 9 ? 'Excellent' : 
                 selectedData.fertilityRating >= 8 ? 'Very Good' :
                 selectedData.fertilityRating >= 7 ? 'Good' : 'Fair'} fertility
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <CardDescription>Soil Type</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{selectedData.soilType}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Ideal for diverse crop cultivation
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <CardDescription>Profitability Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="text-4xl font-bold text-primary">{selectedData.profitabilityScore}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <Progress value={selectedData.profitabilityScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* AI Crop Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">AI-Powered Crop Recommendations</CardTitle>
          </div>
          <CardDescription>
            Based on soil fertility, profitability analysis, and 3-month weather predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recommended Crops */}
          <div className="space-y-3">
            <h3 className="font-semibold">Recommended Crops for {selectedData.district}</h3>
            <div className="flex flex-wrap gap-2">
              {selectedData.recommendedCrops.map((crop, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="px-4 py-2 text-base border-safe text-safe"
                >
                  <Sprout className="w-4 h-4 mr-2" />
                  {crop}
                </Badge>
              ))}
            </div>
          </div>

          {/* Season and Weather */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Cloud className="w-4 h-4 text-primary" />
                Best Season
              </div>
              <p className="text-lg font-bold">{selectedData.bestSeason}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Droplets className="w-4 h-4 text-primary" />
                Weather Outlook
              </div>
              <p className="text-lg font-bold">{selectedData.weatherOutlook}</p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
            <p className="text-sm font-semibold text-primary">💡 AI Insight</p>
            <p className="text-sm text-foreground">
              Based on current soil conditions and upcoming weather patterns, 
              <span className="font-semibold"> {selectedData.recommendedCrops[0]} </span>
              shows the highest profitability potential for this season. Consider crop rotation with 
              <span className="font-semibold"> {selectedData.recommendedCrops[1]} </span>
              to maintain soil health.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Crop Disease Detection (Disabled) */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Crop Disease Detection</CardTitle>
              <CardDescription>Upload leaf images for AI-powered disease identification</CardDescription>
            </div>
            <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            disabled 
            className="w-full md:w-auto"
            data-testid="button-upload-image-disabled"
          >
            <FileImage className="w-4 h-4 mr-2" />
            Upload Leaf Image
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            This feature will be available soon. Upload plant/leaf photos to detect diseases and get treatment recommendations.
          </p>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="text-lg">Market Prices</CardTitle>
            <CardDescription>Latest mandi rates for your crops</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" data-testid="button-view-prices">View Current Prices</Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="text-lg">Expert Consultation</CardTitle>
            <CardDescription>Connect with agricultural experts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" data-testid="button-consult-expert">
              Book Consultation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
