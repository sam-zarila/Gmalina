'use client';

import React, { useState, useEffect, useRef } from "react";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, updateDoc, doc, Firestore } from "firebase/firestore";

// ─── Firebase initialisation (reads from .env.local) ─────────────────────────
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate config on startup — missing keys cause silent hangs
if (typeof window !== "undefined") {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    console.error("🔥 Firebase config MISSING keys:", missing);
    console.error("Add these to your .env.local and restart the dev server.");
  } else {
    console.log("✅ Firebase config loaded. Project:", firebaseConfig.projectId);
  }
}

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db: Firestore    = getFirestore(app);
// ─────────────────────────────────────────────────────────────────────────────

// ─── Timeout helper — Firestore hangs forever when rules block writes ─────────
function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT after ${ms}ms — check Firestore rules or network`)), ms)
    ),
  ]);
}
// ─────────────────────────────────────────────────────────────────────────────

const NAV_LINKS = ["About", "Rooms", "Facilities", "Gallery", "Blog", "FAQ", "Contact"];

// ── Lodge & Safari placeholder images ──
// ─── Local image paths — all photos served from public/images/ ───────────────
const IMGS = {
  // ── Hero & About ─────────────────────────────────────────────────────────
  heroPool:    "/images/hero.jpg",          // ✅ hero.jpg — main hero background
  aboutLodge:  "/images/outside.jpg",       // ✅ outside.jpg — lodge exterior
  aboutNature: "/images/out.jpg",           // ✅ out.jpg — outdoor/nature view
  aboutDining: "/images/living.jpg",        // ✅ living.jpg — lounge/living area

  // ── Rooms ────────────────────────────────────────────────────────────────
  room1:       "/images/gmalina-room.jpg",  // ✅ gmalina-room.jpg — featured deluxe room
  room2:       "/images/bed.jpg",           // ✅ bed.jpg — classic bedroom
  room3:       "/images/tv.jpg",            // ✅ tv.jpg — room with TV/living area

  // ── Facilities ───────────────────────────────────────────────────────────
  pool:        "/images/pool.jpg",          // ✅ pool.jpg — swimming pool
  restaurant:  "/images/living.jpg",        // ✅ living.jpg — dining/lounge
  conference:  "/images/conference.jpg",    // ✅ conference.jpg — conference room
  gym:         "/images/gym.jpg",           // ✅ gym.jpg — fitness centre
  bar:         "/images/pool2.jpg",         // ✅ pool2.jpg — poolside bar area
  garden:      "/images/outside.jpg",       // ✅ outside.jpg — outdoor/garden

  // ── Attractions ──────────────────────────────────────────────────────────
  safari:      "/images/yala.jpg",          // ✅ yala.jpg — wildlife/safari
  lake:        "/images/out.jpg",           // ✅ out.jpg — outdoor water/lake view
  liwonde:     "/images/board.jpg",         // ✅ board.jpg — local area/market
  sunset:      "/images/hero.jpg",          // ✅ hero.jpg — sunset/landscape

  // ── Gallery (9 photos — best variety of your shots) ──────────────────────
  gal1:        "/images/pool.jpg",          // Pool
  gal2:        "/images/gmalina-room.jpg",  // Deluxe room
  gal3:        "/images/living.jpg",        // Lounge/dining
  gal4:        "/images/yala.jpg",          // Wildlife/safari
  gal5:        "/images/conference.jpg",    // Conference
  gal6:        "/images/bed.jpg",           // Bedroom
  gal7:        "/images/outside.jpg",       // Exterior/garden
  gal8:        "/images/pool2.jpg",         // Pool 2
  gal9:        "/images/out.jpg",           // Outdoor view

  // ── Blog thumbnails ───────────────────────────────────────────────────────
  blog1:       "/images/yala.jpg",          // Wildlife post
  blog2:       "/images/living.jpg",        // Cuisine/dining post
  blog3:       "/images/conference.jpg",    // Events/corporate post
  blog4:       "/images/out.jpg",           // Lifestyle/outdoor post
  blog5:       "/images/pool.jpg",          // Wellness/pool post
  blog6:       "/images/gmalina-room.jpg",  // Room/culture post
};

interface GalleryItem {
  emoji: string;
  label: string;
  category: string;
  span: string;
  bg: string;
  img: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  { emoji: "🏊", label: "Swimming Pool",    category: "Facilities", span: "wide",   bg: "linear-gradient(135deg, rgba(20,160,140,0.25), rgba(8,60,80,0.6))",    img: "/images/pool.jpg" },
  { emoji: "🛏️", label: "Deluxe Suite",    category: "Rooms",      span: "tall",   bg: "linear-gradient(135deg, rgba(201,169,110,0.2), rgba(60,30,10,0.6))",   img: "/images/gmalina-room.jpg" },
  { emoji: "🍽️", label: "Lounge & Dining", category: "Restaurant", span: "normal", bg: "linear-gradient(135deg, rgba(180,60,40,0.2), rgba(40,10,10,0.6))",    img: "/images/living.jpg" },
  { emoji: "🦁", label: "Safari Views",    category: "Nature",     span: "wide",   bg: "linear-gradient(135deg, rgba(180,140,30,0.25), rgba(50,40,0,0.6))",   img: "/images/yala.jpg" },
  { emoji: "🎤", label: "Conference Hall", category: "Business",   span: "normal", bg: "linear-gradient(135deg, rgba(60,80,180,0.2), rgba(10,10,50,0.6))",    img: "/images/conference.jpg" },
  { emoji: "💪", label: "Fitness Center",  category: "Facilities", span: "normal", bg: "linear-gradient(135deg, rgba(20,160,100,0.2), rgba(0,30,20,0.6))",    img: "/images/gym.jpg" },
  { emoji: "🌿", label: "Garden Terrace",  category: "Outdoors",   span: "tall",   bg: "linear-gradient(135deg, rgba(40,140,60,0.2), rgba(0,20,0,0.6))",      img: "/images/outside.jpg" },
  { emoji: "🍹", label: "Poolside Bar",    category: "Bar",        span: "normal", bg: "linear-gradient(135deg, rgba(200,100,20,0.2), rgba(50,20,0,0.6))",    img: "/images/pool2.jpg" },
  { emoji: "🌅", label: "Outdoor Views",   category: "Nature",     span: "wide",   bg: "linear-gradient(135deg, rgba(220,120,40,0.25), rgba(60,20,0,0.6))",   img: "/images/out.jpg" },
];

const GALLERY_FILTERS = ["All", "Rooms", "Facilities", "Restaurant", "Nature", "Business", "Outdoors", "Bar"];

const FAQS = [
  {
    q: "What are the check-in and check-out times?",
    a: "Check-in is from 2:00 PM and check-out is by 11:00 AM. Early check-in and late check-out can be arranged subject to availability—please contact our concierge team in advance."
  },
  {
    q: "Is airport transfer available?",
    a: "Yes, we offer private airport transfers to and from Chileka International Airport (Blantyre) and Kamuzu International Airport (Lilongwe). Please book at least 48 hours in advance through our concierge."
  },
  {
    q: "Do you cater for dietary requirements?",
    a: "Absolutely. Our restaurant accommodates vegetarian, vegan, gluten-free, halal, and other dietary requirements. Please inform us at the time of booking and our chefs will prepare accordingly."
  },
  {
    q: "Can I book the conference hall for a day event?",
    a: "Yes, our conference facilities are available for day bookings. We offer full-day and half-day packages that include AV equipment, high-speed Wi-Fi, and catering options tailored to your event."
  },
  {
    q: "Are safari packages available through the lodge?",
    a: "Yes! We partner with licensed safari operators at Liwonde National Park, just 5 minutes away. We can arrange game drives, boat safaris, and guided walking tours. Ask our concierge for current packages and pricing."
  },
  {
    q: "Is the swimming pool available to non-residents?",
    a: "The pool is primarily reserved for lodge guests. However, day passes may be available on request—please contact us directly for pricing and availability."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept cash (MWK and USD), major credit/debit cards, and mobile money payments. A deposit may be required to confirm your booking."
  },
  {
    q: "Is Wi-Fi available throughout the property?",
    a: "Yes, complimentary high-speed Wi-Fi is available in all rooms, the conference centre, restaurant, bar, and common areas throughout the property."
  },
];

const BLOGS = [
  { category: "Travel Guide", title: "The Ultimate Safari Guide to Liwonde National Park", excerpt: "Everything you need to know about visiting one of Africa's most biodiverse wilderness areas — from the best game drives to night safaris along the Shire River.", date: "Jan 15, 2025", readTime: "8 min read", emoji: "🦁", color: "rgba(201,169,110,0.15)", img: "/images/blog1.jpg" },
  { category: "Cuisine", title: "A Taste of Malawi: 7 Dishes You Must Try at Our Restaurant", excerpt: "From nsima with chambo fish to slow-roasted nyama, our head chef walks you through the rich culinary heritage of Malawi.", date: "Feb 3, 2025", readTime: "5 min read", emoji: "🍽️", color: "rgba(20,160,140,0.12)", img: "/images/blog2.jpg" },
  { category: "Events", title: "How to Plan the Perfect Corporate Retreat in Malawi", excerpt: "Companies from across Africa are discovering Liwonde as a premier destination for off-site retreats. Here's why Gmalina Court is the ideal venue.", date: "Feb 20, 2025", readTime: "6 min read", emoji: "💼", color: "rgba(100,80,200,0.12)", img: "/images/blog3.jpg" },
  { category: "Lifestyle", title: "Lake Malawi: A Weekend Escape from the Lodge", excerpt: "Just 45 minutes from Gmalina Court lies the jewel of Central Africa. We guide you through the best beaches, water sports, and lakeside villages.", date: "Mar 1, 2025", readTime: "7 min read", emoji: "🌊", color: "rgba(20,100,180,0.12)", img: "/images/blog4.jpg" },
  { category: "Wellness", title: "Morning Rituals: How Our Guests Start the Perfect Day", excerpt: "Early swim, garden breakfast, and a sunrise walk to the river — discover the unhurried morning rhythms that our guests keep coming back for.", date: "Mar 8, 2025", readTime: "4 min read", emoji: "🌅", color: "rgba(220,120,40,0.12)", img: "/images/blog5.jpg" },
  { category: "Culture", title: "Exploring Malawian Craft Markets: A Buyer's Guide", excerpt: "Liwonde's local markets are a treasure trove of handwoven baskets, carved wooden art, and vibrant textiles. Here's how to shop authentically.", date: "Mar 14, 2025", readTime: "5 min read", emoji: "🏺", color: "rgba(180,80,40,0.12)", img: "/images/blog6.jpg" },
];

function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

interface AnimSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function AnimSection({ children, className = "", delay = 0 }: AnimSectionProps) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(48px)",
      transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`
    }}>
      {children}
    </div>
  );
}

const FACILITIES = [
  { icon: "🛏️", title: "Luxury Accommodation", desc: "Spacious suites with en-suite bathrooms, premium linens, smart TV, high-speed Wi-Fi, and panoramic views of Liwonde.", img: "/images/gmalina-room.jpg" },
  { icon: "🎤", title: "Conference Facilities", desc: "Fully equipped halls for up to 100 guests, with 4K AV equipment, high-speed connectivity, and professional catering.", img: "/images/conference.jpg" },
  { icon: "🍽️", title: "Bar & Restaurant", desc: "Award-winning cuisine blending local Malawian flavors with international gastronomy, paired with curated beverages.", img: "/images/living.jpg" },
  { icon: "💪", title: "Premium Gym", desc: "State-of-the-art fitness center with modern cardio, free weights, and personal training on request.", img: "/images/gym.jpg" },
  { icon: "🏊", title: "Swimming Pool", desc: "Heated outdoor pool with sun loungers, poolside bar service, and stunning garden views.", img: "/images/pool.jpg" },
  { icon: "🌿", title: "Garden & Terrace", desc: "Lush tropical gardens with private terraces—perfect for evening sundowners or romantic dinners.", img: "/images/outside.jpg" },
];

const GUEST_TYPES = [
  { icon: "💼", title: "Business Travelers", desc: "Conference rooms, express check-in, 24/7 concierge, and seamless connectivity for the modern executive.", tag: "Corporate" },
  { icon: "🏖️", title: "Leisure Guests", desc: "Pool, spa treatments, bar, and curated day trips to Liwonde National Park for ultimate relaxation.", tag: "Leisure" },
  { icon: "👨‍👩‍👧", title: "Families", desc: "Family suites, child-friendly menus, and guided safari activities for unforgettable memories.", tag: "Family" },
  { icon: "🎉", title: "Events & Groups", desc: "Bespoke packages for weddings, corporate retreats, and private celebrations with dedicated event staff.", tag: "Events" },
];

const ATTRACTIONS = [
  { icon: "🦁", title: "Liwonde National Park", dist: "5 min away", desc: "One of Africa\'s premier safari destinations—home to elephants, hippos, lions, and over 400 bird species.", img: "/images/yala.jpg" },
  { icon: "🌊", title: "Lake Malawi", dist: "45 min away", desc: "The \'Calendar Lake\'—crystal-clear waters, sandy beaches, and world-class snorkeling in the lake of stars.", img: "/images/out.jpg" },
  { icon: "🏺", title: "Liwonde Town Markets", dist: "2 min away", desc: "Vibrant local markets brimming with handcrafted goods, fresh produce, and authentic Malawian culture.", img: "/images/board.jpg" },
];

const TESTIMONIALS = [
  { quote: "Absolutely world-class. The staff anticipated our every need—from the moment we arrived to checkout.", author: "James K.", location: "London, UK", rating: 5 },
  { quote: "The restaurant is a genuine highlight. Incredible food, beautiful ambiance. We ate there every night.", author: "Amara N.", location: "Nairobi, Kenya", rating: 5 },
  { quote: "Perfect base for our Liwonde safari. Stunning pool, comfortable rooms, and flawless service.", author: "Sophie M.", location: "Cape Town, SA", rating: 5 },
];

const STATS = [
  { value: "4.7★", label: "Tripadvisor Rating" },
  { value: "500+", label: "Happy Guests" },
  { value: "6", label: "Premium Facilities" },
  { value: "24/7", label: "Concierge Service" },
];

export default function GmalinaCourtWebsite() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [galleryFilter, setGalleryFilter] = useState("All");
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeBlogTag, setActiveBlogTag] = useState("All");
  const [livePosts, setLivePosts]           = useState<typeof BLOGS>([]);
  const [liveTestimonials, setLiveTestimonials] = useState<typeof TESTIMONIALS>([]);
  const [contentLoaded, setContentLoaded]   = useState(false);

  // ── Booking modal state ──
  const [bookingOpen, setBookingOpen]       = useState(false);
  const [bookingStep, setBookingStep]       = useState<1|2|3|4|5>(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError]     = useState("");
  const [firestoreId, setFirestoreId]       = useState("");
  const [savedBookingRef, setSavedBookingRef] = useState("");
  const [savedTxRef, setSavedTxRef]         = useState("");
  const [payUrl, setPayUrl]                 = useState("");

  // ── Room pricing ──
  const ROOM_PRICES: Record<string, number> = {
    "Deluxe Room":    85000,
    "Superior Room":  70000,
    "Standard Room":  60000,
  };
  const ROOM_ICONS: Record<string, string> = {
    "Deluxe Room":   "✨",
    "Superior Room": "⭐",
    "Standard Room": "🛏️",
  };

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", country: "",
    checkIn: "", checkOut: "", guests: "2",
    roomType: "Deluxe Room",
    occasion: "", dietary: "No restrictions",
    airportTransfer: false, earlyCheckIn: false, lateCheckOut: false,
    romanticSetup: false, extraBed: false,
    specialRequests: "",
  });

  const openBooking = () => {
    setBookingOpen(true); setBookingStep(1);
    setBookingError(""); setFirestoreId(""); setSavedBookingRef(""); setSavedTxRef("");
    document.body.style.overflow = "hidden";
  };
  const closeBooking = () => { setBookingOpen(false); document.body.style.overflow = ""; };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setBookingError("");
  };
  const toggleAddon = (field: string) => setForm(f => ({ ...f, [field]: !(f as any)[field] }));

  // Calculated pricing
  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.round((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000))
    : 0;
  const pricePerNight = ROOM_PRICES[form.roomType] || 60000;
  const totalAmount   = pricePerNight * Math.max(nights, 1);
  const depositAmount = Math.ceil(totalAmount * 0.20);
  const balanceAmount = totalAmount - depositAmount;
  const fmtMWK = (n: number) => "MWK " + n.toLocaleString("en-MW");
  const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const validateBookingStep = (s: number) => {
    if (s === 1) {
      if (!form.firstName.trim()) return "Please enter your first name.";
      if (!form.lastName.trim())  return "Please enter your last name.";
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
      if (!form.phone.trim())     return "Please enter your phone number.";
    }
    if (s === 2) {
      if (!form.checkIn)  return "Please select a check-in date.";
      if (!form.checkOut) return "Please select a check-out date.";
      if (new Date(form.checkOut) <= new Date(form.checkIn)) return "Check-out must be after check-in.";
    }
    return "";
  };

  const bookingNext = () => {
    const err = validateBookingStep(bookingStep);
    if (err) { setBookingError(err); return; }
    setBookingError("");
    setBookingStep(s => (s + 1) as any);
  };

  // Step 3→4: save to Firestore then show payment screen
  const saveAndPay = async () => {
    setBookingLoading(true); setBookingError("");
    try {
      const ref   = `GML-${Date.now()}`;
      const txRef = `${ref}-DEP`;
      const addons = [
        form.airportTransfer && "Airport Transfer",
        form.earlyCheckIn    && "Early Check-in",
        form.lateCheckOut    && "Late Check-out",
        form.romanticSetup   && "Romantic Setup",
        form.extraBed        && "Extra Bed",
      ].filter(Boolean);

      console.log("🔥 Saving booking to Firestore project:", firebaseConfig.projectId);
      const docRef = await withTimeout(
        addDoc(collection(db, "bookings"), {
          bookingRef:      ref,
          txRef,
          firstName:       form.firstName.trim(),
          lastName:        form.lastName.trim(),
          fullName:        `${form.firstName.trim()} ${form.lastName.trim()}`,
          email:           form.email.trim().toLowerCase(),
          phone:           form.phone.trim(),
          country:         form.country.trim() || null,
          checkIn:         form.checkIn,
          checkOut:        form.checkOut,
          nights,
          guests:          Number(form.guests),
          roomType:        form.roomType,
          pricePerNight,
          totalAmount,
          depositAmount,
          balanceAmount,
          occasion:        form.occasion || null,
          dietary:         form.dietary,
          addons,
          specialRequests: form.specialRequests.trim() || null,
          status:          "awaiting_payment",
          paymentStatus:   "pending",
          source:          "website",
          createdAt:       serverTimestamp(),
        }),
        10000
      );
      console.log("✅ Booking saved! Doc ID:", docRef.id);

      setSavedBookingRef(ref);
      setSavedTxRef(txRef);
      setFirestoreId(docRef.id);
      setBookingStep(4);
    } catch (e: any) {
      console.error("❌ Firestore write failed:", e);
      const msg = e?.message || "";
      let userMsg = "Could not save your booking. Please try again.";
      if (msg.includes("TIMEOUT")) {
        userMsg = "Connection timed out. Check your Firestore security rules are in Test Mode, then try again.";
      } else if (msg.includes("permission-denied") || msg.includes("PERMISSION_DENIED")) {
        userMsg = "Permission denied by Firestore. Go to Firebase Console → Firestore → Rules and set to Test Mode.";
      } else if (msg.includes("not-found") || msg.includes("NOT_FOUND")) {
        userMsg = "Firestore database not found. Make sure you created a database at Firebase Console → Firestore Database.";
      } else if (msg.includes("unavailable") || msg.includes("UNAVAILABLE")) {
        userMsg = "Firestore is unreachable. Check your internet connection.";
      } else if (msg.includes("invalid-argument") || msg.includes("INVALID_ARGUMENT")) {
        userMsg = "Invalid data sent to Firestore. Check browser console for details.";
      }
      setBookingError(userMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    const loadPayChangu = () => {
      if (document.querySelector('script[src="https://in.paychangu.com/js/popup.js"]')) return;
      const pc = document.createElement("script");
      pc.src = "https://in.paychangu.com/js/popup.js";
      pc.async = true;
      document.head.appendChild(pc);
    };

    if (typeof (window as any).$ !== "undefined") {
      loadPayChangu();
    } else if (!document.querySelector('script[src*="jquery"]')) {
      const jq = document.createElement("script");
      jq.src = "https://code.jquery.com/jquery-3.7.1.min.js";
      jq.integrity = "sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=";
      jq.crossOrigin = "anonymous";
      jq.onload = loadPayChangu;
      document.head.appendChild(jq);
    } else {
      const existing = document.querySelector('script[src*="jquery"]') as HTMLScriptElement;
      existing.addEventListener("load", loadPayChangu);
    }
  }, []);

  const openPayChangu = () => {
    const pubKey = process.env.NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY || "";
    if (!pubKey) {
      setBookingError("PayChangu public key not set. Add NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY to .env.local");
      return;
    }
    setBookingError("");
    // Clear any stale result
    try { localStorage.removeItem("paychangu_result"); } catch {}
    const p = new URLSearchParams({
      ref:      savedBookingRef,
      fid:      firestoreId,
      room:     form.roomType,
      checkin:  form.checkIn,
      checkout: form.checkOut,
      nights:   String(nights),
      total:    String(totalAmount),
      deposit:  String(depositAmount),
      balance:  String(balanceAmount),
      fname:    form.firstName.trim(),
      lname:    form.lastName.trim(),
      email:    form.email.trim(),
      phone:    form.phone.trim(),
      pk:       pubKey,
    });
    // Open pay.html in a new tab — avoids cross-origin iframe navigation block
    window.open(`/pay.html?${p.toString()}`, "_blank", "noopener");
    setPayUrl("waiting"); // show waiting UI in modal
  };

  const markPaymentDone = async (fid?: string) => {
    const id = fid || firestoreId;
    if (id) {
      try {
        await updateDoc(doc(db, "bookings", id), {
          status: "confirmed", paymentStatus: "deposit_paid", paidAt: serverTimestamp(),
        });
      } catch (e) { console.error(e); }
    }
    setBookingStep(5);
  };

  // Listen for payment success via BroadcastChannel (same-origin new tab)
  useEffect(() => {
    const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("paychangu_result") : null;
    if (bc) {
      bc.onmessage = async (e) => {
        if (e.data?.type === "PAYCHANGU_SUCCESS") {
          setPayUrl("");
          await markPaymentDone(e.data.firestoreId || undefined);
        }
      };
    }
    // Fallback: poll localStorage for payment result
    const poll = setInterval(() => {
      try {
        const raw = localStorage.getItem("paychangu_result");
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data?.type === "PAYCHANGU_SUCCESS") {
          localStorage.removeItem("paychangu_result");
          setPayUrl("");
          markPaymentDone(data.firestoreId || undefined);
        }
      } catch {}
    }, 800);
    return () => {
      bc?.close();
      clearInterval(poll);
    };
  }, [firestoreId]); // eslint-disable-line

  useEffect(() => {
    const saved = localStorage.getItem("gmalina-theme");
    if (saved) setIsDark(saved === "dark");
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem("gmalina-theme", next ? "dark" : "light");
      return next;
    });
  };

  // Load published posts and testimonials from Firestore
  useEffect(() => {
    const loadContent = async () => {
      try {
        const [postSnap, testimonialSnap] = await Promise.all([
          getDocs(collection(db, "posts")),
          getDocs(collection(db, "testimonials")),
        ]);
        const posts = postSnap.docs
          .map(d => ({ ...d.data() } as typeof BLOGS[0]))
          .filter((p: any) => p.published !== false)
          .sort((a: any, b: any) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        const tms = testimonialSnap.docs
          .map(d => ({ ...d.data() } as typeof TESTIMONIALS[0]))
          .filter((t: any) => t.published !== false)
          .sort((a: any, b: any) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        if (posts.length > 0) setLivePosts(posts);
        if (tms.length > 0) setLiveTestimonials(tms);
      } catch (e) {
        // Silently fall back to hardcoded data if Firestore unavailable
      } finally {
        setContentLoaded(true);
      }
    };
    loadContent();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      if (window.scrollY > 100) setMenuOpen(false);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 700);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const BLOG_DATA = livePosts.length > 0 ? livePosts : BLOGS;
  const TESTIMONIAL_DATA = liveTestimonials.length > 0 ? liveTestimonials : TESTIMONIALS;

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIAL_DATA.length), 4000);
    return () => clearInterval(t);
  }, []);

  // ── Theme tokens ──
  const t = {
    bg:          isDark ? "#08090a"              : "#f8f5f0",
    bgAlt:       isDark ? "rgba(255,255,255,0.015)" : "#ede8e0",
    bgCard:      isDark ? "rgba(255,255,255,0.03)"  : "#ffffff",
    bgCardHov:   isDark ? "rgba(201,169,110,0.07)"  : "rgba(201,169,110,0.15)",
    border:      isDark ? "rgba(255,255,255,0.07)"  : "rgba(0,0,0,0.1)",
    borderGold:  isDark ? "rgba(201,169,110,0.2)"   : "rgba(201,169,110,0.45)",
    borderTeal:  isDark ? "rgba(20,160,140,0.2)"    : "rgba(20,160,140,0.35)",
    text:        isDark ? "#f4f0ea"              : "#1a1208",
    textMuted:   isDark ? "rgba(244,240,234,0.65)" : "#3d2e1e",
    textFaint:   isDark ? "rgba(244,240,234,0.4)"  : "#7a6552",
    textHero:    isDark ? "rgba(244,240,234,0.65)" : "#3d2e1e",
    navBg:       isDark ? "rgba(8,9,10,0.92)"    : "rgba(248,245,240,0.97)",
    navBorder:   isDark ? "rgba(255,255,255,0.05)": "rgba(0,0,0,0.1)",
    inputBg:     isDark ? "rgba(255,255,255,0.04)": "#ffffff",
    inputBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)",
    statsBg:     isDark ? "rgba(201,169,110,0.06)": "rgba(201,169,110,0.1)",
    statsText:   isDark ? "rgba(244,240,234,0.5)" : "#5a4030",
    sectionBorder: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.07)",
    meshBg:      isDark
      ? "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(201,169,110,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 90%, rgba(20,160,140,0.1) 0%, transparent 60%)"
      : "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(201,169,110,0.2) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 90%, rgba(20,160,140,0.14) 0%, transparent 60%)",
    mobileMenuBg: isDark ? "rgba(8,9,10,0.97)"  : "rgba(248,245,240,0.99)",
    faqBg:       isDark ? "rgba(255,255,255,0.03)": "#ffffff",
    faqHov:      isDark ? "rgba(201,169,110,0.05)": "rgba(201,169,110,0.08)",
    faqOpen:     isDark ? "rgba(201,169,110,0.07)": "rgba(201,169,110,0.1)",
    badgeBg:     isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.75)",
    badgeBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    badgeText:   isDark ? "rgba(244,240,234,0.45)" : "#5a4030",
    scrollTrack: isDark ? "#08090a"              : "#f8f5f0",
    gridLine:    isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.04)",
    footerBg:    isDark ? "#06070a"              : "#e8e2d9",
    ctaBg:       isDark ? "linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(20,160,140,0.1) 100%)" : "linear-gradient(135deg, rgba(201,169,110,0.18) 0%, rgba(20,160,140,0.12) 100%)",
    ctaBorder:   isDark ? "rgba(201,169,110,0.2)" : "rgba(201,169,110,0.35)",
    attractionBg: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
    testimonialBg: isDark ? "rgba(201,169,110,0.05)" : "rgba(201,169,110,0.08)",
  };

  return (
    <div style={{ fontFamily: "'Georgia', 'Palatino Linotype', serif", background: t.bg, color: t.text, overflowX: "hidden", transition: "background 0.4s ease, color 0.4s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; transition: background 0.4s ease; }
        h1, h2, h3, h4 { font-family: 'Playfair Display', Georgia, serif; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${t.scrollTrack}; }
        ::-webkit-scrollbar-thumb { background: #c9a96e; border-radius: 2px; }

        .gold-text {
          background: linear-gradient(135deg, #c9a96e 0%, #e8d5a3 50%, #c9a96e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-link {
          color: ${isDark ? "rgba(244,240,234,0.7)" : "rgba(26,18,8,0.7)"};
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.05em;
          transition: color 0.3s;
          position: relative;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px; left: 0; right: 0;
          height: 1px;
          background: #c9a96e;
          transform: scaleX(0);
          transition: transform 0.3s;
        }
        .nav-link:hover { color: #c9a96e; }
        .nav-link:hover::after { transform: scaleX(1); }

        .btn-primary {
          background: linear-gradient(135deg, #c9a96e, #e8d5a3);
          color: #08090a;
          border: none;
          padding: 14px 32px;
          border-radius: 50px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 0.02em;
          text-decoration: none;
          display: inline-block;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(201,169,110,0.4);
        }

        .btn-outline {
          background: transparent;
          color: ${t.text};
          border: 1px solid ${isDark ? "rgba(244,240,234,0.3)" : "rgba(26,18,8,0.25)"};
          padding: 13px 32px;
          border-radius: 50px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
          display: inline-block;
        }
        .btn-outline:hover {
          border-color: #c9a96e;
          color: #c9a96e;
          transform: translateY(-2px);
        }

        .facility-card {
          background: ${t.bgCard};
          border: 1px solid ${t.border};
          border-radius: 20px;
          padding: 32px;
          transition: all 0.4s;
          cursor: default;
        }
        .facility-card:hover {
          background: ${t.bgCardHov};
          border-color: ${t.borderGold};
          transform: translateY(-6px);
          box-shadow: ${isDark ? "0 24px 60px rgba(0,0,0,0.4)" : "0 24px 60px rgba(0,0,0,0.12)"};
        }

        .guest-card {
          background: ${t.bgCard};
          border: 1px solid ${t.border};
          border-radius: 20px;
          padding: 32px;
          transition: all 0.4s;
        }
        .guest-card:hover {
          background: ${isDark ? "rgba(20,160,140,0.07)" : "rgba(20,160,140,0.08)"};
          border-color: ${t.borderTeal};
          transform: translateY(-4px);
        }

        .stat-item {
          text-align: center;
          padding: 32px 24px;
          border-right: 1px solid ${t.border};
        }
        .stat-item:last-child { border-right: none; }

        .testimonial-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"};
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }
        .testimonial-dot.active { background: #c9a96e; transform: scale(1.3); }

        .divider-line {
          width: 60px; height: 2px;
          background: linear-gradient(90deg, #c9a96e, transparent);
          margin: 16px 0 24px 0;
        }

        .tag-pill {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 4px 12px; border-radius: 100px;
          background: rgba(20,160,140,0.15); color: #14a08c;
          border: 1px solid rgba(20,160,140,0.25);
          display: inline-block; margin-bottom: 16px;
        }

        .hero-orb-1 {
          position: absolute; width: 700px; height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%);
          top: -200px; left: -200px;
          pointer-events: none; animation: float 8s ease-in-out infinite;
        }
        .hero-orb-2 {
          position: absolute; width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(20,160,140,0.08) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          pointer-events: none; animation: float 10s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.03); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
        .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; }

        /* ── THEME TOGGLE ── */
        .theme-toggle {
          position: relative;
          width: 52px; height: 28px;
          background: ${isDark ? "rgba(201,169,110,0.2)" : "rgba(20,160,140,0.15)"};
          border: 1px solid ${isDark ? "rgba(201,169,110,0.35)" : "rgba(20,160,140,0.3)"};
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.4s ease;
          flex-shrink: 0;
          display: flex; align-items: center;
          padding: 3px;
        }
        .theme-toggle:hover {
          background: ${isDark ? "rgba(201,169,110,0.3)" : "rgba(20,160,140,0.25)"};
        }
        .theme-toggle-thumb {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: ${isDark ? "linear-gradient(135deg, #c9a96e, #e8d5a3)" : "linear-gradient(135deg, #14a08c, #1dd4b8)"};
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), background 0.4s;
          transform: ${isDark ? "translateX(0)" : "translateX(24px)"};
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .contact-input {
          width: 100%;
          background: ${t.inputBg};
          border: 1px solid ${t.inputBorder};
          border-radius: 12px;
          padding: 14px 18px;
          color: ${t.text};
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.3s, background 0.4s, color 0.4s;
          resize: none;
        }
        .contact-input:focus { border-color: #c9a96e; }
        .contact-input::placeholder { color: ${t.textFaint}; }

        .footer-link {
          color: ${t.textFaint};
          text-decoration: none;
          font-size: 14px;
          transition: color 0.3s;
        }
        .footer-link:hover { color: #c9a96e; }
        /* Gallery */
        .gallery-filter-btn {
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          padding: 8px 20px; border-radius: 100px;
          border: 1px solid ${t.border};
          background: transparent; color: ${t.textMuted};
          cursor: pointer; transition: all 0.3s; letter-spacing: 0.03em;
        }
        .gallery-filter-btn:hover { border-color: rgba(201,169,110,0.4); color: #c9a96e; }
        .gallery-filter-btn.active {
          background: linear-gradient(135deg, #c9a96e, #e8d5a3);
          color: #08090a; border-color: transparent; font-weight: 600;
        }

        .gallery-item {
          border-radius: 20px; overflow: hidden; cursor: pointer; position: relative;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          border: 1px solid ${t.border};
        }
        .gallery-item:hover { transform: scale(1.02); box-shadow: 0 24px 60px rgba(0,0,0,0.5); }
        .gallery-item:hover .gallery-overlay { opacity: 1; }
        .gallery-item:hover .gallery-icon { transform: scale(1.1); }
        .gallery-overlay {
          position: absolute; inset: 0;
          background: rgba(8,9,10,0.55); backdrop-filter: blur(4px);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.35s; gap: 8px;
        }
        .gallery-icon { transition: transform 0.4s; font-size: 52px; }

        .lightbox-backdrop {
          position: fixed; inset: 0; z-index: 9000;
          background: rgba(0,0,0,0.92); backdrop-filter: blur(20px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.25s ease;
        }

        /* FAQ */
        .faq-item {
          border: 1px solid ${t.border}; border-radius: 16px;
          overflow: hidden; transition: border-color 0.3s; margin-bottom: 12px;
        }
        .faq-item.open { border-color: ${t.borderGold}; }
        .faq-question {
          width: 100%; background: ${t.faqBg}; border: none; color: ${t.text};
          font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 500;
          text-align: left; padding: 22px 28px; cursor: pointer;
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px; transition: background 0.3s;
        }
        .faq-question:hover { background: ${t.faqHov}; }
        .faq-item.open .faq-question { background: ${t.faqOpen}; }
        .faq-chevron {
          width: 28px; height: 28px; border-radius: 50%;
          background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"};
          border: 1px solid ${t.border};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: transform 0.35s, background 0.3s;
          font-size: 13px; color: #c9a96e;
        }
        .faq-item.open .faq-chevron { transform: rotate(180deg); background: rgba(201,169,110,0.15); }
        .faq-answer {
          font-family: 'DM Sans', sans-serif; font-size: 15px;
          color: ${t.textMuted}; line-height: 1.8; padding: 0 28px;
          max-height: 0; overflow: hidden;
          transition: max-height 0.4s ease, padding 0.4s ease;
        }
        .faq-item.open .faq-answer { max-height: 240px; padding: 4px 28px 24px; }

        /* Blog */
        .blog-card {
          background: ${t.bgCard}; border: 1px solid ${t.border};
          border-radius: 24px; overflow: hidden; transition: all 0.4s;
          cursor: pointer; display: flex; flex-direction: column;
        }
        .blog-card:hover {
          border-color: ${t.borderGold}; transform: translateY(-6px);
          box-shadow: ${isDark ? "0 24px 60px rgba(0,0,0,0.4)" : "0 24px 60px rgba(0,0,0,0.1)"};
        }
        .blog-card:hover .blog-read-more { color: #c9a96e; gap: 10px; }
        .blog-read-more {
          display: flex; align-items: center; gap: 6px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          color: ${t.textFaint}; transition: all 0.3s; margin-top: auto;
        }
        .blog-tag-btn {
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
          padding: 6px 16px; border-radius: 100px;
          border: 1px solid ${t.border}; background: transparent;
          color: ${t.textMuted}; cursor: pointer; transition: all 0.3s; letter-spacing: 0.04em;
        }
        .blog-tag-btn:hover { border-color: rgba(201,169,110,0.35); color: #c9a96e; }
        .blog-tag-btn.active { background: rgba(201,169,110,0.12); border-color: rgba(201,169,110,0.3); color: #c9a96e; }

        .section-label {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: #c9a96e;
          margin-bottom: 12px; display: block;
        }

        .noise-overlay {
          position: fixed; inset: 0; pointer-events: none; z-index: 9999;
          opacity: ${isDark ? "0.025" : "0.015"};
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        /* ── HAMBURGER ── */
        .hamburger {
          display: none; flex-direction: column; justify-content: center; align-items: center;
          width: 44px; height: 44px;
          background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"};
          border: 1px solid ${t.border};
          border-radius: 12px; cursor: pointer; gap: 5px; transition: background 0.3s; flex-shrink: 0;
        }
        .hamburger:hover { background: rgba(201,169,110,0.12); border-color: rgba(201,169,110,0.3); }
        .hamburger span {
          display: block; width: 20px; height: 2px;
          background: ${t.text};
          border-radius: 2px; transition: all 0.35s ease; transform-origin: center;
        }
        .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        .mobile-menu {
          position: fixed; top: 72px; left: 0; right: 0;
          background: ${t.mobileMenuBg}; backdrop-filter: blur(24px);
          border-bottom: 1px solid ${t.border}; z-index: 999;
          padding: 0; max-height: 0; overflow: hidden;
          transition: max-height 0.45s cubic-bezier(0.4,0,0.2,1), padding 0.45s ease;
        }
        .mobile-menu.open { max-height: 520px; padding: 16px 0 24px; }
        .mobile-menu a {
          display: block; padding: 14px 28px;
          color: ${t.textMuted}; text-decoration: none;
          font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 500;
          border-bottom: 1px solid ${t.border};
          transition: color 0.25s, background 0.25s;
        }
        .mobile-menu a:hover { color: #c9a96e; background: rgba(201,169,110,0.05); }
        .mobile-menu .mobile-book-btn { margin: 16px 28px 0; display: block; text-align: center; }

        /* ── PAY OVERLAY ── */
        .pay-overlay {
          position: fixed; inset: 0; z-index: 20000;
          background: rgba(0,0,0,0.88); backdrop-filter: blur(16px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        .pay-overlay-inner {
          position: relative;
          width: 95vw; max-width: 500px;
          height: 90vh;
          border-radius: 24px; overflow: hidden;
          box-shadow: 0 48px 120px rgba(0,0,0,0.7);
          border: 1px solid rgba(201,169,110,0.2);
        }
        .pay-overlay-close {
          position: absolute; top: 12px; right: 12px; z-index: 10;
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15);
          color: #fff; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .pay-overlay-close:hover { background: rgba(201,169,110,0.3); }

        /* ── PAYCHANGU WRAPPER ── */
        #wrapper {
          position: fixed !important;
          inset: 0 !important;
          z-index: 999999 !important;
          display: none;
          align-items: center !important;
          justify-content: center !important;
          background: rgba(0,0,0,0.82) !important;
          backdrop-filter: blur(10px) !important;
        }
        #wrapper.show,
        #wrapper[style*="display: block"],
        #wrapper[style*="display:block"],
        #wrapper[style*="display: flex"],
        #wrapper[style*="display:flex"] {
          display: flex !important;
          z-index: 999999 !important;
        }
        #wrapper iframe,
        #wrapper > div {
          position: relative !important;
          z-index: 1000000 !important;
          max-width: 520px !important;
          width: 95vw !important;
          height: 90vh !important;
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6) !important;
        }
        /* ── BOOKING MODAL ── */
        * { box-sizing: border-box; }
        .booking-backdrop {
          position: fixed; inset: 0; z-index: 10000;
          background: rgba(0,0,0,0.8); backdrop-filter: blur(12px);
          display: flex; align-items: flex-end; justify-content: center;
          overflow: hidden; animation: fadeIn 0.2s ease;
        }
        @media (min-width: 600px) {
          .booking-backdrop { align-items: center; padding: 16px; overflow-y: auto; }
        }
        .booking-modal {
          width: 100%; max-width: 100%;
          background: ${isDark ? "#0d0e10" : "#fff"};
          border: 1px solid ${t.borderGold};
          border-radius: 18px 18px 0 0;
          max-height: 93dvh; max-height: 93vh;
          display: flex; flex-direction: column;
          overflow: hidden;
          box-shadow: 0 -8px 40px rgba(0,0,0,0.4);
          animation: bkSlideUp 0.28s cubic-bezier(0.32,0.72,0,1);
        }
        @media (min-width: 600px) {
          .booking-modal {
            max-width: 660px; border-radius: 20px;
            max-height: 90dvh; max-height: 90vh;
            box-shadow: 0 32px 80px rgba(0,0,0,0.55);
            animation: bkFadeUp 0.28s cubic-bezier(0.34,1.2,0.64,1);
          }
        }
        @keyframes bkSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes bkFadeUp  { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }

        .bk-handle { width:32px; height:3px; border-radius:2px; background:${t.border}; margin:8px auto 0; flex-shrink:0; }
        @media (min-width:600px) { .bk-handle { display:none; } }

        .bk-header {
          padding: 10px 14px 10px;
          border-bottom: 1px solid ${t.border};
          flex-shrink: 0;
        }
        @media (min-width:600px) { .bk-header { padding: 18px 24px 14px; } }

        .bk-steps {
          display: flex; align-items: center;
          margin-top: 10px; gap: 0; width: 100%;
          overflow: hidden;
        }
        .bk-step { display:flex; align-items:center; flex:1; min-width:0; }
        .bk-step:last-child { flex:0 0 auto; }
        .bk-step-dot {
          width:20px; height:20px; border-radius:50%; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          font-size:9px; font-weight:800; border:1.5px solid ${t.border};
          background:${isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"};
          color:${t.textFaint};
        }
        .bk-step-dot.done { background:linear-gradient(135deg,#c9a96e,#e8d5a3); border-color:#c9a96e; color:#08090a; }
        .bk-step-dot.active { background:rgba(201,169,110,0.15); border-color:#c9a96e; color:#c9a96e; }
        .bk-step-name {
          font-size:9px; font-weight:600; letter-spacing:.05em; text-transform:uppercase;
          color:${t.textFaint}; margin-left:4px; white-space:nowrap;
          display:none;
        }
        .bk-step-name.active { color:#c9a96e; display:block; }
        @media (min-width:400px) { .bk-step-name { display:block; } }
        .bk-step-line { flex:1; height:1px; background:${t.border}; margin:0 4px; }
        .bk-step-line.done { background:rgba(201,169,110,0.4); }

        .bk-body {
          flex:1; overflow-y:auto; overflow-x:hidden;
          padding: 14px 14px 6px;
          -webkit-overflow-scrolling: touch;
        }
        @media (min-width:600px) { .bk-body { padding: 20px 24px 8px; } }
        .bk-body::-webkit-scrollbar { width:3px; }
        .bk-body::-webkit-scrollbar-thumb { background:rgba(201,169,110,0.25); border-radius:2px; }

        .bk-footer {
          flex-shrink:0; padding:12px 16px 16px;
          border-top:1px solid ${t.border};
          display:flex; flex-direction:column; gap:8px;
        }
        @media (min-width:600px) {
          .bk-footer { padding:14px 24px 20px; flex-direction:row; align-items:center; gap:10px; }
        }
        /* mobile: everything full width */
        .bk-footer .bk-btn-main  { width:100%; justify-content:center; }
        .bk-footer .bk-btn-back  { width:100%; justify-content:center; }
        /* desktop: back is compact, main grows */
        @media (min-width:600px) {
          .bk-footer .bk-btn-main { flex:1; width:auto; }
          .bk-footer .bk-btn-back { flex:0 0 auto; width:auto; }
        }

        .booking-close {
          width:28px; height:28px; border-radius:50%; flex-shrink:0;
          background:${t.bgCard}; border:1px solid ${t.border};
          color:${t.textMuted}; cursor:pointer; font-size:16px;
          display:flex; align-items:center; justify-content:center; transition:all .2s;
        }
        .booking-close:hover { border-color:#c9a96e; color:#c9a96e; }

        .bk-label { font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:${t.textFaint}; margin-bottom:4px; display:block; }
        .bk-field { display:flex; flex-direction:column; gap:3px; }
        .bk-input {
          width:100%; background:${t.inputBg};
          border:1.5px solid ${t.inputBorder}; border-radius:10px;
          padding:11px 12px; color:${t.text};
          font-family:'DM Sans',sans-serif; font-size:16px;
          outline:none; transition:border-color .2s;
          appearance:none; -webkit-appearance:none;
        }
        .bk-input:focus { border-color:#c9a96e; box-shadow:0 0 0 3px rgba(201,169,110,0.1); }
        .bk-input::placeholder { color:${t.textFaint}; }
        .bk-input option { background:${isDark?"#0d0e10":"#fff"}; color:${t.text}; }
        .bk-g2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        @media (max-width:340px) { .bk-g2 { grid-template-columns:1fr; } }
        .bk-g3 { display:grid; grid-template-columns:1fr; gap:8px; }
        @media (min-width:480px) { .bk-g3 { grid-template-columns:repeat(3,1fr); } }
        .bk-sep { height:1px; background:${t.border}; margin:10px 0; }
        .bk-section-title { font-size:11px; font-weight:600; letter-spacing:.05em; color:${t.textMuted}; margin-bottom:8px; display:flex; align-items:center; gap:5px; }
        .bk-error { background:rgba(220,60,60,0.08); border:1px solid rgba(220,60,60,0.25); border-radius:8px; padding:9px 12px; color:#e05555; font-size:12px; display:flex; align-items:flex-start; gap:6px; margin-top:10px; word-break:break-word; }
        .bk-room-card { border:2px solid ${t.border}; border-radius:12px; padding:12px; cursor:pointer; transition:all .2s; background:${isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)"}; position:relative; overflow:hidden; }
        .bk-room-card:hover { border-color:rgba(201,169,110,0.4); }
        .bk-room-card.sel { border-color:#c9a96e; background:rgba(201,169,110,0.07); }
        .bk-room-card.sel::after { content:"✓"; position:absolute; top:7px; right:7px; width:16px; height:16px; border-radius:50%; background:linear-gradient(135deg,#c9a96e,#e8d5a3); color:#08090a; font-size:8px; font-weight:800; display:flex; align-items:center; justify-content:center; }
        .bk-toggle { display:flex; align-items:center; gap:9px; padding:9px 11px; border-radius:10px; border:1.5px solid ${t.border}; background:${isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)"}; cursor:pointer; transition:all .2s; user-select:none; width:100%; }
        .bk-toggle:hover { border-color:rgba(201,169,110,0.3); }
        .bk-toggle.on { border-color:rgba(20,160,140,0.35); background:rgba(20,160,140,0.05); }
        .bk-pill { width:32px; height:18px; border-radius:9px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); position:relative; transition:all .25s; flex-shrink:0; }
        .bk-pill::after { content:''; position:absolute; width:11px; height:11px; border-radius:50%; background:rgba(244,240,234,0.3); top:3px; left:3px; transition:transform .25s,background .25s; }
        .bk-toggle.on .bk-pill { background:rgba(20,160,140,0.3); border-color:rgba(20,160,140,0.4); }
        .bk-toggle.on .bk-pill::after { transform:translateX(14px); background:#14a08c; }
        .bk-chip { padding:5px 10px; border-radius:100px; border:1.5px solid ${t.border}; background:transparent; font-size:12px; font-weight:500; cursor:pointer; transition:all .2s; color:${t.textMuted}; }
        .bk-chip:hover { border-color:rgba(201,169,110,0.3); color:#c9a96e; }
        .bk-chip.sel { background:rgba(201,169,110,0.1); border-color:#c9a96e; color:#c9a96e; font-weight:600; }
        .bk-price-row { display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid ${isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"}; gap:8px; }
        .bk-price-row:last-child { border-bottom:none; }
        .bk-price-row > span:last-child { text-align:right; }
        .btn-pay {
          background: linear-gradient(135deg, #0e7b6a 0%, #14a08c 50%, #1dc9ae 100%);
          color: #fff; border: none;
          padding: 14px 24px;
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all .25s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 20px rgba(20,160,140,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          letter-spacing: 0.01em;
          position: relative; overflow: hidden;
        }
        .btn-pay::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 60%);
          pointer-events:none;
        }
        .btn-pay:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(20,160,140,0.45), inset 0 1px 0 rgba(255,255,255,0.2); }
        .btn-pay:active { transform:translateY(0); }
        .btn-pay:disabled { opacity:.55; cursor:not-allowed; transform:none; box-shadow:none; }
        .btn-pay-lock { font-size:15px; }

        /* Compact "← Back" style for inside modal footer */
        .btn-back {
          background: transparent;
          color: ${t.textMuted};
          border: 1.5px solid ${t.border};
          padding: 13px 20px;
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all .2s;
          display: flex; align-items: center; gap: 6px;
          white-space: nowrap;
        }
        .btn-back:hover { border-color: rgba(201,169,110,0.5); color: #c9a96e; }

        .mobile-theme-toggle { display: none !important; }
        .mobile-book-btn-nav { display: none !important; }

        @media (max-width: 900px) {
          .grid-4 { grid-template-columns: 1fr 1fr; }
          .grid-3 { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .mobile-theme-toggle { display: flex !important; }
          .mobile-book-btn-nav { display: inline-block !important; }
          .hamburger { display: flex !important; }
          .desktop-nav { display: none !important; }
          .hero-badges { display: none !important; }
          .hero-scroll-indicator { display: none !important; }
          .section-pad { padding: 72px 20px !important; }
          .section-pad-top { padding-top: 72px !important; }
          .about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .about-visual { display: none !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .stat-item { border-right: none !important; border-bottom: 1px solid ${t.border} !important; padding: 20px 16px !important; }
          .stat-item:nth-child(odd) { border-right: 1px solid ${t.border} !important; }
          .stat-item:last-child { border-bottom: none !important; }
          .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr !important; }
          .faq-layout { grid-template-columns: 1fr !important; gap: 40px !important; }
          .faq-sticky { position: static !important; }
          .blog-featured { grid-template-columns: 1fr !important; }
          .blog-featured-img { height: 200px !important; border-right: none !important; border-bottom: 1px solid rgba(201,169,110,0.12) !important; }
          .contact-layout { grid-template-columns: 1fr !important; gap: 40px !important; }
          .contact-form-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .footer-brand { grid-column: 1 / -1 !important; }
          .gallery-header { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
          .gallery-filters { overflow-x: auto; padding-bottom: 8px; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; }
          .gallery-filters::-webkit-scrollbar { height: 2px; }
          .cta-pad { padding: 48px 28px !important; }
          .blog-header { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
          .blog-tags { overflow-x: auto; flex-wrap: nowrap !important; padding-bottom: 6px; -webkit-overflow-scrolling: touch; }
          .hero-inline-stats { gap: 24px !important; }
          .faq-question { font-size: 14px !important; padding: 18px 20px !important; }
          .faq-answer { padding: 0 20px !important; }
          .faq-item.open .faq-answer { padding: 4px 20px 20px !important; }
        }
        @media (max-width: 600px) {
          .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
          .hero-buttons { flex-direction: column !important; align-items: stretch !important; }
          .hero-buttons a { text-align: center !important; }
          .btn-primary, .btn-outline { width: 100%; text-align: center; }
          .cta-buttons { flex-direction: column !important; align-items: stretch !important; }
          .cta-buttons a { text-align: center !important; width: 100% !important; }
        }
      `}</style>

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        padding: "0 20px",
        height: 72,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? t.navBg : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${t.navBorder}` : "1px solid transparent",
        transition: "all 0.4s ease"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/images/logo.jpg"
            alt="Gmalina Court Lodge"
            style={{ width: 38, height: 38, borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
          />
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, lineHeight: 1.1, color: t.text }}>
              Gmalina Court
            </div>
            <div style={{ fontSize: 10, color: t.textFaint, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
              Liwonde · Malawi
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="desktop-nav" style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {NAV_LINKS.map(link => (
            <a key={link} href={`#${link.toLowerCase()}`} className="nav-link">{link}</a>
          ))}
          {/* Theme toggle */}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            <div className="theme-toggle-thumb">{isDark ? "🌙" : "☀️"}</div>
          </button>
          <a href="/admin" className="btn-outline" style={{ padding: "9px 22px", fontSize: 13, display:"inline-flex", alignItems:"center", gap:7, borderRadius:50 }}><span style={{fontSize:12}}>🔐</span> Admin</a>
        </div>

        {/* Mobile right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="theme-toggle mobile-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <div className="theme-toggle-thumb">{isDark ? "🌙" : "☀️"}</div>
          </button>
          <a href="/admin" className="btn-outline mobile-book-btn-nav" style={{ padding: "8px 16px", fontSize: 12, display:"inline-flex", alignItems:"center", gap:5, borderRadius:50 }}><span>🔐</span> Admin</a>
          <button
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {NAV_LINKS.map(link => (
          <a key={link} href={`#${link.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{link}</a>
        ))}
        <a href="/admin" style={{ display:"block", padding:"14px 28px", color:"rgba(201,169,110,0.9)", textDecoration:"none", fontFamily:"'DM Sans', sans-serif", fontSize:16, fontWeight:500, borderBottom:`1px solid ${t.border}`, background:"transparent" }}>🔐 Admin Portal</a>
        <button className="btn-primary mobile-book-btn" onClick={() => { setMenuOpen(false); openBooking(); }}>
          Reserve Your Stay →
        </button>
      </div>

      {/* ─── HERO ─── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: 72, background: t.bg, backgroundImage: t.meshBg }}>
        {/* Hero background image */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `url(${IMGS.heroPool})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: isDark ? 0.18 : 0.1,
          transition: "opacity 0.4s"
        }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 0, background: isDark ? "linear-gradient(to right, rgba(8,9,10,0.97) 45%, rgba(8,9,10,0.5) 100%)" : "linear-gradient(to right, rgba(248,245,240,0.97) 45%, rgba(248,245,240,0.6) 100%)" }} />
        <div className="hero-orb-1" />
        <div className="hero-orb-2" />

        {/* Subtle grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(${t.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${t.gridLine} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          pointerEvents: "none"
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px", width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <div style={{
                background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.25)",
                borderRadius: 100, padding: "6px 16px",
                display: "inline-flex", alignItems: "center", gap: 8
              }}>
                <span style={{ fontSize: 11, color: "#c9a96e", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  ⭐ Tripadvisor Travelers' Choice 4.7/5
                </span>
              </div>
            </div>

            <h1 style={{ fontSize: "clamp(44px, 7vw, 88px)", lineHeight: 1.05, fontWeight: 900, marginBottom: 28, letterSpacing: "-0.02em" }}>
              Where Luxury<br />
              <span className="gold-text">Meets the Wild</span><br />
              Heart of Malawi
            </h1>

            <p style={{ fontSize: 18, color: t.textHero, lineHeight: 1.8, maxWidth: 560, marginBottom: 48, fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
              Premier lodge on M5 Road, Liwonde — where world-class hospitality, 
              safari adventures, and refined comfort converge at the gateway to 
              Liwonde National Park.
            </p>

            <div className="hero-buttons" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 64 }}>
              <button className="btn-primary" onClick={openBooking}>Reserve Your Stay</button>
              <a href="#about" className="btn-outline">Discover More</a>
            </div>

            {/* Inline stats */}
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
              {[
                { n: "500+", l: "Guests Hosted" },
                { n: "6", l: "Facilities" },
                { n: "24/7", l: "Concierge" },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#c9a96e" }}>{s.n}</div>
                  <div style={{ fontSize: 13, color: t.statsText, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badges */}
          <div className="hero-badges" style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "🏆", t: "Award Winning", s: "Tripadvisor Choice" },
              { icon: "🦁", t: "Safari Nearby", s: "5 min to Park" },
              { icon: "📶", t: "High-Speed WiFi", s: "Throughout" },
            ].map((b, i) => (
              <div key={i} style={{
                background: t.badgeBg,
                border: `1px solid ${t.badgeBorder}`,
                borderRadius: 16, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 14,
                backdropFilter: "blur(16px)",
                animation: `float ${6 + i}s ease-in-out ${i * 0.5}s infinite`
              }}>
                <span style={{ fontSize: 24 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: t.text }}>{b.t}</div>
                  <div style={{ fontSize: 11, color: t.badgeText, fontFamily: "'DM Sans', sans-serif" }}>{b.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-indicator" style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.4 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>Scroll</div>
          <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, #c9a96e, transparent)" }} />
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <div style={{ background: t.statsBg, borderTop: `1px solid ${t.borderGold}`, borderBottom: `1px solid ${t.borderGold}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
            {STATS.map((s, i) => (
              <div key={i} className="stat-item">
                <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Playfair Display', serif" }} className="gold-text">{s.value}</div>
                <div style={{ fontSize: 13, color: t.statsText, fontFamily: "'DM Sans', sans-serif", marginTop: 4, letterSpacing: "0.05em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ROOMS SHOWCASE ─── */}
      <section id="rooms" style={{ padding: "120px 32px", background: t.bgAlt, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }} className="section-pad">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <AnimSection>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span className="section-label">Our Rooms & Suites</span>
              <div className="divider-line" style={{ margin: "16px auto 24px" }} />
              <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Spaces Designed for<br /><span className="gold-text">Perfect Rest</span>
              </h2>
            </div>
          </AnimSection>

          {/* Featured large room */}
          <AnimSection>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
              borderRadius: 28, overflow: "hidden",
              border: `1px solid ${t.borderGold}`,
              marginBottom: 24,
              boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.4)" : "0 24px 60px rgba(0,0,0,0.1)"
            }} className="blog-featured">
              <div style={{ height: 480, overflow: "hidden", position: "relative" }} className="blog-featured-img">
                <img src={IMGS.room1} alt="Deluxe Suite" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.2), transparent)" }} />
              </div>
              <div style={{
                background: t.bgCard, padding: "48px 52px",
                display: "flex", flexDirection: "column", justifyContent: "center"
              }}>
                <span className="tag-pill">Featured Suite</span>
                <h3 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 20, letterSpacing: "-0.02em", color: t.text }}>
                  The Liwonde<br /><span className="gold-text">Deluxe Suite</span>
                </h3>
                <p style={{ color: t.textMuted, lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif", fontSize: 16, marginBottom: 32 }}>
                  Our signature suite features a king-size bed with premium Egyptian cotton, a private balcony overlooking the gardens, rain shower, smart TV, and personalised butler service.
                </p>
                <div style={{ display: "flex", gap: 20, marginBottom: 36, flexWrap: "wrap" }}>
                  {["King Bed", "En-suite Bath", "Garden View", "Free WiFi"].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ color: "#c9a96e", fontSize: 13 }}>✦</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: t.textMuted }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-primary" style={{ alignSelf: "flex-start" }} onClick={openBooking}>Book This Suite →</button>
              </div>
            </div>
          </AnimSection>

          {/* Two smaller room cards */}
          <div className="grid-2">
            {[
              { img: IMGS.room2, title: "Classic Room", tag: "Standard", features: ["Queen Bed", "AC", "Smart TV"], desc: "Elegant comfort with all essentials — ideal for solo and business travellers seeking quality at every touch." },
              { img: IMGS.room3, title: "Family Suite", tag: "Family", features: ["2 Bedrooms", "Kitchenette", "Garden Patio"], desc: "Spacious suite with two bedrooms and a shared living area — the perfect home away from home for families." },
            ].map((r, i) => (
              <AnimSection key={i} delay={i * 0.15}>
                <div style={{
                  borderRadius: 24, overflow: "hidden",
                  border: `1px solid ${t.border}`,
                  background: t.bgCard,
                  transition: "all 0.4s",
                  boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.2)" : "0 8px 32px rgba(0,0,0,0.06)"
                }}>
                  <div style={{ height: 260, overflow: "hidden", position: "relative" }}>
                    <img src={r.img} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4))" }} />
                    <div style={{
                      position: "absolute", top: 14, left: 14,
                      background: "rgba(201,169,110,0.85)", backdropFilter: "blur(8px)",
                      borderRadius: 100, padding: "4px 14px",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "#1a1208", letterSpacing: "0.08em"
                    }}>{r.tag}</div>
                  </div>
                  <div style={{ padding: "28px 32px 32px" }}>
                    <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: t.text }}>{r.title}</h3>
                    <p style={{ color: t.textMuted, fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{r.desc}</p>
                    <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                      {r.features.map(f => (
                        <span key={f} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: t.textFaint, display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ color: "#c9a96e" }}>✦</span> {f}
                        </span>
                      ))}
                    </div>
                    <button onClick={openBooking} style={{ color: "#14a08c", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "none" }}>Reserve Room →</button>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" style={{ padding: "120px 32px", maxWidth: 1200, margin: "0 auto", background: t.bg }} className="section-pad">
        <AnimSection>
          <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <span className="section-label">About Gmalina Court</span>
              <div className="divider-line" />
              <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.15, fontWeight: 800, marginBottom: 24, letterSpacing: "-0.02em" }}>
                The Pinnacle of<br />Malawian Hospitality
              </h2>
              <p style={{ color: t.textMuted, lineHeight: 1.9, marginBottom: 24, fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 300 }}>
                Nestled along M5 Road beside Fcapital Bank in the heart of Liwonde, 
                Gmalina Court stands as Malawi's most distinguished lodge—a seamless 
                fusion of modern luxury and authentic African warmth.
              </p>
              <p style={{ color: t.textMuted, lineHeight: 1.9, marginBottom: 40, fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 300 }}>
                Whether you're here for business, a family safari, or a romantic 
                escape, our meticulously crafted spaces and attentive team ensure 
                every moment exceeds expectation.
              </p>
              <div style={{ display: "flex", gap: 32, marginBottom: 40 }}>
                {[["Business", "✓"], ["Leisure", "✓"], ["Events", "✓"], ["Dining", "✓"]].map(([l, c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#14a08c", fontWeight: 600 }}>{c}</span>
                    <span style={{ fontSize: 14, color: t.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{l}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={openBooking}>Book Now →</button>
            </div>

            {/* Visual collage with real images */}
            <div className="about-visual" style={{ position: "relative", height: 520 }}>
              {/* Main large image */}
              <div style={{
                position: "absolute", top: 0, left: 0,
                width: "70%", height: "65%",
                borderRadius: 24, overflow: "hidden",
                border: `1px solid ${t.borderGold}`,
                boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.5)" : "0 24px 60px rgba(0,0,0,0.12)"
              }}>
                <img src={IMGS.aboutLodge} alt="Gmalina Court Lodge" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))" }} />
              </div>
              {/* Bottom right image */}
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: "58%", height: "52%",
                borderRadius: 24, overflow: "hidden",
                border: `1px solid ${t.borderTeal}`,
                boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.4)" : "0 16px 40px rgba(0,0,0,0.1)"
              }}>
                <img src={IMGS.aboutNature} alt="Malawi nature" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.35))" }} />
              </div>
              {/* Small dining image */}
              <div style={{
                position: "absolute", top: "38%", right: "36%",
                width: "32%", height: "28%",
                borderRadius: 16, overflow: "hidden",
                border: `2px solid ${t.bg}`,
                boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.15)",
                zIndex: 2
              }}>
                <img src={IMGS.aboutDining} alt="Fine dining" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              {/* Badge overlay */}
              <div style={{
                position: "absolute", bottom: "20%", left: "3%",
                background: isDark ? "rgba(8,9,10,0.85)" : "rgba(255,255,255,0.92)",
                border: `1px solid ${t.borderGold}`,
                borderRadius: 16, padding: "14px 18px",
                backdropFilter: "blur(16px)", zIndex: 3,
                boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }} className="gold-text">Est. in Liwonde</div>
                <div style={{ fontSize: 12, color: t.statsText, fontFamily: "'DM Sans', sans-serif" }}>Machinga, Malawi</div>
              </div>
            </div>
          </div>
        </AnimSection>
      </section>

      {/* ─── FACILITIES ─── */}
      <section id="facilities" style={{ padding: "120px 32px", background: t.bgAlt, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }} className="section-pad">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <AnimSection>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <span className="section-label">Premium Facilities</span>
              <div className="divider-line" style={{ margin: "16px auto 24px" }} />
              <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Everything You<br /><span className="gold-text">Could Desire</span>
              </h2>
              <p style={{ color: t.textMuted, marginTop: 20, maxWidth: 480, margin: "20px auto 0", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8 }}>
                Six world-class amenities designed to make your stay unforgettable, from sunrise to sunset.
              </p>
            </div>
          </AnimSection>

          <div className="grid-3">
            {FACILITIES.map((f, i) => (
              <AnimSection key={i} delay={i * 0.08}>
                <div className="facility-card" style={{ padding: 0, overflow: "hidden" }}>
                  {/* Card image */}
                  <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
                    <img src={f.img} alt={f.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45))" }} />
                    <div style={{ position: "absolute", bottom: 14, left: 16, fontSize: 28 }}>{f.icon}</div>
                  </div>
                  {/* Card text */}
                  <div style={{ padding: "24px 28px 28px" }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.01em", color: t.text }}>{f.title}</h3>
                    <p style={{ color: t.textMuted, lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 300 }}>{f.desc}</p>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GUEST TYPES ─── */}
      <section id="guests" style={{ padding: "120px 32px" }} className="section-pad">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <AnimSection>
            <div style={{ marginBottom: 72 }}>
              <span className="section-label">Tailored Experiences</span>
              <div className="divider-line" />
              <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-0.02em", maxWidth: 560 }}>
                Crafted for<br /><span className="gold-text">Every Guest</span>
              </h2>
            </div>
          </AnimSection>

          <div className="grid-4">
            {GUEST_TYPES.map((g, i) => (
              <AnimSection key={i} delay={i * 0.1}>
                <div className="guest-card">
                  <div className="tag-pill">{g.tag}</div>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{g.icon}</div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 12 }}>{g.title}</h3>
                  <p style={{ color: t.textMuted, lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 300, marginBottom: 20 }}>{g.desc}</p>
                  <button onClick={openBooking} style={{ color: "#14a08c", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    Book Now <span style={{ transition: "transform 0.3s" }}>→</span>
                  </button>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ATTRACTIONS ─── */}
      <section id="attractions" style={{ padding: "120px 32px", background: "rgba(20,160,140,0.04)", borderTop: "1px solid rgba(20,160,140,0.1)", borderBottom: "1px solid rgba(20,160,140,0.1)" }} className="section-pad">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <AnimSection>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <span className="section-label">Explore & Discover</span>
              <div className="divider-line" style={{ margin: "16px auto 24px" }} />
              <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Beyond the<br /><span className="gold-text">Lodge Doors</span>
              </h2>
            </div>
          </AnimSection>

          <div className="grid-3">
            {ATTRACTIONS.map((a, i) => (
              <AnimSection key={i} delay={i * 0.12}>
                <div style={{
                  background: t.attractionBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 24, overflow: "hidden",
                  transition: "all 0.4s",
                  position: "relative"
                }}>
                  {/* Attraction image */}
                  <div style={{ height: 220, overflow: "hidden", position: "relative" }}>
                    <img src={a.img} alt={a.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))" }} />
                    {/* Distance badge */}
                    <div style={{
                      position: "absolute", top: 14, right: 14,
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 100, padding: "5px 12px"
                    }}>
                      <span style={{ fontSize: 11, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>📍 {a.dist}</span>
                    </div>
                  </div>
                  <div style={{ padding: "28px 28px 32px" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{a.icon}</div>
                    <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: t.text }}>{a.title}</h3>
                    <p style={{ color: t.textMuted, lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 300 }}>{a.desc}</p>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding: "120px 32px" }} className="section-pad">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <AnimSection>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span className="section-label">Guest Stories</span>
              <div className="divider-line" style={{ margin: "16px auto 24px" }} />
              <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                What Our Guests<br /><span className="gold-text">Are Saying</span>
              </h2>
            </div>
          </AnimSection>

          {/* Featured testimonial */}
          <div style={{ maxWidth: 800, margin: "0 auto 48px", textAlign: "center" }}>
            <div style={{
              background: t.testimonialBg,
              border: `1px solid ${t.borderGold}`,
              borderRadius: 28, padding: "48px",
              transition: "all 0.6s ease",
              position: "relative", color: t.text
            }}>
              <div style={{ fontSize: 64, lineHeight: 0.8, color: "#c9a96e", fontFamily: "'Playfair Display', serif", opacity: 0.4, marginBottom: 32 }}>"</div>
              <p style={{
                fontSize: "clamp(18px, 2.5vw, 24px)",
                lineHeight: 1.7, fontFamily: "'Playfair Display', serif",
                fontStyle: "italic", color: t.text,
                marginBottom: 32, transition: "all 0.5s"
              }}>
                {TESTIMONIAL_DATA[activeTestimonial].quote}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #c9a96e, #e8d5a3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {TESTIMONIAL_DATA[activeTestimonial].author[0]}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, color: t.text }}>{TESTIMONIAL_DATA[activeTestimonial].author}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: t.textFaint }}>{TESTIMONIAL_DATA[activeTestimonial].location}</div>
                </div>
                <div style={{ marginLeft: 16, color: "#c9a96e", fontSize: 16 }}>{"★".repeat(TESTIMONIAL_DATA[activeTestimonial].rating)}</div>
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              {TESTIMONIAL_DATA.map((_, i) => (
                <button key={i} className={`testimonial-dot ${i === activeTestimonial ? "active" : ""}`}
                  onClick={() => setActiveTestimonial(i)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section id="gallery" style={{ padding: "120px 32px", background: t.bgAlt, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }} className="section-pad">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <AnimSection>
            <div className="gallery-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 32 }}>
              <div>
                <span className="section-label">Photo Gallery</span>
                <div className="divider-line" />
                <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  See it to<br /><span className="gold-text">Believe It</span>
                </h2>
              </div>
              <div className="gallery-filters" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {GALLERY_FILTERS.map(f => (
                  <button key={f} className={`gallery-filter-btn ${galleryFilter === f ? "active" : ""}`} onClick={() => setGalleryFilter(f)}>{f}</button>
                ))}
              </div>
            </div>
          </AnimSection>

          {/* Masonry-style grid */}
          <div style={{ columns: "3 300px", columnGap: 16 }}>
            {GALLERY_ITEMS.filter(g => galleryFilter === "All" || g.category === galleryFilter).map((item, i) => (
              <AnimSection key={`${galleryFilter}-${i}`} delay={i * 0.06}>
                <div
                  className="gallery-item"
                  style={{
                    height: item.span === "tall" ? 340 : item.span === "wide" ? 220 : 240,
                    marginBottom: 16,
                    breakInside: "avoid",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  onClick={() => setLightbox(item)}
                >
                  {/* Real photo background */}
                  <img src={item.img} alt={item.label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }} />
                  {/* Gradient overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.65))" }} />
                  {/* Bottom label always visible */}
                  <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>{item.label}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>{item.category}</div>
                  </div>
                  <div className="gallery-overlay">
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>{item.label}</div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                      color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase",
                      padding: "4px 14px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 100
                    }}>{item.category}</div>
                    <div style={{ fontSize: 22, color: "rgba(255,255,255,0.8)", marginTop: 8 }}>⊕</div>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div className="lightbox-backdrop" onClick={() => setLightbox(null)}>
            <div style={{
              background: isDark ? "rgba(14,16,18,0.97)" : "rgba(255,252,248,0.98)",
              border: `1px solid ${t.border}`,
              borderRadius: 28, overflow: "hidden",
              maxWidth: 560, width: "90%",
              position: "relative", color: t.text
            }} onClick={e => e.stopPropagation()}>
              {/* Image */}
              <div style={{ height: 280, overflow: "hidden", position: "relative" }}>
                <img src={lightbox.img} alt={lightbox.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))" }} />
                <button onClick={() => setLightbox(null)} style={{
                  position: "absolute", top: 16, right: 16,
                  background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff", width: 36, height: 36, borderRadius: "50%",
                  cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(8px)"
                }}>×</button>
              </div>
              {/* Content */}
              <div style={{ padding: "32px 40px 40px", textAlign: "center" }}>
                <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, color: t.text }}>{lightbox.label}</h3>
                <div style={{
                  display: "inline-flex",
                  background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.2)",
                  borderRadius: 100, padding: "4px 16px",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#c9a96e",
                  letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600
                }}>{lightbox.category}</div>
                <p style={{ marginTop: 16, color: t.textMuted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, fontSize: 15 }}>
                  Experience the finest {lightbox.label.toLowerCase()} at Gmalina Court — crafted to exceed every expectation.
                </p>
                <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => { setLightbox(null); openBooking(); }}>
                  Book Now →
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── BLOG ─── */}
      <section id="blog" style={{ padding: "120px 32px" }} className="section-pad">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <AnimSection>
            <div className="blog-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, flexWrap: "wrap", gap: 32 }}>
              <div>
                <span className="section-label">Stories & Insights</span>
                <div className="divider-line" />
                <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  From Our<br /><span className="gold-text">Journal</span>
                </h2>
              </div>
              <div className="blog-tags" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["All", "Travel Guide", "Cuisine", "Events", "Lifestyle", "Wellness", "Culture"].map(tag => (
                  <button key={tag} className={`blog-tag-btn ${activeBlogTag === tag ? "active" : ""}`} onClick={() => setActiveBlogTag(tag)}>{tag}</button>
                ))}
              </div>
            </div>
          </AnimSection>

          {/* Featured post */}
          {(BLOG_DATA.length > 0 && (activeBlogTag === "All" || BLOG_DATA[0].category === activeBlogTag)) && (
            <AnimSection>
              <div style={{
                background: t.bgCard,
                border: `1px solid ${t.borderGold}`,
                borderRadius: 28,
                overflow: "hidden",
                display: "grid", gridTemplateColumns: "1fr 1.2fr",
                marginBottom: 24,
                cursor: "pointer",
                transition: "all 0.4s",
                boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.25)" : "0 8px 32px rgba(0,0,0,0.08)"
              }} className="blog-featured">
                <div className="blog-featured-img" style={{ overflow: "hidden", position: "relative", minHeight: 320 }}>
                  <img src={BLOG_DATA[0].img} alt={BLOG_DATA[0].title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))" }} />
                  <div style={{
                    position: "absolute", top: 16, left: 16,
                    background: "rgba(201,169,110,0.9)", backdropFilter: "blur(8px)",
                    borderRadius: 100, padding: "5px 14px",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "#1a1208", letterSpacing: "0.08em"
                  }}>⭐ Featured</div>
                </div>
                <div style={{ padding: "52px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ marginBottom: 20 }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.1em", textTransform: "uppercase", color: "#14a08c",
                      background: "rgba(20,160,140,0.1)", border: "1px solid rgba(20,160,140,0.2)",
                      padding: "4px 12px", borderRadius: 100
                    }}>{BLOG_DATA[0].category}</span>
                  </div>
                  <h3 style={{ fontSize: "clamp(22px, 2.5vw, 32px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: "-0.02em", color: t.text }}>{BLOG_DATA[0].title}</h3>
                  <p style={{ color: t.textMuted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.75, fontSize: 15, fontWeight: 300, marginBottom: 28 }}>{BLOG_DATA[0].excerpt}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 20 }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: t.textFaint }}>📅 {BLOG_DATA[0].date}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: t.textFaint }}>⏱ {BLOG_DATA[0].readTime}</span>
                    </div>
                    <span className="blog-read-more">Read Article →</span>
                  </div>
                </div>
              </div>
            </AnimSection>
          )}

          {/* Grid of remaining posts */}
          <div className="grid-3">
            {BLOG_DATA.filter((b, i) => (i > 0 || activeBlogTag !== "All") && (activeBlogTag === "All" || b.category === activeBlogTag)).map((post, i) => (
              <AnimSection key={post.title} delay={i * 0.08}>
                <div className="blog-card">
                  <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
                    <img src={post.img} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.45))" }} />
                    <span style={{
                      position: "absolute", top: 12, left: 12,
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.12em", textTransform: "uppercase", color: "#14a08c",
                      background: isDark ? "rgba(8,9,10,0.8)" : "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(6px)", padding: "4px 10px", borderRadius: 100
                    }}>{post.category}</span>
                  </div>
                  <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 10, flexGrow: 1 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em", color: t.text }}>{post.title}</h3>
                    <p style={{ color: t.textMuted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.75, fontSize: 14, fontWeight: 300 }}>{post.excerpt}</p>
                    <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: t.textFaint }}>📅 {post.date}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: t.textFaint }}>⏱ {post.readTime}</span>
                    </div>
                    <span className="blog-read-more" style={{ paddingTop: 8 }}>Read More →</span>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" style={{ padding: "120px 32px", background: t.bgAlt, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }} className="section-pad">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="faq-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 80, alignItems: "start" }}>
            <AnimSection>
              <div className="faq-sticky" style={{ position: "sticky", top: 120 }}>
                <span className="section-label">FAQ</span>
                <div className="divider-line" />
                <h2 style={{ fontSize: "clamp(32px, 3.5vw, 52px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 24 }}>
                  Questions<br /><span className="gold-text">Answered</span>
                </h2>
                <p style={{ color: t.textMuted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8, fontSize: 15, fontWeight: 300, marginBottom: 40 }}>
                  Can't find what you're looking for? Our concierge team is available 24/7.
                </p>
                <button className="btn-primary" onClick={openBooking}>Reserve a Room →</button>

                {/* Decorative element */}
                <div style={{
                  marginTop: 48,
                  background: isDark ? "rgba(201,169,110,0.06)" : "rgba(201,169,110,0.1)",
                  border: `1px solid ${t.borderGold}`,
                  borderRadius: 20, padding: "24px",
                  display: "flex", gap: 16, alignItems: "center"
                }}>
                  <div style={{ fontSize: 36 }}>📞</div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Direct Line</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#c9a96e", fontWeight: 600 }}>+265 998 00 19 09</div>
                  </div>
                </div>
              </div>
            </AnimSection>

            <div>
              {FAQS.map((faq, i) => (
                <AnimSection key={i} delay={i * 0.05}>
                  <div className={`faq-item ${openFaq === i ? "open" : ""}`}>
                    <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span>{faq.q}</span>
                      <span className="faq-chevron">▾</span>
                    </button>
                    <div className="faq-answer">{faq.a}</div>
                  </div>
                </AnimSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <AnimSection>
        <div style={{ margin: "0 32px 120px", maxWidth: 1200, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{
            background: t.ctaBg,
            border: `1px solid ${t.ctaBorder}`,
            borderRadius: 32, padding: "72px 64px",
            textAlign: "center",
            position: "relative", overflow: "hidden"
          }} className="cta-pad">
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `linear-gradient(${t.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${t.gridLine} 1px, transparent 1px)`,
              backgroundSize: "40px 40px"
            }} />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 20, position: "relative", color: t.text }}>
              Ready for an<br /><span className="gold-text">Unforgettable Stay?</span>
            </h2>
            <p style={{ color: t.textMuted, maxWidth: 480, margin: "0 auto 40px", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8, position: "relative" }}>
              Reserve your room today and experience the finest hospitality in the heart of Malawi.
            </p>
            <div className="cta-buttons" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
              <button className="btn-primary" onClick={openBooking}>Book Your Room →</button>
              <a href="tel:+265998001909" className="btn-outline">+265 998 00 19 09</a>
            </div>
          </div>
        </div>
      </AnimSection>

      {/* ─── CONTACT ─── */}
      <section id="contact" style={{ padding: "0 32px 120px" }} className="section-pad section-pad-top">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <AnimSection>
            <div style={{ marginBottom: 72 }}>
              <span className="section-label">Get in Touch</span>
              <div className="divider-line" />
              <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                We'd Love to<br /><span className="gold-text">Hear From You</span>
              </h2>
            </div>
          </AnimSection>

          <div className="contact-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "start" }}>
            <div>
              {[
                { icon: "📍", label: "Address", value: "M5 Road, Next to Fcapital Bank\nP.O. Box 6, Liwonde, Machinga, Malawi" },
                { icon: "📞", label: "Phone", value: "+265 998 00 19 09" },
                { icon: "✉️", label: "Email", value: "pijotrust2012@yahoo.com" },
                { icon: "🌐", label: "Facebook", value: "facebook.com/gmalina.court" },
              ].map((c, i) => (
                <AnimSection key={i} delay={i * 0.08}>
                  <div style={{ display: "flex", gap: 20, marginBottom: 36, alignItems: "flex-start" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                    }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: 12, color: "#c9a96e", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
                      <div style={{ color: t.textMuted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, whiteSpace: "pre-line", fontSize: 15 }}>{c.value}</div>
                    </div>
                  </div>
                </AnimSection>
              ))}
            </div>

            <AnimSection delay={0.2}>
              <div style={{
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: 24, padding: "40px"
              }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 28 }}>Send us a Message</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="contact-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <input className="contact-input" placeholder="Your Name" />
                    <input className="contact-input" placeholder="Email Address" />
                  </div>
                  <input className="contact-input" placeholder="Subject" />
                  <textarea className="contact-input" placeholder="Your message..." rows={5} />
                  <button className="btn-primary" style={{ width: "100%", textAlign: "center" }}>
                    Send Message →
                  </button>
                </div>
              </div>
            </AnimSection>
          </div>
        </div>
      </section>

      {/* ─── PAY OVERLAY (iframe — keeps payment inside the website) ─── */}
{/* Pay overlay removed — PayChangu opens in a new tab now */}

      {/* ─── BOOKING MODAL ─── */}
      {bookingOpen && (
        <div className="booking-backdrop" onClick={closeBooking}>
          <div className="booking-modal" onClick={e => e.stopPropagation()}>

            {/* Drag handle (mobile) */}
            <div className="bk-handle" />

            {/* Header */}
            <div className="bk-header">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                  <img src="/images/logo.jpg" alt="Gmalina Court" style={{ width:26, height:26, borderRadius:6, objectFit:"cover", flexShrink:0 }} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:t.text, lineHeight:1.1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>Reserve Your Stay</div>
                    <div style={{ fontSize:10, color:t.textFaint }}>Gmalina Court Lodge</div>
                  </div>
                </div>
                <button className="booking-close" onClick={closeBooking}>×</button>
              </div>

              {/* Step progress */}
              {bookingStep < 5 && (
                <div className="bk-steps">
                  {(["Details","Stay","Extras","Pay"] as const).map((label, i) => {
                    const n = i + 1;
                    const done   = bookingStep > n;
                    const active = bookingStep === n;
                    return (
                      <div key={label} className="bk-step">
                        <div className={`bk-step-dot${done?" done":active?" active":""}`}>{done ? "✓" : n}</div>
                        <span className={`bk-step-name${active?" active":""}`}>{label}</span>
                        {i < 3 && <div className={`bk-step-line${done?" done":""}`} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="bk-body">

              {/* ── STEP 1 ── */}
              {bookingStep === 1 && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(15px,4vw,19px)", fontWeight:700, color:t.text }}>Your Details</div>
                  <div className="bk-g2">
                    <div className="bk-field"><label className="bk-label">First Name *</label><input className="bk-input" name="firstName" value={form.firstName} onChange={handleFormChange} placeholder="James" /></div>
                    <div className="bk-field"><label className="bk-label">Last Name *</label><input className="bk-input" name="lastName" value={form.lastName} onChange={handleFormChange} placeholder="Banda" /></div>
                  </div>
                  <div className="bk-g2">
                    <div className="bk-field"><label className="bk-label">Email *</label><input className="bk-input" type="email" name="email" value={form.email} onChange={handleFormChange} placeholder="your@email.com" /></div>
                    <div className="bk-field"><label className="bk-label">Phone *</label><input className="bk-input" type="tel" name="phone" value={form.phone} onChange={handleFormChange} placeholder="+265 998 001 909" /></div>
                  </div>
                  <div className="bk-field"><label className="bk-label">Country (optional)</label><input className="bk-input" name="country" value={form.country} onChange={handleFormChange} placeholder="e.g. Malawi, United Kingdom…" /></div>
                  <div className="bk-field">
                    <label className="bk-label">Occasion (optional)</label>
                    <select className="bk-input" name="occasion" value={form.occasion} onChange={handleFormChange}>
                      <option value="">Select occasion…</option>
                      {["Leisure / Holiday","Business Trip","Safari / Wildlife","Anniversary / Romance","Family Vacation","Wedding / Honeymoon","Corporate Event"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  {bookingError && <div className="bk-error">⚠️ {bookingError}</div>}
                </div>
              )}

              {/* ── STEP 2 ── */}
              {bookingStep === 2 && (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(15px,4vw,19px)", fontWeight:700, color:t.text }}>Stay Details</div>

                  <div>
                    <div className="bk-section-title">📅 Dates & Guests</div>
                    <div className="bk-g2">
                      <div className="bk-field"><label className="bk-label">Check-In *</label><input className="bk-input" type="date" name="checkIn" value={form.checkIn} min={new Date().toISOString().split("T")[0]} onChange={e => { handleFormChange(e); if (form.checkOut && e.target.value >= form.checkOut) setForm(f => ({ ...f, checkOut:"" })); }} /></div>
                      <div className="bk-field"><label className="bk-label">Check-Out *</label><input className="bk-input" type="date" name="checkOut" value={form.checkOut} min={form.checkIn || new Date().toISOString().split("T")[0]} onChange={handleFormChange} /></div>
                    </div>
                    {nights > 0 && (
                      <div style={{ marginTop:8, padding:"8px 12px", borderRadius:8, background:"rgba(201,169,110,0.07)", border:`1px solid ${t.borderGold}`, fontSize:12, color:"#c9a96e", fontWeight:600 }}>
                        🌙 {nights} night{nights!==1?"s":""} · {fmtDate(form.checkIn)} → {fmtDate(form.checkOut)}
                      </div>
                    )}
                    <div style={{ marginTop:12 }}>
                      <label className="bk-label" style={{ marginBottom:7 }}>Number of Guests</label>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {[1,2,3,4,5,6,7,8].map(n => (
                          <button key={n} onClick={() => setForm(f => ({ ...f, guests:String(n) }))} style={{ width:38, height:38, borderRadius:9, border:`2px solid ${form.guests===String(n)?"#c9a96e":t.border}`, background:form.guests===String(n)?"rgba(201,169,110,0.12)":t.bgCard, color:form.guests===String(n)?"#c9a96e":t.textMuted, fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer", transition:"all .2s" }}>{n}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="bk-section-title">🛏️ Choose Your Room</div>
                    <div className="bk-g3">
                      {[
                        { id:"Deluxe Room",   icon:"✨", price:85000, desc:"King bed, lounge area, garden view" },
                        { id:"Superior Room", icon:"⭐", price:70000, desc:"Queen bed, modern en-suite" },
                        { id:"Standard Room", icon:"🛏️", price:60000, desc:"Double bed, all essentials" },
                      ].map(r => (
                        <div key={r.id} className={`bk-room-card${form.roomType===r.id?" sel":""}`} onClick={() => setForm(f => ({ ...f, roomType:r.id }))}>
                          <div style={{ fontSize:20, marginBottom:6 }}>{r.icon}</div>
                          <div style={{ fontWeight:700, fontSize:12, color:form.roomType===r.id?"#c9a96e":t.text, marginBottom:3 }}>{r.id}</div>
                          <div style={{ fontSize:10, color:t.textFaint, lineHeight:1.4, marginBottom:8 }}>{r.desc}</div>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:"#c9a96e" }}>MWK {r.price.toLocaleString()}</div>
                          <div style={{ fontSize:10, color:t.textFaint }}>/ night</div>
                          {nights > 0 && <div style={{ marginTop:6, fontSize:10, color:form.roomType===r.id?"#c9a96e":t.textFaint, fontWeight:600 }}>{nights}n = MWK {(r.price*nights).toLocaleString()}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {bookingError && <div className="bk-error">⚠️ {bookingError}</div>}
                </div>
              )}

              {/* ── STEP 3 ── */}
              {bookingStep === 3 && (
                <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(15px,4vw,19px)", fontWeight:700, color:t.text }}>Preferences <span style={{ fontSize:13, fontWeight:400, color:t.textFaint }}>(optional)</span></div>

                  <div>
                    <div className="bk-section-title">🍽️ Dietary Requirements</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {["No restrictions","Vegetarian","Vegan","Halal","Gluten-free","Kosher","Nut allergy","Dairy-free","Other"].map(d => (
                        <button key={d} className={`bk-chip${form.dietary===d?" sel":""}`} onClick={() => setForm(f => ({ ...f, dietary:d }))}>{d}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="bk-section-title">✨ Add-ons</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                      {[
                        { field:"airportTransfer", icon:"✈️", label:"Airport Transfer",   desc:"Private car from Chileka/Kamuzu Airport" },
                        { field:"earlyCheckIn",    icon:"🌅", label:"Early Check-in",      desc:"Access from 9 AM (subject to availability)" },
                        { field:"lateCheckOut",    icon:"🌙", label:"Late Check-out",       desc:"Stay until 4 PM instead of 11 AM" },
                        { field:"romanticSetup",   icon:"🌹", label:"Romantic Setup",       desc:"Rose petals, candles & champagne" },
                        { field:"extraBed",        icon:"🛏️", label:"Extra Bed",            desc:"Additional rollaway bed in room" },
                      ].map(({ field, icon, label, desc }) => (
                        <div key={field} className={`bk-toggle${(form as any)[field]?" on":""}`} onClick={() => toggleAddon(field)}>
                          <div className="bk-pill" />
                          <span style={{ fontSize:16 }}>{icon}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:600, fontSize:13, color:(form as any)[field]?"#14a08c":t.text }}>{label}</div>
                            <div style={{ fontSize:11, color:t.textFaint, marginTop:1 }}>{desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bk-field">
                    <label className="bk-label">Special Requests</label>
                    <textarea className="bk-input" name="specialRequests" value={form.specialRequests} onChange={handleFormChange} rows={3} placeholder="Early check-in, extra pillows, quiet room…" style={{ resize:"none" }} />
                  </div>
                  {bookingError && <div className="bk-error">⚠️ {bookingError}</div>}
                </div>
              )}

              {/* ── STEP 4 ── */}
              {bookingStep === 4 && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(15px,4vw,19px)", fontWeight:700, color:t.text }}>Secure Your Booking</div>
                  <p style={{ fontSize:13, color:t.textMuted, lineHeight:1.6, margin:0 }}>Pay a <strong style={{ color:"#c9a96e" }}>20% deposit</strong> now. Remaining balance paid on arrival.</p>

                  {/* Ref badge */}
                  <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 10px", borderRadius:100, background:"rgba(201,169,110,0.07)", border:`1px solid ${t.borderGold}`, alignSelf:"flex-start", maxWidth:"100%", overflow:"hidden" }}>
                    <span style={{ fontSize:9, color:t.textFaint, letterSpacing:".1em", textTransform:"uppercase", flexShrink:0 }}>Ref</span>
                    <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:13, color:"#c9a96e", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{savedBookingRef}</span>
                  </div>

                  {/* Cost breakdown */}
                  <div style={{ background:isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)", border:`1px solid ${t.border}`, borderRadius:12, padding:"14px" }}>
                    <div style={{ fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:t.textFaint, marginBottom:10 }}>Cost Breakdown</div>
                    {[
                      { label:"Room",      value:form.roomType },
                      { label:"Rate",      value:`MWK ${pricePerNight.toLocaleString()} / night` },
                      { label:"Duration",  value:`${nights} night${nights!==1?"s":""}` },
                      { label:"Check-In",  value:fmtDate(form.checkIn) },
                      { label:"Check-Out", value:fmtDate(form.checkOut) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bk-price-row">
                        <span style={{ fontSize:12, color:t.textFaint }}>{label}</span>
                        <span style={{ fontSize:12, fontWeight:500, color:t.text }}>{value}</span>
                      </div>
                    ))}
                    <div className="bk-sep" />
                    <div className="bk-price-row">
                      <span style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>Total Stay</span>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:t.text }}>{fmtMWK(totalAmount)}</span>
                    </div>
                    {/* Deposit highlight */}
                    <div style={{ marginTop:8, background:"rgba(20,160,140,0.07)", border:"1px solid rgba(20,160,140,0.25)", borderRadius:10, padding:"10px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:"#14a08c" }}>Deposit Due Now (20%)</div>
                        <div style={{ fontSize:10, color:t.textFaint, marginTop:2 }}>Paid via PayChangu · secure</div>
                      </div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(16px,4vw,20px)", fontWeight:900, color:"#14a08c" }}>{fmtMWK(depositAmount)}</div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0 0", fontSize:12, color:t.textFaint }}>
                      <span>Balance on Arrival</span>
                      <span style={{ fontWeight:600, color:t.textMuted }}>{fmtMWK(balanceAmount)}</span>
                    </div>
                  </div>

                  {/* Guest summary */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:12, padding:"10px 12px", borderRadius:10, background:isDark?"rgba(201,169,110,0.04)":"rgba(201,169,110,0.07)", border:`1px solid ${t.borderGold}` }}>
                    {[
                      { l:"Guest",  v:`${form.firstName} ${form.lastName}` },
                      { l:"Email",  v:form.email },
                      { l:"Guests", v:form.guests },
                      ...(form.occasion ? [{ l:"Occasion", v:form.occasion }] : []),
                    ].map(({ l, v }) => (
                      <div key={l} style={{ minWidth:0 }}>
                        <div style={{ fontSize:9, color:t.textFaint, textTransform:"uppercase", letterSpacing:".08em", marginBottom:2 }}>{l}</div>
                        <div style={{ fontSize:12, fontWeight:600, color:t.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"40vw" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {bookingError && <div className="bk-error">⚠️ {bookingError}</div>}
                </div>
              )}

              {/* ── STEP 5 ── */}
              {bookingStep === 5 && (
                <div style={{ textAlign:"center", padding:"12px 0 20px" }}>
                  <div style={{ fontSize:"clamp(36px,10vw,56px)", marginBottom:10, animation:"float 3s ease-in-out infinite" }}>✅</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(18px,5vw,24px)", fontWeight:800, color:t.text, marginBottom:10 }}>Payment Confirmed!</div>
                  <p style={{ fontSize:13, color:t.textMuted, lineHeight:1.6, maxWidth:340, margin:"0 auto 10px" }}>
                    Thank you, <strong style={{ color:t.text }}>{form.firstName}</strong>! Your <strong style={{ color:"#c9a96e" }}>20% deposit</strong> of <strong style={{ color:"#14a08c" }}>{fmtMWK(depositAmount)}</strong> has been received and your {form.roomType} is confirmed.
                  </p>
                  <p style={{ fontSize:12, color:t.textFaint, marginBottom:16 }}>Receipt sent to <strong style={{ color:"#c9a96e" }}>{form.email}</strong></p>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:16, padding:"7px 14px", borderRadius:100, background:"rgba(20,160,140,0.08)", border:"1px solid rgba(20,160,140,0.3)" }}>
                    <span style={{ fontSize:9, color:t.textFaint, textTransform:"uppercase", letterSpacing:".1em" }}>Booking Ref</span>
                    <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:13, color:"#14a08c" }}>{savedBookingRef}</span>
                  </div>
                  <div style={{ background:isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.03)", border:`1px solid ${t.border}`, borderRadius:12, padding:"10px 14px", maxWidth:320, margin:"0 auto 14px", textAlign:"left" }}>
                    {[
                      { l:"Room",         v:form.roomType },
                      { l:"Check-In",     v:fmtDate(form.checkIn) },
                      { l:"Check-Out",    v:fmtDate(form.checkOut) },
                      { l:"Duration",     v:`${nights} night${nights!==1?"s":""}` },
                      { l:"Total",        v:fmtMWK(totalAmount) },
                      { l:"Deposit Paid", v:fmtMWK(depositAmount), color:"#14a08c" },
                      { l:"Balance Due",  v:fmtMWK(balanceAmount) },
                    ].map(({ l, v, color }) => (
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", paddingBottom:6, marginBottom:6, borderBottom:`1px solid ${t.border}`, gap:8 }}>
                        <span style={{ fontSize:11, color:t.textFaint, flexShrink:0 }}>{l}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:color||t.text, textAlign:"right" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize:12, color:t.textFaint }}>Questions? <a href="tel:+265998001909" style={{ color:"#c9a96e", textDecoration:"none", fontWeight:600 }}>+265 998 00 19 09</a></p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="bk-footer">
              {bookingStep === 1 && (<>
                <button className="btn-primary bk-btn-main" onClick={bookingNext}>Continue to Stay Details →</button>
                <button className="btn-outline bk-btn-back" onClick={closeBooking}>Cancel</button>
              </>)}
              {bookingStep === 2 && (<>
                <button className="btn-primary bk-btn-main" onClick={bookingNext}>Continue to Preferences →</button>
                <button className="btn-outline bk-btn-back" onClick={() => { setBookingError(""); setBookingStep(1); }}>← Back</button>
              </>)}
              {bookingStep === 3 && (<>
                <button className="btn-primary bk-btn-main" style={{ opacity:bookingLoading?0.7:1 }} onClick={saveAndPay} disabled={bookingLoading}>
                  {bookingLoading
                    ? <span style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ width:13,height:13,border:"2px solid rgba(0,0,0,.2)",borderTop:"2px solid #08090a",borderRadius:"50%",display:"inline-block",animation:"spin .8s linear infinite" }} />Saving…</span>
                    : "Review & Pay →"}
                </button>
                <button className="btn-outline bk-btn-back" onClick={() => { setBookingError(""); setBookingStep(2); }}>← Back</button>
              </>)}
              {bookingStep === 4 && !payUrl && (<>
                <button className="btn-pay bk-btn-main" onClick={openPayChangu}>
                  <span className="btn-pay-lock">🔒</span>
                  <span>Pay {fmtMWK(depositAmount)} Deposit</span>
                </button>
                <button className="btn-back bk-btn-back" onClick={() => { setBookingError(""); setBookingStep(3); }}>
                  ← Back
                </button>
              </>)}
              {bookingStep === 4 && payUrl === "waiting" && (
                <div style={{ width:"100%", display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"6px 0" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, color:"#14a08c", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600 }}>
                    <span style={{ width:16, height:16, border:"2.5px solid rgba(20,160,140,0.25)", borderTop:"2.5px solid #14a08c", borderRadius:"50%", display:"inline-block", animation:"spin .8s linear infinite", flexShrink:0 }} />
                    Waiting for payment confirmation…
                  </div>
                  <p style={{ margin:0, fontSize:12, color:t.textFaint, textAlign:"center", lineHeight:1.5 }}>
                    Complete the payment in the tab that just opened. This will update automatically.
                  </p>
                  <div style={{ display:"flex", gap:10, width:"100%", flexWrap:"wrap" }}>
                    <button className="btn-back bk-btn-back" style={{ flex:1 }} onClick={() => { setPayUrl(""); }}>
                      ← Cancel payment
                    </button>
                    <button className="btn-back bk-btn-back" style={{ flex:1 }} onClick={() => openPayChangu()}>
                      Reopen payment tab ↗
                    </button>
                  </div>
                  <button onClick={() => markPaymentDone()} style={{ background:"none", border:"none", color:t.textFaint, fontSize:11, cursor:"pointer", textDecoration:"underline", fontFamily:"'DM Sans',sans-serif" }}>[Test: simulate success]</button>
                </div>
              )}
              {bookingStep === 5 && (<>
                <button className="btn-primary bk-btn-main" onClick={closeBooking}>Close</button>
                <button className="btn-outline bk-btn-back" onClick={() => { setBookingStep(1); setForm({ firstName:"",lastName:"",email:"",phone:"",country:"",checkIn:"",checkOut:"",guests:"2",roomType:"Deluxe Room",occasion:"",dietary:"No restrictions",airportTransfer:false,earlyCheckIn:false,lateCheckOut:false,romanticSetup:false,extraBed:false,specialRequests:"" }); setSavedBookingRef(""); setFirestoreId(""); }}>New Booking</button>
              </>)}
            </div>
          </div>
        </div>
      )}

      <footer style={{
        borderTop: `1px solid ${t.border}`,
        padding: "64px 32px 40px",
        background: isDark ? "#06070a" : "#ede9e3"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 64 }}>
            <div className="footer-brand">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <img src="/images/logo.jpg" alt="Gmalina Court Lodge" style={{ width: 38, height: 38, borderRadius: "10px", objectFit: "cover" }} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>Gmalina Court</span>
              </div>
              <p style={{ color: t.textFaint, lineHeight: 1.8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", maxWidth: 280 }}>
                Premier lodge in Liwonde, Malawi. Where luxury meets the wild heart of Africa.
              </p>
            </div>
            {[
              { title: "Facilities", links: ["Accommodation", "Conference", "Restaurant", "Gym", "Swimming Pool"] },
              { title: "Explore", links: ["Gallery", "Blog", "FAQ", "Attractions", "About Us"] },
              { title: "Contact", links: ["+265 998 00 19 09", "pijotrust2012@yahoo.com", "Facebook", "Tripadvisor"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: t.textFaint, marginBottom: 20 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {col.links.map(l => <a key={l} href="#" className="footer-link">{l}</a>)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ color: t.textFaint, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
              © 2026 Gmalina Court. Liwonde, Machinga, Malawi. All rights reserved.
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}