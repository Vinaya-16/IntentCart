import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function Categories() {
  const categories = [
    'Women', 'Men', 'Kids', 'Footwear', 'Bags', 
    'Beauty', 'Home & Living', 'BabyShop', 'GenZ', 'Watches'
  ];

  return (
    <div className="bg-orange-50/40 border-b border-gray-200 py-3">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-start sm:justify-between overflow-x-auto gap-6 sm:gap-4 scrollbar-thin scrollbar-thumb-gray-300">
        {categories.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group">
            <div className="w-14 h-14 bg-amber-100/60 rounded-md border border-amber-200/50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ImageIcon className="w-6 h-6 text-amber-600/50" />
            </div>
            <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600 whitespace-nowrap">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}