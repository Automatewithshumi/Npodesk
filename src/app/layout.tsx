import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NpoDesk — Community Management Platform",
  description: "Community outreach management platform by NpoDesk",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
