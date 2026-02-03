/**
 * Seed script for demo purposes
 * Creates sample components and users for testing
 * 
 * Usage: node seed.js
 * 
 * Note: This will clear existing data. Use with caution!
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Component = require('./models/Component');
const Category = require('./models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pc_build_db';

// Sample components data
const sampleComponents = [
  // CPUs
  {
    name: 'Intel Core i7-13700K',
    category: 'CPU',
    price: 399.99,
    specifications: '13th Gen, 16 cores (8P+8E), 3.4GHz base, 5.4GHz boost',
    compatibility: 'LGA 1700',
    stockStatus: true,
  },
  {
    name: 'AMD Ryzen 7 7700X',
    category: 'CPU',
    price: 399.99,
    specifications: 'Zen 4, 8 cores, 4.5GHz base, 5.4GHz boost',
    compatibility: 'AM5',
    stockStatus: true,
  },
  {
    name: 'Intel Core i5-13400',
    category: 'CPU',
    price: 229.99,
    specifications: '13th Gen, 10 cores (6P+4E), 2.5GHz base, 4.6GHz boost',
    compatibility: 'LGA 1700',
    stockStatus: true,
  },
  
  // GPUs
  {
    name: 'NVIDIA GeForce RTX 4070',
    category: 'GPU',
    price: 599.99,
    specifications: '12GB GDDR6X, 192-bit bus, Ray Tracing, DLSS 3',
    compatibility: 'PCIe 4.0',
    stockStatus: true,
  },
  {
    name: 'AMD Radeon RX 7800 XT',
    category: 'GPU',
    price: 499.99,
    specifications: '16GB GDDR6, 256-bit bus, FSR support',
    compatibility: 'PCIe 4.0',
    stockStatus: true,
  },
  {
    name: 'NVIDIA GeForce RTX 4060',
    category: 'GPU',
    price: 299.99,
    specifications: '8GB GDDR6, 128-bit bus, Ray Tracing, DLSS 3',
    compatibility: 'PCIe 4.0',
    stockStatus: true,
  },
  
  // RAM
  {
    name: 'Corsair Vengeance DDR5 32GB (2x16GB)',
    category: 'RAM',
    price: 129.99,
    specifications: 'DDR5-5600, CL36, 1.25V',
    compatibility: 'DDR5',
    stockStatus: true,
  },
  {
    name: 'G.Skill Trident Z5 DDR5 16GB (2x8GB)',
    category: 'RAM',
    price: 89.99,
    specifications: 'DDR5-6000, CL36, 1.35V',
    compatibility: 'DDR5',
    stockStatus: true,
  },
  {
    name: 'Kingston Fury Beast DDR4 16GB (2x8GB)',
    category: 'RAM',
    price: 59.99,
    specifications: 'DDR4-3200, CL16, 1.35V',
    compatibility: 'DDR4',
    stockStatus: true,
  },
  
  // Storage
  {
    name: 'Samsung 980 Pro 1TB NVMe SSD',
    category: 'Storage',
    price: 99.99,
    specifications: 'PCIe 4.0, Read: 7000MB/s, Write: 5000MB/s',
    compatibility: 'M.2 NVMe',
    stockStatus: true,
  },
  {
    name: 'WD Black SN850X 2TB NVMe SSD',
    category: 'Storage',
    price: 179.99,
    specifications: 'PCIe 4.0, Read: 7300MB/s, Write: 6300MB/s',
    compatibility: 'M.2 NVMe',
    stockStatus: true,
  },
  {
    name: 'Seagate Barracuda 2TB HDD',
    category: 'Storage',
    price: 49.99,
    specifications: '7200 RPM, SATA III, 256MB cache',
    compatibility: 'SATA',
    stockStatus: true,
  },
  
  // PSUs
  {
    name: 'Corsair RM850x 850W 80+ Gold',
    category: 'PSU',
    price: 149.99,
    specifications: '850W, 80+ Gold, Fully Modular, 140mm Fan',
    compatibility: 'ATX',
    stockStatus: true,
  },
  {
    name: 'EVGA SuperNOVA 750W 80+ Gold',
    category: 'PSU',
    price: 119.99,
    specifications: '750W, 80+ Gold, Fully Modular',
    compatibility: 'ATX',
    stockStatus: true,
  },
  {
    name: 'Seasonic Focus GX-650 650W 80+ Gold',
    category: 'PSU',
    price: 99.99,
    specifications: '650W, 80+ Gold, Semi-Modular',
    compatibility: 'ATX',
    stockStatus: true,
  },
  
  // Motherboards
  {
    name: 'ASUS ROG Strix B650E-F Gaming WiFi',
    category: 'Motherboard',
    price: 279.99,
    specifications: 'AM5, DDR5, PCIe 5.0, WiFi 6E, Bluetooth 5.2',
    compatibility: 'AM5',
    stockStatus: true,
  },
  {
    name: 'MSI MPG Z790 Edge WiFi',
    category: 'Motherboard',
    price: 329.99,
    specifications: 'LGA 1700, DDR5, PCIe 5.0, WiFi 6E',
    compatibility: 'LGA 1700',
    stockStatus: true,
  },
  {
    name: 'ASRock B650M Pro4',
    category: 'Motherboard',
    price: 139.99,
    specifications: 'AM5, DDR5, PCIe 4.0, Micro-ATX',
    compatibility: 'AM5',
    stockStatus: true,
  },
  
  // Cases
  {
    name: 'Corsair 4000D Airflow',
    category: 'Case',
    price: 89.99,
    specifications: 'Mid Tower, Tempered Glass, 3x120mm fans, ATX',
    compatibility: 'ATX',
    stockStatus: true,
  },
  {
    name: 'NZXT H5 Flow',
    category: 'Case',
    price: 94.99,
    specifications: 'Mid Tower, Tempered Glass, 2x140mm fans, ATX',
    compatibility: 'ATX',
    stockStatus: true,
  },
  {
    name: 'Fractal Design Pop Air',
    category: 'Case',
    price: 79.99,
    specifications: 'Mid Tower, Tempered Glass, 3x120mm fans, RGB',
    compatibility: 'ATX',
    stockStatus: true,
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out to keep existing data)
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Component.deleteMany({});
    await Category.deleteMany({});
    console.log('Existing data cleared');

    // Hash password for users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create sample users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
      },
      {
        name: 'John Customer',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
      },
      {
        name: 'Assembly Pro',
        email: 'assembler@example.com',
        password: hashedPassword,
        role: 'assembler',
      },
      {
        name: 'Tech Supplier',
        email: 'supplier@example.com',
        password: hashedPassword,
        role: 'supplier',
      },
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // Create default categories
    const defaultCategories = [
      { name: 'CPU', description: 'Central Processing Unit', isActive: true },
      { name: 'GPU', description: 'Graphics Processing Unit', isActive: true },
      { name: 'RAM', description: 'Random Access Memory', isActive: true },
      { name: 'Storage', description: 'Storage Drives (SSD/HDD)', isActive: true },
      { name: 'PSU', description: 'Power Supply Unit', isActive: true },
      { name: 'Motherboard', description: 'Motherboard', isActive: true },
      { name: 'Case', description: 'PC Case/Chassis', isActive: true },
    ];

    const createdCategories = await Category.insertMany(defaultCategories);
    console.log(`Created ${createdCategories.length} categories`);

    // Get supplier user for component assignment
    const supplier = createdUsers.find((u) => u.role === 'supplier');

    // Create sample components
    const componentsWithSupplier = sampleComponents.map((comp) => ({
      ...comp,
      supplierID: supplier._id,
    }));

    const createdComponents = await Component.insertMany(componentsWithSupplier);
    console.log(`Created ${createdComponents.length} components`);

    console.log('\n=== Seed Data Summary ===');
    console.log('Users created:');
    users.forEach((user) => {
      console.log(`  - ${user.email} (${user.role}) - Password: password123`);
    });
    console.log(`\nComponents created: ${createdComponents.length}`);
    console.log(`Categories created: ${createdCategories.length}`);
    console.log('Category names:', createdCategories.map(c => c.name).join(', '));
    console.log('\n=== Seed Complete ===');
    console.log('\nYou can now login with any of the test accounts.');
    console.log('All accounts use password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed function
seedDatabase();
