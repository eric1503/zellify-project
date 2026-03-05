import type { Metadata } from "next";
import localFont from "next/font/local";
import { Agentation } from "agentation";
import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import "./globals.css";

const aspekta = localFont({
  src: [
    {
      path: "./fonts/Aspekta-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Aspekta-600.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-aspekta-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zellify",
  description: "Zellify — AI-powered workflow builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${aspekta.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
        {process.env.NODE_ENV === "development" && <DialRoot position="top-right" defaultOpen={false} />}
      </body>
    </html>
  );
}
