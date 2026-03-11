'use client';

import React, { useState, useEffect, useRef } from "react";

const NAV_LINKS = ["About", "Facilities", "Gallery", "Blog", "FAQ", "Contact"];

interface GalleryItem {
  emoji: string;
  label: string;
  category: string;
  span: string;
  bg: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  { emoji: "🏊", label: "Swimming Pool", category: "Facilities", span: "wide", bg: "linear-gradient(135deg, rgba(20,160,140,0.25), rgba(8,60,80,0.6))" },
  { emoji: "🛏️", label: "Deluxe Suite", category: "Rooms", span: "tall", bg: "linear-gradient(135deg, rgba(201,169,110,0.2), rgba(60,30,10,0.6))" },
  { emoji: "🍽️", label: "Fine Dining", category: "Restaurant", span: "normal", bg: "linear-gradient(135deg, rgba(180,60,40,0.2), rgba(40,10,10,0.6))" },
  { emoji: "🦁", label: "Safari Views", category: "Nature", span: "wide", bg: "linear-gradient(135deg, rgba(180,140,30,0.25), rgba(50,40,0,0.6))" },
  { emoji: "🎤", label: "Conference Hall", category: "Business", span: "normal", bg: "linear-gradient(135deg, rgba(60,80,180,0.2), rgba(10,10,50,0.6))" },
  { emoji: "💪", label: "Fitness Center", category: "Facilities", span: "normal", bg: "linear-gradient(135deg, rgba(20,160,100,0.2), rgba(0,30,20,0.6))" },
  { emoji: "🌿", label: "Garden Terrace", category: "Outdoors", span: "tall", bg: "linear-gradient(135deg, rgba(40,140,60,0.2), rgba(0,20,0,0.6))" },
  { emoji: "🍹", label: "Poolside Bar", category: "Bar", span: "normal", bg: "linear-gradient(135deg, rgba(200,100,20,0.2), rgba(50,20,0,0.6))" },
  { emoji: "🌅", label: "Sunrise Views", category: "Nature", span: "wide", bg: "linear-gradient(135deg, rgba(220,120,40,0.25), rgba(60,20,0,0.6))" },
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
  {
    category: "Travel Guide",
    title: "The Ultimate Safari Guide to Liwonde National Park",
    excerpt: "Everything you need to know about visiting one of Africa's most biodiverse wilderness areas — from the best game drives to night safaris along the Shire River.",
    date: "Jan 15, 2025",
    readTime: "8 min read",
    emoji: "🦁",
    color: "rgba(201,169,110,0.15)"
  },
  {
    category: "Cuisine",
    title: "A Taste of Malawi: 7 Dishes You Must Try at Our Restaurant",
    excerpt: "From nsima with chambo fish to slow-roasted nyama, our head chef walks you through the rich culinary heritage of Malawi — and how we reimagine it on your plate.",
    date: "Feb 3, 2025",
    readTime: "5 min read",
    emoji: "🍽️",
    color: "rgba(20,160,140,0.12)"
  },
  {
    category: "Events",
    title: "How to Plan the Perfect Corporate Retreat in Malawi",
    excerpt: "Companies from across Africa are discovering Liwonde as a premier destination for off-site retreats. Here's why Gmalina Court is the ideal venue — and how to plan it.",
    date: "Feb 20, 2025",
    readTime: "6 min read",
    emoji: "💼",
    color: "rgba(100,80,200,0.12)"
  },
  {
    category: "Lifestyle",
    title: "Lake Malawi: A Weekend Escape from the Lodge",
    excerpt: "Just 45 minutes from Gmalina Court lies the jewel of Central Africa. We guide you through the best beaches, water sports, and lakeside villages worth visiting.",
    date: "Mar 1, 2025",
    readTime: "7 min read",
    emoji: "🌊",
    color: "rgba(20,100,180,0.12)"
  },
  {
    category: "Wellness",
    title: "Morning Rituals: How Our Guests Start the Perfect Day",
    excerpt: "Early swim, garden breakfast, and a sunrise walk to the river — discover the unhurried morning rhythms that our guests keep coming back for.",
    date: "Mar 8, 2025",
    readTime: "4 min read",
    emoji: "🌅",
    color: "rgba(220,120,40,0.12)"
  },
  {
    category: "Culture",
    title: "Exploring Malawian Craft Markets: A Buyer's Guide",
    excerpt: "Liwonde's local markets are a treasure trove of handwoven baskets, carved wooden art, and vibrant textiles. Here's how to shop authentically and support local artisans.",
    date: "Mar 14, 2025",
    readTime: "5 min read",
    emoji: "🏺",
    color: "rgba(180,80,40,0.12)"
  },
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
  { icon: "🛏️", title: "Luxury Accommodation", desc: "Spacious suites with en-suite bathrooms, premium linens, smart TV, high-speed Wi-Fi, and panoramic views of Liwonde." },
  { icon: "🎤", title: "Conference Facilities", desc: "Fully equipped halls for up to 100 guests, with 4K AV equipment, high-speed connectivity, and professional catering." },
  { icon: "🍽️", title: "Bar & Restaurant", desc: "Award-winning cuisine blending local Malawian flavors with international gastronomy, paired with curated beverages." },
  { icon: "💪", title: "Premium Gym", desc: "State-of-the-art fitness center with modern cardio, free weights, and personal training on request." },
  { icon: "🏊", title: "Swimming Pool", desc: "Heated outdoor pool with sun loungers, poolside bar service, and stunning garden views." },
  { icon: "🌿", title: "Garden & Terrace", desc: "Lush tropical gardens with private terraces—perfect for evening sundowners or romantic dinners." },
];

const GUEST_TYPES = [
  { icon: "💼", title: "Business Travelers", desc: "Conference rooms, express check-in, 24/7 concierge, and seamless connectivity for the modern executive.", tag: "Corporate" },
  { icon: "🏖️", title: "Leisure Guests", desc: "Pool, spa treatments, bar, and curated day trips to Liwonde National Park for ultimate relaxation.", tag: "Leisure" },
  { icon: "👨‍👩‍👧", title: "Families", desc: "Family suites, child-friendly menus, and guided safari activities for unforgettable memories.", tag: "Family" },
  { icon: "🎉", title: "Events & Groups", desc: "Bespoke packages for weddings, corporate retreats, and private celebrations with dedicated event staff.", tag: "Events" },
];

const ATTRACTIONS = [
  { icon: "🦁", title: "Liwonde National Park", dist: "5 min away", desc: "One of Africa's premier safari destinations—home to elephants, hippos, lions, and over 400 bird species." },
  { icon: "🌊", title: "Lake Malawi", dist: "45 min away", desc: "The 'Calendar Lake'—crystal-clear waters, sandy beaches, and world-class snorkeling in the lake of stars." },
  { icon: "🏺", title: "Liwonde Town Markets", dist: "2 min away", desc: "Vibrant local markets brimming with handcrafted goods, fresh produce, and authentic Malawian culture." },
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
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [galleryFilter, setGalleryFilter] = useState("All");
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeBlogTag, setActiveBlogTag] = useState("All");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 700);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ fontFamily: "'Georgia', 'Palatino Linotype', serif", background: "#08090a", color: "#f4f0ea", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        h1, h2, h3, h4 { font-family: 'Playfair Display', Georgia, serif; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #08090a; }
        ::-webkit-scrollbar-thumb { background: #c9a96e; border-radius: 2px; }

        .mesh-bg {
          background: #08090a;
          background-image:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(201,169,110,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 90%, rgba(20,160,140,0.1) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 100%);
        }

        .glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .glass-gold {
          background: rgba(201,169,110,0.06);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(201,169,110,0.2);
        }

        .gold-text {
          background: linear-gradient(135deg, #c9a96e 0%, #e8d5a3 50%, #c9a96e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .teal-glow { box-shadow: 0 0 30px rgba(20,160,140,0.3); }
        .gold-glow { box-shadow: 0 0 40px rgba(201,169,110,0.25); }

        .nav-link {
          color: rgba(244,240,234,0.7);
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
          color: #f4f0ea;
          border: 1px solid rgba(244,240,234,0.3);
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
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 32px;
          transition: all 0.4s;
          cursor: default;
        }
        .facility-card:hover {
          background: rgba(201,169,110,0.07);
          border-color: rgba(201,169,110,0.3);
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.4);
        }

        .guest-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 32px;
          transition: all 0.4s;
        }
        .guest-card:hover {
          background: rgba(20,160,140,0.07);
          border-color: rgba(20,160,140,0.3);
          transform: translateY(-4px);
        }

        .stat-item {
          text-align: center;
          padding: 32px 24px;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .stat-item:last-child { border-right: none; }

        .testimonial-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }
        .testimonial-dot.active {
          background: #c9a96e;
          transform: scale(1.3);
        }

        .divider-line {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #c9a96e, transparent);
          margin: 16px 0 24px 0;
        }

        .tag-pill {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 100px;
          background: rgba(20,160,140,0.15);
          color: #14a08c;
          border: 1px solid rgba(20,160,140,0.25);
          display: inline-block;
          margin-bottom: 16px;
        }

        .hero-orb-1 {
          position: absolute;
          width: 700px; height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%);
          top: -200px; left: -200px;
          pointer-events: none;
          animation: float 8s ease-in-out infinite;
        }
        .hero-orb-2 {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(20,160,140,0.08) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          pointer-events: none;
          animation: float 10s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.03); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
        .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; }

        @media (max-width: 900px) {
          .grid-4 { grid-template-columns: 1fr 1fr; }
          .grid-3 { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
          .stat-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .stat-item:last-child { border-bottom: none; }
        }

        .contact-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 18px;
          color: #f4f0ea;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.3s;
          resize: none;
        }
        .contact-input:focus { border-color: #c9a96e; }
        .contact-input::placeholder { color: rgba(244,240,234,0.35); }

        .footer-link {
          color: rgba(244,240,234,0.5);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.3s;
        }
        .footer-link:hover { color: #c9a96e; }

        /* Gallery */
        .gallery-filter-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 8px 20px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: rgba(244,240,234,0.6);
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 0.03em;
        }
        .gallery-filter-btn:hover { border-color: rgba(201,169,110,0.4); color: #c9a96e; }
        .gallery-filter-btn.active {
          background: linear-gradient(135deg, #c9a96e, #e8d5a3);
          color: #08090a;
          border-color: transparent;
          font-weight: 600;
        }

        .gallery-item {
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .gallery-item:hover { transform: scale(1.02); box-shadow: 0 24px 60px rgba(0,0,0,0.5); }
        .gallery-item:hover .gallery-overlay { opacity: 1; }
        .gallery-item:hover .gallery-icon { transform: scale(1.1); }

        .gallery-overlay {
          position: absolute; inset: 0;
          background: rgba(8,9,10,0.55);
          backdrop-filter: blur(4px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.35s;
          gap: 8px;
        }

        .gallery-icon { transition: transform 0.4s; font-size: 52px; }

        /* Lightbox */
        .lightbox-backdrop {
          position: fixed; inset: 0; z-index: 9000;
          background: rgba(0,0,0,0.92);
          backdrop-filter: blur(20px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        /* FAQ */
        .faq-item {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 0.3s;
          margin-bottom: 12px;
        }
        .faq-item.open { border-color: rgba(201,169,110,0.3); }

        .faq-question {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: none;
          color: #f4f0ea;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 500;
          text-align: left;
          padding: 22px 28px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          transition: background 0.3s;
        }
        .faq-question:hover { background: rgba(201,169,110,0.05); }
        .faq-item.open .faq-question { background: rgba(201,169,110,0.07); }

        .faq-chevron {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: transform 0.35s, background 0.3s;
          font-size: 13px; color: #c9a96e;
        }
        .faq-item.open .faq-chevron { transform: rotate(180deg); background: rgba(201,169,110,0.15); }

        .faq-answer {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: rgba(244,240,234,0.65);
          line-height: 1.8;
          padding: 0 28px;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, padding 0.4s ease;
        }
        .faq-item.open .faq-answer { max-height: 240px; padding: 4px 28px 24px; }

        /* Blog */
        .blog-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.4s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .blog-card:hover {
          border-color: rgba(201,169,110,0.25);
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.4);
        }
        .blog-card:hover .blog-read-more { color: #c9a96e; gap: 10px; }

        .blog-read-more {
          display: flex; align-items: center; gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600;
          color: rgba(244,240,234,0.5);
          transition: all 0.3s;
          margin-top: auto;
        }

        .blog-tag-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          padding: 6px 16px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: rgba(244,240,234,0.55);
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 0.04em;
        }
        .blog-tag-btn:hover { border-color: rgba(201,169,110,0.35); color: #c9a96e; }
        .blog-tag-btn.active { background: rgba(201,169,110,0.12); border-color: rgba(201,169,110,0.3); color: #c9a96e; }

        .section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c9a96e;
          margin-bottom: 12px;
          display: block;
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }
      `}</style>

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        padding: "0 32px",
        height: 72,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(8,9,10,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
        transition: "all 0.4s ease"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "10px",
            background: "linear-gradient(135deg, #c9a96e, #e8d5a3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18
          }}>🏛️</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, lineHeight: 1.1 }}>
              Gmalina Court
            </div>
            <div style={{ fontSize: 10, color: "rgba(244,240,234,0.45)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
              Liwonde · Malawi
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {NAV_LINKS.map(link => (
            <a key={link} href={`#${link.toLowerCase()}`} className="nav-link" style={{ display: isMobile ? "none" : "block" }}>{link}</a>
          ))}
          <a href="#contact" className="btn-primary" style={{ padding: "10px 24px", fontSize: 13 }}>Book Now</a>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="mesh-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: 72 }}>
        <div className="hero-orb-1" />
        <div className="hero-orb-2" />

        {/* Subtle grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
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
              <span className="gold-text">Meets the Warm</span><br />
              Heart of Africa
            </h1>

            <p style={{ fontSize: 18, color: "rgba(244,240,234,0.65)", lineHeight: 1.8, maxWidth: 560, marginBottom: 48, fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
              Premier lodge on M5 Road, Liwonde — where world-class hospitality, 
              safari adventures, and refined comfort converge at the gateway to 
              Liwonde National Park.
            </p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 64 }}>
              <a href="#contact" className="btn-primary">Reserve Your Stay</a>
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
                  <div style={{ fontSize: 13, color: "rgba(244,240,234,0.5)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badges */}
          <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 16 }} className="glass-badges">
            {[
              { icon: "🏆", t: "Award Winning", s: "Tripadvisor Choice" },
              { icon: "🦁", t: "Safari Nearby", s: "5 min to Park" },
              { icon: "📶", t: "High-Speed WiFi", s: "Throughout" },
            ].map((b, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 14,
                backdropFilter: "blur(16px)",
                animation: `float ${6 + i}s ease-in-out ${i * 0.5}s infinite`
              }}>
                <span style={{ fontSize: 24 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{b.t}</div>
                  <div style={{ fontSize: 11, color: "rgba(244,240,234,0.45)", fontFamily: "'DM Sans', sans-serif" }}>{b.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.4 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>Scroll</div>
          <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, #c9a96e, transparent)" }} />
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <div style={{ background: "rgba(201,169,110,0.06)", borderTop: "1px solid rgba(201,169,110,0.15)", borderBottom: "1px solid rgba(201,169,110,0.15)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
            {STATS.map((s, i) => (
              <div key={i} className="stat-item">
                <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Playfair Display', serif" }} className="gold-text">{s.value}</div>
                <div style={{ fontSize: 13, color: "rgba(244,240,234,0.5)", fontFamily: "'DM Sans', sans-serif", marginTop: 4, letterSpacing: "0.05em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ABOUT ─── */}
      <section id="about" style={{ padding: "120px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <AnimSection>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <span className="section-label">About Gmalina Court</span>
              <div className="divider-line" />
              <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.15, fontWeight: 800, marginBottom: 24, letterSpacing: "-0.02em" }}>
                The Pinnacle of<br />Malawian Hospitality
              </h2>
              <p style={{ color: "rgba(244,240,234,0.65)", lineHeight: 1.9, marginBottom: 24, fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 300 }}>
                Nestled along M5 Road beside Fcapital Bank in the heart of Liwonde, 
                Gmalina Court stands as Malawi's most distinguished lodge—a seamless 
                fusion of modern luxury and authentic African warmth.
              </p>
              <p style={{ color: "rgba(244,240,234,0.65)", lineHeight: 1.9, marginBottom: 40, fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 300 }}>
                Whether you're here for business, a family safari, or a romantic 
                escape, our meticulously crafted spaces and attentive team ensure 
                every moment exceeds expectation.
              </p>
              <div style={{ display: "flex", gap: 32, marginBottom: 40 }}>
                {[["Business", "✓"], ["Leisure", "✓"], ["Events", "✓"], ["Dining", "✓"]].map(([l, c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#14a08c", fontWeight: 600 }}>{c}</span>
                    <span style={{ fontSize: 14, color: "rgba(244,240,234,0.6)", fontFamily: "'DM Sans', sans-serif" }}>{l}</span>
                  </div>
                ))}
              </div>
              <a href="#contact" className="btn-primary">Get in Touch →</a>
            </div>

            {/* Visual collage */}
            <div style={{ position: "relative", height: 480 }}>
              <div style={{
                position: "absolute", top: 0, left: 0,
                width: "70%", height: "65%",
                background: "linear-gradient(135deg, rgba(201,169,110,0.15), rgba(20,160,140,0.1))",
                border: "1px solid rgba(201,169,110,0.2)",
                borderRadius: 24,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontSize: 72
              }}>🏛️</div>
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: "60%", height: "55%",
                background: "linear-gradient(135deg, rgba(20,160,140,0.12), rgba(201,169,110,0.1))",
                border: "1px solid rgba(20,160,140,0.2)",
                borderRadius: 24,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontSize: 64
              }}>🌿</div>
              <div style={{
                position: "absolute", bottom: "20%", left: "5%",
                background: "rgba(201,169,110,0.1)",
                border: "1px solid rgba(201,169,110,0.25)",
                borderRadius: 16, padding: "16px 20px",
                backdropFilter: "blur(16px)"
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }} className="gold-text">Est. in Liwonde</div>
                <div style={{ fontSize: 12, color: "rgba(244,240,234,0.5)", fontFamily: "'DM Sans', sans-serif" }}>Machinga, Malawi</div>
              </div>
            </div>
          </div>
        </AnimSection>
      </section>

      {/* ─── FACILITIES ─── */}
      <section id="facilities" style={{ padding: "120px 32px", background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <AnimSection>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <span className="section-label">Premium Facilities</span>
              <div className="divider-line" style={{ margin: "16px auto 24px" }} />
              <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Everything You<br /><span className="gold-text">Could Desire</span>
              </h2>
              <p style={{ color: "rgba(244,240,234,0.55)", marginTop: 20, maxWidth: 480, margin: "20px auto 0", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8 }}>
                Six world-class amenities designed to make your stay unforgettable, from sunrise to sunset.
              </p>
            </div>
          </AnimSection>

          <div className="grid-3">
            {FACILITIES.map((f, i) => (
              <AnimSection key={i} delay={i * 0.08}>
                <div className="facility-card">
                  <div style={{ fontSize: 40, marginBottom: 20 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em" }}>{f.title}</h3>
                  <p style={{ color: "rgba(244,240,234,0.55)", lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 300 }}>{f.desc}</p>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GUEST TYPES ─── */}
      <section id="guests" style={{ padding: "120px 32px" }}>
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
                  <p style={{ color: "rgba(244,240,234,0.55)", lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 300, marginBottom: 20 }}>{g.desc}</p>
                  <a href="#contact" style={{ color: "#14a08c", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    Learn more <span style={{ transition: "transform 0.3s" }}>→</span>
                  </a>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ATTRACTIONS ─── */}
      <section id="attractions" style={{ padding: "120px 32px", background: "rgba(20,160,140,0.04)", borderTop: "1px solid rgba(20,160,140,0.1)", borderBottom: "1px solid rgba(20,160,140,0.1)" }}>
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
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 24, padding: "40px 32px",
                  transition: "all 0.4s",
                  position: "relative", overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute", top: 0, right: 0,
                    width: 120, height: 120,
                    background: "radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)",
                    borderRadius: "0 0 0 100%"
                  }} />
                  <div style={{ fontSize: 52, marginBottom: 24 }}>{a.icon}</div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(20,160,140,0.1)", border: "1px solid rgba(20,160,140,0.2)",
                    borderRadius: 100, padding: "4px 12px", marginBottom: 16
                  }}>
                    <span style={{ fontSize: 11, color: "#14a08c", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>📍 {a.dist}</span>
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 14 }}>{a.title}</h3>
                  <p style={{ color: "rgba(244,240,234,0.55)", lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 300 }}>{a.desc}</p>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding: "120px 32px" }}>
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
              background: "rgba(201,169,110,0.05)",
              border: "1px solid rgba(201,169,110,0.15)",
              borderRadius: 28, padding: "48px",
              transition: "all 0.6s ease",
              position: "relative"
            }}>
              <div style={{ fontSize: 64, lineHeight: 0.8, color: "#c9a96e", fontFamily: "'Playfair Display', serif", opacity: 0.4, marginBottom: 32 }}>"</div>
              <p style={{
                fontSize: "clamp(18px, 2.5vw, 24px)",
                lineHeight: 1.7, fontFamily: "'Playfair Display', serif",
                fontStyle: "italic", color: "rgba(244,240,234,0.9)",
                marginBottom: 32, transition: "all 0.5s"
              }}>
                {TESTIMONIALS[activeTestimonial].quote}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #c9a96e, #e8d5a3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {TESTIMONIALS[activeTestimonial].author[0]}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15 }}>{TESTIMONIALS[activeTestimonial].author}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(244,240,234,0.45)" }}>{TESTIMONIALS[activeTestimonial].location}</div>
                </div>
                <div style={{ marginLeft: 16, color: "#c9a96e", fontSize: 16 }}>{"★".repeat(TESTIMONIALS[activeTestimonial].rating)}</div>
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              {TESTIMONIALS.map((_, i) => (
                <button key={i} className={`testimonial-dot ${i === activeTestimonial ? "active" : ""}`}
                  onClick={() => setActiveTestimonial(i)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section id="gallery" style={{ padding: "120px 32px", background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <AnimSection>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 32 }}>
              <div>
                <span className="section-label">Photo Gallery</span>
                <div className="divider-line" />
                <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  See it to<br /><span className="gold-text">Believe It</span>
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                    background: item.bg,
                    height: item.span === "tall" ? 340 : item.span === "wide" ? 220 : 240,
                    marginBottom: 16,
                    breakInside: "avoid",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  onClick={() => setLightbox(item)}
                >
                  <div style={{ textAlign: "center" }}>
                    <div className="gallery-icon">{item.emoji}</div>
                  </div>
                  <div className="gallery-overlay">
                    <div style={{ fontSize: 48 }}>{item.emoji}</div>
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
              background: "rgba(14,16,18,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 28, padding: "64px 80px",
              textAlign: "center", maxWidth: 480,
              position: "relative"
            }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setLightbox(null)} style={{
                position: "absolute", top: 20, right: 20,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#f4f0ea", width: 36, height: 36, borderRadius: "50%",
                cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center"
              }}>×</button>
              <div style={{ fontSize: 96, marginBottom: 24 }}>{lightbox.emoji}</div>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{lightbox.label}</h3>
              <div style={{
                display: "inline-flex",
                background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.2)",
                borderRadius: 100, padding: "4px 16px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#c9a96e",
                letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600
              }}>{lightbox.category}</div>
              <p style={{ marginTop: 20, color: "rgba(244,240,234,0.55)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, fontSize: 15 }}>
                Experience the finest {lightbox.label.toLowerCase()} at Gmalina Court — crafted to exceed every expectation.
              </p>
              <a href="#contact" className="btn-primary" style={{ marginTop: 32, display: "inline-block" }} onClick={() => setLightbox(null)}>
                Book Now →
              </a>
            </div>
          </div>
        )}
      </section>

      {/* ─── BLOG ─── */}
      <section id="blog" style={{ padding: "120px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <AnimSection>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, flexWrap: "wrap", gap: 32 }}>
              <div>
                <span className="section-label">Stories & Insights</span>
                <div className="divider-line" />
                <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  From Our<br /><span className="gold-text">Journal</span>
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["All", "Travel Guide", "Cuisine", "Events", "Lifestyle", "Wellness", "Culture"].map(tag => (
                  <button key={tag} className={`blog-tag-btn ${activeBlogTag === tag ? "active" : ""}`} onClick={() => setActiveBlogTag(tag)}>{tag}</button>
                ))}
              </div>
            </div>
          </AnimSection>

          {/* Featured post */}
          {(activeBlogTag === "All" || BLOGS[0].category === activeBlogTag) && (
            <AnimSection>
              <div style={{
                background: "rgba(201,169,110,0.06)",
                border: "1px solid rgba(201,169,110,0.18)",
                borderRadius: 28,
                padding: "0",
                overflow: "hidden",
                display: "grid", gridTemplateColumns: "1fr 1.2fr",
                marginBottom: 24,
                cursor: "pointer",
                transition: "all 0.4s"
              }}>
                <div style={{
                  background: BLOGS[0].color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 120, padding: "60px",
                  borderRight: "1px solid rgba(201,169,110,0.12)"
                }}>{BLOGS[0].emoji}</div>
                <div style={{ padding: "52px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.15em", textTransform: "uppercase", color: "#c9a96e",
                      background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.25)",
                      padding: "4px 12px", borderRadius: 100
                    }}>⭐ Featured</span>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.1em", textTransform: "uppercase", color: "#14a08c",
                      background: "rgba(20,160,140,0.1)", border: "1px solid rgba(20,160,140,0.2)",
                      padding: "4px 12px", borderRadius: 100
                    }}>{BLOGS[0].category}</span>
                  </div>
                  <h3 style={{ fontSize: "clamp(22px, 2.5vw, 32px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: "-0.02em" }}>{BLOGS[0].title}</h3>
                  <p style={{ color: "rgba(244,240,234,0.6)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.75, fontSize: 15, fontWeight: 300, marginBottom: 28 }}>{BLOGS[0].excerpt}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 20 }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(244,240,234,0.4)" }}>📅 {BLOGS[0].date}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(244,240,234,0.4)" }}>⏱ {BLOGS[0].readTime}</span>
                    </div>
                    <span className="blog-read-more">Read Article →</span>
                  </div>
                </div>
              </div>
            </AnimSection>
          )}

          {/* Grid of remaining posts */}
          <div className="grid-3">
            {BLOGS.filter((b, i) => (i > 0 || activeBlogTag !== "All") && (activeBlogTag === "All" || b.category === activeBlogTag)).map((post, i) => (
              <AnimSection key={post.title} delay={i * 0.08}>
                <div className="blog-card">
                  <div style={{
                    background: post.color,
                    height: 180, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 72, borderBottom: "1px solid rgba(255,255,255,0.05)"
                  }}>{post.emoji}</div>
                  <div style={{ padding: "28px 28px 32px", display: "flex", flexDirection: "column", gap: 12, flexGrow: 1 }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.12em", textTransform: "uppercase", color: "#14a08c"
                    }}>{post.category}</span>
                    <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>{post.title}</h3>
                    <p style={{ color: "rgba(244,240,234,0.55)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.75, fontSize: 14, fontWeight: 300 }}>{post.excerpt}</p>
                    <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(244,240,234,0.35)" }}>📅 {post.date}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(244,240,234,0.35)" }}>⏱ {post.readTime}</span>
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
      <section id="faq" style={{ padding: "120px 32px", background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 80, alignItems: "start" }}>
            <AnimSection>
              <div style={{ position: "sticky", top: 120 }}>
                <span className="section-label">FAQ</span>
                <div className="divider-line" />
                <h2 style={{ fontSize: "clamp(32px, 3.5vw, 52px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 24 }}>
                  Questions<br /><span className="gold-text">Answered</span>
                </h2>
                <p style={{ color: "rgba(244,240,234,0.55)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8, fontSize: 15, fontWeight: 300, marginBottom: 40 }}>
                  Can't find what you're looking for? Our concierge team is available 24/7.
                </p>
                <a href="#contact" className="btn-primary">Ask a Question →</a>

                {/* Decorative element */}
                <div style={{
                  marginTop: 48,
                  background: "rgba(201,169,110,0.06)",
                  border: "1px solid rgba(201,169,110,0.15)",
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
            background: "linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(20,160,140,0.1) 100%)",
            border: "1px solid rgba(201,169,110,0.2)",
            borderRadius: 32, padding: "72px 64px",
            textAlign: "center",
            position: "relative", overflow: "hidden"
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(rgba(201,169,110,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,110,0.03) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }} />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 20, position: "relative" }}>
              Ready for an<br /><span className="gold-text">Unforgettable Stay?</span>
            </h2>
            <p style={{ color: "rgba(244,240,234,0.6)", maxWidth: 480, margin: "0 auto 40px", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8, position: "relative" }}>
              Reserve your room today and experience the finest hospitality in the heart of Malawi.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
              <a href="#contact" className="btn-primary">Book Your Room →</a>
              <a href="tel:+265998001909" className="btn-outline">+265 998 00 19 09</a>
            </div>
          </div>
        </div>
      </AnimSection>

      {/* ─── CONTACT ─── */}
      <section id="contact" style={{ padding: "0 32px 120px" }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "start" }}>
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
                      <div style={{ color: "rgba(244,240,234,0.75)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, whiteSpace: "pre-line", fontSize: 15 }}>{c.value}</div>
                    </div>
                  </div>
                </AnimSection>
              ))}
            </div>

            <AnimSection delay={0.2}>
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24, padding: "40px"
              }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 28 }}>Send us a Message</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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

      {/* ─── FOOTER ─── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "64px 32px 40px",
        background: "#06070a"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 64 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 38, height: 38, borderRadius: "10px", background: "linear-gradient(135deg, #c9a96e, #e8d5a3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏛️</div>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>Gmalina Court</span>
              </div>
              <p style={{ color: "rgba(244,240,234,0.4)", lineHeight: 1.8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", maxWidth: 280 }}>
                Premier lodge in Liwonde, Malawi. Where luxury meets the warm heart of Africa.
              </p>
            </div>
            {[
              { title: "Facilities", links: ["Accommodation", "Conference", "Restaurant", "Gym", "Swimming Pool"] },
              { title: "Explore", links: ["Gallery", "Blog", "FAQ", "Attractions", "About Us"] },
              { title: "Contact", links: ["+265 998 00 19 09", "pijotrust2012@yahoo.com", "Facebook", "Tripadvisor"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(244,240,234,0.4)", marginBottom: 20 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {col.links.map(l => <a key={l} href="#" className="footer-link">{l}</a>)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ color: "rgba(244,240,234,0.3)", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
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