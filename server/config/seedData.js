const mongoose  = require('mongoose');
const dotenv    = require('dotenv');
const Equipment = require('../models/Equipment');

dotenv.config();

const equipmentData = [
  {
    name:        'Tractor',
    category:    'tractor',
    icon:        '🚜',
    description: 'Heavy duty tractor for ploughing and transport',
    pricePerDay: 1200,
    buyPrice:    450000,
    canRent:     true,
    canBuy:      true,
    available:   true,
    totalUnits:  3,
    specifications: {
      brand:    'Mahindra',
      model:    '575 DI',
      year:     2023,
      capacity: '45 HP',
    },
    location: { state: 'Bihar', district: 'Patna' },
  },
  {
    name:        'Harvester',
    category:    'harvester',
    icon:        '🌾',
    description: 'Combine harvester for wheat and rice',
    pricePerDay: 3500,
    canRent:     true,
    canBuy:      false,
    available:   true,
    totalUnits:  2,
    specifications: {
      brand:    'John Deere',
      model:    'W70',
      year:     2022,
      capacity: '100 HP',
    },
    location: { state: 'Bihar', district: 'Patna' },
  },
  {
    name:        'Seeder Machine',
    category:    'seeder',
    icon:        '🌱',
    description: 'Precision seeder for uniform crop sowing',
    pricePerDay: 800,
    canRent:     true,
    canBuy:      false,
    available:   true,
    totalUnits:  2,
    specifications: {
      brand:    'AGCO',
      model:    'S800',
      year:     2023,
      capacity: '8 rows',
    },
    location: { state: 'Bihar', district: 'Patna' },
  },
  {
    name:        'Plough Machine',
    category:    'plough',
    icon:        '⚙️',
    description: 'Rotavator for deep soil preparation',
    pricePerDay: 600,
    canRent:     true,
    canBuy:      false,
    available:   true,
    totalUnits:  3,
    location: { state: 'Bihar', district: 'Patna' },
  },
  {
    name:        'Sprayer Machine',
    category:    'sprayer',
    icon:        '🧪',
    description: 'Power sprayer for pesticide & fertilizer',
    pricePerDay: 400,
    canRent:     true,
    canBuy:      true,
    buyPrice:    15000,
    available:   true,
    totalUnits:  5,
    location: { state: 'Bihar', district: 'Patna' },
  },
  {
    name:        'Drip Irrigation Kit',
    category:    'irrigation',
    icon:        '💧',
    description: 'Water-saving drip system for any crop',
    pricePerDay: 500,
    buyPrice:    25000,
    canRent:     true,
    canBuy:      true,
    available:   true,
    totalUnits:  4,
    location: { state: 'Bihar', district: 'Patna' },
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing equipment
    await Equipment.deleteMany({});
    console.log('🗑️  Old equipment deleted');

    // Insert new equipment
    await Equipment.insertMany(equipmentData);
    console.log('✅ Equipment seeded successfully!');
    console.log(`📦 ${equipmentData.length} machines added`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedDB();