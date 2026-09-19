import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://settora.opuskiln.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Settora: shared cards, UPI, paybacks that need approval",
    template: "%s · Settora",
  },
  description:
    "Make a group, share an invite, log card or UPI charges. Paybacks only count after the person owed approves.",
  applicationName: "Settora",
  authors: [{ name: "OpusKiln / Shubham Mishra" }],
  creator: "OpusKiln",
  publisher: "OpusKiln",
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Settora",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Settora",
    title: "Settora: shared cards, UPI, paybacks that need approval",
    description:
      "Friend groups for shared cards and UPI. Settlements wait on receiver approval. Built by OpusKiln.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Settora: shared cards, UPI, paybacks that need approval",
    description:
      "Friend groups for shared cards and UPI. Settlements wait on receiver approval.",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1f5c4d" },
    { media: "(prefers-color-scheme: dark)", color: "#1f5c4d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
