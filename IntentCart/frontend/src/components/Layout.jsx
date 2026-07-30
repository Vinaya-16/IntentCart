import React from 'react';
import Header from './Header';
import CategoryBar from './CategoryBar';

export default function Layout() {
  return (
    <div className="bg-white text-slate-800 font-sans">
      <Header />
      <CategoryBar />
    </div>
  );
}