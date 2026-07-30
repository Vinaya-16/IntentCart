import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  Globe,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import Header from './components/Header.jsx';
import CategoryBar from './components/CategoryBar.jsx';
import Layout from './components/Layout.jsx';

// ------------------- DATA -------------------

const heroSlides = [
  {
    id: 1,
    tagline: 'BRAND IN FOCUS',
    brand: 'CAPRESE',
    offer: 'Flat 50% Off',
    bgColor: '#18181b',
  },
  {
    id: 2,
    tagline: 'NEW ARRIVALS',
    brand: 'FOSSIL',
    offer: 'Up to 40% Off',
    bgColor: '#1c1917',
  },
  {
    id: 3,
    tagline: 'EXCLUSIVE DEAL',
    brand: 'TOMMY HILFIGER',
    offer: 'Min 30% Off',
    bgColor: '#0f172a',
  },
];

const saleHighlights = [
  {
    id: 1,
    brand: 'US POLO ASSN.',
    subtitle: 'Since 1980',
    line1: 'Buy 2 Get 2',
    line2: 'Free',
  },
  {
    id: 2,
    brand: 'LEVIS',
    subtitle: '',
    line1: 'Buy 2 Get',
    line2: '40 % Off',
  },
  {
    id: 3,
    brand: 'FAHRENHEIT',
    subtitle: '',
    line1: 'min .',
    line2: '30 % Off',
  },
  {
    id: 4,
    brand: 'US POLO ASSN.',
    subtitle: 'Since 1980',
    line1: 'Buy 2 Get 2',
    line2: 'Free',
  },
];

const dealCorner = [
  {
    id: 1,
    brand: 'Allen Solly',
    line1: 'Buy 2 Get',
    line2: '40 % Off',
  },
  {
    id: 2,
    brand: 'ELLE',
    line1: 'Flat',
    line2: '30 % Off',
  },
  {
    id: 3,
    brand: 'Elli',
    line1: 'Flat',
    line2: '30 % Off',
  },
  {
    id: 4,
    brand: 'Code',
    line1: 'Flat',
    line2: '30 % Off',
  },
  {
    id: 5,
    brand: 'Ginger',
    line1: 'Flat',
    line2: '50 % Off',
  },
  {
    id: 6,
    brand: 'Fastrack',
    line1: 'Flat',
    line2: '50 % Off',
  },
];

const benefits = [
  {
    id: 1,
    title: 'Free Shipping',
    subtitle: 'on all orders',
    icon: Truck,
  },
  {
    id: 2,
    title: '25+ Global Brands',
    subtitle: 'your favourite brands',
    icon: Globe,
  },
  {
    id: 3,
    title: 'Authenticity',
    subtitle: '100 % genuine products',
    icon: CheckCircle2,
  },
];

// ------------------- COMPONENTS -------------------

function ImagePlaceholder({ label = 'Image Placeholder' }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#334155',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        gap: '8px',
        userSelect: 'none',
      }}
    >
      <ImageIcon size={32} color="#94a3b8" />
      <span style={{ fontSize: '12px', fontWeight: '600' }}>{label}</span>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h2
        style={{
          fontSize: '20px',
          fontWeight: '800',
          color: '#0f172a',
          margin: 0,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          width: '48px',
          height: '4px',
          backgroundColor: '#4f46e5',
          borderRadius: '2px',
          marginTop: '6px',
        }}
      />
    </div>
  );
}

function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  };

  const currentSlide = heroSlides[currentIndex];

  return (
    <section style={{ width: '100%', backgroundColor: '#ffffff', padding: '16px 0' }}>
      <div
        style={{
          position: 'relative',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '380px',
            borderRadius: '16px',
            backgroundColor: currentSlide.bgColor,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 48px',
            boxSizing: 'border-box',
            transform: 'translate3d(0, 0, 0)',
            WebkitTransform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            perspective: 1000,
            WebkitPerspective: 1000,
          }}
        >
          {/* Hero Left Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              color: '#ffffff',
              maxWidth: '450px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '3px',
                color: '#94a3b8',
                textTransform: 'uppercase',
                margin: '0 0 10px 0',
              }}
            >
              {currentSlide.tagline}
            </p>

            <h2
              style={{
                fontSize: '40px',
                fontWeight: '900',
                letterSpacing: '4px',
                color: '#ffffff',
                textTransform: 'uppercase',
                margin: '0 0 8px 0',
              }}
            >
              {currentSlide.brand}
            </h2>

            <p
              style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#ffffff',
                margin: 0,
              }}
            >
              {currentSlide.offer}
            </p>
          </div>

          {/* Right Placeholder Box */}
          <div
            style={{
              width: '320px',
              height: '240px',
              border: '2px dashed #475569',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
            }}
          >
            <ImagePlaceholder label="Banner Image Slot" />
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          style={{
            position: 'absolute',
            left: '28px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }}
        >
          <ChevronLeft size={20} color="#374151" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          style={{
            position: 'absolute',
            right: '28px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }}
        >
          <ChevronRight size={20} color="#374151" />
        </button>
      </div>
    </section>
  );
}

function SaleHighlightCard({ item }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        height: '300px',
        borderRadius: '20px',
        overflow: 'hidden',
        backgroundColor: '#1e1b4b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px',
        boxSizing: 'border-box',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 12px 24px rgba(0,0,0,0.18)'
          : '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        willChange: 'transform',
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          color: '#ffffff',
        }}
      >
        <p
          style={{
            fontSize: '13px',
            fontWeight: '800',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          {item.brand}
        </p>
        {item.subtitle && (
          <p style={{ fontSize: '10px', opacity: 0.8, margin: '2px 0 0 0' }}>
            {item.subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          color: '#ffffff',
        }}
      >
        <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, lineHeight: '1.2' }}>
          {item.line1}
        </p>
        <p
          style={{
            fontSize: '26px',
            fontWeight: '900',
            margin: 0,
            lineHeight: '1.2',
          }}
        >
          {item.line2}
        </p>
      </div>
    </div>
  );
}

function SaleHighlight() {
  return (
    <section
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <SectionHeader title="Sale Highlight" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        {saleHighlights.map((item) => (
          <SaleHighlightCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function DealCornerCard({ item }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        height: '140px',
        borderRadius: '16px',
        backgroundColor: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        boxSizing: 'border-box',
        border: '1px solid #e2e8f0',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 8px 16px rgba(0,0,0,0.08)'
          : '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        willChange: 'transform',
      }}
    >
      <p
        style={{
          fontSize: '13px',
          fontWeight: '800',
          color: '#0f172a',
          margin: 0,
        }}
      >
        {item.brand}
      </p>
      <p
        style={{
          fontSize: '12px',
          fontWeight: '700',
          color: '#312e81',
          margin: '4px 0 0 0',
        }}
      >
        {item.line1}
      </p>
      <p
        style={{
          fontSize: '14px',
          fontWeight: '900',
          color: '#312e81',
          margin: 0,
        }}
      >
        {item.line2}
      </p>
    </div>
  );
}

function DealCorner() {
  return (
    <section
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <SectionHeader title="Deal Corner" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
        }}
      >
        {dealCorner.map((item) => (
          <DealCornerCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function OurBenefits() {
  return (
    <section
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px 40px',
        boxSizing: 'border-box',
      }}
    >
      <SectionHeader title="Our Benefits" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {benefits.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid #e0e7ff',
                borderRadius: '16px',
                padding: '20px',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 10px rgba(79, 70, 229, 0.05)',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#eef2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconComponent size={24} color="#4f46e5" />
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: '#0f172a',
                    margin: 0,
                  }}
                >
                  {item.title}
                </h4>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    margin: '2px 0 0 0',
                    fontWeight: '500',
                  }}
                >
                  {item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="bg-white text-slate-800 min-h-screen font-sans">
      <Layout />

      <HeroSection />
      <SaleHighlight />
      <DealCorner />
      <OurBenefits />

    </div>
  );
}