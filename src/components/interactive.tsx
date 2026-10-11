"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { WalletButton } from "./wallet";
export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/", label: "Overview" },
    { href: "/projects/bavaria", label: "Project" },
    { href: "/facility", label: "Facility" },
    { href: "/documents", label: "Documents" },
    { href: "/portfolio", label: "Portfolio" },
  ];
  return (
    <header className="site-header">
      <nav className="container nav" aria-label="Main navigation">
        <Link className="wordmark" href="/" onClick={() => setOpen(false)}>
          <Brand />
        </Link>
        <div className="desktop-links">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={pathname === l.href ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          <WalletButton />
          <button
            className="btn btn-ghost menu-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close navigation" : "Open navigation"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div id="mobile-navigation" className="mobile-navigation">
            {links.map((l) => (
              <Link
                href={l.href}
                key={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
