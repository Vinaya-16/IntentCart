import React, { useState, useEffect } from 'react';
import {
  User, Package, MapPin, CreditCard, Shield, LogOut,
  Edit3, Plus, CheckCircle2, Truck, X,
  Award, ChevronRight, Camera, Loader2, WifiOff, RefreshCw,
  Check, ShoppingBag, Heart, Trash2, Lock, Mail, Phone, Map, Eye, Calendar, Link2, Image
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/customer';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageType, setImageType] = useState('avatar'); // 'avatar' or 'cover'
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isServerDown, setIsServerDown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // User State
  const [user, setUser] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    stateZip: '',
    country: '',
    dob: '',
    gender: '',
    avatar: '',
    cover: '',
    memberSince: '',
    tier: 'Silver Member',
    stats: { orders: 0, rewardPoints: 0, wishlist: 0 }
  });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    type: 'Home',
    street: '',
    city: '',
    state: '',
    zip: '',
    isDefault: false
  });

  // Payments State
  const [payments, setPayments] = useState([]);
  const [newCard, setNewCard] = useState({
    brand: 'Visa',
    last4: '',
    expiry: '',
    isDefault: false
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const getToken = () => localStorage.getItem('token');

  // Fetch profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      setIsServerDown(false);

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/intentCart-auth';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (data.success) {
        setUser(data.profile);
        setAddresses(data.profile.addresses || []);
        setPayments(data.profile.payments || []);

        if (activeTab === 'orders') {
          fetchOrders();
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (err.message === 'Failed to fetch' || err.message.includes('ERR_CONNECTION_REFUSED')) {
        setIsServerDown(true);
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update Avatar
  const handleUpdateAvatar = async (e) => {
    e.preventDefault();

    if (!imageUrlInput.trim()) {
      setError('Please enter a valid image URL');
      return;
    }

    try {
      new URL(imageUrlInput);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setSaving(false);
        return;
      }

      const response = await fetch(`${API_URL}/avatar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatarUrl: imageUrlInput })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update avatar');
      }

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, avatar: data.avatarUrl }));
        setImageUrlInput('');
        setShowAvatarModal(false);
        setSuccess('Profile picture updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating avatar:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Update Cover Image - Now calls backend API
  const handleUpdateCover = async (e) => {
    e.preventDefault();

    if (!imageUrlInput.trim()) {
      setError('Please enter a valid image URL');
      return;
    }

    try {
      new URL(imageUrlInput);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setSaving(false);
        return;
      }

      // Call the backend API
      const response = await fetch(`${API_URL}/cover`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ coverUrl: imageUrlInput })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update cover image');
      }

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, cover: data.coverUrl }));
        setImageUrlInput('');
        setShowCoverModal(false);
        setSuccess('Cover image updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating cover:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open avatar modal
  const openAvatarModal = () => {
    setImageType('avatar');
    setImageUrlInput(user.avatar || '');
    setShowAvatarModal(true);
  };

  // Open cover modal
  const openCoverModal = () => {
    setImageType('cover');
    setImageUrlInput(user.cover || '');
    setShowCoverModal(true);
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError('');

      const token = getToken();
      if (!token) {
        setOrdersError('Please login first');
        setOrdersLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/intentCart-auth';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrdersError(err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setSaving(false);
        return;
      }

      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          mobile: user.mobile,
          address: user.address,
          city: user.city,
          stateZip: user.stateZip,
          country: user.country,
          dob: user.dob,
          gender: user.gender
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      setSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setSaving(false);
        return;
      }

      const response = await fetch(`${API_URL}/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.city) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setSaving(false);
        return;
      }

      const response = await fetch(`${API_URL}/addresses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAddress)
      });

      if (!response.ok) {
        throw new Error('Failed to add address');
      }

      const data = await response.json();
      setAddresses(data.addresses);
      setNewAddress({ type: 'Home', street: '', city: '', state: '', zip: '', isDefault: false });
      setShowAddressModal(false);
      setSuccess('Address added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding address:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const token = getToken();
      if (!token) {
        setError('Please login first');
        return;
      }

      const response = await fetch(`${API_URL}/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      const data = await response.json();
      setAddresses(data.addresses);
      setSuccess('Address deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting address:', err);
      setError(err.message);
    }
  };

  // Add payment
  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCard.last4) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setSaving(false);
        return;
      }

      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCard)
      });

      if (!response.ok) {
        throw new Error('Failed to add card');
      }

      const data = await response.json();
      setPayments(data.payments);
      setNewCard({ brand: 'Visa', last4: '', expiry: '', isDefault: false });
      setShowPaymentModal(false);
      setSuccess('Payment method added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding card:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete payment
  const handleRemovePayment = async (id) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) return;

    try {
      const token = getToken();
      if (!token) {
        setError('Please login first');
        return;
      }

      const response = await fetch(`${API_URL}/payments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove payment');
      }

      const data = await response.json();
      setPayments(data.payments);
      setSuccess('Payment method removed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error removing payment:', err);
      setError(err.message);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'pending': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'Shipped';
      case 'processing': return 'Processing';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header />
        <div className="flex flex-col items-center justify-center my-auto py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-500">Loading your profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between">
      <div>
        <Header />

        {/* Global Alert Notifications */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-3">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium">{success}</span>
              </div>
              <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Server Down Banner */}
          {isServerDown && (
            <div className="p-6 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200/80 text-center shadow-sm">
              <WifiOff className="w-10 h-10 mx-auto mb-3 text-amber-500" />
              <h3 className="text-base font-bold text-amber-900 mb-1">Server Connection Offline</h3>
              <p className="text-xs text-amber-700 mb-4 max-w-md mx-auto">{error}</p>
              <button
                onClick={fetchProfile}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Connection
              </button>
            </div>
          )}
        </div>

        {/* Top Header & Banner  */}
        <div className="relative bg-white border-b border-slate-200 shadow-sm mt-2">
          <div className="h-44 md:h-56 w-full overflow-hidden bg-slate-800 relative group">
            <img
              src={user.cover || 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?auto=format&fit=crop&q=80&w=1200'}
              alt="Profile Cover"
              className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition duration-500"
            />
            <button
              onClick={openCoverModal}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Change Cover</span>
            </button>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-20 gap-4">

              {/* Profile Avatar & Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                <div className="relative group">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250'}
                    alt={user.name}
                    className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250';
                    }}
                  />
                  <button
                    onClick={openAvatarModal}
                    className="absolute bottom-1 right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-center sm:justify-start space-x-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-900">{user.name || 'Account Holder'}</h1>
                    <span className="bg-amber-50 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-200 flex items-center gap-1 shadow-xs">
                      <Award className="w-3 h-3 text-amber-600" />
                      {user.tier}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {user.email || 'No email associated'} • Joined {user.memberSince || 'Recently'}
                  </p>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <Link to="/orders" className="text-center px-3 py-2 hover:bg-white rounded-lg transition">
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Orders</p>
                  <p className="text-base sm:text-lg font-bold text-slate-900">{user.stats?.orders || 0}</p>
                </Link>
                <div className="text-center px-3 py-2 border-x border-slate-200">
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Points</p>
                  <p className="text-base sm:text-lg font-bold text-indigo-600">{user.stats?.rewardPoints || 0}</p>
                </div>
                <Link to="/main-wishlist" className="text-center px-3 py-2 hover:bg-white rounded-lg transition">
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Wishlist</p>
                  <p className="text-base sm:text-lg font-bold text-slate-900">{user.stats?.wishlist || 0}</p>
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            {/* Sidebar Navigation */}
            <aside className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-2 sticky top-6">
                <div className="flex md:flex-col overflow-x-auto space-x-1 md:space-x-0 md:space-y-1 pb-1 md:pb-0 no-scrollbar">
                  {[
                    { id: 'profile', label: 'Personal Info', icon: User },
                    { id: 'orders', label: 'Order History', icon: Package },
                    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
                    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
                    { id: 'security', label: 'Account Security', icon: Shield }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all w-full ${isActive
                          ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span>{tab.label}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 hidden md:block transition-transform ${isActive ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 hidden md:block">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-rose-600 rounded-xl hover:bg-rose-50 transition w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Content Display Card */}
            <main className="md:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8">

                {/* TAB 1: Personal Info */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-5 border-b border-slate-100">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
                        <p className="text-xs text-slate-500">Update your account identity and contact detail records.</p>
                      </div>
                      <button
                        onClick={isEditingProfile ? handleUpdateProfile : () => setIsEditingProfile(true)}
                        disabled={saving}
                        className="flex items-center space-x-1.5 text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition font-semibold disabled:opacity-50 shadow-xs"
                      >
                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Edit3 className="w-3.5 h-3.5" />
                        )}
                        <span>{isEditingProfile ? 'Save Changes' : 'Edit Info'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* ... personal info fields ... */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                        <input
                          type="text"
                          value={user.name}
                          disabled={!isEditingProfile}
                          onChange={(e) => setUser({ ...user, name: e.target.value })}
                          className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50/80 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          placeholder="Full Name"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                        <input
                          type="email"
                          value={user.email}
                          disabled={!isEditingProfile}
                          onChange={(e) => setUser({ ...user, email: e.target.value })}
                          className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50/80 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          placeholder="Email"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                        <input
                          type="tel"
                          value={user.phone}
                          disabled={!isEditingProfile}
                          onChange={(e) => setUser({ ...user, phone: e.target.value })}
                          className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50/80 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          placeholder="Phone"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mobile (Alternate)</label>
                        <input
                          type="tel"
                          value={user.mobile}
                          disabled={!isEditingProfile}
                          onChange={(e) => setUser({ ...user, mobile: e.target.value })}
                          className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50/80 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          placeholder="Mobile"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Address</label>
                        <input
                          type="text"
                          value={user.address}
                          disabled={!isEditingProfile}
                          onChange={(e) => setUser({ ...user, address: e.target.value })}
                          className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50/80 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          placeholder="Street Address"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">City</label>
                        <input
                          type="text"
                          value={user.city}
                          disabled={!isEditingProfile}
                          onChange={(e) => setUser({ ...user, city: e.target.value })}
                          className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50/80 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">State & ZIP</label>
                        <input
                          type="text"
                          value={user.stateZip}
                          disabled={!isEditingProfile}
                          onChange={(e) => setUser({ ...user, stateZip: e.target.value })}
                          className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50/80 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          placeholder="State, ZIP"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Country</label>
                        <input
                          type="text"
                          value={user.country}
                          disabled={!isEditingProfile}
                          onChange={(e) => setUser({ ...user, country: e.target.value })}
                          className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50/80 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          placeholder="Country"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                        <input
                          type="text"
                          value={user.dob}
                          disabled={!isEditingProfile}
                          onChange={(e) => setUser({ ...user, dob: e.target.value })}
                          className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50/80 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                          placeholder="DD/MM/YYYY"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                        <select
                          value={user.gender || ''}
                          disabled={!isEditingProfile}
                          onChange={(e) => setUser({ ...user, gender: e.target.value })}
                          className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50/80 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Membership Status</label>
                        <input
                          type="text"
                          value={user.tier}
                          disabled
                          className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Order History */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="pb-5 border-b border-slate-100">
                      <h2 className="text-base font-bold text-slate-900">Order History</h2>
                      <p className="text-xs text-slate-500">Track pending packages and inspect completed transactions.</p>
                    </div>

                    {ordersLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">#{order.orderId}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadgeColor(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(order.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xs text-slate-500">Total</p>
                                  <p className="text-sm font-bold text-indigo-600">₹{order.total?.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-slate-500">Items</p>
                                  <p className="text-sm font-semibold text-slate-900">{order.items?.length || 0}</p>
                                </div>
                                <Link
                                  to={`/orders`}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="font-bold text-slate-800">No orders placed yet</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Explore our collection to start shopping and tracking your orders here.</p>
                        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                          <span>Browse Catalog</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Saved Addresses */}
                {activeTab === 'addresses' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-5 border-b border-slate-100">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Saved Addresses</h2>
                      </div>
                      <button
                        onClick={() => setShowAddressModal(true)}
                        className="flex items-center space-x-1.5 text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition font-semibold shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Address</span>
                      </button>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No saved addresses</p>
                        <p className="text-xs text-slate-400">Add your first shipping address</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                          <div key={addr._id || Math.random()} className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 transition bg-white shadow-2xs">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">{addr.type}</span>
                                {addr.isDefault && (
                                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100">DEFAULT</span>
                                )}
                              </div>
                              <p className="text-xs font-medium text-slate-700 mt-2">{addr.street}</p>
                              <p className="text-xs text-slate-500">{addr.city}, {addr.state} {addr.zip}</p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                              <button className="text-indigo-600 hover:text-indigo-700">Edit</button>
                              <button onClick={() => handleDeleteAddress(addr._id)} className="text-rose-600 hover:text-rose-700 flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: Payment Methods */}
                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-5 border-b border-slate-100">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Payment Methods</h2>
                      </div>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="flex items-center space-x-1.5 text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition font-semibold shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Card</span>
                      </button>
                    </div>

                    {payments.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No payment methods</p>
                        <p className="text-xs text-slate-400">Add a card for faster checkout</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {payments.map((card) => (
                          <div key={card._id || Math.random()} className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-slate-300 transition bg-white shadow-2xs">
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 bg-slate-100 rounded-xl">
                                <CreditCard className="w-5 h-5 text-slate-700" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{card.brand} ending in •••• {card.last4}</p>
                                  {card.isDefault && (
                                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100">DEFAULT</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Expires {card.expiry}</p>
                              </div>
                            </div>
                            <button onClick={() => handleRemovePayment(card._id)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: Account Security */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="pb-5 border-b border-slate-100">
                      <h2 className="text-base font-bold text-slate-900">Account Security</h2>
                      <p className="text-xs text-slate-500">Manage credentials and sign-in authentication safeguards.</p>
                    </div>

                    <div className="space-y-6 max-w-lg">
                      <div>
                        <button
                          onClick={() => setShowPasswordForm(!showPasswordForm)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
                        >
                          {showPasswordForm ? 'Hide' : 'Change'} Password
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
                        </button>
                      </div>

                      {showPasswordForm && (
                        <form onSubmit={handleChangePassword} className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-indigo-600" />
                            Update Password
                          </h3>
                          <div>
                            <input
                              type="password"
                              placeholder="Current Password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <input
                              type="password"
                              placeholder="New Password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <input
                              type="password"
                              placeholder="Confirm New Password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 inline-flex items-center gap-2 shadow-xs"
                          >
                            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Update Password
                          </button>
                        </form>
                      )}

                      <div className="pt-5 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Two-Factor Authentication (2FA)</h3>
                        <p className="text-xs text-slate-500 mt-1">Add an additional security layer using an authenticator app code during sign-in.</p>
                        <button className="mt-3 border border-slate-300 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-50 transition">Enable 2FA Verification</button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </main>
          </div>
        </div>

        {/* Modal: Change Avatar */}
        {showAvatarModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  Change Profile Picture
                </h3>
                <button type="button" onClick={() => setShowAvatarModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateAvatar} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Image URL
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Enter a valid image URL (JPEG, PNG, WebP)</p>
                </div>

                {/* Preview */}
                {imageUrlInput && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 flex-shrink-0">
                      <img
                        src={imageUrlInput}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-700">Preview</p>
                      <p className="text-[10px] text-slate-400">This is how your avatar will look</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(false)}
                    className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !imageUrlInput.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Update Avatar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Change Cover Image */}
        {showCoverModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Image className="w-4 h-4 text-indigo-600" />
                  Change Cover Image
                </h3>
                <button type="button" onClick={() => setShowCoverModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateCover} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Cover Image URL
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://example.com/cover.jpg"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Enter a valid image URL (JPEG, PNG, WebP)</p>
                </div>

                {/* Preview */}
                {imageUrlInput && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] font-medium text-slate-500 mb-1.5">Preview</p>
                    <div className="w-full aspect-[16/6] rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100">
                      <img
                        src={imageUrlInput}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?auto=format&fit=crop&q=80&w=1200';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCoverModal(false)}
                    className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !imageUrlInput.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Update Cover
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Address */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <form onSubmit={handleAddAddress} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Add New Address</h3>
                <button type="button" onClick={() => setShowAddressModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Address Label</label>
                  <select
                    value={newAddress.type}
                    onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="123 Main Street, Apt 4B"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    placeholder="New York"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">State</label>
                    <input
                      type="text"
                      placeholder="NY"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ZIP Code</label>
                    <input
                      type="text"
                      placeholder="10001"
                      value={newAddress.zip}
                      onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-600">Set as default address</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-1"
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save Address
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Add Payment Card */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <form onSubmit={handleAddCard} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Add Payment Card</h3>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Card Brand</label>
                  <select
                    value={newCard.brand}
                    onChange={(e) => setNewCard({ ...newCard, brand: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">American Express</option>
                    <option value="Discover">Discover</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength="4"
                    placeholder="4242"
                    value={newCard.last4}
                    onChange={(e) => setNewCard({ ...newCard, last4: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expiration (MM/YY)</label>
                  <input
                    type="text"
                    placeholder="12/28"
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCard.isDefault}
                    onChange={(e) => setNewCard({ ...newCard, isDefault: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-600">Set as default card</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-1"
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save Card
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}