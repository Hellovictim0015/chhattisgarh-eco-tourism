"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg(data.message || 'Login successful! Redirecting...');
        
        // 1. Store the token (Using localStorage for simplicity, 
        // but for production Next.js apps, HttpOnly Cookies are recommended)
        localStorage.setItem('admin_token', data.token);
        
        // 2. Store user details if needed for profile rendering
        localStorage.setItem('admin_user', JSON.stringify(data.user));

        // 3. Redirect to Admin Dashboard
        setTimeout(() => {
          router.push('/admin/dashboard'); // Replace with your actual dashboard route
        }, 1000);

      } else {
        // Handle API errors (e.g., wrong password, user not found)
        setErrorMsg(data.message || 'Invalid email or password.');
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMsg('Network error. Please check your server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fe] flex items-center justify-center p-4 font-sans">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-[#0a1629] z-0 rounded-b-[3rem]"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">INDIANTOWNSHIP</h1>
          <p className="text-amber-500 font-bold text-xs uppercase tracking-widest mt-1 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Secure Admin Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_60px_rgb(0,0,0,0.05)] border border-slate-100">
          
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[#0a1629]">Welcome Back</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your credentials to access the dashboard</p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-sm text-green-600 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0"></span> {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Email Address
              </label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@indiantownship.com" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-[#0a1629] font-medium outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  required
                  disabled={isLoading}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Password
                </label>
                <a href="#" className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-12 text-sm text-[#0a1629] font-medium outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  required
                  disabled={isLoading}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#0a1629] hover:bg-slate-800 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Authenticating...
                  </>
               ) : (
                  'Login to Dashboard'
               )}
              </button>
            </div>
          </form>

        </div>
        
        {/* Footer info */}
        <p className="text-center text-xs font-medium text-slate-500 mt-8">
          © {new Date().getFullYear()} IndianTownship. All rights reserved.
        </p>

      </div>
    </main>
  );
}