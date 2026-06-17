import "./globals.css";
import { Providers } from "@/components/shared/providers";

export const metadata = {
  title: "ElevenOrbits",
  description: "Managed hosting, AI, workflow automation, and support services.",
  icons: {
    icon: "/invoice.png",
    shortcut: "/invoice.png",
    apple: "/invoice.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
