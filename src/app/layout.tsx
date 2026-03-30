import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForgeOS",
  description: "AI-native product execution system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
