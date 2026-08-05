import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch categories from backend
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from backend
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
      
      if (data.success && data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      } else {
        // Fallback categories if API returns empty
        setCategories([
          { name: 'Women', slug: 'women' },
          { name: 'Men', slug: 'men' },
          { name: 'Kids', slug: 'kids' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
      
      // Fallback categories if API fails
      setCategories([
        { name: 'Women', slug: 'women' },
        { name: 'Men', slug: 'men' },
        { name: 'Kids', slug: 'kids' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Get category name for display
  const getCategoryName = (category) => {
    return category.name || category;
  };

  // Get category slug for link
  const getCategorySlug = (category) => {
    const name = getCategoryName(category);
    return category.slug || name.toLowerCase().replace(/\s+/g, '-');
  };

  // Don't show anything if there's an error and no categories
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
          return (
            <Link
              key={index}
              to={`/category/${slug}`}
              className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
            >
              <div className="w-14 h-14 bg-amber-100/60 rounded-md border border-amber-200/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ImageIcon className="w-6 h-6 text-amber-600/50" />
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