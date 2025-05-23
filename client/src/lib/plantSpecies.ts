export interface PlantSpecies {
  id: number;
  name: string;
  variety?: string;
  idealRanges: {
    temp: [number, number];
    humidity: [number, number];
    soilMoisture: [number, number];
    co2: [number, number];
  };
  description?: string;
  imageUrl?: string;
  growthStages: string[];
  commonIssues: string[];
  careInstructions: {
    watering: string;
    lighting: string;
    temperature: string;
    nutrients: string;
  };
}

// Plant species data for the precision farming platform
export const plantSpeciesData: PlantSpecies[] = [
  {
    id: 1,
    name: "Tomato",
    variety: "Cherry Tomato",
    idealRanges: {
      temp: [18, 27],
      humidity: [60, 80],
      soilMoisture: [0.6, 0.8],
      co2: [400, 800]
    },
    description: "Cherry tomatoes are perfect for controlled environment agriculture with high yields and continuous harvest.",
    growthStages: ["Seedling", "Vegetative", "Flowering", "Fruiting", "Mature"],
    commonIssues: ["Blossom end rot", "Bacterial wilt", "Spider mites", "Nutrient deficiency"],
    careInstructions: {
      watering: "Maintain consistent soil moisture. Water deeply but avoid waterlogging.",
      lighting: "14-16 hours of LED light per day during growing season.",
      temperature: "Maintain 20-25°C during day, 16-18°C at night.",
      nutrients: "High potassium during fruiting, balanced NPK during vegetative growth."
    }
  },
  {
    id: 2,
    name: "Lettuce",
    variety: "Butterhead Lettuce",
    idealRanges: {
      temp: [15, 20],
      humidity: [70, 90],
      soilMoisture: [0.7, 0.9],
      co2: [400, 600]
    },
    description: "Cool-season crop ideal for hydroponic systems with quick growing cycles.",
    growthStages: ["Germination", "Cotyledon", "True leaves", "Head formation", "Harvest"],
    commonIssues: ["Tipburn", "Aphids", "Downy mildew", "Bolting"],
    careInstructions: {
      watering: "Keep roots consistently moist but well-drained.",
      lighting: "12-14 hours of moderate intensity LED lighting.",
      temperature: "Cool temperatures prevent bolting and bitter taste.",
      nutrients: "Lower EC levels, high nitrogen during vegetative phase."
    }
  },
  {
    id: 3,
    name: "Strawberry",
    variety: "Everbearing Strawberry",
    idealRanges: {
      temp: [16, 24],
      humidity: [65, 85],
      soilMoisture: [0.65, 0.85],
      co2: [500, 900]
    },
    description: "High-value crop with excellent returns in controlled environment production.",
    growthStages: ["Planting", "Runner development", "Crown formation", "Flowering", "Fruiting"],
    commonIssues: ["Gray mold", "Powdery mildew", "Aphids", "Root rot"],
    careInstructions: {
      watering: "Drip irrigation to avoid wetting foliage.",
      lighting: "Supplemental lighting during flower initiation.",
      temperature: "Cool nights promote flower initiation.",
      nutrients: "High potassium for fruit quality, moderate nitrogen."
    }
  },
  {
    id: 4,
    name: "Basil",
    variety: "Sweet Basil",
    idealRanges: {
      temp: [20, 25],
      humidity: [55, 75],
      soilMoisture: [0.6, 0.8],
      co2: [600, 1000]
    },
    description: "Aromatic herb with high market value and rapid growth in controlled environments.",
    growthStages: ["Seedling", "Vegetative", "Pre-flowering", "Harvest", "Regrowth"],
    commonIssues: ["Downy mildew", "Fusarium wilt", "Aphids", "Whitefly"],
    careInstructions: {
      watering: "Allow slight drying between waterings to prevent fungal issues.",
      lighting: "High light intensity promotes essential oil production.",
      temperature: "Warm temperatures essential for optimal growth.",
      nutrients: "Moderate feeding, avoid excess nitrogen which reduces oil content."
    }
  },
  {
    id: 5,
    name: "Cucumber",
    variety: "Greenhouse Cucumber",
    idealRanges: {
      temp: [22, 28],
      humidity: [70, 80],
      soilMoisture: [0.7, 0.9],
      co2: [600, 1000]
    },
    description: "Vining crop with high yields in vertical growing systems.",
    growthStages: ["Seedling", "Vine development", "Flowering", "Fruit set", "Harvest"],
    commonIssues: ["Powdery mildew", "Cucumber mosaic virus", "Spider mites", "Blossom end rot"],
    careInstructions: {
      watering: "High water requirements, maintain consistent moisture.",
      lighting: "Long photoperiod promotes continuous flowering.",
      temperature: "Warm temperatures crucial for pollination and fruit development.",
      nutrients: "High potassium during fruiting, consistent calcium supply."
    }
  },
  {
    id: 6,
    name: "Pepper",
    variety: "Bell Pepper",
    idealRanges: {
      temp: [21, 28],
      humidity: [60, 70],
      soilMoisture: [0.6, 0.8],
      co2: [500, 800]
    },
    description: "Heat-loving crop with excellent color development under controlled conditions.",
    growthStages: ["Seedling", "Vegetative", "Flowering", "Fruit development", "Color change"],
    commonIssues: ["Bacterial spot", "Thrips", "Blossom end rot", "Sunscald"],
    careInstructions: {
      watering: "Deep, infrequent watering promotes root development.",
      lighting: "High light intensity improves fruit color and quality.",
      temperature: "Warm temperatures essential, avoid cold stress.",
      nutrients: "Balanced feeding, reduce nitrogen during fruiting."
    }
  },
  {
    id: 7,
    name: "Spinach",
    variety: "Baby Spinach",
    idealRanges: {
      temp: [13, 18],
      humidity: [75, 95],
      soilMoisture: [0.8, 0.95],
      co2: [400, 600]
    },
    description: "Fast-growing leafy green perfect for continuous harvest systems.",
    growthStages: ["Germination", "Cotyledon", "True leaves", "Rosette", "Harvest"],
    commonIssues: ["Downy mildew", "Aphids", "Leaf miners", "Bolting"],
    careInstructions: {
      watering: "High moisture requirements, consistent irrigation.",
      lighting: "Moderate lighting, avoid heat stress.",
      temperature: "Cool temperatures prevent premature bolting.",
      nutrients: "High nitrogen for rapid leaf development."
    }
  },
  {
    id: 8,
    name: "Kale",
    variety: "Curly Kale",
    idealRanges: {
      temp: [15, 22],
      humidity: [65, 85],
      soilMoisture: [0.7, 0.9],
      co2: [400, 700]
    },
    description: "Nutrient-dense superfood with excellent shelf life and market demand.",
    growthStages: ["Seedling", "Juvenile", "Mature leaves", "Continuous harvest", "Senescence"],
    commonIssues: ["Cabbage worm", "Aphids", "Clubroot", "Black rot"],
    careInstructions: {
      watering: "Consistent moisture promotes tender leaf development.",
      lighting: "Moderate to high light intensity.",
      temperature: "Cool to moderate temperatures improve flavor.",
      nutrients: "High nitrogen, adequate sulfur for nutrient density."
    }
  },
  {
    id: 9,
    name: "Mint",
    variety: "Spearmint",
    idealRanges: {
      temp: [18, 24],
      humidity: [60, 80],
      soilMoisture: [0.7, 0.9],
      co2: [500, 800]
    },
    description: "Perennial herb with strong market demand and easy propagation.",
    growthStages: ["Cutting", "Root development", "Vegetative", "Mature", "Harvest"],
    commonIssues: ["Mint rust", "Spider mites", "Aphids", "Root rot"],
    careInstructions: {
      watering: "High moisture tolerance, but ensure good drainage.",
      lighting: "Moderate light requirements, tolerates some shade.",
      temperature: "Moderate temperatures promote essential oil production.",
      nutrients: "Light feeding, excess nitrogen reduces oil concentration."
    }
  },
  {
    id: 10,
    name: "Orchid",
    variety: "Phalaenopsis Orchid",
    idealRanges: {
      temp: [20, 28],
      humidity: [50, 70],
      soilMoisture: [0.4, 0.6],
      co2: [400, 600]
    },
    description: "High-value ornamental plant requiring precise environmental control.",
    growthStages: ["Seedling", "Vegetative", "Spike initiation", "Flowering", "Rest period"],
    commonIssues: ["Crown rot", "Scale insects", "Bacterial brown spot", "Fungal infections"],
    careInstructions: {
      watering: "Allow drying between waterings, use pure water.",
      lighting: "Bright indirect light, avoid direct sun.",
      temperature: "Stable temperatures with slight night drop.",
      nutrients: "Dilute orchid fertilizer, flush monthly to prevent salt buildup."
    }
  }
];

export function getPlantById(id: number): PlantSpecies | undefined {
  return plantSpeciesData.find(plant => plant.id === id);
}

export function getPlantByName(name: string): PlantSpecies | undefined {
  return plantSpeciesData.find(plant => 
    plant.name.toLowerCase() === name.toLowerCase()
  );
}

export function getPlantsByCategory(category: 'leafy' | 'fruit' | 'herb' | 'ornamental'): PlantSpecies[] {
  const categories = {
    leafy: ['Lettuce', 'Spinach', 'Kale'],
    fruit: ['Tomato', 'Strawberry', 'Cucumber', 'Pepper'],
    herb: ['Basil', 'Mint'],
    ornamental: ['Orchid']
  };
  
  return plantSpeciesData.filter(plant => 
    categories[category].includes(plant.name)
  );
}

export function validateSensorReading(
  plantId: number, 
  sensorType: 'temp' | 'humidity' | 'soilMoisture' | 'co2', 
  value: number
): { isValid: boolean; status: 'optimal' | 'warning' | 'critical'; message: string } {
  const plant = getPlantById(plantId);
  if (!plant) {
    return { isValid: false, status: 'critical', message: 'Plant species not found' };
  }

  const range = plant.idealRanges[sensorType];
  const [min, max] = range;
  
  if (value >= min && value <= max) {
    return { isValid: true, status: 'optimal', message: 'Reading within optimal range' };
  }
  
  const criticalLow = min * 0.8;
  const criticalHigh = max * 1.2;
  
  if (value < criticalLow || value > criticalHigh) {
    return { 
      isValid: false, 
      status: 'critical', 
      message: `Reading critically ${value < criticalLow ? 'low' : 'high'} for ${plant.name}` 
    };
  }
  
  return { 
    isValid: false, 
    status: 'warning', 
    message: `Reading ${value < min ? 'below' : 'above'} optimal range for ${plant.name}` 
  };
}
