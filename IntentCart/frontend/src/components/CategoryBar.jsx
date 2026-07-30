import React, { useState, useEffect } from 'react';

const categories = [
  { id: 1, label: 'Women', image: '' },
  { id: 2, label: 'Men', image: '' },
  { id: 3, label: 'Kids', image: '' },
  { id: 4, label: 'Footwear', image: '' },
  { id: 5, label: 'Bags', image: '' },
  { id: 6, label: 'Beauty', image: '' },
  { id: 7, label: 'Home & Living', image: '' },
  { id: 8, label: 'BabyShop', image: '' },
  { id: 9, label: 'GenZ', image: '' },
  { id: 10, label: 'Watches', image: '' },
];

export default function CategoryBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        maxHeight: isVisible ? '300px' : '0px',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.4s ease-in-out',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Categories Bar */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
          paddingTop: '20px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '15px',
            overflowX: 'auto'
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: '1',
                minWidth: '80px',
                maxWidth: '110px',
                cursor: 'pointer'
              }}
            >
              {/* Image Box Container */}
              <div
                style={{
                  width: '100%',
                  height: '75px',
                  backgroundColor: '#F6ECE1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.label}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '11px', color: '#a89a8c', fontWeight: '500' }}>
                    Image
                  </span>
                )}
              </div>

              {/* Category Title */}
              <span
                style={{
                  marginTop: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'Blue',
                  textAlign: 'center',
                  lineHeight: '1.2'
                }}
              >
                {cat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#4A3B9B',
          color: '#ffffff',
          paddingTop: '10px',
          paddingBottom: '10px',
          paddingLeft: '16px',
          paddingRight: '16px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '700',
          letterSpacing: '0.3px',
          boxSizing: 'border-box'
        }}
      >
        EOSS | Up to 50 % + Extra 10 % Off | Free Shipping on all orders
      </div>
    </div>
  );
}