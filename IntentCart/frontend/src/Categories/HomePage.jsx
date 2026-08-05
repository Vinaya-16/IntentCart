import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Truck, 
  Globe, 
  CheckCircle2, 
  Image as ImageIcon 
} from 'lucide-react';

import Header from '../components/Header.jsx';
import Categories from '../components/CategoryBar.jsx';
import Footer from '../components/Footer.jsx';

export default function EcommerceLanding() {
  const saleHighlights = [
    { title: 'US Polo ASSN.', subtitle: 'Since 1980', offer: 'Buy 2 Get 2', discount: 'Free', bg: 'bg-indigo-500' },
    { title: 'Levis', offer: 'Buy 2 Get', discount: '40 % Off', bg: 'bg-indigo-400' },
    { title: 'Fahrenheit', offer: 'min .', discount: '30 % Off', bg: 'bg-indigo-900' },
    { title: 'US Polo ASSN.', subtitle: 'Since 1980', offer: 'Buy 2 Get 2', discount: 'Free', bg: 'bg-indigo-500' },
  ];

  const dealCorner = [
    { brand: 'Allen Solly', offer: 'Buy 2 Get 40 % Off' },
    { brand: 'ELLE', offer: 'Flat 30 % Off' },
    { brand: 'Elli', offer: 'Flat 30 % Off' },
    { brand: 'Code', offer: 'Flat 30 % Off' },
    { brand: 'Ginger', offer: 'Flat 50 % Off' },
    { brand: 'Fastrack', offer: 'Flat 50 % Off' },
  ];

  const benefits = [
    { 
      icon: <Truck className="w-8 h-8 text-gray-700" />, 
      title: 'Free Shipping', 
      description: 'on all orders' 
    },
    { 
      icon: <Globe className="w-8 h-8 text-gray-700" />, 
      title: '25+ Global Brands', 
      description: 'your favourite brands' 
    },
    { 
      icon: <CheckCircle2 className="w-8 h-8 text-gray-700" />, 
      title: 'Authentic Products', 
      description: '100% genuine guaranteed' 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      
      {/* Top Navigation Wrapper */}
      <header className="sticky top-0 z-50 shadow-sm">
        <Header />
        <Categories />
        {/* Promo Banner Strip */}
        <div className="bg-indigo-700 text-white text-center py-2 text-xs font-semibold tracking-wide">
          EOSS | Up to 50 % + Extra 10 % Off | Free Shipping on all orders
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-10">

        {/* Hero Slider Section */}
        <section className="relative bg-slate-200 rounded-xl overflow-hidden h-[380px] flex items-center justify-center group">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center">
            <div className="text-center text-slate-400 flex flex-col items-center gap-2">
              <ImageIcon className="w-16 h-16 stroke-1" />
              <span className="text-sm font-medium">Hero Banner Image Placeholder</span>
            </div>
          </div>

          <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-md transition-all">
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-md transition-all">
            <ChevronRight className="w-5 h-5 text-gray-800" />
          </button>
        </section>

        {/* Sale Highlight Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Sale Highlight</h2>
            <div className="w-16 h-1 bg-indigo-600 mt-1 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {saleHighlights.map((item, index) => (
              <div 
                key={index} 
                className={`relative rounded-2xl h-80 ${item.bg} overflow-hidden shadow-sm flex flex-col justify-end p-6 text-white text-center group cursor-pointer`}
              >
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-white/30" />
                </div>

                <div className="relative z-10 space-y-1">
                  <p className="text-xs font-semibold tracking-wider uppercase opacity-90">{item.title}</p>
                  {item.subtitle && <p className="text-[10px] opacity-75">{item.subtitle}</p>}
                  <p className="text-lg font-bold mt-2 leading-tight">{item.offer}</p>
                  <p className="text-3xl font-black uppercase tracking-tight">{item.discount}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Deal Corner Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Deal Corner</h2>
            <div className="w-16 h-1 bg-indigo-600 mt-1 rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {dealCorner.map((item, index) => (
              <div 
                key={index} 
                className="relative bg-amber-100/70 border border-amber-200/50 rounded-xl h-44 flex flex-col justify-center items-center text-center p-3 shadow-sm overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-amber-800/20" />
                </div>

                <div className="relative z-10 bg-white/40 backdrop-blur-[2px] p-2 rounded-lg w-full">
                  <p className="font-bold text-sm text-indigo-950">{item.brand}</p>
                  <p className="text-xs font-extrabold text-indigo-900 mt-0.5">{item.offer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Our Benefits Section */}
        <section className="pb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Our Benefits</h2>
            <div className="w-16 h-1 bg-indigo-600 mt-1 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((item, index) => (
              <div 
                key={index} 
                className="bg-white border border-indigo-100 rounded-xl p-5 flex items-center gap-4 shadow-sm"
              >
                <div className="p-3 bg-gray-50 rounded-lg">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}