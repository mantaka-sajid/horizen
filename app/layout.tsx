
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horizen — See Nature. Share Moments.",
  description:
    "A photography community for nature lovers. Share what you see and inspire someone else.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
