import type { Metadata } from "next";
import { Playfair_Display, DM_Mono, Lato, Caveat } from "next/font/google";
import AppHeader from "@/features/auth/components/AppHeader/AppHeader";
import BirdGuideChat from "@/features/bird-guide/components/BirdGuideChat";
import BirdGuideChatProvider from "@/features/bird-guide/components/BirdGuideChatProvider/BirdGuideChatProvider";
import { getUser } from "@/features/auth/auth-helpers";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "BirdDex",
  description: "A field guide to birds, each with a personality.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmMono.variable} ${lato.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppHeader />
        <BirdGuideChatProvider isAuthenticated={!!user}>
          {children}
          <BirdGuideChat />
        </BirdGuideChatProvider>
      </body>
    </html>
  );
}
