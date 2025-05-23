import bcrypt from 'bcrypt';
import { db } from './db';
import { admins, plantSpecies, actuators, currentPlant } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function seedDatabase() {
  console.log('🌱 Seeding Green Genesis database...');
  
  try {
    // Create admin user with default credentials
    const hashedPassword = await bcrypt.hash('Infomatrix2025MKA', 12);
    await db.insert(admins).values({
      username: 'Infomatrix',
      passwordHash: hashedPassword
    }).onConflictDoNothing();
    console.log('✅ Admin user created (Infomatrix/Infomatrix2025MKA)');

    // Create the 10 plant species as specified
    const plants = [
      {
        name: 'Tomato',
        variety: 'Cherry Tomato',
        idealRanges: { temp: [18, 27], humidity: [60, 80], soilMoisture: [0.6, 0.8], co2: [400, 800] },
        description: 'Perfect for controlled environment agriculture with high yields and continuous harvest.'
      },
      {
        name: 'Lettuce',
        variety: 'Butterhead Lettuce',
        idealRanges: { temp: [15, 20], humidity: [70, 90], soilMoisture: [0.7, 0.9], co2: [400, 600] },
        description: 'Cool-season crop ideal for hydroponic systems with quick growing cycles.'
      },
      {
        name: 'Strawberry',
        variety: 'Everbearing Strawberry',
        idealRanges: { temp: [16, 24], humidity: [65, 85], soilMoisture: [0.65, 0.85], co2: [500, 900] },
        description: 'High-value crop with excellent returns in controlled environment production.'
      },
      {
        name: 'Basil',
        variety: 'Sweet Basil',
        idealRanges: { temp: [20, 25], humidity: [55, 75], soilMoisture: [0.6, 0.8], co2: [600, 1000] },
        description: 'Aromatic herb with high market value and rapid growth in controlled environments.'
      },
      {
        name: 'Cucumber',
        variety: 'Greenhouse Cucumber',
        idealRanges: { temp: [22, 28], humidity: [70, 80], soilMoisture: [0.7, 0.9], co2: [600, 1000] },
        description: 'Vining crop with high yields in vertical growing systems.'
      },
      {
        name: 'Pepper',
        variety: 'Bell Pepper',
        idealRanges: { temp: [21, 28], humidity: [60, 70], soilMoisture: [0.6, 0.8], co2: [500, 800] },
        description: 'Heat-loving crop with excellent color development under controlled conditions.'
      },
      {
        name: 'Spinach',
        variety: 'Baby Spinach',
        idealRanges: { temp: [13, 18], humidity: [75, 95], soilMoisture: [0.8, 0.95], co2: [400, 600] },
        description: 'Fast-growing leafy green perfect for continuous harvest systems.'
      },
      {
        name: 'Kale',
        variety: 'Curly Kale',
        idealRanges: { temp: [15, 22], humidity: [65, 85], soilMoisture: [0.7, 0.9], co2: [400, 700] },
        description: 'Nutrient-dense superfood with excellent shelf life and market demand.'
      },
      {
        name: 'Mint',
        variety: 'Spearmint',
        idealRanges: { temp: [18, 24], humidity: [60, 80], soilMoisture: [0.7, 0.9], co2: [500, 800] },
        description: 'Perennial herb with strong market demand and easy propagation.'
      },
      {
        name: 'Orchid',
        variety: 'Phalaenopsis Orchid',
        idealRanges: { temp: [20, 28], humidity: [50, 70], soilMoisture: [0.4, 0.6], co2: [400, 600] },
        description: 'High-value ornamental plant requiring precise environmental control.'
      }
    ];
    
    for (const plant of plants) {
      await db.insert(plantSpecies).values(plant).onConflictDoNothing();
    }
    console.log('✅ 10 plant species added');

    // Create the 4 main actuators (Pump, Vent, Light, Fan)
    const actuatorsData = [
      {
        name: 'pump',
        displayName: 'Water Pump',
        isActive: false,
        autoMode: true,
        settings: { flowRate: 'moderate', schedule: 'auto' }
      },
      {
        name: 'vent',
        displayName: 'Ventilation System',
        isActive: true,
        autoMode: true,
        settings: { speed: 'medium', temperatureThreshold: 25 }
      },
      {
        name: 'light',
        displayName: 'LED Grow Lights',
        isActive: true,
        autoMode: false,
        settings: { intensity: 80, photoperiod: 14 }
      },
      {
        name: 'fan',
        displayName: 'Circulation Fan',
        isActive: false,
        autoMode: true,
        settings: { speed: 'low', humidityThreshold: 85 }
      }
    ];
    
    for (const actuator of actuatorsData) {
      await db.insert(actuators).values(actuator).onConflictDoNothing();
    }
    console.log('✅ 4 actuators configured');

    // Set Tomato as the default current plant
    const tomato = await db.select().from(plantSpecies).where(eq(plantSpecies.name, 'Tomato')).limit(1);
    if (tomato.length > 0) {
      await db.insert(currentPlant).values({
        speciesId: tomato[0].id,
        notes: 'Demo plant for Green Genesis platform showcase'
      }).onConflictDoNothing();
      console.log('✅ Set Tomato as current plant');
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('📋 Login credentials: Infomatrix / Infomatrix2025MKA');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seedDatabase()
  .then(() => {
    console.log('✨ Green Genesis platform is ready!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });