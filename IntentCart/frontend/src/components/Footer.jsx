import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-indigo-700 text-white py-6 border-t border-indigo-800">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Brand Logo */}
        <div className="text-xl font-black tracking-tight">
          Intent<span className="text-indigo-200">Cart</span>
        </div>

        {/* Copyright and Legal Links */}
        <div className="text-indigo-100 text-center sm:text-right">
          <p>© 2026 RNA Intellectual Property Limited.</p>
          <div className="flex gap-2 justify-center sm:justify-end mt-1 text-indigo-200">
            <a href="#" className="underline hover:text-white">Terms & Conditions</a>
            <span>-</span>
            <a href="#" className="underline hover:text-white">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}