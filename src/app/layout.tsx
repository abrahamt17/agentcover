import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "AgentCover · AI-agent risk intelligence",
    template: "%s · AgentCover",
  },
  description:
    "AgentCover helps businesses and AI developers assess, manage and prepare to insure the risks created by autonomous AI agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster theme="dark" position="bottom-right" closeButton toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  );
}
