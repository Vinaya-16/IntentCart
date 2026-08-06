import Category from '../models/Category.js';
import Product from '../models/Product.js';

// @desc    Get top-level categories for public
// @route   GET /api/categories/top
// @access  Public
export const getTopCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      level: 0,
      isActive: true
    })
      .sort({ order: 1 })
      .select('name slug level order');

    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Error fetching top categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to get all child category IDs recursively
const getAllChildCategoryIds = async (categoryId) => {
  const childIds = [categoryId];

  // Find all direct children
  const children = await Category.find({ parentId: categoryId, isActive: true }).select('_id');

  for (const child of children) {
    // Recursively get grandchildren
    const grandChildIds = await getAllChildCategoryIds(child._id);
    childIds.push(...grandChildIds);
  }

  return childIds;
};

// @desc    Get category by path (supports nested categories)
// @route   GET /api/categories/path/:path
// @access  Public
export const getCategoryByPath = async (req, res) => {
  try {
    const { path } = req.params;
    const slugs = path.split('/');

    let currentCategory = null;
    let subcategories = [];
    let products = [];
    let breadcrumbs = [];
    let allCategoryIds = [];

    // console.log('Fetching category path:', slugs);

    // Find the first category (level 0)
    let query = { slug: slugs[0], level: 0 };
    let parent = await Category.findOne(query);

    if (!parent) {
      // console.log('Top-level category not found:', slugs[0]);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    breadcrumbs.push(parent);
    currentCategory = parent;

    // If there are more slugs, find subcategories
    for (let i = 1; i < slugs.length; i++) {
      const child = await Category.findOne({
        slug: slugs[i],
        parentId: currentCategory._id
      });

      if (!child) {
        // console.log('Subcategory not found:', slugs[i]);
        break;
      }

      breadcrumbs.push(child);
      currentCategory = child;
    }

    // console.log('Current category:', currentCategory.name);
    // console.log('Breadcrumbs:', breadcrumbs.map(c => c.name).join(' → '));

    // Get ALL child category IDs (including current and all descendants)
    allCategoryIds = await getAllChildCategoryIds(currentCategory._id);
    // console.log(`Found ${allCategoryIds.length} category IDs including descendants`);

    // Get subcategories (direct children only)
    subcategories = await Category.find({
      parentId: currentCategory._id,
      isActive: true
    }).sort({ order: 1 });

    // Get product count for each subcategory (including their descendants)
    for (let sub of subcategories) {
      const subChildIds = await getAllChildCategoryIds(sub._id);
      const count = await Product.countDocuments({
        categoryId: { $in: subChildIds },
        status: 'active',
        approvalStatus: 'approved'
      });
      sub._doc.productCount = count;
    }

    // Get products from ALL child categories (not just direct)
    products = await Product.find({
      categoryId: { $in: allCategoryIds },
      status: 'active',
      approvalStatus: 'approved'
    })
      .populate('merchantId', 'businessName')
      .limit(50)
      .sort({ createdAt: -1 });

    // console.log(`Products found in all child categories: ${products.length}`);

    // Format products for frontend
    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      stock: product.stock,
      description: product.description,
      shortDescription: product.shortDescription,
      compareAtPrice: product.compareAtPrice || null,
      discount: product.discount || 0,
      isFeatured: product.isFeatured || false,
      image: product.images && product.images.length > 0
        ? (product.images.find(img => img.isPrimary) || product.images[0])?.url
        : null,
      images: product.images || [],
      merchant: product.merchantId?.businessName || 'Unknown',
      brand: product.brand || product.merchantId?.businessName || '',
      status: product.status,
      approvalStatus: product.approvalStatus,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      microCategoryId: product.microCategoryId,
      createdAt: product.createdAt
    }));

    // Get category hierarchy for the current category
    const categoryHierarchy = [];
    for (const cat of breadcrumbs) {
      categoryHierarchy.push({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        level: cat.level
      });
    }

    res.status(200).json({
      success: true,
      currentCategory: {
        _id: currentCategory._id,
        name: currentCategory.name,
        slug: currentCategory.slug,
        level: currentCategory.level,
        description: currentCategory.description || ''
      },
      subcategories: subcategories.map(c => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        level: c.level,
        image: c.image || null,
        productCount: c._doc?.productCount || 0
      })),
      products: formattedProducts,
      breadcrumbs: categoryHierarchy,
      totalProducts: products.length,
      categoryIds: allCategoryIds
    });

  } catch (error) {
    console.error('Error fetching category path:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all categories (with subcategories)
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ level: 1, order: 1 })
      .select('name slug level parentId order');

    // Build category tree
    const categoryTree = buildCategoryTree(categories);

    res.status(200).json({
      success: true,
      count: categories.length,
      categories: categoryTree
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/:slug
// @access  Public
export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug, isActive: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get subcategories
    const subcategories = await Category.find({
      parentId: category._id,
      isActive: true
    }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      category,
      subcategories
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to build category tree
const buildCategoryTree = (categories, parentId = null) => {
  const result = [];
  const filtered = categories.filter(cat => {
    if (parentId === null) {
      return !cat.parentId || cat.parentId === null;
    }
    return cat.parentId && cat.parentId.toString() === parentId.toString();
  });

  filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

  for (const category of filtered) {
    const children = buildCategoryTree(categories, category._id);
    result.push({
      _id: category._id,
      name: category.name,
      slug: category.slug,
      level: category.level,
      order: category.order,
      children: children
    });
  }

  return result;
};