import Link from "next/link";
import { Leaf, ArrowUpRight } from "lucide-react";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link href="/" className="wordmark">
              <span className="brand-icon">
                <Leaf size={20} />
              </span>
              joint<span className="wordmark-light">venture</span>
              <span className="brand-period">.</span>
            </Link>
            <p>Real infrastructure. Shared opportunity.</p>
          </div>
          <div className="footer-links">
            <Link href="/projects">
              Marketplace <ArrowUpRight size={14} />
            </Link>
            <Link href="/#how-it-works">
              How It Works <ArrowUpRight size={14} />
            </Link>
            <span
              aria-disabled="true"
              title="Repository URL has not been supplied"
            >
              GitHub <small>Unavailable · URL pending</small>
            </span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Joint Venture. Devnet MVP.</span>
          <p>
            Demo only. All financial figures are projections, not guaranteed
            returns. Financing uses Devnet test tokens. EUR portfolio figures
            are demo data. Document fingerprints establish file integrity,
            without independently authenticating issuers or contents.
          </p>
        </div>
      </div>
    </footer>
  );
}
