import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Система заказов",
  description: "Система обработки и мониторинга заказов Автодом - Союз",
  applicationName: "Система заказов",
  openGraph: {
    title: "Система заказов",
    description: "Система обработки и мониторинга заказов Автодом - Союз",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Система заказов",
    description: "Система обработки и мониторинга заказов Автодом - Союз",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>{children}</body>
    </html>
  );
}