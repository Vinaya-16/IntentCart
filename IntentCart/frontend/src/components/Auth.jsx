import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/auth';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isSignUp ? '/signup' : '/signin';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setSuccess(data.message);
      console.log('Auth successful:', data);

      // Redirect or update app state here
      // window.location.href = '/dashboard';
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
    setFormData({
      username: '',
      email: '',
      password: '',
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8f9fc] font-sans overflow-x-hidden">
      {/* Left Column - Branding & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-white items-center justify-center p-8 border-r border-gray-100">
        {/* Brand Header - Top Left */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4B2EC2] rounded-xl flex items-center justify-center shadow-md shadow-[#4B2EC2]/20">
            <span className="text-white font-bold text-lg">IC</span>
          </div>
          <h1 className="text-xl font-bold text-[#1D1068]">
            IntentCart
          </h1>
        </div>

        {/* Illustration */}
        <div className="w-full max-w-lg">
          <img
            src="https://i.pinimg.com/736x/9d/f8/98/9df89840e668b11f0165040513d968b1.jpg"
            alt="Shopping Illustration"
            referrerPolicy="no-referrer"
            className="w-full h-auto object-contain mix-blend-multiply max-h-[70vh]"
          />
        </div>

        {/* Bottom Text */}
        <div className="absolute bottom-8 left-8 right-8 text-center">
          <p className="text-sm font-medium text-gray-500">
            Smart shopping, simplified
          </p>
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
            <h1 className="text-2xl font-bold text-[#1D1068]">
              IntentCart
            </h1>
          </div>

          {/* Card Component */}
          <div className="w-full min-h-[55vh] bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-10 lg:p-12 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            
            {/* Card Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1068] text-center tracking-tight">
                {isSignUp ? 'Create Account' : 'Welcome back'}
              </h2>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-5 my-auto py-4">
              
              {/* Username Field - Only renders when in Sign Up mode */}
              {isSignUp && (
                <div className="relative flex items-center">
                  <User className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                    required={isSignUp}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B2EC2]/20 focus:border-[#4B2EC2] transition-all text-sm sm:text-base bg-gray-50/30 focus:bg-white"
                  />
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
                  placeholder="Password"
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
            <div className="text-center pt-2">
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