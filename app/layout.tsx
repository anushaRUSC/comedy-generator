import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mood Joke Generator",
  description: "A cozy little joke generator that turns your mood into a gentle smile."
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
