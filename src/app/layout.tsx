import type { Metadata } from "next";
import { Navbar } from "@/components/interactive";
import { WalletProvider } from "@/components/wallet-provider";
import { Footer } from "@/components/footer";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Joint Venture — Real infrastructure. Shared opportunity.",
    template: "%s | Joint Venture",
  },
  description:
    "Explore transparent agricultural infrastructure financing. A clearly labelled frontend demonstration.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="jointventure">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <WalletProvider>
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
