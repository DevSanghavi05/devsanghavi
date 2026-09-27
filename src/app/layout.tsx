import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import {
  SITE_URL,
  DEFAULT_TITLE,
  TITLE_TEMPLATE,
  KEYWORDS,
  PERSON,
  buildPersonJsonLd,
} from "@/lib/seo";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: TITLE_TEMPLATE,
  },
  description: PERSON.tagline,
  keywords: KEYWORDS,
  authors: [{ name: PERSON.name, url: SITE_URL }],
  creator: PERSON.name,
  publisher: PERSON.name,
  applicationName: PERSON.name,
  alternates: {
    canonical: "/",
  },
  category: "technology",
  openGraph: {
    title: DEFAULT_TITLE,
    description: PERSON.tagline,
    url: SITE_URL,
    siteName: PERSON.name,
    locale: "en_US",
    type: "profile",
    firstName: PERSON.givenName,
    lastName: PERSON.familyName,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dev Sanghavi — developer, creator, and founder of Learnr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@devsanghavi05",
    creator: "@devsanghavi05",
    title: DEFAULT_TITLE,
    description: PERSON.tagline,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${spaceGrotesk.className} bg-white text-zinc-900 antialiased selection:bg-zinc-200`}
      >
        <script
          type="application/ld+json"
          // Structured data (Person + Organization + WebSite) — powers the
          // "Dev Sanghavi is…" knowledge result. Rendered as static markup.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPersonJsonLd()) }}
        />
        {children}
      </body>
    </html>
  );
}
