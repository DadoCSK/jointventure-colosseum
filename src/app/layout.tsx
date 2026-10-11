import type { Metadata } from "next";
import { Navbar } from "@/components/interactive";
import { WalletProvider } from "@/components/wallet-provider";
import { Footer } from "@/components/footer";
import "./globals.css";
import "./industrial.css";
import "./dashboard.css";
import "./digital-twin.css";
import { UiVariantProvider, appearanceScript } from "@/components/ui-variant";
export const metadata: Metadata = {
  title: {
    default: "Joint Venture — Fund real productive infrastructure.",
    template: "%s | Joint Venture",
  },
  description:
    "Fund real productive infrastructure and see what your capital is building. Bavaria project financing, onchain records and planned facility visibility.",
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
