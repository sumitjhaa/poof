import type { Metadata } from "next";
import "@/styles/globals.css";
import KeepAlive from "@/components/KeepAlive";

export const metadata: Metadata = {
  title: "Poof - One-Time Secret Sharing",
  description: "Share secrets securely with end-to-end encryption. One-time access. Zero knowledge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <KeepAlive />
        {children}
      </body>
    </html>
  );
}
