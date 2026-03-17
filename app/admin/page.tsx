'use client';

import React, { useState, useEffect } from "react";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getFirestore, collection, getDocs, doc, updateDoc, addDoc, deleteDoc,
  serverTimestamp, Firestore, Timestamp
} from "firebase/firestore";

// Firebase is initialised lazily inside the component (avoids SSR crash)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Hardcoded admin credentials (replace with proper auth in production) ───
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "gmalina2024";
// ─────────────────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  bookingRef: string;
  fullName: string;
  email: string;
  phone: string;
  country?: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  depositAmount: number;
  balanceAmount: number;
  status: string;
  paymentStatus: string;
  occasion?: string;
  dietary?: string;
  addons?: string[];
  specialRequests?: string;
  createdAt?: Timestamp;
  paidAt?: Timestamp;
}

type Tab = "overview" | "bookings" | "booking-detail" | "posts" | "testimonials";

interface Post {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  img: string;
  date: string;
  readTime: string;
  emoji: string;
  published: boolean;
  createdAt?: Timestamp;
}

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  location: string;
  rating: number;
  published: boolean;
  createdAt?: Timestamp;
}
type StatusFilter = "all" | "confirmed" | "awaiting_payment" | "cancelled";

const fmtMWK  = (n: number) => "MWK " + (n || 0).toLocaleString("en-MW");
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtTS   = (ts?: Timestamp) => ts ? ts.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function AdminPage() {
  // ── Lazy Firebase init (runs only in browser, avoids Next.js SSR crash) ──
  const getDB = (): Firestore => {
    const config = {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    const firebaseApp: FirebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    return getFirestore(firebaseApp);
  };

  // ── Auth state ──
  const [authed, setAuthed]         = useState(false);
  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPass, setShowPass]     = useState(false);

  // ── App state ──
  const [tab, setTab]               = useState<Tab>("overview");
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [loading, setLoading]       = useState(false);
  const [loadError, setLoadError]   = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch]         = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDark, setIsDark]         = useState(true);

  // ── Posts state ──
  const [posts, setPosts]               = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError]     = useState("");
  const [postForm, setPostForm]         = useState<Partial<Post>>({});
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postSaving, setPostSaving]     = useState(false);

  // ── Testimonials state ──
  const [testimonials, setTestimonials]         = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [testimonialsError, setTestimonialsError]     = useState("");
  const [testimonialForm, setTestimonialForm]   = useState<Partial<Testimonial>>({});
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testimonialSaving, setTestimonialSaving] = useState(false);

  // ── Persist auth across page refresh ──
  useEffect(() => {
    const saved = sessionStorage.getItem("gmalina_admin_auth");
    if (saved === "true") setAuthed(true);
    const theme = localStorage.getItem("gmalina-theme");
    if (theme) setIsDark(theme === "dark");
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setAuthed(true);
      sessionStorage.setItem("gmalina_admin_auth", "true");
      setLoginError("");
    } else {
      setLoginError("Invalid username or password.");
    }
  };

  const handleLogout = () => {
    setAuthed(false);
    sessionStorage.removeItem("gmalina_admin_auth");
    setUsername(""); setPassword("");
  };

  // ── Load bookings from Firestore ──
  const loadBookings = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const db = getDB();
      // Use simple collection fetch — no orderBy to avoid missing-index errors
      const snap = await getDocs(collection(db, "bookings"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
      // Sort client-side: newest first (handles missing createdAt gracefully)
      data.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      setBookings(data);
      if (data.length === 0) setLoadError("No bookings found in the database yet.");
    } catch (e: any) {
      console.error("❌ Failed to load bookings:", e);
      const msg = e?.message || "";
      if (msg.includes("permission-denied") || msg.includes("PERMISSION_DENIED")) {
        setLoadError("Firestore permission denied. Update your security rules to allow reads.");
      } else if (msg.includes("not-found") || msg.includes("NOT_FOUND")) {
        setLoadError("Firestore database not found. Check your Firebase project config.");
      } else if (msg.includes("unavailable") || msg.includes("UNAVAILABLE")) {
        setLoadError("Firestore is unreachable. Check your internet connection.");
      } else {
        setLoadError("Failed to load bookings: " + (msg || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) { loadBookings(); loadPosts(); loadTestimonials(); }
  }, [authed]);

  const loadPosts = async () => {
    setPostsLoading(true); setPostsError("");
    try {
      const snap = await getDocs(collection(getDB(), "posts"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setPosts(data);
    } catch (e: any) { setPostsError(e?.message || "Failed to load posts"); }
    finally { setPostsLoading(false); }
  };

  const savePost = async () => {
    if (!postForm.title?.trim() || !postForm.excerpt?.trim()) return;
    setPostSaving(true);
    try {
      const db = getDB();
      const payload = {
        title:     postForm.title.trim(),
        category:  postForm.category || "Uncategorised",
        excerpt:   postForm.excerpt.trim(),
        img:       postForm.img?.trim() || "",
        date:      postForm.date || new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }),
        readTime:  postForm.readTime || "3 min read",
        emoji:     postForm.emoji || "📝",
        published: postForm.published ?? true,
      };
      if (editingPostId) {
        await updateDoc(doc(db, "posts", editingPostId), payload);
        setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, ...payload } : p));
      } else {
        const ref = await addDoc(collection(db, "posts"), { ...payload, createdAt: serverTimestamp() });
        setPosts(prev => [{ id: ref.id, ...payload } as Post, ...prev]);
      }
      setPostModalOpen(false); setPostForm({}); setEditingPostId(null);
    } catch (e: any) { setPostsError(e?.message || "Save failed"); }
    finally { setPostSaving(false); }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try { await deleteDoc(doc(getDB(), "posts", id)); setPosts(prev => prev.filter(p => p.id !== id)); }
    catch (e: any) { setPostsError(e?.message || "Delete failed"); }
  };

  const loadTestimonials = async () => {
    setTestimonialsLoading(true); setTestimonialsError("");
    try {
      const snap = await getDocs(collection(getDB(), "testimonials"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Testimonial));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setTestimonials(data);
    } catch (e: any) { setTestimonialsError(e?.message || "Failed to load testimonials"); }
    finally { setTestimonialsLoading(false); }
  };

  const saveTestimonial = async () => {
    if (!testimonialForm.quote?.trim() || !testimonialForm.author?.trim()) return;
    setTestimonialSaving(true);
    try {
      const db = getDB();
      const payload = {
        quote:     testimonialForm.quote.trim(),
        author:    testimonialForm.author.trim(),
        location:  testimonialForm.location?.trim() || "",
        rating:    testimonialForm.rating ?? 5,
        published: testimonialForm.published ?? true,
      };
      if (editingTestimonialId) {
        await updateDoc(doc(db, "testimonials", editingTestimonialId), payload);
        setTestimonials(prev => prev.map(t => t.id === editingTestimonialId ? { ...t, ...payload } : t));
      } else {
        const ref = await addDoc(collection(db, "testimonials"), { ...payload, createdAt: serverTimestamp() });
        setTestimonials(prev => [{ id: ref.id, ...payload } as Testimonial, ...prev]);
      }
      setTestimonialModalOpen(false); setTestimonialForm({}); setEditingTestimonialId(null);
    } catch (e: any) { setTestimonialsError(e?.message || "Save failed"); }
    finally { setTestimonialSaving(false); }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    try { await deleteDoc(doc(getDB(), "testimonials", id)); setTestimonials(prev => prev.filter(t => t.id !== id)); }
    catch (e: any) { setTestimonialsError(e?.message || "Delete failed"); }
  };

  const updateStatus = async (bookingId: string, newStatus: string, newPaymentStatus: string) => {
    setUpdatingId(bookingId);
    try {
      const db = getDB();
    await updateDoc(doc(db, "bookings", bookingId), {
        status: newStatus,
        paymentStatus: newPaymentStatus,
      });
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: newStatus, paymentStatus: newPaymentStatus } : b
      ));
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(b => b ? { ...b, status: newStatus, paymentStatus: newPaymentStatus } : b);
      }
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  };

  // ── Derived stats ──
  const stats = {
    total:      bookings.length,
    confirmed:  bookings.filter(b => b.status === "confirmed").length,
    pending:    bookings.filter(b => b.status === "awaiting_payment").length,
    revenue:    bookings.filter(b => b.paymentStatus === "deposit_paid").reduce((s, b) => s + (b.depositAmount || 0), 0),
  };

  const filtered = bookings.filter(b => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.fullName?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.bookingRef?.toLowerCase().includes(q) ||
        b.roomType?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Theme tokens (matches main site) ──
  const t = {
    bg:       isDark ? "#08090a"   : "#f8f5f0",
    bgCard:   isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
    bgAlt:    isDark ? "#0d0e10"   : "#ede8e0",
    border:   isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.1)",
    borderGold: isDark ? "rgba(201,169,110,0.2)" : "rgba(201,169,110,0.4)",
    text:     isDark ? "#f4f0ea"   : "#1a1208",
    textMuted:isDark ? "rgba(244,240,234,0.65)" : "#3d2e1e",
    textFaint:isDark ? "rgba(244,240,234,0.4)"  : "#7a6552",
    inputBg:  isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
    inputBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)",
    navBg:    isDark ? "#0a0b0d"   : "#ede8e0",
  };

  const statusBadge = (status: string, paymentStatus: string) => {
    if (status === "confirmed")        return { label: "Confirmed",        color: "#14a08c", bg: "rgba(20,160,140,0.12)",  border: "rgba(20,160,140,0.3)"  };
    if (status === "awaiting_payment") return { label: "Awaiting Payment", color: "#c9a96e", bg: "rgba(201,169,110,0.1)", border: "rgba(201,169,110,0.3)" };
    if (status === "cancelled")        return { label: "Cancelled",        color: "#e05555", bg: "rgba(220,60,60,0.1)",   border: "rgba(220,60,60,0.3)"   };
    return                                     { label: status,             color: t.textFaint, bg: "transparent",         border: t.border                };
  };

  const G = {
    adm_input: `width:100%;border:1.5px solid ${t.inputBorder};background:${t.inputBg};border-radius:10px;padding:11px 14px;color:${t.text};font-family:'DM Sans',sans-serif;font-size:15px;outline:none;transition:border-color .2s;`,
  };
  const globalCSS = [
    "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');",
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}",
    "::-webkit-scrollbar{width:3px;height:3px;}",
    "::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:2px;}",
    `.adm-input{width:100%;background:${t.inputBg};border:1.5px solid ${t.inputBorder};border-radius:10px;padding:11px 14px;color:${t.text};font-family:'DM Sans',sans-serif;font-size:15px;outline:none;transition:border-color .2s;}`,
    ".adm-input:focus{border-color:#c9a96e;box-shadow:0 0 0 3px rgba(201,169,110,0.1);}",
    `.adm-input::placeholder{color:${t.textFaint};}`,
    `.adm-row{display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid ${t.border};transition:background .15s;cursor:pointer;}`,
    `.adm-row:hover{background:${isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)"};}`,
    ".adm-row:last-child{border-bottom:none;}",
    `.tab-btn{background:transparent;border:none;padding:10px 20px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;color:${t.textFaint};}`,
    ".tab-btn.active{background:rgba(201,169,110,0.12);color:#c9a96e;font-weight:600;}",
    `.tab-btn:hover:not(.active){color:${t.textMuted};background:${isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"};}`,
    `.filter-btn{padding:6px 14px;border-radius:100px;border:1px solid ${t.border};background:transparent;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;color:${t.textFaint};}`,
    ".filter-btn.active{background:rgba(201,169,110,0.12);border-color:rgba(201,169,110,0.3);color:#c9a96e;font-weight:600;}",
    `.filter-btn:hover:not(.active){border-color:rgba(201,169,110,0.25);color:${t.textMuted};}`,
    ".action-btn{padding:7px 14px;border-radius:8px;border:1.5px solid;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;}",
    "@media(max-width:768px){.adm-table-hide{display:none!important;}}",
  ].join("\n");

  // ════════════════════════════════════════════════════════════════════════════
  // ── LOGIN PAGE ──
  // ════════════════════════════════════════════════════════════════════════════
  if (!authed) {
    return (
      <>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
      <div style={{ minHeight: "100vh", backgroundColor: isDark ? "#08090a" : "#f8f5f0", backgroundImage: isDark ? "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(201,169,110,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 90%, rgba(20,160,140,0.07) 0%, transparent 60%)" : "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(201,169,110,0.15) 0%, transparent 60%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <img src="/images/logo.jpg" alt="Gmalina Court" style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover", margin: "0 auto 16px", display: "block" }} />
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: t.text, lineHeight: 1.1 }}>Gmalina Court</div>
            <div style={{ fontSize: 12, color: t.textFaint, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>Admin Portal</div>
          </div>

          {/* Card */}
          <div style={{ background: t.bgCard, border: `1px solid ${t.borderGold}`, borderRadius: 24, padding: "40px 36px", boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.5)" : "0 16px 48px rgba(0,0,0,0.1)" }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: t.text, marginBottom: 6 }}>Welcome Back</div>
              <div style={{ fontSize: 14, color: t.textFaint }}>Sign in to manage bookings</div>
            </div>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: t.textFaint, marginBottom: 6 }}>Username</label>
                <input
                  className="adm-input"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setLoginError(""); }}
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: t.textFaint, marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="adm-input"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLoginError(""); }}
                    placeholder="Enter password"
                    style={{ paddingRight: 48 }}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: t.textFaint, padding: 4 }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {loginError && (
                <div style={{ background: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.25)", borderRadius: 10, padding: "10px 14px", color: "#e05555", fontSize: 13, display: "flex", gap: 7, alignItems: "center" }}>
                  ⚠️ {loginError}
                </div>
              )}

              <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg,#c9a96e,#e8d5a3)", color: "#08090a", border: "none", padding: "14px", borderRadius: 100, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4, letterSpacing: "0.02em", transition: "all .2s" }}>
                Sign In →
              </button>
            </form>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${t.border}`, textAlign: "center" }}>
              <a href="/" style={{ color: t.textFaint, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>← Back to Website</a>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: t.textFaint }}>
            Gmalina Court Lodge · Liwonde, Malawi
          </div>
        </div>
      </div>
    </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── DASHBOARD ──
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'DM Sans',sans-serif" }}>
            {/* ── TOP NAV ── */}
      <nav style={{ background: t.navBg, borderBottom: `1px solid ${t.border}`, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(16px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/images/logo.jpg" alt="Gmalina Court" style={{ width: 34, height: 34, borderRadius: 9, objectFit: "cover" }} />
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, lineHeight: 1.1, color: t.text }}>Gmalina Court</div>
            <div style={{ fontSize: 10, color: t.textFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>Admin Dashboard</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={loadBookings} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 8, padding: "7px 14px", color: t.textFaint, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans',sans-serif" }}>
            {loading ? "⏳" : "🔄"} Refresh
          </button>
          <button onClick={() => setIsDark(p => !p)} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 8, padding: "7px 10px", color: t.textFaint, cursor: "pointer", fontSize: 14 }}>
            {isDark ? "☀️" : "🌙"}
          </button>
          <a href="/" style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 8, padding: "7px 14px", color: t.textFaint, cursor: "pointer", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>🌐 Site</a>
          <button onClick={handleLogout} style={{ background: "rgba(220,60,60,0.1)", border: "1px solid rgba(220,60,60,0.25)", borderRadius: 8, padding: "7px 14px", color: "#e05555", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: 4, padding: "16px 0 0", borderBottom: `1px solid ${t.border}`, marginBottom: 28 }}>
          {([["overview","📊 Overview"],["bookings","📋 Bookings"],["posts","✍️ Posts"],["testimonials","💬 Testimonials"]] as [Tab, string][]).map(([id, label]) => (
            <button key={id} className={`tab-btn ${tab === id ? "active" : ""}`} onClick={() => { setTab(id); setSelectedBooking(null); }}>{label}</button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════ */}
        {/* ── OVERVIEW TAB ── */}
        {/* ════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { icon: "📋", label: "Total Bookings",  value: stats.total,     color: "#c9a96e",  bg: "rgba(201,169,110,0.1)"  },
                { icon: "✅", label: "Confirmed",        value: stats.confirmed, color: "#14a08c",  bg: "rgba(20,160,140,0.1)"   },
                { icon: "⏳", label: "Awaiting Payment", value: stats.pending,   color: "#f0a020",  bg: "rgba(240,160,32,0.1)"   },
                { icon: "💰", label: "Deposits Received",value: fmtMWK(stats.revenue), color: "#c9a96e", bg: "rgba(201,169,110,0.08)" },
              ].map((s, i) => (
                <div key={i} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
                    <span style={{ fontSize: 12, color: t.textFaint, fontWeight: 500 }}>{s.label}</span>
                  </div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Recent bookings */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: t.text }}>Recent Bookings</div>
                <button onClick={() => setTab("bookings")} style={{ background: "none", border: "none", color: "#c9a96e", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>View All →</button>
              </div>
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: t.textFaint }}>Loading…</div>
              ) : loadError ? (
                <div style={{ padding: 32, textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>⚠️</div>
                  <div style={{ fontSize:14, color:"#e05555", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>{loadError}</div>
                  <button onClick={loadBookings} style={{ marginTop:14, background:"rgba(201,169,110,0.12)", border:"1px solid rgba(201,169,110,0.3)", color:"#c9a96e", padding:"8px 20px", borderRadius:100, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600 }}>Retry</button>
                </div>
              ) : bookings.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: t.textFaint }}>No bookings yet.</div>
              ) : (
                bookings.slice(0, 8).map(b => {
                  const badge = statusBadge(b.status, b.paymentStatus);
                  return (
                    <div key={b.id} className="adm-row" onClick={() => { setSelectedBooking(b); setTab("booking-detail"); }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,rgba(201,169,110,0.15),rgba(201,169,110,0.05))", border: `1px solid ${t.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                        {b.roomType === "Deluxe Room" ? "✨" : b.roomType === "Superior Room" ? "⭐" : "🛏️"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.fullName}</div>
                        <div style={{ fontSize: 12, color: t.textFaint }}>{b.roomType} · {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</div>
                      </div>
                      <div className="adm-table-hide" style={{ fontSize: 12, color: t.textFaint, fontFamily: "monospace" }}>{b.bookingRef}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#c9a96e", flexShrink: 0 }}>{fmtMWK(b.depositAmount)}</div>
                      <div style={{ padding: "3px 10px", borderRadius: 100, background: badge.bg, border: `1px solid ${badge.border}`, fontSize: 11, fontWeight: 600, color: badge.color, flexShrink: 0, whiteSpace: "nowrap" }}>{badge.label}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════ */}
        {/* ── BOOKINGS TABLE TAB ── */}
        {/* ════════════════════════════════════════════════ */}
        {tab === "bookings" && (
          <div>
            {/* Filters row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {(["all","confirmed","awaiting_payment","cancelled"] as StatusFilter[]).map(s => (
                  <button key={s} className={`filter-btn ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
                    {s === "all" ? "All" : s === "confirmed" ? "Confirmed" : s === "awaiting_payment" ? "Awaiting" : "Cancelled"}
                  </button>
                ))}
              </div>
              <input
                className="adm-input"
                placeholder="🔍  Search by name, email, ref…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 260 }}
              />
            </div>

            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr 1fr 0.8fr 0.8fr 1fr", gap: 0, padding: "10px 20px", borderBottom: `1px solid ${t.border}`, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)" }}>
                {["Guest","Room","Dates","Ref","Total","Deposit","Status"].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: t.textFaint }}>{h}</div>
                ))}
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: t.textFaint }}>Loading bookings…</div>
              ) : loadError ? (
                <div style={{ padding: 32, textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>⚠️</div>
                  <div style={{ fontSize:14, color:"#e05555", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>{loadError}</div>
                  <button onClick={loadBookings} style={{ marginTop:14, background:"rgba(201,169,110,0.12)", border:"1px solid rgba(201,169,110,0.3)", color:"#c9a96e", padding:"8px 20px", borderRadius:100, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600 }}>Retry</button>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: t.textFaint }}>No bookings match the current filter.</div>
              ) : (
                filtered.map(b => {
                  const badge = statusBadge(b.status, b.paymentStatus);
                  return (
                    <div key={b.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr 1fr 0.8fr 0.8fr 1fr", gap: 0, padding: "14px 20px", borderBottom: `1px solid ${t.border}`, cursor: "pointer", transition: "background .15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      onClick={() => { setSelectedBooking(b); setTab("booking-detail"); }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.fullName}</div>
                        <div style={{ fontSize: 11, color: t.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.email}</div>
                      </div>
                      <div style={{ fontSize: 13, color: t.textMuted, alignSelf: "center" }}>{b.roomType}</div>
                      <div style={{ fontSize: 12, color: t.textFaint, alignSelf: "center", lineHeight: 1.5 }}>
                        <div>{fmtDate(b.checkIn)}</div>
                        <div>{fmtDate(b.checkOut)}</div>
                      </div>
                      <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", alignSelf: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.bookingRef}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.text, alignSelf: "center" }}>{fmtMWK(b.totalAmount)}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#c9a96e", alignSelf: "center" }}>{fmtMWK(b.depositAmount)}</div>
                      <div style={{ alignSelf: "center" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 100, background: badge.bg, border: `1px solid ${badge.border}`, fontSize: 11, fontWeight: 600, color: badge.color, whiteSpace: "nowrap" }}>{badge.label}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: 14, fontSize: 12, color: t.textFaint, textAlign: "right" }}>
              {filtered.length} of {bookings.length} bookings
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════ */}
        {/* ── BOOKING DETAIL TAB ── */}
        {/* ════════════════════════════════════════════════ */}
        {tab === "booking-detail" && selectedBooking && (() => {
          const b = selectedBooking;
          const badge = statusBadge(b.status, b.paymentStatus);
          return (
            <div>
              {/* Back */}
              <button onClick={() => { setTab("bookings"); setSelectedBooking(null); }} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans',sans-serif", marginBottom: 20 }}>
                ← Back to Bookings
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>

                {/* ── Left: main details ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Header card */}
                  <div style={{ background: t.bgCard, border: `1px solid ${t.borderGold}`, borderRadius: 16, padding: "22px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 4 }}>{b.fullName}</div>
                        <div style={{ fontSize: 13, color: t.textFaint, fontFamily: "monospace" }}>{b.bookingRef}</div>
                      </div>
                      <span style={{ padding: "5px 14px", borderRadius: 100, background: badge.bg, border: `1px solid ${badge.border}`, fontSize: 13, fontWeight: 600, color: badge.color }}>{badge.label}</span>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "20px 24px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: t.textFaint, marginBottom: 16 }}>Contact Details</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {[
                        { l: "Email",   v: b.email   },
                        { l: "Phone",   v: b.phone   },
                        { l: "Country", v: b.country || "—" },
                        { l: "Guests",  v: String(b.guests) },
                        { l: "Occasion",v: b.occasion || "—" },
                        { l: "Dietary", v: b.dietary || "—" },
                      ].map(({ l, v }) => (
                        <div key={l}>
                          <div style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>{l}</div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: t.text, wordBreak: "break-all" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stay details */}
                  <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "20px 24px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: t.textFaint, marginBottom: 16 }}>Stay Details</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {[
                        { l: "Room Type",  v: b.roomType },
                        { l: "Nights",     v: String(b.nights) },
                        { l: "Check-In",   v: fmtDate(b.checkIn) },
                        { l: "Check-Out",  v: fmtDate(b.checkOut) },
                      ].map(({ l, v }) => (
                        <div key={l}>
                          <div style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>{l}</div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {b.addons && b.addons.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Add-ons</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {b.addons.map((a, i) => (
                            <span key={i} style={{ padding: "3px 10px", borderRadius: 100, background: "rgba(20,160,140,0.1)", border: "1px solid rgba(20,160,140,0.25)", fontSize: 12, color: "#14a08c", fontWeight: 500 }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {b.specialRequests && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Special Requests</div>
                        <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.6, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)", padding: "10px 14px", borderRadius: 8, border: `1px solid ${t.border}` }}>{b.specialRequests}</div>
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "20px 24px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: t.textFaint, marginBottom: 14 }}>Timeline</div>
                    {[
                      { dot: "#c9a96e", label: "Booking Created", time: fmtTS(b.createdAt) },
                      ...(b.paidAt ? [{ dot: "#14a08c", label: "Deposit Paid", time: fmtTS(b.paidAt) }] : []),
                    ].map((e, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: e.dot, flexShrink: 0, marginTop: 4 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{e.label}</div>
                          <div style={{ fontSize: 12, color: t.textFaint }}>{e.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Right: financials + actions ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Financial summary */}
                  <div style={{ background: t.bgCard, border: `1px solid ${t.borderGold}`, borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: t.textFaint, marginBottom: 14 }}>Financials</div>
                    {[
                      { l: "Rate / Night", v: fmtMWK(b.totalAmount / Math.max(b.nights, 1)) },
                      { l: "Total Stay",   v: fmtMWK(b.totalAmount) },
                      { l: "Deposit (20%)",v: fmtMWK(b.depositAmount), color: "#14a08c" },
                      { l: "Balance Due",  v: fmtMWK(b.balanceAmount) },
                    ].map(({ l, v, color }) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${t.border}` }}>
                        <span style={{ fontSize: 13, color: t.textFaint }}>{l}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: color || t.text }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: b.paymentStatus === "deposit_paid" ? "rgba(20,160,140,0.08)" : "rgba(240,160,32,0.08)", border: `1px solid ${b.paymentStatus === "deposit_paid" ? "rgba(20,160,140,0.25)" : "rgba(240,160,32,0.25)"}` }}>
                      <div style={{ fontSize: 11, color: t.textFaint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>Payment Status</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: b.paymentStatus === "deposit_paid" ? "#14a08c" : "#f0a020" }}>
                        {b.paymentStatus === "deposit_paid" ? "✅ Deposit Received" : "⏳ " + (b.paymentStatus || "Pending")}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: t.textFaint, marginBottom: 14 }}>Actions</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {b.status !== "confirmed" && (
                        <button
                          className="action-btn"
                          disabled={updatingId === b.id}
                          onClick={() => updateStatus(b.id, "confirmed", "deposit_paid")}
                          style={{ borderColor: "rgba(20,160,140,0.4)", color: "#14a08c", background: "rgba(20,160,140,0.08)", opacity: updatingId === b.id ? .6 : 1 }}
                        >
                          {updatingId === b.id ? "Updating…" : "✅ Mark as Confirmed"}
                        </button>
                      )}
                      {b.status !== "awaiting_payment" && (
                        <button
                          className="action-btn"
                          disabled={updatingId === b.id}
                          onClick={() => updateStatus(b.id, "awaiting_payment", "pending")}
                          style={{ borderColor: "rgba(201,169,110,0.4)", color: "#c9a96e", background: "rgba(201,169,110,0.08)", opacity: updatingId === b.id ? .6 : 1 }}
                        >
                          ⏳ Mark Awaiting Payment
                        </button>
                      )}
                      {b.status !== "cancelled" && (
                        <button
                          className="action-btn"
                          disabled={updatingId === b.id}
                          onClick={() => updateStatus(b.id, "cancelled", "cancelled")}
                          style={{ borderColor: "rgba(220,60,60,0.3)", color: "#e05555", background: "rgba(220,60,60,0.06)", opacity: updatingId === b.id ? .6 : 1 }}
                        >
                          ❌ Cancel Booking
                        </button>
                      )}
                      <a
                        href={`mailto:${b.email}?subject=Your booking at Gmalina Court (${b.bookingRef})&body=Dear ${b.fullName},%0A%0AThank you for your booking at Gmalina Court Lodge.%0A%0ABooking Reference: ${b.bookingRef}%0ARoom: ${b.roomType}%0ACheck-In: ${b.checkIn}%0ACheck-Out: ${b.checkOut}%0A%0AKind regards,%0AGmalina Court Team`}
                        style={{ display: "block", textAlign: "center", padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${t.border}`, color: t.textMuted, textDecoration: "none", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", transition: "all .2s" }}
                      >
                        ✉️ Email Guest
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </div>


        {/* ════════ POSTS TAB ════════ */}
        {tab === "posts" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:t.text }}>Stories & Insights</div>
              <button onClick={() => { setPostForm({ published:true, emoji:"📝", category:"Travel Guide" }); setEditingPostId(null); setPostModalOpen(true); }}
                style={{ background:"linear-gradient(135deg,#c9a96e,#e8d5a3)", border:"none", borderRadius:100, padding:"9px 20px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:"#08090a", cursor:"pointer" }}>
                + New Post
              </button>
            </div>

            {postsError && <div style={{ background:"rgba(220,60,60,0.08)", border:"1px solid rgba(220,60,60,0.25)", borderRadius:10, padding:"10px 14px", color:"#e05555", fontSize:13, marginBottom:16 }}>⚠️ {postsError}</div>}

            {postsLoading ? (
              <div style={{ padding:40, textAlign:"center", color:t.textFaint }}>Loading posts…</div>
            ) : posts.length === 0 ? (
              <div style={{ padding:48, textAlign:"center", color:t.textFaint }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✍️</div>
                <div style={{ fontSize:15, marginBottom:8 }}>No posts yet</div>
                <div style={{ fontSize:13 }}>Click "+ New Post" to publish your first story.</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {posts.map(post => (
                  <div key={post.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                    <div style={{ width:44, height:44, borderRadius:10, overflow:"hidden", flexShrink:0, background:t.bgAlt }}>
                      {post.img ? <img src={post.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{post.emoji}</div>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:t.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{post.title}</div>
                      <div style={{ fontSize:12, color:t.textFaint, marginTop:2 }}>{post.category} · {post.date} · {post.readTime}</div>
                    </div>
                    <span style={{ padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:600, background:post.published?"rgba(20,160,140,0.1)":"rgba(255,255,255,0.06)", border:`1px solid ${post.published?"rgba(20,160,140,0.3)":t.border}`, color:post.published?"#14a08c":t.textFaint, flexShrink:0 }}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <button onClick={() => { setPostForm(post); setEditingPostId(post.id); setPostModalOpen(true); }}
                        style={{ background:"rgba(201,169,110,0.1)", border:"1px solid rgba(201,169,110,0.3)", borderRadius:8, padding:"6px 12px", color:"#c9a96e", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Edit</button>
                      <button onClick={() => deletePost(post.id)}
                        style={{ background:"rgba(220,60,60,0.08)", border:"1px solid rgba(220,60,60,0.25)", borderRadius:8, padding:"6px 12px", color:"#e05555", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Post Modal */}
            {postModalOpen && (
              <div style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={() => setPostModalOpen(false)}>
                <div style={{ background:t.bgAlt, border:`1px solid ${t.borderGold}`, borderRadius:20, padding:"28px 28px 24px", width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:t.text, marginBottom:20 }}>{editingPostId ? "Edit Post" : "New Post"}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <div>
                      <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:5 }}>Title *</label>
                      <input className="adm-input" value={postForm.title||""} onChange={e => setPostForm(f => ({...f, title:e.target.value}))} placeholder="Post title…" />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:5 }}>Category</label>
                        <select className="adm-input" value={postForm.category||""} onChange={e => setPostForm(f => ({...f, category:e.target.value}))} style={{ appearance:"none" }}>
                          {["Travel Guide","Cuisine","Events","Lifestyle","Wellness","Culture","Uncategorised"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:5 }}>Emoji</label>
                        <input className="adm-input" value={postForm.emoji||""} onChange={e => setPostForm(f => ({...f, emoji:e.target.value}))} placeholder="🦁" />
                      </div>
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:5 }}>Excerpt *</label>
                      <textarea className="adm-input" rows={3} value={postForm.excerpt||""} onChange={e => setPostForm(f => ({...f, excerpt:e.target.value}))} placeholder="Brief summary of the post…" style={{ resize:"vertical" }} />
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:5 }}>Image URL</label>
                      <input className="adm-input" value={postForm.img||""} onChange={e => setPostForm(f => ({...f, img:e.target.value}))} placeholder="https://images.unsplash.com/…" />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:5 }}>Date</label>
                        <input className="adm-input" value={postForm.date||""} onChange={e => setPostForm(f => ({...f, date:e.target.value}))} placeholder="Jan 15, 2025" />
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:5 }}>Read Time</label>
                        <input className="adm-input" value={postForm.readTime||""} onChange={e => setPostForm(f => ({...f, readTime:e.target.value}))} placeholder="5 min read" />
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border:`1px solid ${t.border}`, cursor:"pointer", userSelect:"none" }} onClick={() => setPostForm(f => ({...f, published:!f.published}))}>
                      <div style={{ width:34, height:18, borderRadius:9, background:postForm.published?"rgba(20,160,140,0.3)":"rgba(255,255,255,0.08)", border:`1px solid ${postForm.published?"rgba(20,160,140,0.4)":t.border}`, position:"relative", transition:"all .25s", flexShrink:0 }}>
                        <div style={{ position:"absolute", width:11, height:11, borderRadius:"50%", background:postForm.published?"#14a08c":"rgba(244,240,234,0.3)", top:3, left:3, transform:postForm.published?"translateX(15px)":"translateX(0)", transition:"transform .25s, background .25s" }} />
                      </div>
                      <span style={{ fontSize:13, color:t.textMuted, fontFamily:"'DM Sans',sans-serif" }}>{postForm.published ? "Published (visible on site)" : "Draft (hidden from site)"}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10, marginTop:20 }}>
                    <button onClick={savePost} disabled={postSaving || !postForm.title?.trim() || !postForm.excerpt?.trim()}
                      style={{ flex:1, background:"linear-gradient(135deg,#c9a96e,#e8d5a3)", border:"none", borderRadius:100, padding:"12px", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, color:"#08090a", cursor:"pointer", opacity:(postSaving||!postForm.title?.trim()||!postForm.excerpt?.trim())?.6:1 }}>
                      {postSaving ? "Saving…" : editingPostId ? "Save Changes" : "Publish Post"}
                    </button>
                    <button onClick={() => { setPostModalOpen(false); setPostForm({}); setEditingPostId(null); }}
                      style={{ padding:"12px 20px", background:"transparent", border:`1px solid ${t.border}`, borderRadius:100, color:t.textMuted, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ TESTIMONIALS TAB ════════ */}
        {tab === "testimonials" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:t.text }}>Guest Testimonials</div>
              <button onClick={() => { setTestimonialForm({ published:true, rating:5 }); setEditingTestimonialId(null); setTestimonialModalOpen(true); }}
                style={{ background:"linear-gradient(135deg,#c9a96e,#e8d5a3)", border:"none", borderRadius:100, padding:"9px 20px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:"#08090a", cursor:"pointer" }}>
                + New Testimonial
              </button>
            </div>

            {testimonialsError && <div style={{ background:"rgba(220,60,60,0.08)", border:"1px solid rgba(220,60,60,0.25)", borderRadius:10, padding:"10px 14px", color:"#e05555", fontSize:13, marginBottom:16 }}>⚠️ {testimonialsError}</div>}

            {testimonialsLoading ? (
              <div style={{ padding:40, textAlign:"center", color:t.textFaint }}>Loading testimonials…</div>
            ) : testimonials.length === 0 ? (
              <div style={{ padding:48, textAlign:"center", color:t.textFaint }}>
                <div style={{ fontSize:40, marginBottom:12 }}>💬</div>
                <div style={{ fontSize:15, marginBottom:8 }}>No testimonials yet</div>
                <div style={{ fontSize:13 }}>Click "+ New Testimonial" to add your first guest review.</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {testimonials.map(t2 => (
                  <div key={t2.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, padding:"16px 20px", display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,rgba(201,169,110,0.2),rgba(201,169,110,0.05))", border:`1px solid ${t.borderGold}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:700, flexShrink:0, color:"#c9a96e" }}>{t2.author[0]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:t.text, lineHeight:1.6, fontStyle:"italic", marginBottom:6 }}>"{t2.quote}"</div>
                      <div style={{ fontSize:12, color:t.textFaint }}>{t2.author} · {t2.location} · {"★".repeat(t2.rating)}</div>
                    </div>
                    <span style={{ padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:600, background:t2.published?"rgba(20,160,140,0.1)":"rgba(255,255,255,0.06)", border:`1px solid ${t2.published?"rgba(20,160,140,0.3)":t.border}`, color:t2.published?"#14a08c":t.textFaint, flexShrink:0 }}>
                      {t2.published ? "Published" : "Hidden"}
                    </span>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <button onClick={() => { setTestimonialForm(t2); setEditingTestimonialId(t2.id); setTestimonialModalOpen(true); }}
                        style={{ background:"rgba(201,169,110,0.1)", border:"1px solid rgba(201,169,110,0.3)", borderRadius:8, padding:"6px 12px", color:"#c9a96e", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Edit</button>
                      <button onClick={() => deleteTestimonial(t2.id)}
                        style={{ background:"rgba(220,60,60,0.08)", border:"1px solid rgba(220,60,60,0.25)", borderRadius:8, padding:"6px 12px", color:"#e05555", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Testimonial Modal */}
            {testimonialModalOpen && (
              <div style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={() => setTestimonialModalOpen(false)}>
                <div style={{ background:t.bgAlt, border:`1px solid ${t.borderGold}`, borderRadius:20, padding:"28px 28px 24px", width:"100%", maxWidth:480 }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:t.text, marginBottom:20 }}>{editingTestimonialId ? "Edit Testimonial" : "New Testimonial"}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <div>
                      <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:5 }}>Quote *</label>
                      <textarea className="adm-input" rows={3} value={testimonialForm.quote||""} onChange={e => setTestimonialForm(f => ({...f, quote:e.target.value}))} placeholder="Guest's review…" style={{ resize:"vertical" }} />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:5 }}>Author *</label>
                        <input className="adm-input" value={testimonialForm.author||""} onChange={e => setTestimonialForm(f => ({...f, author:e.target.value}))} placeholder="Jane D." />
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:5 }}>Location</label>
                        <input className="adm-input" value={testimonialForm.location||""} onChange={e => setTestimonialForm(f => ({...f, location:e.target.value}))} placeholder="Nairobi, Kenya" />
                      </div>
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:8 }}>Rating</label>
                      <div style={{ display:"flex", gap:8 }}>
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setTestimonialForm(f => ({...f, rating:n}))}
                            style={{ width:36, height:36, borderRadius:8, border:`1.5px solid ${(testimonialForm.rating??5)>=n?"#c9a96e":t.border}`, background:(testimonialForm.rating??5)>=n?"rgba(201,169,110,0.15)":"transparent", fontSize:18, cursor:"pointer", transition:"all .2s" }}>⭐</button>
                        ))}
                        <span style={{ alignSelf:"center", fontSize:14, color:t.textFaint, marginLeft:4 }}>{testimonialForm.rating ?? 5}/5</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border:`1px solid ${t.border}`, cursor:"pointer", userSelect:"none" }} onClick={() => setTestimonialForm(f => ({...f, published:!f.published}))}>
                      <div style={{ width:34, height:18, borderRadius:9, background:testimonialForm.published?"rgba(20,160,140,0.3)":"rgba(255,255,255,0.08)", border:`1px solid ${testimonialForm.published?"rgba(20,160,140,0.4)":t.border}`, position:"relative", transition:"all .25s", flexShrink:0 }}>
                        <div style={{ position:"absolute", width:11, height:11, borderRadius:"50%", background:testimonialForm.published?"#14a08c":"rgba(244,240,234,0.3)", top:3, left:3, transform:testimonialForm.published?"translateX(15px)":"translateX(0)", transition:"transform .25s, background .25s" }} />
                      </div>
                      <span style={{ fontSize:13, color:t.textMuted, fontFamily:"'DM Sans',sans-serif" }}>{testimonialForm.published ? "Published (visible on site)" : "Hidden from site"}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10, marginTop:20 }}>
                    <button onClick={saveTestimonial} disabled={testimonialSaving || !testimonialForm.quote?.trim() || !testimonialForm.author?.trim()}
                      style={{ flex:1, background:"linear-gradient(135deg,#c9a96e,#e8d5a3)", border:"none", borderRadius:100, padding:"12px", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, color:"#08090a", cursor:"pointer", opacity:(testimonialSaving||!testimonialForm.quote?.trim()||!testimonialForm.author?.trim())?.6:1 }}>
                      {testimonialSaving ? "Saving…" : editingTestimonialId ? "Save Changes" : "Add Testimonial"}
                    </button>
                    <button onClick={() => { setTestimonialModalOpen(false); setTestimonialForm({}); setEditingTestimonialId(null); }}
                      style={{ padding:"12px 20px", background:"transparent", border:`1px solid ${t.border}`, borderRadius:100, color:t.textMuted, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "32px 24px", marginTop: 48, borderTop: `1px solid ${t.border}`, fontSize: 12, color: t.textFaint }}>
        Gmalina Court Lodge · Admin Portal · Liwonde, Malawi
      </div>
    </div>
  </>
  );
}