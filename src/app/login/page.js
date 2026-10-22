"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_NAME, LOGO_SRC } from '@/lib/site';
import {
  Phone, Mail, ShieldCheck, User, ArrowLeft, Loader2, CheckCircle2,
  Users, Headset, BadgeCheck
} from 'lucide-react';

const BENEFITS = [
  { icon: CheckCircle2, text: 'Book hotels, resorts & eco stays' },
  { icon: CheckCircle2, text: 'No advance payment — pay at the hotel' },
  { icon: CheckCircle2, text: 'Simple, secure email OTP login' },
  { icon: CheckCircle2, text: 'Trusted by thousands across India' },
];

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [step, setStep] = useState(1); // 1 = enter details, 2 = verify OTP

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0); // seconds until "Resend OTP" is allowed

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // Count down the resend timer once per second
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setStep(1);
    setName('');
    setEmail('');
    setPhone('');
    setOtp('');
    setResendIn(0);
    setError('');
    setSuccess('');
  };

  const cleanEmail = email.trim().toLowerCase();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanPhone = phone.trim();
    if (activeTab === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (activeTab === 'register' && !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = activeTab === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = activeTab === 'register'
        ? { name: name.trim(), email: cleanEmail, phone: cleanPhone }
        : { email: cleanEmail };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.retryAfter) setResendIn(data.retryAfter);
        throw new Error(`${data.message || data.error || 'Failed to send OTP.'}${data.code ? ` [${data.code}]` : ''}`);
      }

      setSuccess(data.message || 'OTP sent to your email.');
      setOtp('');
      setResendIn(60);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp.trim()) {
      setError('Please enter the OTP.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = activeTab === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = activeTab === 'register'
        ? { name: name.trim(), email: cleanEmail, phone: phone.trim(), otp: otp.trim() }
        : { email: cleanEmail, otp: otp.trim() };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(`${data.message || data.error || 'Verification failed.'}${data.code ? ` [${data.code}]` : ''}`);
      }

      if (data.token) localStorage.setItem('authToken', data.token);
      if (data.user) localStorage.setItem('authUser', JSON.stringify(data.user));

      if (activeTab === 'register') {
        setSuccess('Account created! Redirecting...');
        setTimeout(() => router.push(redirectTo), 600);
      } else {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => router.push(redirectTo), 600);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fe] font-sans flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f4f7fe] relative overflow-hidden flex-col justify-center px-16">
        <Image
          src="/login-bg.webp"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />

        {/* Frosted white card: keeps logo + text readable over any part of the photo, no colour wash */}
        <div className="relative z-10 max-w-md bg-white/75 backdrop-blur-md rounded-3xl p-10 shadow-[0_20px_60px_rgba(10,22,41,0.18)] border border-white/60">
          <Link href="/" className="inline-block mb-8">
            <Image src={LOGO_SRC} alt={SITE_NAME} width={250} height={100} className="h-16 w-auto object-contain" />
          </Link>

          <h1 className="font-[family-name:var(--font-playfair)] text-[2.6rem] font-semibold text-[#0a1629] leading-[1.15] mb-4">
            Book Your Next <em className="text-[#b07a1c]">Getaway</em> with {SITE_NAME}
          </h1>
          <p className="text-slate-600 text-base mb-8 max-w-sm">
            Discover hotels, resorts and eco stays across Chhattisgarh.
          </p>

          <div className="flex flex-col gap-3.5 mb-8">
            {BENEFITS.map((b, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <b.icon className="w-5 h-5 text-[#b07a1c] shrink-0" />
                <span className="text-sm text-[#0a1629] font-medium">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-8 pt-6 border-t border-[#0a1629]/10">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-[#b07a1c]" />
              <span className="text-xs text-[#0a1629] font-semibold">2500+ Happy Families</span>
            </div>
            <div className="flex items-center gap-2.5">
              <BadgeCheck className="w-5 h-5 text-[#b07a1c]" />
              <span className="text-xs text-[#0a1629] font-semibold">Verified Listings</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-start lg:justify-center px-4 py-6 sm:p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile: the left brand panel is hidden, so give a way back home */}
          <Link href="/" className="lg:hidden flex justify-center mb-6">
            <Image src={LOGO_SRC} alt={SITE_NAME} width={200} height={80} className="h-12 w-auto object-contain" priority />
          </Link>

          <div className="bg-white rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-[0_20px_60px_rgb(0,0,0,0.06)] border border-slate-100">

            {step === 1 && (
              <div className="flex border-b border-slate-200 mb-8">
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${
                    activeTab === 'login' ? 'text-[#0a1629]' : 'text-slate-400'
                  }`}
                >
                  Login
                  {activeTab === 'login' && <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#d9982b]"></span>}
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${
                    activeTab === 'register' ? 'text-[#0a1629]' : 'text-slate-400'
                  }`}
                >
                  Register
                  {activeTab === 'register' && <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#d9982b]"></span>}
                </button>
              </div>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setError(''); setSuccess(''); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-6"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Email
              </button>
            )}

            <div className="mb-7">
              <h2 className="text-2xl font-bold text-[#0a1629] mb-1.5">
                {step === 1
                  ? (activeTab === 'login' ? 'Welcome Back' : 'Create Your Account')
                  : 'Verify OTP'}
              </h2>
              <p className="text-sm text-slate-500">
                {step === 1
                  ? (activeTab === 'login'
                      ? "Enter your email and we'll send you a one-time code"
                      : 'Your name, email and phone number to get started')
                  : `Enter the 6-digit code sent to ${cleanEmail}`}
              </p>
            </div>

            {error && (
              <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-5 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3 font-medium">
                {success}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                {activeTab === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Full Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                          disabled={loading}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-[#0a1629] font-medium outline-none focus:bg-white focus:border-[#d9982b] focus:ring-2 focus:ring-[#d9982b]/20 transition-all"
                        />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Email Address {activeTab === 'register' && <span className="normal-case font-medium text-slate-400">(OTP will be sent here)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={loading}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-[#0a1629] font-medium outline-none focus:bg-white focus:border-[#d9982b] focus:ring-2 focus:ring-[#d9982b]/20 transition-all"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Your contact number for buyers to reach you
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-sm font-semibold text-slate-500 border-r border-slate-200 pr-3">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      disabled={loading}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-20 pr-11 text-sm text-[#0a1629] font-medium outline-none focus:bg-white focus:border-[#d9982b] focus:ring-2 focus:ring-[#d9982b]/20 transition-all"
                    />
                    <Phone className="absolute right-4 w-4 h-4 text-slate-400" />
                  </div>
                </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0a1629] hover:bg-slate-800 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Sending OTP...</>) : (activeTab === 'register' ? 'Start Now' : 'Send OTP')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Enter OTP</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit code"
                      maxLength={6}
                      disabled={loading}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-[#0a1629] font-semibold tracking-widest text-center text-lg outline-none focus:bg-white focus:border-[#d9982b] focus:ring-2 focus:ring-[#d9982b]/20 transition-all"
                    />
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Didn&apos;t get it? Check your spam / promotions folder. The code is valid for 10 minutes.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0a1629] hover:bg-slate-800 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>) : (activeTab === 'register' ? 'Verify & Create Account' : 'Verify & Login')}
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || resendIn > 0}
                  className="w-full text-center text-xs font-semibold text-[#d9982b] hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
                </button>
              </form>
            )}

            {step === 1 && (
              <p className="text-center text-xs text-slate-400 mt-7 flex items-center justify-center gap-1.5">
                <Headset className="w-3.5 h-3.5" /> Need help? Call us at +91 98765 43210
              </p>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}
