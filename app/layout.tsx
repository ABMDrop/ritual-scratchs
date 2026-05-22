import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ritual Scratch",
  description: "Scratch & earn Ritual Points on the Ritual Testnet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
