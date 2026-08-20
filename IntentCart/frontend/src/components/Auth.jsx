import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, Store, ShoppingBag, Briefcase, MapPin, Phone, Truck } from 'lucide-react';

const API_BASE_URI = import.meta.env.VITE_APP_URL;
const API_URL = `${API_BASE_URI}/auth` || 'http://localhost:5000/api/auth';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('customer');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'customer',
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    businessPhone: '',
    // Shipping specific fields
    shipperDetails: {
      branch: '',
      assignedRegion: '',
      vehicleNumber: '',
      licenseNumber: '',
      experience: 0
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested shipper details
    if (name.startsWith('shipper.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        shipperDetails: {
          ...formData.shipperDetails,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    setError('');
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setFormData({
      ...formData,
      role: selectedRole
    });
    setError('');
  };

  const validateForm = () => {
    if (isSignUp) {
      const usernameRegex = /^[a-zA-Z0-9\s]+$/;
      if (formData.username.length < 3 || formData.username.length > 30) {
        setError('Username must be 3-30 characters');
        return false;
      }
      if (!usernameRegex.test(formData.username)) {
        setError('Username can only contain letters, numbers, and spaces');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
        setError('Password must contain at least one letter and one number');
        return false;
      }

      if (role === 'merchant' && !formData.businessName.trim()) {
        setError('Business name is required for merchants');
        return false;
      }

      if (role === 'shipper') {
        if (!formData.shipperDetails.branch.trim()) {
          setError('Branch is required for shippers');
          return false;
        }
        if (!formData.shipperDetails.vehicleNumber.trim()) {
          setError('Vehicle number is required for shippers');
          return false;
        }
        if (!formData.shipperDetails.licenseNumber.trim()) {
          setError('License number is required for shippers');
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isSignUp ? '/signup' : '/signin';

      let dataToSend;
      if (isSignUp) {
        dataToSend = {
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role
        };

        if (formData.role === 'merchant') {
          dataToSend.businessName = formData.businessName.trim();
          dataToSend.businessDescription = formData.businessDescription?.trim() || '';
          dataToSend.businessAddress = formData.businessAddress?.trim() || '';
          dataToSend.businessPhone = formData.businessPhone?.trim() || '';
        }

        if (formData.role === 'shipper') {
          dataToSend.shipperDetails = {
            branch: formData.shipperDetails.branch.trim(),
            assignedRegion: formData.shipperDetails.assignedRegion?.trim() || '',
            vehicleNumber: formData.shipperDetails.vehicleNumber.trim(),
            licenseNumber: formData.shipperDetails.licenseNumber.trim(),
            experience: parseInt(formData.shipperDetails.experience) || 0,
            currentStatus: 'available'
          };
        }
      } else {
        dataToSend = {
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        };
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const errorMessages = data.errors.map(err => `${err.field}: ${err.message}`).join('\n');
          throw new Error(errorMessages);
        }
        throw new Error(data.message || 'Authentication failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setSuccess(`Welcome ${data.user.username}!`);

      // REDIRECT - Using window.location.replace for cleaner navigation
      setTimeout(() => {
        const roleRedirects = {
          admin: '/admin-dashboard',
          merchant: '/merchant-dashboard',
          customer: '/',
          shipper: '/shipping-dashboard'
        };

        const redirectUrl = data.user.redirectUrl || roleRedirects[data.user.role] || '/';

        // Use replace to prevent back button issues
        window.location.replace(redirectUrl);
      }, 800);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
    setRole('customer');
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'customer',
      businessName: '',
      businessDescription: '',
      businessAddress: '',
      businessPhone: '',
      shipperDetails: {
        branch: '',
        assignedRegion: '',
        vehicleNumber: '',
        licenseNumber: '',
        experience: 0
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8f9fc] font-sans overflow-x-hidden">
      {/* Left Column - Branding & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-white items-center justify-center p-8 border-r border-gray-100">
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4B2EC2] rounded-xl flex items-center justify-center shadow-md shadow-[#4B2EC2]/20">
            <span className="text-white font-bold text-lg">IC</span>
          </div>
          <h1 className="text-xl font-bold text-[#1D1068]">IntentCart</h1>
        </div>
        <div className="w-full max-w-lg">
          <img
            src="https://i.pinimg.com/736x/9d/f8/98/9df89840e668b11f0165040513d968b1.jpg"
            alt="Shopping Illustration"
            referrerPolicy="no-referrer"
            className="w-full h-auto object-contain mix-blend-multiply max-h-[70vh]"
          />
        </div>
        <div className="absolute bottom-8 left-8 right-8 text-center">
          <p className="text-sm font-medium text-gray-500">Smart shopping, simplified</p>
        </div>
      </div>

      {/* Right Column - Auth Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 min-h-screen">
        <div className="w-full max-w-md">

          {/* Mobile Logo Header */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-[#4B2EC2] rounded-2xl flex items-center justify-center mb-3 shadow-md shadow-[#4B2EC2]/20">
              <span className="text-white font-bold text-xl">IC</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1D1068]">IntentCart</h1>
          </div>

          {/* Card Component */}
          <div className="w-full bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-10 lg:p-12 shadow-xl shadow-slate-200/50">

            {/* Card Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1068] text-center tracking-tight">
                {isSignUp ? 'Create Account' : 'Welcome back'}
              </h2>
              <p className="text-gray-500 text-center mt-2 text-sm">
                {isSignUp ? 'Join as a customer, merchant, or shipper' : 'Sign in to your account'}
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mt-4 whitespace-pre-line">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm mt-4">
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-5 mt-6">

              {/* Role Selection - Only for Sign Up */}
              {isSignUp && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    I want to join as:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('customer')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${role === 'customer'
                        ? 'border-[#4B2EC2] bg-[#4B2EC2]/5 text-[#4B2EC2]'
                        : 'border-gray-300 hover:border-gray-400 text-gray-600'
                        }`}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span className="font-medium text-xs sm:text-sm">Customer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('merchant')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${role === 'merchant'
                        ? 'border-[#4B2EC2] bg-[#4B2EC2]/5 text-[#4B2EC2]'
                        : 'border-gray-300 hover:border-gray-400 text-gray-600'
                        }`}
                    >
                      <Store className="w-5 h-5" />
                      <span className="font-medium text-xs sm:text-sm">Merchant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('shipper')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${role === 'shipper'
                        ? 'border-[#4B2EC2] bg-[#4B2EC2]/5 text-[#4B2EC2]'
                        : 'border-gray-300 hover:border-gray-400 text-gray-600'
                        }`}
                    >
                      <Truck className="w-5 h-5" />
                      <span className="font-medium text-xs sm:text-sm">Shipper</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Username Field - Only for Sign Up */}
              {isSignUp && (
                <div className="relative flex items-center">
                  <User className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username (3-30 chars, letters, numbers & spaces)"
                    required={isSignUp}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-gray-50/30 focus:bg-white"
                  />
                </div>
              )}

              {/* Merchant Specific Fields */}
              {isSignUp && role === 'merchant' && (
                <div className="space-y-4 border-l-4 border-[#4B2EC2] pl-4 bg-gray-50/30 p-4 rounded-r-xl">
                  <div className="relative flex items-center">
                    <Briefcase className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="Business Name *"
                      required={role === 'merchant'}
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-white"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <MapPin className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      name="businessAddress"
                      value={formData.businessAddress}
                      onChange={handleChange}
                      placeholder="Business Address"
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-white"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <Phone className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      name="businessPhone"
                      value={formData.businessPhone}
                      onChange={handleChange}
                      placeholder="Business Phone"
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-white"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <textarea
                      name="businessDescription"
                      value={formData.businessDescription}
                      onChange={handleChange}
                      placeholder="Business Description (Optional)"
                      rows="3"
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-white resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Shipper Specific Fields */}
              {isSignUp && role === 'shipper' && (
                <div className="space-y-4 border-l-4 border-[#4B2EC2] pl-4 bg-gray-50/30 p-4 rounded-r-xl">
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      name="shipper.branch"
                      value={formData.shipperDetails.branch}
                      onChange={handleChange}
                      placeholder="Branch / Depot *"
                      required={role === 'shipper'}
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-white"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <MapPin className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      name="shipper.assignedRegion"
                      value={formData.shipperDetails.assignedRegion}
                      onChange={handleChange}
                      placeholder="Assigned Region (e.g., North District)"
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-white"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <Truck className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      name="shipper.vehicleNumber"
                      value={formData.shipperDetails.vehicleNumber}
                      onChange={handleChange}
                      placeholder="Vehicle Number *"
                      required={role === 'shipper'}
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-white"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <Briefcase className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      name="shipper.licenseNumber"
                      value={formData.shipperDetails.licenseNumber}
                      onChange={handleChange}
                      placeholder="Driver's License Number *"
                      required={role === 'shipper'}
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-white"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="number"
                      name="shipper.experience"
                      value={formData.shipperDetails.experience}
                      placeholder="Experiance"
                      onChange={handleChange}
                      min="0"
                      max="50"
                      className="w-full pl-4 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-gray-50/30 focus:bg-white"
                />
              </div>

              {/* Password Field */}
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password (min 6 chars, 1 letter & 1 number)"
                  required
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-gray-50/30 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#4B2EC2] hover:bg-[#3B22A2] text-white font-semibold text-base rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-[#4B2EC2]/25 active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Mode Switch Link */}
            <div className="text-center pt-6">
              <p className="text-sm sm:text-base font-semibold text-gray-900">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="text-[#1D1068] hover:underline font-bold transition-colors inline-block"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}