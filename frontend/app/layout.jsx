import "./globals.css";
import { Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/shared/providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata = {
  title: "ElevenOrbits",
  description: "Managed hosting, AI, workflow automation, and support services.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body className={spaceGrotesk.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
