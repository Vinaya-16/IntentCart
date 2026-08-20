import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URI = import.meta.env.REACT_APP_API_URL;
const API_URL = `${API_BASE_URI}` || 'http://localhost:5000/api';

// Fallback images using placeholder service
const CATEGORY_FALLBACKS = {
  'Electronics & Gadgets': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=100&h=100&fit=crop&crop=center',
  'Fashion & Apparel': 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=100&h=100&fit=crop&crop=center',
  'Home, Kitchen & Living': 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=100&h=100&fit=crop&crop=center',
  'Beauty & Personal Care': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&h=100&fit=crop&crop=center',
  'Health & Wellness': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100&h=100&fit=crop&crop=center',
  'Sports, Fitness & Outdoors': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100&h=100&fit=crop&crop=center',
  'Toys, Baby & Kids': 'https://images.unsplash.com/photo-1558060370-d6441d64758a?w=100&h=100&fit=crop&crop=center',
  'Books, Media & Hobbies': 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=100&h=100&fit=crop&crop=center',
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/categories/top`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      // console.log('Categories data:', data);

      if (data.success && data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      } else {
        // Fallback categories with images
        setCategories([
          { name: 'Electronics & Gadgets', slug: 'electronics-gadgets', img: CATEGORY_FALLBACKS['Electronics & Gadgets'] },
          { name: 'Fashion & Apparel', slug: 'fashion-apparel', img: CATEGORY_FALLBACKS['Fashion & Apparel'] },
          { name: 'Home, Kitchen & Living', slug: 'home-kitchen-living', img: CATEGORY_FALLBACKS['Home, Kitchen & Living'] },
          { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', img: CATEGORY_FALLBACKS['Beauty & Personal Care'] },
          { name: 'Health & Wellness', slug: 'health-wellness', img: CATEGORY_FALLBACKS['Health & Wellness'] },
          { name: 'Sports, Fitness & Outdoors', slug: 'sports-fitness-outdoors', img: CATEGORY_FALLBACKS['Sports, Fitness & Outdoors'] },
          { name: 'Toys, Baby & Kids', slug: 'toys-baby-kids', img: CATEGORY_FALLBACKS['Toys, Baby & Kids'] },
          { name: 'Books, Media & Hobbies', slug: 'books-media-hobbies', img: CATEGORY_FALLBACKS['Books, Media & Hobbies'] },
        ]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');

      // Fallback categories with images
      setCategories([
        { name: 'Electronics & Gadgets', slug: 'electronics-gadgets', img: CATEGORY_FALLBACKS['Electronics & Gadgets'] },
        { name: 'Fashion & Apparel', slug: 'fashion-apparel', img: CATEGORY_FALLBACKS['Fashion & Apparel'] },
        { name: 'Home, Kitchen & Living', slug: 'home-kitchen-living', img: CATEGORY_FALLBACKS['Home, Kitchen & Living'] },
        { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', img: CATEGORY_FALLBACKS['Beauty & Personal Care'] },
        { name: 'Health & Wellness', slug: 'health-wellness', img: CATEGORY_FALLBACKS['Health & Wellness'] },
        { name: 'Sports, Fitness & Outdoors', slug: 'sports-fitness-outdoors', img: CATEGORY_FALLBACKS['Sports, Fitness & Outdoors'] },
        { name: 'Toys, Baby & Kids', slug: 'toys-baby-kids', img: CATEGORY_FALLBACKS['Toys, Baby & Kids'] },
        { name: 'Books, Media & Hobbies', slug: 'books-media-hobbies', img: CATEGORY_FALLBACKS['Books, Media & Hobbies'] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryImage = (category) => {
    // First check if category has img field
    if (category.img) {
      console.log('Using category img:', category.img);
      return category.img;
    }

    // Then check fallback by name
    const fallback = CATEGORY_FALLBACKS[category.name];
    if (fallback) {
      console.log('Using fallback for:', category.name);
      return fallback;
    }

    // Finally return null
    console.log('No image for:', category.name);
    return null;
  };

  const getCategoryName = (category) => {
    return category.name || category;
  };

  const getCategorySlug = (category) => {
    const name = getCategoryName(category);
    return category.slug || name.toLowerCase().replace(/\s+/g, '-');
  };

  if (error && categories.length === 0) {
    return (
      <div className="bg-orange-50/40 border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center h-14">
          <span className="text-xs text-red-500">Failed to load categories</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-orange-50/40 border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center h-14">
          <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
          <span className="ml-2 text-xs text-gray-500">Loading categories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50/40 border-b border-gray-200 py-3">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-start sm:justify-between overflow-x-auto gap-6 sm:gap-4 scrollbar-thin scrollbar-thumb-gray-300">
        {categories.map((category, index) => {
          const name = getCategoryName(category);
          const slug = getCategorySlug(category);
          const imageUrl = getCategoryImage(category);

          return (
            <Link
              key={index}
              to={`/category/${slug}`}
              className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
            >
              <div className="w-14 h-14 bg-amber-100/60 rounded-md border border-amber-200/50 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.log('Image failed to load:', imageUrl);
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      if (parent) {
                        const icon = document.createElement('div');
                        icon.className = 'w-full h-full flex items-center justify-center';
                        icon.innerHTML = `<svg class="w-6 h-6 text-amber-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
                        parent.appendChild(icon);
                      }
                    }}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-amber-600/50" />
                )}
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600 whitespace-nowrap">
                {name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}