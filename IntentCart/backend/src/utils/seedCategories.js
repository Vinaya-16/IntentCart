import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';

dotenv.config();

const categories = [
  // ============ 1. Electronics & Gadgets ============
  { name: 'Electronics & Gadgets', level: 0, order: 1 },
  { name: 'Smartphones & Accessories', level: 1, parentName: 'Electronics & Gadgets', order: 1 },
  { name: 'Computers & Laptops', level: 1, parentName: 'Electronics & Gadgets', order: 2 },
  { name: 'Audio & Headphones', level: 1, parentName: 'Electronics & Gadgets', order: 3 },
  { name: 'Cameras & Photography', level: 1, parentName: 'Electronics & Gadgets', order: 4 },
  { name: 'TV & Home Entertainment', level: 1, parentName: 'Electronics & Gadgets', order: 5 },
  
  // Smartphones subcategories
  { name: 'Mobile Phones', level: 2, parentName: 'Smartphones & Accessories', order: 1 },
  { name: 'Cases, Covers & Screen Protectors', level: 2, parentName: 'Smartphones & Accessories', order: 2 },
  { name: 'Chargers, Cables & Power Banks', level: 2, parentName: 'Smartphones & Accessories', order: 3 },
  { name: 'Smartwatches & Fitness Bands', level: 2, parentName: 'Smartphones & Accessories', order: 4 },
  
  // Computers subcategories
  { name: 'Laptops', level: 2, parentName: 'Computers & Laptops', order: 1 },
  { name: 'Desktop PCs & All-in-Ones', level: 2, parentName: 'Computers & Laptops', order: 2 },
  { name: 'Computer Components', level: 2, parentName: 'Computers & Laptops', order: 3 },
  { name: 'Computer Accessories', level: 2, parentName: 'Computers & Laptops', order: 4 },
  
  // Audio subcategories
  { name: 'Wireless Earbuds & In-Ear Headphones', level: 2, parentName: 'Audio & Headphones', order: 1 },
  { name: 'Over-Ear & On-Ear Headphones', level: 2, parentName: 'Audio & Headphones', order: 2 },
  { name: 'Bluetooth Speakers & Soundbars', level: 2, parentName: 'Audio & Headphones', order: 3 },
  
  // Cameras subcategories
  { name: 'DSLR & Mirrorless Cameras', level: 2, parentName: 'Cameras & Photography', order: 1 },
  { name: 'Action Cameras & Drones', level: 2, parentName: 'Cameras & Photography', order: 2 },
  { name: 'Lenses, Tripods & Lighting', level: 2, parentName: 'Cameras & Photography', order: 3 },
  
  // TV subcategories
  { name: 'Smart TVs & Projectors', level: 2, parentName: 'TV & Home Entertainment', order: 1 },
  { name: 'Streaming Devices & Media Players', level: 2, parentName: 'TV & Home Entertainment', order: 2 },

  // ============ 2. Fashion & Apparel ============
  { name: 'Fashion & Apparel', level: 0, order: 2 },
  { name: "Men's Clothing", level: 1, parentName: 'Fashion & Apparel', order: 1 },
  { name: "Women's Clothing", level: 1, parentName: 'Fashion & Apparel', order: 2 },
  { name: 'Footwear', level: 1, parentName: 'Fashion & Apparel', order: 3 },
  { name: 'Accessories', level: 1, parentName: 'Fashion & Apparel', order: 4 },
  
  // Men's Clothing subcategories
  { name: 'Shirts, T-Shirts & Polo Shirts', level: 2, parentName: "Men's Clothing", order: 1 },
  { name: 'Jeans, Trousers & Shorts', level: 2, parentName: "Men's Clothing", order: 2 },
  { name: 'Jackets, Coats & Hoodies', level: 2, parentName: "Men's Clothing", order: 3 },
  { name: 'Activewear & Gym Wear', level: 2, parentName: "Men's Clothing", order: 4 },
  
  // Women's Clothing subcategories
  { name: 'Dresses, Tops & Blouses', level: 2, parentName: "Women's Clothing", order: 1 },
  { name: 'Jeans, Pants & Skirts', level: 2, parentName: "Women's Clothing", order: 2 },
  { name: 'Jackets, Blazers & Knitwear', level: 2, parentName: "Women's Clothing", order: 3 },
  { name: 'Activewear & Shapewear', level: 2, parentName: "Women's Clothing", order: 4 },
  
  // Footwear subcategories
  { name: "Men's Shoes", level: 2, parentName: 'Footwear', order: 1 },
  { name: "Women's Shoes", level: 2, parentName: 'Footwear', order: 2 },
  { name: "Kids' Shoes", level: 2, parentName: 'Footwear', order: 3 },
  
  // Accessories subcategories
  { name: 'Bags, Backpacks & Luggage', level: 2, parentName: 'Accessories', order: 1 },
  { name: 'Watches & Jewelry', level: 2, parentName: 'Accessories', order: 2 },
  { name: 'Sunglasses & Eyewear', level: 2, parentName: 'Accessories', order: 3 },
  { name: 'Belts, Hats & Scarves', level: 2, parentName: 'Accessories', order: 4 },

  // ============ 3. Home, Kitchen & Living ============
  { name: 'Home, Kitchen & Living', level: 0, order: 3 },
  { name: 'Furniture', level: 1, parentName: 'Home, Kitchen & Living', order: 1 },
  { name: 'Home Decor', level: 1, parentName: 'Home, Kitchen & Living', order: 2 },
  { name: 'Kitchen & Dining', level: 1, parentName: 'Home, Kitchen & Living', order: 3 },
  { name: 'Bedding & Bath', level: 1, parentName: 'Home, Kitchen & Living', order: 4 },
  
  // Furniture subcategories
  { name: 'Living Room', level: 2, parentName: 'Furniture', order: 1 },
  { name: 'Bedroom', level: 2, parentName: 'Furniture', order: 2 },
  { name: 'Office Furniture', level: 2, parentName: 'Furniture', order: 3 },
  
  // Home Decor subcategories
  { name: 'Wall Art, Mirrors & Clocks', level: 2, parentName: 'Home Decor', order: 1 },
  { name: 'Lighting', level: 2, parentName: 'Home Decor', order: 2 },
  { name: 'Rugs, Curtains & Cushion Covers', level: 2, parentName: 'Home Decor', order: 3 },
  
  // Kitchen & Dining subcategories
  { name: 'Cookware & Bakeware', level: 2, parentName: 'Kitchen & Dining', order: 1 },
  { name: 'Kitchen Appliances', level: 2, parentName: 'Kitchen & Dining', order: 2 },
  { name: 'Dinnerware, Drinkware & Cutlery', level: 2, parentName: 'Kitchen & Dining', order: 3 },
  
  // Bedding & Bath subcategories
  { name: 'Bed Sheets, Duvets & Pillows', level: 2, parentName: 'Bedding & Bath', order: 1 },
  { name: 'Towels & Bath Mats', level: 2, parentName: 'Bedding & Bath', order: 2 },

  // ============ 4. Beauty & Personal Care ============
  { name: 'Beauty & Personal Care', level: 0, order: 4 },
  { name: 'Skincare', level: 1, parentName: 'Beauty & Personal Care', order: 1 },
  { name: 'Makeup', level: 1, parentName: 'Beauty & Personal Care', order: 2 },
  { name: 'Hair Care', level: 1, parentName: 'Beauty & Personal Care', order: 3 },
  { name: 'Personal Care & Fragrance', level: 1, parentName: 'Beauty & Personal Care', order: 4 },
  
  // Skincare subcategories
  { name: 'Cleansers & Toners', level: 2, parentName: 'Skincare', order: 1 },
  { name: 'Serums, Moisturizers & Sunscreen', level: 2, parentName: 'Skincare', order: 2 },
  { name: 'Face Masks & Treatments', level: 2, parentName: 'Skincare', order: 3 },
  
  // Makeup subcategories
  { name: 'Face', level: 2, parentName: 'Makeup', order: 1 },
  { name: 'Eyes', level: 2, parentName: 'Makeup', order: 2 },
  { name: 'Lips', level: 2, parentName: 'Makeup', order: 3 },
  
  // Hair Care subcategories
  { name: 'Shampoo & Conditioners', level: 2, parentName: 'Hair Care', order: 1 },
  { name: 'Hair Oils & Styling Products', level: 2, parentName: 'Hair Care', order: 2 },
  { name: 'Hair Tools', level: 2, parentName: 'Hair Care', order: 3 },
  
  // Personal Care subcategories
  { name: 'Perfumes & Body Sprays', level: 2, parentName: 'Personal Care & Fragrance', order: 1 },
  { name: "Men's Grooming & Trimmers", level: 2, parentName: 'Personal Care & Fragrance', order: 2 },
  { name: 'Oral & Bath Care', level: 2, parentName: 'Personal Care & Fragrance', order: 3 },

  // ============ 5. Health & Wellness ============
  { name: 'Health & Wellness', level: 0, order: 5 },
  { name: 'Vitamins & Supplements', level: 1, parentName: 'Health & Wellness', order: 1 },
  { name: 'Personal Medical Devices', level: 1, parentName: 'Health & Wellness', order: 2 },
  
  // Vitamins subcategories
  { name: 'Multivitamins & Minerals', level: 2, parentName: 'Vitamins & Supplements', order: 1 },
  { name: 'Protein Powders & Sports Nutrition', level: 2, parentName: 'Vitamins & Supplements', order: 2 },
  
  // Medical Devices subcategories
  { name: 'Blood Pressure Monitors & Thermometers', level: 2, parentName: 'Personal Medical Devices', order: 1 },
  { name: 'Massagers & Heating Pads', level: 2, parentName: 'Personal Medical Devices', order: 2 },

  // ============ 6. Sports, Fitness & Outdoors ============
  { name: 'Sports, Fitness & Outdoors', level: 0, order: 6 },
  { name: 'Fitness & Gym Equipment', level: 1, parentName: 'Sports, Fitness & Outdoors', order: 1 },
  { name: 'Outdoor & Camping', level: 1, parentName: 'Sports, Fitness & Outdoors', order: 2 },
  
  // Fitness subcategories
  { name: 'Dumbbells, Kettlebells & Resistance Bands', level: 2, parentName: 'Fitness & Gym Equipment', order: 1 },
  { name: 'Treadmills & Exercise Bikes', level: 2, parentName: 'Fitness & Gym Equipment', order: 2 },
  { name: 'Yoga Mats & Accessories', level: 2, parentName: 'Fitness & Gym Equipment', order: 3 },
  
  // Outdoor subcategories
  { name: 'Tents, Sleeping Bags & Hiking Gear', level: 2, parentName: 'Outdoor & Camping', order: 1 },
  { name: 'Cycling & Bikes', level: 2, parentName: 'Outdoor & Camping', order: 2 },

  // ============ 7. Toys, Baby & Kids ============
  { name: 'Toys, Baby & Kids', level: 0, order: 7 },
  { name: 'Baby Care', level: 1, parentName: 'Toys, Baby & Kids', order: 1 },
  { name: 'Toys & Games', level: 1, parentName: 'Toys, Baby & Kids', order: 2 },
  
  // Baby Care subcategories
  { name: 'Diapers, Wipes & Skin Care', level: 2, parentName: 'Baby Care', order: 1 },
  { name: 'Feeding, Strollers & Car Seats', level: 2, parentName: 'Baby Care', order: 2 },
  
  // Toys subcategories
  { name: 'Action Figures & Dolls', level: 2, parentName: 'Toys & Games', order: 1 },
  { name: 'Board Games & Puzzles', level: 2, parentName: 'Toys & Games', order: 2 },
  { name: 'STEM & Educational Toys', level: 2, parentName: 'Toys & Games', order: 3 },

  // ============ 8. Books, Media & Hobbies ============
  { name: 'Books, Media & Hobbies', level: 0, order: 8 },
  { name: 'Books', level: 1, parentName: 'Books, Media & Hobbies', order: 1 },
  { name: 'Gaming', level: 1, parentName: 'Books, Media & Hobbies', order: 2 },
  { name: 'Stationery & Office Supplies', level: 1, parentName: 'Books, Media & Hobbies', order: 3 },
  
  // Books subcategories
  { name: 'Fiction, Non-Fiction & Biographies', level: 2, parentName: 'Books', order: 1 },
  { name: "Children's Books & Educational", level: 2, parentName: 'Books', order: 2 },
  
  // Gaming subcategories
  { name: 'Consoles', level: 2, parentName: 'Gaming', order: 1 },
  { name: 'Video Games & Controllers', level: 2, parentName: 'Gaming', order: 2 },
  
  // Stationery subcategories
  { name: 'Notebooks, Pens & Art Supplies', level: 2, parentName: 'Stationery & Office Supplies', order: 1 }
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    // console.log('Cleared existing categories');

    // Create categories with parent references
    const categoryMap = {};
    
    for (const cat of categories) {
      // Find parent by name
      let parentId = null;
      if (cat.parentName) {
        const parent = categoryMap[cat.parentName];
        if (parent) {
          parentId = parent._id;
        } else {
          console.warn(`Parent "${cat.parentName}" not found for category "${cat.name}"`);
        }
      }
      
      const category = new Category({
        name: cat.name,
        level: cat.level,
        parentId: parentId,
        order: cat.order || 0,
        isActive: true
      });
      
      await category.save();
      categoryMap[cat.name] = category;
    //   console.log(`Created: ${cat.name} (Level: ${cat.level}, Parent: ${cat.parentName || 'None'})`);
    }

    // console.log(`\nSeeded ${categories.length} categories successfully!`);
    // console.log('Category breakdown:');
    // console.log(`   - Level 0 (Top): ${categories.filter(c => c.level === 0).length}`);
    // console.log(`   - Level 1 (Sub): ${categories.filter(c => c.level === 1).length}`);
    // console.log(`   - Level 2 (Micro): ${categories.filter(c => c.level === 2).length}`);
    
    // Verify parent-child relationships
    const allCategories = await Category.find();
    // console.log('\nVerifying category hierarchy...');
    const topLevel = allCategories.filter(c => !c.parentId);
    // console.log(`   - Top level categories: ${topLevel.length}`);
    const subCategories = allCategories.filter(c => c.level === 1);
    // console.log(`   - Subcategories: ${subCategories.length}`);
    const microCategories = allCategories.filter(c => c.level === 2);
    // console.log(`   - Micro categories: ${microCategories.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();