import type { Metadata } from "next";
import { Navbar } from "@/components/interactive";
import { WalletProvider } from "@/components/wallet-provider";
import { Footer } from "@/components/footer";
import "./globals.css";
import "./industrial.css";
import "./dashboard.css";
import "./digital-twin.css";
export const metadata: Metadata = {
  title: {
    default: "Joint Venture — Finance real infrastructure.",
    template: "%s | Joint Venture",
  },
  description:
    "Finance real infrastructure. Verify what your capital is building. Bavaria project financing, onchain records and planned facility visibility.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="jointventure-industrial" data-scroll-behavior="smooth">
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
