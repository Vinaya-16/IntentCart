import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';

dotenv.config();

// Only top-level category images
const CATEGORY_IMAGES = {
  'Electronics & Gadgets': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop',
  'Fashion & Apparel': 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=200&h=200&fit=crop',
  'Home, Kitchen & Living': 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=200&h=200&fit=crop',
  'Beauty & Personal Care': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop',
  'Health & Wellness': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop',
  'Sports, Fitness & Outdoors': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop',
  'Toys, Baby & Kids': 'https://images.unsplash.com/photo-1558060370-d6441d64758a?w=200&h=200&fit=crop',
  'Books, Media & Hobbies': 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=200&h=200&fit=crop',
};

const categories = [
  // ============ LEVEL 0: Top Categories (8) ============
  { name: 'Electronics & Gadgets', level: 0, order: 1 },
  { name: 'Fashion & Apparel', level: 0, order: 2 },
  { name: 'Home, Kitchen & Living', level: 0, order: 3 },
  { name: 'Beauty & Personal Care', level: 0, order: 4 },
  { name: 'Health & Wellness', level: 0, order: 5 },
  { name: 'Sports, Fitness & Outdoors', level: 0, order: 6 },
  { name: 'Toys, Baby & Kids', level: 0, order: 7 },
  { name: 'Books, Media & Hobbies', level: 0, order: 8 },

  // ============ LEVEL 1: Electronics & Gadgets (5) ============
  { name: 'Smartphones & Accessories', level: 1, parentName: 'Electronics & Gadgets', order: 1 },
  { name: 'Computers & Laptops', level: 1, parentName: 'Electronics & Gadgets', order: 2 },
  { name: 'Audio & Headphones', level: 1, parentName: 'Electronics & Gadgets', order: 3 },
  { name: 'Cameras & Photography', level: 1, parentName: 'Electronics & Gadgets', order: 4 },
  { name: 'TV & Home Entertainment', level: 1, parentName: 'Electronics & Gadgets', order: 5 },

  // ============ LEVEL 1: Fashion & Apparel (4) ============
  { name: "Men's Clothing", level: 1, parentName: 'Fashion & Apparel', order: 1 },
  { name: "Women's Clothing", level: 1, parentName: 'Fashion & Apparel', order: 2 },
  { name: 'Footwear', level: 1, parentName: 'Fashion & Apparel', order: 3 },
  { name: 'Accessories', level: 1, parentName: 'Fashion & Apparel', order: 4 },

  // ============ LEVEL 1: Home, Kitchen & Living (4) ============
  { name: 'Furniture', level: 1, parentName: 'Home, Kitchen & Living', order: 1 },
  { name: 'Home Decor', level: 1, parentName: 'Home, Kitchen & Living', order: 2 },
  { name: 'Kitchen & Dining', level: 1, parentName: 'Home, Kitchen & Living', order: 3 },
  { name: 'Bedding & Bath', level: 1, parentName: 'Home, Kitchen & Living', order: 4 },

  // ============ LEVEL 1: Beauty & Personal Care (4) ============
  { name: 'Skincare', level: 1, parentName: 'Beauty & Personal Care', order: 1 },
  { name: 'Makeup', level: 1, parentName: 'Beauty & Personal Care', order: 2 },
  { name: 'Hair Care', level: 1, parentName: 'Beauty & Personal Care', order: 3 },
  { name: 'Personal Care & Fragrance', level: 1, parentName: 'Beauty & Personal Care', order: 4 },

  // ============ LEVEL 1: Health & Wellness (1) ============
  { name: 'Personal Medical Devices', level: 1, parentName: 'Health & Wellness', order: 2 },

  // ============ LEVEL 1: Sports, Fitness & Outdoors (1) ============
  { name: 'Fitness & Gym Equipment', level: 1, parentName: 'Sports, Fitness & Outdoors', order: 1 },

  // ============ LEVEL 1: Toys, Baby & Kids (2) ============
  { name: 'Baby Care', level: 1, parentName: 'Toys, Baby & Kids', order: 1 },
  { name: 'Toys & Games', level: 1, parentName: 'Toys, Baby & Kids', order: 2 },

  // ============ LEVEL 1: Books, Media & Hobbies (1) ============
  { name: 'Books', level: 1, parentName: 'Books, Media & Hobbies', order: 1 },

  // ============ LEVEL 2: Smartphones & Accessories (4) ============
  { name: 'Mobile Phones', level: 2, parentName: 'Smartphones & Accessories', order: 1 },
  { name: 'Cases, Covers & Screen Protectors', level: 2, parentName: 'Smartphones & Accessories', order: 2 },
  { name: 'Chargers, Cables & Power Banks', level: 2, parentName: 'Smartphones & Accessories', order: 3 },
  { name: 'Smartwatches & Fitness Bands', level: 2, parentName: 'Smartphones & Accessories', order: 4 },

  // ============ LEVEL 2: Computers & Laptops (3) ============
  { name: 'Laptops', level: 2, parentName: 'Computers & Laptops', order: 1 },
  { name: 'Computer Components', level: 2, parentName: 'Computers & Laptops', order: 3 },
  { name: 'Computer Accessories', level: 2, parentName: 'Computers & Laptops', order: 4 },

  // ============ LEVEL 2: Audio & Headphones (1) ============
  { name: 'Wireless Earbuds & In-Ear Headphones', level: 2, parentName: 'Audio & Headphones', order: 1 },

  // ============ LEVEL 2: Men's Clothing (2) ============
  { name: 'Shirts, T-Shirts & Polo Shirts', level: 2, parentName: "Men's Clothing", order: 1 },
  { name: 'Jeans, Trousers & Shorts', level: 2, parentName: "Men's Clothing", order: 2 },

  // ============ LEVEL 2: Women's Clothing (4) ============
  { name: 'Dresses, Tops & Blouses', level: 2, parentName: "Women's Clothing", order: 1 },
  { name: 'Jeans, Pants & Skirts', level: 2, parentName: "Women's Clothing", order: 2 },
  { name: 'Jackets, Blazers & Knitwear', level: 2, parentName: "Women's Clothing", order: 3 },
  { name: 'Activewear & Shapewear', level: 2, parentName: "Women's Clothing", order: 4 },

  // ============ LEVEL 2: Footwear (3) ============
  { name: "Men's Shoes", level: 2, parentName: 'Footwear', order: 1 },
  { name: "Women's Shoes", level: 2, parentName: 'Footwear', order: 2 },
  { name: "Kids' Shoes", level: 2, parentName: 'Footwear', order: 3 },

  // ============ LEVEL 2: Accessories (4) ============
  { name: 'Bags, Backpacks & Luggage', level: 2, parentName: 'Accessories', order: 1 },
  { name: 'Watches & Jewelry', level: 2, parentName: 'Accessories', order: 2 },
  { name: 'Sunglasses & Eyewear', level: 2, parentName: 'Accessories', order: 3 },
  { name: 'Belts, Hats & Scarves', level: 2, parentName: 'Accessories', order: 4 },

  // ============ LEVEL 2: Furniture (3) ============
  { name: 'Living Room', level: 2, parentName: 'Furniture', order: 1 },
  { name: 'Bedroom', level: 2, parentName: 'Furniture', order: 2 },
  { name: 'Office Furniture', level: 2, parentName: 'Furniture', order: 3 },

  // ============ LEVEL 2: Home Decor (2) ============
  { name: 'Lighting', level: 2, parentName: 'Home Decor', order: 2 },
  { name: 'Rugs, Curtains & Cushion Covers', level: 2, parentName: 'Home Decor', order: 3 },

  // ============ LEVEL 2: Kitchen & Dining (1) ============
  { name: 'Kitchen Appliances', level: 2, parentName: 'Kitchen & Dining', order: 2 },

  // ============ LEVEL 2: Personal Care & Fragrance (1) ============
  { name: "Men's Grooming & Trimmers", level: 2, parentName: 'Personal Care & Fragrance', order: 2 },

  // ============ LEVEL 2: Personal Medical Devices (1) ============
  { name: 'Multivitamins & Minerals', level: 2, parentName: 'Personal Medical Devices', order: 1 },

  // ============ LEVEL 2: Books (1) ============
  { name: "Children's Books & Educational", level: 2, parentName: 'Books', order: 2 },

  // ============ LEVEL 2: Stationery & Office Supplies (1) ============
  { name: 'Notebooks, Pens & Art Supplies', level: 2, parentName: 'Books', order: 1 }
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Category.deleteMany({});
    console.log('Cleared existing categories');

    const categoryMap = {};

    for (const cat of categories) {
      let parentId = null;
      if (cat.parentName) {
        const parent = categoryMap[cat.parentName];
        if (parent) {
          parentId = parent._id;
        }
      }

      // Only add image for level 0 categories
      const imgUrl = cat.level === 0 ? CATEGORY_IMAGES[cat.name] || null : null;

      const category = new Category({
        name: cat.name,
        level: cat.level,
        parentId: parentId,
        order: cat.order || 0,
        isActive: true,
        img: imgUrl // Only level 0 categories get images
      });

      await category.save();
      categoryMap[cat.name] = category;
      console.log(` Created: ${cat.name} ${imgUrl ? '' : ''}`);
    }

    console.log(`\nSeeded ${categories.length} categories successfully!`);
    console.log('Category breakdown:');
    console.log(`   - Level 0 (Top): ${categories.filter(c => c.level === 0).length} (with images)`);
    console.log(`   - Level 1 (Sub): ${categories.filter(c => c.level === 1).length}`);
    console.log(`   - Level 2 (Micro): ${categories.filter(c => c.level === 2).length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();