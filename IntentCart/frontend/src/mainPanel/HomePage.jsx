import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  Globe,
  CheckCircle2,
  Image as ImageIcon,
  Copy,
  Check,
  Clock
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Header from '../components/Header.jsx';
import Categories from '../components/CategoryBar.jsx';
import Footer from '../components/Footer.jsx';

// API Configuration
const API_BASE_URI = import.meta.env.VITE_APP_URL;
const API_BASE_URL = `${API_BASE_URI}` || 'http://localhost:5000/api';

export default function HomePage() {
  // State Management
  const [loading, setLoading] = useState(true);
  const [saleHighlights, setSaleHighlights] = useState([]);
  const [dealCorner, setDealCorner] = useState([]);
  const [promoBanner, setPromoBanner] = useState(null);
  const [bannerCampaigns, setBannerCampaigns] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeCampaignsCount, setActiveCampaignsCount] = useState(0);
  const [error, setError] = useState(null);

  const fallbackData = {
    saleHighlights: [
      {
        _id: '1',
        title: 'US Polo ASSN.',
        subtitle: 'Since 1980',
        offer: 'Buy 2 Get 2',
        discount: 'Free',
        bg: 'bg-indigo-500',
        couponCode: 'USPOLOB2G2',
        imageUrl: null
      },
      {
        _id: '2',
        title: 'Levis',
        offer: 'Buy 2 Get',
        discount: '40% Off',
        bg: 'bg-indigo-400',
        couponCode: 'LEVIS40',
        imageUrl: null
      },
      {
        _id: '3',
        title: 'Fahrenheit',
        offer: 'min .',
        discount: '30% Off',
        bg: 'bg-indigo-900',
        couponCode: 'FAHREN30',
        imageUrl: null
      },
      {
        _id: '4',
        title: 'EOSS Promo',
        subtitle: 'End of Season Sale',
        offer: 'Up to 50% + Extra 10%',
        discount: '50% Off',
        bg: 'bg-indigo-500',
        couponCode: 'EOSS50',
        imageUrl: null
      },
    ],
    dealCorner: [
      { _id: '5', brand: 'Allen Solly', offer: 'Buy 2 Get 40% Off', couponCode: 'ALLEN40', imageUrl: null },
      { _id: '6', brand: 'ELLE', offer: 'Flat 30% Off', couponCode: 'ELLE30', imageUrl: null },
      { _id: '7', brand: 'Elli', offer: 'Flat 30% Off', couponCode: 'ELLI30', imageUrl: null },
      { _id: '8', brand: 'Code', offer: 'Flat 30% Off', couponCode: 'CODE30', imageUrl: null },
      { _id: '9', brand: 'Ginger', offer: 'Flat 50% Off', couponCode: 'GINGER50', imageUrl: null },
      { _id: '10', brand: 'Fastrack', offer: 'Flat 50% Off', couponCode: 'FASTRACK50', imageUrl: null },
    ],
    promoBanner: {
      text: 'EOSS | Up to 50% + Extra 10% Off | Free Shipping on all orders',
      couponCode: 'EOSS50',
      extraDiscount: '10%',
      imageUrl: null
    },
    bannerCampaigns: [
      {
        _id: 'banner1',
        name: 'Flash Sale',
        description: 'FLASH SALE: 20% OFF everything!',
        couponCode: 'FLASH20',
        discount: '20% Off',
        type: 'flash_sale',
        bg: 'from-red-600 to-orange-600',
        imageUrl: null
      },
      {
        _id: 'banner2',
        name: 'US Polo ASSN.',
        description: 'Buy 2 Get 2 Free on US Polo ASSN.',
        couponCode: 'USPOLOB2G2',
        discount: 'Buy 2 Get 2 Free',
        type: 'bogo',
        bg: 'from-purple-600 to-pink-600',
        imageUrl: null
      }
    ]
  };

  // Fetch campaigns on component mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Auto-slide banners
  useEffect(() => {
    if (bannerCampaigns.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % bannerCampaigns.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [bannerCampaigns]);

  // Fetch campaigns from backend using fetch
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/merchant/campaigns/public`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const campaigns = data.campaigns || [];

        if (campaigns.length === 0) {
          useFallbackData();
          setLoading(false);
          return;
        }

        const active = campaigns.filter(c => c.status === 'active');
        setActiveCampaignsCount(active.length);
        processCampaigns(campaigns);
      } else {
        useFallbackData();
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      useFallbackData();

      if (error.message.includes('401')) {
        toast.error('Please login to view campaigns');
      } else if (error.message.includes('404')) {
        toast.error('Campaign API not found');
      } else {
        toast.error('Failed to load campaigns');
      }
    } finally {
      setLoading(false);
    }
  };

  const useFallbackData = () => {
    setSaleHighlights(fallbackData.saleHighlights);
    setDealCorner(fallbackData.dealCorner);
    setPromoBanner(fallbackData.promoBanner);
    setBannerCampaigns(fallbackData.bannerCampaigns);
    setActiveCampaignsCount(9);
  };

  const processCampaigns = (campaigns) => {
    const activeCampaigns = campaigns.filter(c => c.status === 'active');

    if (activeCampaigns.length === 0) {
      useFallbackData();
      return;
    }

    // 1. Sale Highlights
    let highlights = activeCampaigns
      .filter(c => c.metadata?.section === 'sale_highlights')
      .map(c => ({
        _id: c._id,
        title: c.metadata?.title || c.name,
        subtitle: c.metadata?.subtitle || '',
        offer: c.metadata?.offer || formatOffer(c),
        discount: c.metadata?.discount || formatDiscount(c),
        bg: c.metadata?.bg || getRandomColor(),
        couponCode: c.couponCode,
        type: c.type,
        imageUrl: c.imageUrl || c.image || null
      }));

    if (highlights.length === 0) {
      const fallbackHighlights = activeCampaigns
        .filter(c => c.type === 'discount' || c.type === 'bogo' || c.type === 'flash_sale')
        .slice(0, 4)
        .map(c => ({
          _id: c._id,
          title: c.name,
          subtitle: c.description?.substring(0, 30) || '',
          offer: c.type === 'bogo' ? 'Buy 1 Get 1' : formatOffer(c),
          discount: formatDiscount(c),
          bg: getRandomColor(),
          couponCode: c.couponCode,
          type: c.type,
          imageUrl: c.imageUrl || c.image || null
        }));

      if (fallbackHighlights.length > 0) {
        highlights = fallbackHighlights;
      } else {
        highlights = fallbackData.saleHighlights;
      }
    }
    setSaleHighlights(highlights);

    // 2. Deal Corner - ALL campaigns with coupons or discounts
    let deals = activeCampaigns
      .filter(c => {
        const hasCoupon = !!c.couponCode;
        const hasDiscount = c.discountValue > 0;
        const isFreeShipping = c.type === 'free_shipping';
        const isBogo = c.type === 'bogo';
        return hasCoupon || hasDiscount || isFreeShipping || isBogo;
      })
      .slice(0, 6)
      .map(c => ({
        _id: c._id,
        brand: c.metadata?.brand || c.name,
        offer: c.metadata?.offer || formatDiscount(c),
        couponCode: c.couponCode,
        type: c.type,
        imageUrl: c.imageUrl || c.image || null,
        discount: formatDiscount(c)
      }));

    if (deals.length === 0) {
      deals = fallbackData.dealCorner;
    }
    setDealCorner(deals);

    // 3. Promo Banner
    const promo = activeCampaigns.find(c => c.metadata?.section === 'promo_banner');
    if (promo) {
      setPromoBanner({
        text: promo.description || `${promo.name} | ${formatDiscount(promo)}`,
        couponCode: promo.couponCode,
        extraDiscount: promo.metadata?.extraDiscount || '',
        imageUrl: promo.imageUrl || promo.image || null
      });
    } else {
      const firstWithCoupon = activeCampaigns.find(c => c.couponCode);
      if (firstWithCoupon) {
        setPromoBanner({
          text: `${firstWithCoupon.name} | ${formatDiscount(firstWithCoupon)}`,
          couponCode: firstWithCoupon.couponCode,
          extraDiscount: '',
          imageUrl: firstWithCoupon.imageUrl || firstWithCoupon.image || null
        });
      } else {
        setPromoBanner(fallbackData.promoBanner);
      }
    }

    // 4. Banner Campaigns
    let banners = activeCampaigns
      .filter(c => c.couponCode || c.type === 'flash_sale' || c.type === 'bogo')
      .slice(0, 5)
      .map(c => ({
        _id: c._id,
        name: c.name,
        description: c.description || `${formatDiscount(c)} on ${c.name}`,
        couponCode: c.couponCode,
        discount: formatDiscount(c),
        type: c.type,
        bg: getGradientColor(c.type),
        imageUrl: c.imageUrl || c.image || null
      }));

    if (banners.length === 0) {
      banners = fallbackData.bannerCampaigns;
    }
    setBannerCampaigns(banners);
  };

  const formatDiscount = (campaign) => {
    if (!campaign) return 'Special Offer';
    if (campaign.discountType === 'percentage') {
      return `${campaign.discountValue}% Off`;
    } else if (campaign.discountType === 'fixed') {
      return `Rs.${campaign.discountValue} Off`;
    } else if (campaign.discountType === 'free_shipping') {
      return 'Free Shipping';
    }
    return 'Special Offer';
  };

  const formatOffer = (campaign) => {
    if (!campaign) return 'Special Offer';
    if (campaign.type === 'bogo') return 'Buy 1 Get 1';
    if (campaign.type === 'flash_sale') return 'Flash Sale';
    if (campaign.type === 'free_shipping') return 'Free Shipping';
    return campaign.name || 'Special Offer';
  };

  const getRandomColor = () => {
    const colors = [
      'bg-indigo-500', 'bg-indigo-400', 'bg-indigo-900',
      'bg-purple-500', 'bg-blue-500', 'bg-teal-500',
      'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getGradientColor = (type) => {
    const gradients = {
      discount: 'from-blue-600 to-indigo-600',
      coupon: 'from-purple-600 to-pink-600',
      free_shipping: 'from-green-600 to-emerald-600',
      loyalty_reward: 'from-amber-600 to-orange-600',
      bogo: 'from-rose-600 to-red-600',
      flash_sale: 'from-red-600 to-orange-600'
    };
    return gradients[type] || 'from-purple-600 to-indigo-600';
  };

  const handleCopyCoupon = (couponCode) => {
    if (couponCode) {
      navigator.clipboard.writeText(couponCode);
      setCopiedCode(couponCode);
      toast.success(`Coupon ${couponCode} copied!`);
      setTimeout(() => setCopiedCode(null), 3000);
    }
  };

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + bannerCampaigns.length) % bannerCampaigns.length);
  };

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % bannerCampaigns.length);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
        <Header />
        <Categories />
        <div className="bg-indigo-700 text-white text-center py-2 text-xs font-semibold tracking-wide">
          Loading campaigns...
        </div>
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-10">
          <div className="bg-slate-200 rounded-xl h-[380px] animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl h-80 animate-pulse"></div>)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-white rounded-xl h-44 animate-pulse"></div>)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <Toaster position="top-right" />

      <header className="sticky top-0 z-50 shadow-sm">
        <Header />
        <Categories />
        <div className="bg-indigo-700 text-white text-center py-2 text-xs font-semibold tracking-wide flex items-center justify-center gap-3 flex-wrap">
          <span>{promoBanner?.text || 'EOSS | Up to 50% + Extra 10% Off | Free Shipping on all orders'}</span>
          {promoBanner?.couponCode && (
            <button
              onClick={() => handleCopyCoupon(promoBanner.couponCode)}
              className="bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 transition-all"
            >
              {copiedCode === promoBanner.couponCode ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  {promoBanner.couponCode}
                </>
              )}
            </button>
          )}
          {promoBanner?.extraDiscount && (
            <span className="bg-yellow-400 text-indigo-900 px-2 py-0.5 rounded-full font-bold text-[10px]">
              + {promoBanner.extraDiscount} Extra
            </span>
          )}
          <span className="text-[10px] opacity-75">
            {activeCampaignsCount} active offers
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-10">

        {/* Hero Slider Section */}
        <section className="relative bg-slate-200 rounded-xl overflow-hidden h-[380px] flex items-center justify-center group">
          {bannerCampaigns.length > 0 && (
            <div className="absolute inset-0 transition-all duration-700">
              <div className={`w-full h-full bg-gradient-to-r ${bannerCampaigns[currentBannerIndex]?.bg || 'from-purple-600 to-indigo-600'} flex items-center justify-center relative`}>
                {bannerCampaigns[currentBannerIndex]?.imageUrl ? (
                  <>
                    <img
                      src={bannerCampaigns[currentBannerIndex].imageUrl}
                      alt={bannerCampaigns[currentBannerIndex].name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40"></div>
                  </>
                ) : null}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-8">
                  <div className="text-center text-white max-w-2xl relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold mb-3">
                      {bannerCampaigns[currentBannerIndex]?.name}
                    </h2>
                    <p className="text-lg md:text-xl text-white/90 mb-4">
                      {bannerCampaigns[currentBannerIndex]?.description}
                    </p>
                    <div className="text-2xl font-bold text-yellow-300 mb-4">
                      {bannerCampaigns[currentBannerIndex]?.discount}
                    </div>
                    {bannerCampaigns[currentBannerIndex]?.couponCode && (
                      <button
                        onClick={() => handleCopyCoupon(bannerCampaigns[currentBannerIndex].couponCode)}
                        className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all flex items-center gap-2 mx-auto"
                      >
                        {copiedCode === bannerCampaigns[currentBannerIndex].couponCode ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Code: {bannerCampaigns[currentBannerIndex].couponCode}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {bannerCampaigns.length > 1 && (
            <>
              <button
                onClick={prevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-md transition-all z-10"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
              <button
                onClick={nextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-md transition-all z-10"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {bannerCampaigns.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentBannerIndex ? 'bg-white w-8' : 'bg-white/50'
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Sale Highlight Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sale Highlight</h2>
              <div className="w-16 h-1 bg-indigo-600 mt-1 rounded-full"></div>
            </div>
            {saleHighlights.length > 0 && (
              <span className="text-xs text-indigo-600 font-medium">{saleHighlights.length} offers</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {saleHighlights.map((item) => (
              <div
                key={item._id}
                className="relative rounded-2xl h-80 overflow-hidden shadow-sm flex flex-col justify-end p-6 text-white text-center group cursor-pointer transition-transform hover:scale-[1.02]"
              >
                {item.imageUrl ? (
                  <>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  </>
                ) : (
                  <div className={`absolute inset-0 ${item.bg || 'bg-indigo-500'}`}></div>
                )}
                
                <div className="relative z-10 space-y-1">
                  <p className="text-xs font-semibold tracking-wider uppercase opacity-90">{item.title}</p>
                  {item.subtitle && <p className="text-[10px] opacity-75">{item.subtitle}</p>}
                  <p className="text-lg font-bold mt-2 leading-tight">{item.offer}</p>
                  <p className="text-3xl font-black uppercase tracking-tight">{item.discount}</p>
                  {item.couponCode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCoupon(item.couponCode);
                      }}
                      className="mt-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-white/30 transition-all inline-flex items-center gap-1"
                    >
                      {copiedCode === item.couponCode ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          {item.couponCode}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Deal Corner Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Deal Corner</h2>
              <div className="w-16 h-1 bg-indigo-600 mt-1 rounded-full"></div>
            </div>
            {dealCorner.length > 0 && (
              <span className="text-xs text-indigo-600 font-medium">{dealCorner.length} deals</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {dealCorner.map((item) => (
              <div
                key={item._id}
                className="relative rounded-xl h-44 flex flex-col justify-center items-center text-center p-3 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-all"
              >
                {item.imageUrl ? (
                  <>
                    <img
                      src={item.imageUrl}
                      alt={item.brand}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-amber-100/70 border border-amber-200/50"></div>
                )}

                <div className={`relative z-10 p-2 rounded-lg w-full ${item.imageUrl ? 'bg-black/30 backdrop-blur-sm' : 'bg-white/40 backdrop-blur-[2px]'}`}>
                  <p className={`font-bold text-sm truncate ${item.imageUrl ? 'text-white' : 'text-indigo-950'}`}>
                    {item.brand}
                  </p>
                  <p className={`text-xs font-extrabold mt-0.5 ${item.imageUrl ? 'text-yellow-300' : 'text-indigo-900'}`}>
                    {item.offer}
                  </p>
                  {item.couponCode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCoupon(item.couponCode);
                      }}
                      className={`mt-1.5 text-[10px] px-2 py-0.5 rounded-full transition-all flex items-center gap-1 mx-auto ${
                        item.imageUrl 
                          ? 'bg-white/20 text-white hover:bg-white/30' 
                          : 'bg-indigo-600/80 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {copiedCode === item.couponCode ? (
                        <>
                          <Check className="w-2.5 h-2.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          {item.couponCode}
                        </>
                      )}
                    </button>
                  )}
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
                className="bg-white border border-indigo-100 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all"
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

      <Footer />
    </div>
  );
}