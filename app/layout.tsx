import type { Metadata, Viewport } from "next";

// ─── Site constants ───────────────────────────────────────────────────────────
const SITE_URL  = "https://gmalina-court.netlify.app";
const SITE_NAME = "Gmalina Court Lodge";
const TAGLINE   = "Luxury Lodge & Safari Gateway in Liwonde, Malawi";
const DESCRIPTION =
  "Gmalina Court is Malawi's premier luxury lodge on M5 Road, Liwonde — gateway to Liwonde National Park. Book your stay for world-class accommodation, conference facilities, fine dining, and guided safari adventures.";

const KEYWORDS = [
  "Gmalina Court Lodge",
  "Gmalina Court Liwonde",
  "luxury lodge Malawi",
  "Liwonde lodge",
  "Liwonde National Park accommodation",
  "hotel Liwonde Malawi",
  "safari lodge Malawi",
  "Machinga hotel",
  "Malawi accommodation",
  "lodge near Liwonde National Park",
  "conference venue Liwonde",
  "luxury hotel southern Malawi",
  "M5 Road Liwonde lodge",
  "best hotel Liwonde",
  "Malawi safari hotel",
  "Liwonde game park hotel",
  "Malawi wildlife lodge",
  "corporate retreat Malawi",
  "wedding venue Malawi",
  "romantic getaway Malawi",
].join(", ");
// ─────────────────────────────────────────────────────────────────────────────

export const viewport: Viewport = {
  themeColor: "#c9a96e",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  // ── Core ──────────────────────────────────────────────────────────────────
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "travel",

  // ── Canonical ─────────────────────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
  },

  // ── Open Graph (Facebook, WhatsApp, LinkedIn previews) ────────────────────
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${TAGLINE}`,
    description: DESCRIPTION,
    locale: "en_MW",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Gmalina Court Lodge — Luxury Safari Lodge in Liwonde, Malawi",
        type: "image/jpeg",
      },
    ],
  },

  // ── Twitter / X card ──────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${TAGLINE}`,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-image.jpg`],
    creator: "@GmalinaCourtLodge",
  },

  // ── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico",    sizes: "any"   },
      { url: "/icon-192.png",   sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png",   sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },

  // ── Web app manifest ──────────────────────────────────────────────────────
  manifest: "/manifest.json",

  // ── Verification (add your actual codes from Search Console / Bing) ───────
  verification: {
    google: "VwnY_TzlfmAdLU3lQza6CQXWC7VSUpGEcFR3xX2o1Zc",
    other: {
      "msvalidate.01": "REPLACE_WITH_BING_WEBMASTER_CODE",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ── Preconnect to speed up font/image loading ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />

        {/* ── JSON-LD Structured Data — tells Google exactly what this business is ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              // ── LodgingBusiness schema ──────────────────────────────────
              {
                "@context": "https://schema.org",
                "@type": "LodgingBusiness",
                "@id": `${SITE_URL}/#lodging`,
                name: "Gmalina Court Lodge",
                alternateName: "Gmalina Court",
                description: DESCRIPTION,
                url: SITE_URL,
                telephone: "+265998001909",
                email: "pijotrust2012@yahoo.com",
                priceRange: "$$",
                currenciesAccepted: "MWK, USD",
                paymentAccepted: "Cash, Credit Card, Mobile Money",
                starRating: { "@type": "Rating", ratingValue: "4.7" },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.7",
                  reviewCount: "500",
                  bestRating: "5",
                  worstRating: "1",
                },
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "M5 Road, Next to Fcapital Bank",
                  addressLocality: "Liwonde",
                  addressRegion: "Machinga",
                  addressCountry: "MW",
                  postalCode: "P.O. Box 6",
                },
                geo: {
                  "@type": "GeoCoordinates",
                  latitude:  -15.0583,
                  longitude:  35.2311,
                },
                hasMap: "https://maps.google.com/?q=Liwonde,Malawi",
                openingHours: "Mo-Su 00:00-24:00",
                amenityFeature: [
                  { "@type": "LocationFeatureSpecification", name: "Swimming Pool",        value: true },
                  { "@type": "LocationFeatureSpecification", name: "Restaurant",           value: true },
                  { "@type": "LocationFeatureSpecification", name: "Bar",                  value: true },
                  { "@type": "LocationFeatureSpecification", name: "Conference Facilities", value: true },
                  { "@type": "LocationFeatureSpecification", name: "Fitness Centre",        value: true },
                  { "@type": "LocationFeatureSpecification", name: "Free WiFi",             value: true },
                  { "@type": "LocationFeatureSpecification", name: "Airport Transfer",      value: true },
                  { "@type": "LocationFeatureSpecification", name: "Safari Packages",       value: true },
                ],
                image: [
                  `${SITE_URL}/og-image.jpg`,
                  "https://images.unsplash.com/photo-1587502537745-84b86da1204f?w=1200",
                  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200",
                ],
                sameAs: [
                  "https://www.facebook.com/gmalina.court",
                  "https://www.tripadvisor.com",
                ],
                containsPlace: [
                  { "@type": "FoodEstablishment", name: "Gmalina Court Restaurant", servesCuisine: ["Malawian", "International"] },
                  { "@type": "SportsActivityLocation", name: "Gmalina Court Swimming Pool" },
                  { "@type": "ExerciseGym", name: "Gmalina Court Fitness Centre" },
                  { "@type": "EventVenue", name: "Gmalina Court Conference Hall", maximumAttendeeCapacity: 100 },
                ],
                nearbyAttraction: [
                  {
                    "@type": "TouristAttraction",
                    name: "Liwonde National Park",
                    description: "Premier safari destination with elephants, hippos, and lions",
                    distance: "5 minutes",
                  },
                  {
                    "@type": "TouristAttraction",
                    name: "Lake Malawi",
                    description: "Crystal-clear freshwater lake, UNESCO World Heritage Site",
                    distance: "45 minutes",
                  },
                ],
              },

              // ── BreadcrumbList ───────────────────────────────────────────
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Rooms", item: `${SITE_URL}/#rooms` },
                  { "@type": "ListItem", position: 3, name: "Facilities", item: `${SITE_URL}/#facilities` },
                  { "@type": "ListItem", position: 4, name: "Gallery", item: `${SITE_URL}/#gallery` },
                  { "@type": "ListItem", position: 5, name: "Contact", item: `${SITE_URL}/#contact` },
                ],
              },

              // ── FAQPage schema (gets FAQ rich snippets in Google) ────────
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "What are the check-in and check-out times at Gmalina Court Lodge?",
                    acceptedAnswer: { "@type": "Answer", text: "Check-in is from 2:00 PM and check-out is by 11:00 AM. Early check-in and late check-out can be arranged subject to availability." },
                  },
                  {
                    "@type": "Question",
                    name: "Is Gmalina Court Lodge near Liwonde National Park?",
                    acceptedAnswer: { "@type": "Answer", text: "Yes, Gmalina Court is just 5 minutes from Liwonde National Park, one of Africa's premier safari destinations. We can arrange game drives, boat safaris, and guided walking tours." },
                  },
                  {
                    "@type": "Question",
                    name: "Does Gmalina Court have conference facilities?",
                    acceptedAnswer: { "@type": "Answer", text: "Yes, our fully equipped conference hall hosts up to 100 guests with 4K AV equipment, high-speed Wi-Fi, and professional catering packages." },
                  },
                  {
                    "@type": "Question",
                    name: "How do I book a room at Gmalina Court Lodge?",
                    acceptedAnswer: { "@type": "Answer", text: "You can book directly on our website at gmalina-court.netlify.app, or call us at +265 998 00 19 09. A 20% deposit is required to confirm your reservation." },
                  },
                  {
                    "@type": "Question",
                    name: "What is the address of Gmalina Court Lodge?",
                    acceptedAnswer: { "@type": "Answer", text: "Gmalina Court Lodge is located on M5 Road, next to Fcapital Bank, Liwonde, Machinga District, Malawi." },
                  },
                ],
              },
            ]),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}