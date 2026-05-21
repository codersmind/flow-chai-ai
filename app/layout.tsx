import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalVoiceFlow",
  description: "Local-first voice and chat agent builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
