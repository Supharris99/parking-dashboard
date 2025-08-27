import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {Theme} from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
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
  title: "Sistem Parkir PNP",
  description: "Sistem Parkir PNP adalah sistem parkir yang dibuat oleh PNP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Theme appearance="inherit" accentColor="blue" grayColor="sand" radius="large" scaling="100%">{children}</Theme>
          </ThemeProvider>
      </body>
    </html>
  );
}
