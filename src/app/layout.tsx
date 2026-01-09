import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { getServerSession } from "next-auth";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import { authOptions } from "@/lib/authOptions";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Social",
  description: "Rede social focada em conversas, perfis e interesses.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR">
      <body className={`${grotesk.variable}`}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
