import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next"
import * as React from "react";
import { RouteChangeTransition } from "@/components/layout/route-change-transition";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revshare.fast";
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RevShare - Revenue Share Marketplace for Indie SaaS",
    template: "%s | RevShare",
  },
  description:
    "RevShare helps indie SaaS founders and marketers share recurring revenue with transparent tracking, Stripe-based payouts, and public performance.",
  keywords: [
    "revshare",
    "revenue sharing",
    "affiliate marketing",
    "indie hackers",
    "saas partnerships",
    "stripe connect",
    "performance marketing",
    "partner program",
    "saas affiliate program",
    "recurring commissions",
    "affiliate network alternative",
    "performance-based marketing",
    "saas growth",
    "marketer marketplace",
  ],
  authors: [{ name: "RevShare", url: siteUrl }],
  creator: "RevShare",
  publisher: "RevShare",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
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
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "RevShare - Revenue Share Marketplace for Indie SaaS",
    description:
      "Find marketers, publish programs, and share recurring revenue with transparent tracking and Stripe-based payouts.",
    siteName: "RevShare",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RevShare - Revenue Share Marketplace for Indie SaaS",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RevShare - Revenue Share Marketplace for Indie SaaS",
    description:
      "Find marketers, publish programs, and share recurring revenue with transparent tracking and Stripe-based payouts.",
    creator: "@revshare",
    site: "@revshare",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RevShare - Revenue Share Marketplace for Indie SaaS",
      },
    ],
  },
  icons: {
    icon: "/favicon.svg",
  },
  category: "technology",
  classification: "Business Software",
};

// JSON-LD Structured Data for SEO and AEO
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "RevShare",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
      },
      description:
        "RevShare is the first transparent revenue-sharing marketplace connecting indie SaaS founders with performance marketers.",
      foundingDate: "2024",
      sameAs: [
        "https://twitter.com/revshare",
        "https://linkedin.com/company/revshare",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        email: "support@revshare.fast",
        contactType: "customer support",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "RevShare",
      description:
        "Revenue Share Marketplace for Indie SaaS - Connect founders with performance marketers",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/projects?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#application`,
      name: "RevShare",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "A marketplace platform connecting SaaS founders with performance marketers through transparent revenue sharing agreements.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free for marketers, paid plans for founders",
      },
      featureList: [
        "Stripe-verified revenue tracking",
        "Refund-aware commission calculations",
        "Automated Stripe Connect payouts",
        "Public performance leaderboards",
        "Milestone-based reward system",
        "Direct founder-marketer connections",
      ],
      provider: {
        "@id": `${siteUrl}/#organization`,
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What is RevShare?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "RevShare is a transparent revenue-sharing marketplace that connects indie SaaS founders with performance marketers. Unlike traditional affiliate networks, RevShare uses Stripe-verified revenue data and handles automatic payouts.",
          },
        },
        {
          "@type": "Question",
          name: "How does RevShare differ from affiliate networks?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "RevShare eliminates middlemen by connecting founders directly with marketers. Revenue data comes straight from Stripe, ensuring both parties see identical numbers. Commissions are held during refund windows, and payouts are automated through Stripe Connect.",
          },
        },
        {
          "@type": "Question",
          name: "Is RevShare free for marketers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, RevShare is completely free for marketers. There are no subscription fees, platform fees, or payout cuts. Marketers keep 100% of their earned commissions.",
          },
        },
        {
          "@type": "Question",
          name: "How do payouts work on RevShare?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Payouts are handled automatically through Stripe Connect. Commissions are held during the refund window set by founders, and once that period passes, earnings become available for payout.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <link rel="canonical" href={siteUrl} />
        <meta name="theme-color" content="#ffe924ff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RevShare" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="light" storageKey="revshare-theme">
          <ReactQueryProvider>
            {children}
            <Toaster />
          </ReactQueryProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics/>
        <SmoothScroll />
      </body>
    </html>
  );
}
