// Weather API integration for Green Genesis
// This will integrate with OpenWeatherMap API for real-time weather data

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  uvIndex: number;
  visibility: number;
  description: string;
  icon: string;
  timestamp: string;
  forecast: WeatherForecast[];
}

interface WeatherForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  description: string;
  precipitation: number;
}

export class WeatherService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ OpenWeatherMap API key not found. Weather features will be limited.');
    }
  }

  async getCurrentWeather(lat: number = 40.7128, lon: number = -74.0060): Promise<WeatherData | null> {
    if (!this.apiKey) {
      console.log('📡 Weather API key required for real-time weather data');
      return null;
    }

    try {
      const currentResponse = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );
      
      if (!currentResponse.ok) {
        throw new Error(`Weather API error: ${currentResponse.status}`);
      }

      const currentData = await currentResponse.json();

      // Get 5-day forecast
      const forecastResponse = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );
      
      const forecastData = forecastResponse.ok ? await forecastResponse.json() : { list: [] };

      // Process forecast data (next 5 days, daily summary)
      const forecast: WeatherForecast[] = [];
      const dailyData = new Map();

      forecastData.list?.forEach((item: any) => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyData.has(date)) {
          dailyData.set(date, {
            date,
            tempMin: item.main.temp_min,
            tempMax: item.main.temp_max,
            humidity: item.main.humidity,
            description: item.weather[0].description,
            precipitation: item.rain?.['3h'] || 0
          });
        } else {
          const existing = dailyData.get(date);
          existing.tempMin = Math.min(existing.tempMin, item.main.temp_min);
          existing.tempMax = Math.max(existing.tempMax, item.main.temp_max);
        }
      });

      forecast.push(...Array.from(dailyData.values()).slice(0, 5));

      return {
        temperature: currentData.main.temp,
        humidity: currentData.main.humidity,
        pressure: currentData.main.pressure,
        windSpeed: currentData.wind?.speed || 0,
        windDirection: currentData.wind?.deg || 0,
        cloudCover: currentData.clouds?.all || 0,
        uvIndex: 0, // Would need UV API call
        visibility: currentData.visibility / 1000, // Convert to km
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        timestamp: new Date().toISOString(),
        forecast
      };

    } catch (error) {
      console.error('❌ Error fetching weather data:', error);
      return null;
    }
  }

  async getLocationWeather(city: string): Promise<WeatherData | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      // Get coordinates for city
      const geoResponse = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.apiKey}`
      );
      
      const geoData = await geoResponse.json();
      if (geoData.length === 0) {
        throw new Error('City not found');
      }

      const { lat, lon } = geoData[0];
      return this.getCurrentWeather(lat, lon);

    } catch (error) {
      console.error('❌ Error fetching weather for city:', error);
      return null;
    }
  }
}

export const weatherService = new WeatherService();