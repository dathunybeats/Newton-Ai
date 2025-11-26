import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { NoteProvider } from "@/contexts/NoteContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Newton AI - An AI tutor made for you",
  description: "Turn your learning materials into notes, interactive chats, quizzes, and more. Learn smarter, faster, easier.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <ThemeProvider>
          <NoteProvider>
            {children}
          </NoteProvider>
        </ThemeProvider>
        <Analytics />
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="dfid_DbE9hAe2HvIhrNSRbC3WY"
          data-domain="www.newtonstudy.app"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
