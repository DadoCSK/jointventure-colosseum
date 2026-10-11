import type { Metadata } from "next";
import { Navbar } from "@/components/interactive";
import { WalletProvider } from "@/components/wallet-provider";
import { Footer } from "@/components/footer";
import "./globals.css";
import "./industrial.css";
import { UiVariantProvider, appearanceScript } from "@/components/ui-variant";
export const metadata: Metadata = {
  title: {
    default: "Joint Venture — Real infrastructure. Shared opportunity.",
    template: "%s | Joint Venture",
  },
  description:
    "Explore transparent agricultural infrastructure financing. Inspired by Bavaria’s real founding project, with a separate live Solana Devnet financing demo.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="jointventure" data-ui-variant="classic" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: appearanceScript }} /></head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <UiVariantProvider><WalletProvider>
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
        </WalletProvider></UiVariantProvider>
      </body>
    </html>
  );
}
