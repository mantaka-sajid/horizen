import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horizen — See nature. Share moments.",
  description: "A welcoming community for nature photographers and curious minds.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
