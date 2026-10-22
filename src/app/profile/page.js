"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Loader2, Phone, Mail, Calendar, ShieldCheck, Hotel, CalendarCheck, ArrowRight, User as UserIcon
} from "lucide-react";
import { dayFromToday } from "@/lib/dates";

export default function ProfilePage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [token, setToken] = useState(null);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (!storedToken) {
      router.replace("/login?redirect=/profile");
      return;
    }
    setToken(storedToken);
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked || !token) return;

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setProfile(data.data);
        else if (res.status === 401) router.replace("/login?redirect=/profile");
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    const fetchBookings = async () => {
      setBookingsLoading(true);
      try {
        const res = await fetch("/api/bookings", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setBookings(data.data);
      } catch (err) {
        console.error("Failed to fetch my bookings:", err);
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchProfile();
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, token]);

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-[#f8fafc] font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-sm">Checking your session...</span>
        </div>
        <Footer />
      </main>
    );
  }

  const today = dayFromToday();
  const upcoming = bookings.filter((b) => ["PENDING", "CONFIRMED"].includes(b.status) && b.check_out >= today).length;
  const stats = [
    { label: "Total Bookings", value: bookings.length, cls: "text-[#0a1629]" },
    { label: "Upcoming Stays", value: upcoming, cls: "text-emerald-600" },
    { label: "Awaiting Confirmation", value: bookings.filter((b) => b.status === "PENDING").length, cls: "text-amber-600" },
    { label: "Completed Stays", value: bookings.filter((b) => b.status === "COMPLETED").length, cls: "text-slate-500" },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans pb-16">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6">
          {profileLoading ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : profile ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center shrink-0 text-2xl font-bold text-[#d9982b] border border-amber-100">
                {profile.name?.charAt(0)?.toUpperCase() || <UserIcon className="w-7 h-7" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-[#0a1629]">{profile.name}</h1>
                  {profile.role === "ADMIN" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#d9982b]" /> {profile.phone}</span>
                  {profile.email && (
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#d9982b]" /> {profile.email}</span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#d9982b]" />
                    Member since {new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Unable to load profile.</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {stats.map((st) => (
            <div key={st.label} className="bg-white p-4 border border-slate-200 rounded-xl text-center">
              <p className={`text-2xl font-bold ${st.cls}`}>{bookingsLoading ? "—" : st.value}</p>
              <p className="text-xs text-slate-500 mt-1">{st.label}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/my-bookings" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:border-emerald-300 group">
            <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center"><CalendarCheck className="w-6 h-6" /></span>
            <span className="flex-1">
              <span className="block font-bold text-[#0a1629]">My Bookings</span>
              <span className="block text-xs text-slate-500">View, track or cancel your stays</span>
            </span>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-700" />
          </Link>
          <Link href="/my-hotels" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:border-emerald-300 group">
            <span className="w-12 h-12 rounded-full bg-amber-50 text-[#d9982b] flex items-center justify-center"><Hotel className="w-6 h-6" /></span>
            <span className="flex-1">
              <span className="block font-bold text-[#0a1629]">My Hotels</span>
              <span className="block text-xs text-slate-500">List your hotel and confirm guest bookings</span>
            </span>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-700" />
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
