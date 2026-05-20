// app/layout.tsx

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Nagani",
  title: {
    default: "Nagani | နဂါးနီ",
    template: "%s | Nagani",
  },
  description: "A premium Myanmar red-dragon casino player experience.",
  keywords: [
    "Nagani",
    "နဂါးနီ",
    "Red Dragon Casino",
    "Myanmar Casino",
    "Slot Game",
  ],
  authors: [{ name: "Nagani" }],
  creator: "Nagani",
  publisher: "Nagani",
  category: "game",
  openGraph: {
    title: "Nagani | နဂါးနီ",
    description: "A premium Myanmar red-dragon casino player experience.",
    siteName: "Nagani",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Nagani | နဂါးနီ",
    description: "A premium Myanmar red-dragon casino player experience.",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#070202",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#070202] text-[#FFF7D6]">
        {children}
      </body>
    </html>
  );
}