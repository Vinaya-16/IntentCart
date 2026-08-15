import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateCarts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all carts without status
    const result = await Cart.updateMany(
      { status: { $exists: false } },
      {
        $set: {
          status: 'active',
          modificationHistory: [],
          wasModifiedAfterAbandonment: false,
          originalTotal: 0,
          originalItemsCount: 0,
          lastModifiedAt: new Date()
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} carts`);
    console.log(`Matched ${result.matchedCount} carts`);

    // Update carts with items but no original total
    const cartsWithItems = await Cart.find({ 
      items: { $exists: true, $ne: [] },
      originalTotal: 0
    });

    for (const cart of cartsWithItems) {
      cart.originalTotal = cart.total;
      cart.originalItemsCount = cart.items.length;
      await cart.save();
    }

    console.log(`Updated ${cartsWithItems.length} carts with original totals`);

    process.exit(0);
  } catch (error) {
    console.error('Error migrating carts:', error);
    process.exit(1);
  }
};

migrateCarts();