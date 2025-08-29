import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kevin Cauto - AI-Focused Software Engineer",
  description: "Portfolio showcasing software engineering projects including Sweet Potato Tattoo, lease generators, and Pokemon log parsers.",
  icons: {
    icon: [
      { url: '/watch-favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/watch-favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/watch-favicon.png',
    apple: '/watch-favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Header />
      </body>
    </html>
  );
}
