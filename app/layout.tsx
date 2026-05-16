import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Free Image to PDF Converter Online | JPG PNG HEIC to PDF",

  description:
    "Convert JPG, PNG, WEBP and HEIC images into PDF directly in your browser. Fast, private and free image to PDF converter with no uploads.",

  keywords: [
    "image to pdf",
    "jpg to pdf",
    "png to pdf",
    "heic to pdf",
    "free image to pdf converter",
    "browser image to pdf",
    "private image to pdf",
    "iphone heic to pdf",
  ],

  verification: {
    google: "3bw6Cono_cPqaJelDWtpZLu0JClxHuckW8WRRlzUEzQ",
  },

  openGraph: {
    title:
      "Free Image to PDF Converter Online | JPG PNG HEIC to PDF",

    description:
      "Convert JPG, PNG, WEBP and HEIC images into PDF directly in your browser.",

    url: "https://image-to-pdf-umber-chi.vercel.app",

    siteName: "Image To PDF Tool",

    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}