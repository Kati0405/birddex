import type { Metadata } from "next";
import { Playfair_Display, DM_Mono, Lato, Caveat } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import AppHeader from "@/features/auth/components/AppHeader/AppHeader";
import AskRobinChat from "@/features/bird-guide/components/AskRobinChat";
import AskRobinChatProvider from "@/features/bird-guide/components/AskRobinChatProvider/AskRobinChatProvider";
import { getUser } from "@/features/auth/auth-helpers";
import { type Locale } from '@/i18n/locales';
import "../globals.css";

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
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const messages = await getMessages();
  const user = await getUser();

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${dmMono.variable} ${lato.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <AppHeader />
          <AskRobinChatProvider isAuthenticated={!!user}>
            {children}
            <AskRobinChat />
          </AskRobinChatProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
