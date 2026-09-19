import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
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
    default: "Settora — shared cards, UPI, and approved paybacks",
    template: "%s · Settora",
  },
  description:
    "Create a group, share an invite link, log card or UPI charges, and require the receiver to approve repayments.",
  applicationName: "Settora",
  authors: [{ name: "OpusKiln / Shubham Mishra" }],
  creator: "OpusKiln",
  publisher: "OpusKiln",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Settora",
    title: "Settora — shared cards, UPI, and approved paybacks",
    description:
      "Shared card and UPI groups with receiver-approved settlements. An OpusKiln product.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Settora — shared cards, UPI, and approved paybacks",
    description:
      "Shared card and UPI groups with receiver-approved settlements.",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
