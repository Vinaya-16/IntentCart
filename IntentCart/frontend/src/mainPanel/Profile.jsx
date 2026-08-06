import React, { useState, useEffect } from 'react';
import { 
  User, Package, MapPin, CreditCard, Shield, LogOut, 
  Edit3, Plus, CheckCircle2, Truck, X,
  Award, ChevronRight, Camera, Loader2, WifiOff, RefreshCw,
  Check
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/customer';

export default function EnhancedCustomerProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isServerDown, setIsServerDown] = useState(false);
  const [saving, setSaving] = useState(false);

  // User State
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    cover: '',
    memberSince: '',
    tier: 'Silver Member',
    stats: { orders: 0, rewardPoints: 0, wishlist: 0 }
  });

  // Orders State
  const [orders] = useState([]);

  // Addresses State
  const [addresses, setAddresses] = useState([]);

  const [newAddress, setNewAddress] = useState({ type: 'Home', street: '', city: '', state: '', zip: '', isDefault: false });

  // Payments State
  const [payments, setPayments] = useState([]);

  const [newCard, setNewCard] = useState({ brand: 'Card', last4: '', expiry: '', isDefault: false });

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
          email: user.email,
          phone: user.phone
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
      setNewCard({ brand: 'Card', last4: '', expiry: '', isDefault: false });
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
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header /> 

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
            <X /> {error}
          </div>
        </div>
      )}
      {success && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
            <Check /> {success}
          </div>
        </div>
      )}

      {/* Server Down */}
      {isServerDown && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
            <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
            <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchProfile}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Top Banner & Header Section */}
      <div className="relative bg-white border-b border-slate-200">
        <div className="h-44 md:h-56 w-full overflow-hidden bg-slate-800 relative">
          <img src={user.cover} alt="Profile Cover" className="w-full h-full object-cover opacity-60" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-20 gap-4">
            
            {/* User Info Bar */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-md object-cover bg-white"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250';
                  }}
                />
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                  <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-200 flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-600" />
                    {user.tier}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{user.email} • Joined {user.memberSince}</p>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-center px-2">
                <p className="text-xs text-slate-500 uppercase font-semibold">Orders</p>
                <p className="text-lg font-bold text-slate-900">{user.stats.orders}</p>
              </div>
              <div className="text-center px-2 border-x border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-semibold">Points</p>
                <p className="text-lg font-bold text-indigo-600">{user.stats.rewardPoints}</p>
              </div>
              <div className="text-center px-2">
                <p className="text-xs text-slate-500 uppercase font-semibold">Wishlist</p>
                <p className="text-lg font-bold text-slate-900">{user.stats.wishlist}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Sidebar / Navigation Tabs */}
          <aside className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden sticky top-6">
              
              <div className="flex md:flex-col overflow-x-auto p-2 border-b md:border-none border-slate-100 no-scrollbar">
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
                      className={`flex-shrink-0 flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${
                        isActive 
                          ? 'bg-indigo-50 text-indigo-600' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-t border-slate-100 hidden md:block">
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition w-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>

            </div>
          </aside>

          {/* Main Display Box */}
          <main className="md:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 md:p-8">
              
              {/* TAB 1: Personal Info */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-5 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                      <p className="text-xs text-slate-500">Update your basic details and account info.</p>
                    </div>
                    <button 
                      onClick={isEditingProfile ? handleUpdateProfile : () => setIsEditingProfile(true)}
                      disabled={saving}
                      className="flex items-center space-x-1.5 text-xs bg-indigo-600 text-white px-3.5 py-2 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
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
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                      <input 
                        type="text" 
                        value={user.name} 
                        disabled={!isEditingProfile}
                        onChange={(e) => setUser({...user, name: e.target.value})}
                        className="mt-1.5 w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                      <input 
                        type="email" 
                        value={user.email} 
                        disabled={!isEditingProfile}
                        onChange={(e) => setUser({...user, email: e.target.value})}
                        className="mt-1.5 w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
                      <input 
                        type="tel" 
                        value={user.phone} 
                        disabled={!isEditingProfile}
                        onChange={(e) => setUser({...user, phone: e.target.value})}
                        className="mt-1.5 w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Membership Status</label>
                      <input 
                        type="text" 
                        value={user.tier} 
                        disabled 
                        className="mt-1.5 w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Order History */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="pb-5 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">Order History</h2>
                    <p className="text-xs text-slate-500">Track current packages and inspect historical orders.</p>
                  </div>
                  <div className="text-center py-12 text-slate-500">
                    <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>No orders yet</p>
                    <p className="text-xs text-slate-400 mt-1">Start shopping to see your orders here.</p>
                  </div>
                </div>
              )}

              {/* TAB 3: Saved Addresses */}
              {activeTab === 'addresses' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-5 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Saved Addresses</h2>
                      <p className="text-xs text-slate-500">Manage shipping and billing destinations.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddressModal(true)}
                      className="flex items-center space-x-1.5 text-xs bg-indigo-600 text-white px-3.5 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Address</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr._id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between relative hover:border-slate-300 transition">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900 text-sm">{addr.type}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">DEFAULT</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-2">{addr.street}</p>
                          <p className="text-sm text-slate-600">{addr.city}, {addr.state} {addr.zip}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                          <button className="text-indigo-600 hover:underline">Edit</button>
                          <button onClick={() => handleDeleteAddress(addr._id)} className="text-rose-600 hover:underline">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Payment Methods */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-5 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Payment Methods</h2>
                      <p className="text-xs text-slate-500">Manage payment options and default cards.</p>
                    </div>
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="flex items-center space-x-1.5 text-xs bg-indigo-600 text-white px-3.5 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Card</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {payments.map((card) => (
                      <div key={card._id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-slate-300 transition">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-slate-100 rounded-lg">
                            <CreditCard className="w-5 h-5 text-slate-700" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-slate-900 text-sm">{card.brand} ending in {card.last4}</p>
                              {card.isDefault && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">DEFAULT</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">Expires {card.expiry}</p>
                          </div>
                        </div>
                        <button onClick={() => handleRemovePayment(card._id)} className="text-xs font-medium text-rose-600 hover:underline">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: Account Security */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="pb-5 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">Account Security</h2>
                    <p className="text-xs text-slate-500">Enhance your password and security settings.</p>
                  </div>

                  <div className="space-y-6 max-w-lg">
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>
                      <input type="password" placeholder="Current Password" className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                      <input type="password" placeholder="New Password" className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                      <button type="submit" className="bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium">Update Password</button>
                    </form>

                    <div className="pt-5 border-t border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-900">Two-Factor Authentication (2FA)</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Protect your payment info with a verification code on sign in.</p>
                      <button className="mt-3 border border-slate-300 text-slate-700 text-xs px-4 py-2 rounded-lg hover:bg-slate-50 transition font-medium">Enable 2FA</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {/* Modal: Add Address */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddAddress} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900">Add New Address</h3>
              <button type="button" onClick={() => setShowAddressModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <select 
                value={newAddress.type} 
                onChange={(e) => setNewAddress({...newAddress, type: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
              <input 
                type="text" 
                placeholder="Street Address" 
                value={newAddress.street} 
                onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                className="w-full p-2 border rounded-lg" 
                required
              />
              <input 
                type="text" 
                placeholder="City" 
                value={newAddress.city} 
                onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                className="w-full p-2 border rounded-lg" 
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="State (e.g. IL)" 
                  value={newAddress.state} 
                  onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                  className="p-2 border rounded-lg" 
                />
                <input 
                  type="text" 
                  placeholder="Zip Code" 
                  value={newAddress.zip} 
                  onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})}
                  className="p-2 border rounded-lg" 
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                />
                Set as default address
              </label>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowAddressModal(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddCard} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Credit Card</h3>
              <button type="button" onClick={() => setShowPaymentModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <select 
                value={newCard.brand}
                onChange={(e) => setNewCard({...newCard, brand: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="Card">Card</option>
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="Amex">Amex</option>
              </select>
              <input 
                type="text" 
                placeholder="Card Number (last 4 digits)" 
                value={newCard.last4} 
                onChange={(e) => setNewCard({...newCard, last4: e.target.value})}
                className="w-full p-2 border rounded-lg" 
                required
                maxLength="4"
              />
              <input 
                type="text" 
                placeholder="Expiry (MM/YY)" 
                value={newCard.expiry} 
                onChange={(e) => setNewCard({...newCard, expiry: e.target.value})}
                className="w-full p-2 border rounded-lg" 
              />
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={newCard.isDefault}
                  onChange={(e) => setNewCard({...newCard, isDefault: e.target.checked})}
                />
                Set as default payment method
              </label>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setShowPaymentModal(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Card'}
              </button>
            </div>
          </form>
        </div>
      )}

      <Footer />

    </div>
  );
}