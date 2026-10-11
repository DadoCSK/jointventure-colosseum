"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf,
  Menu,
  X,
} from "lucide-react";
import {
  projects,
} from "@/data/projects";
import { ProjectCard } from "./ui";
import { Modal } from "./modal";
import { WalletButton } from "./wallet";
import { AppearanceSwitch } from "./ui-variant";
export function NoticeButton({
  children,
  title,
  message,
  className,
}: {
  children: ReactNode;
  title: string;
  message: string;
  className?: string;
}) {
  return (
    <Modal trigger={children} title={title} className={className}>
      <span className="modal-phase">PHASE 2</span>
      <p>{message}</p>
    </Modal>
  );
}
export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/projects", label: "Marketplace" },
    { href: "/portfolio", label: "My Portfolio" },
    { href: "/#how-it-works", label: "How It Works" },
  ];
  return (
    <header className="site-header">
      <nav className="container nav" aria-label="Main navigation">
        <Link className="wordmark" href="/" onClick={() => setOpen(false)}>
          <span className="brand-icon">
            <Leaf size={22} />
          </span>
          joint<span className="wordmark-light">venture</span>
          <span className="brand-period">.</span>
        </Link>
        <div className="desktop-links">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname.startsWith(l.href) ? "page" : undefined}
              className={pathname.startsWith(l.href) ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          <div className="desktop-appearance"><AppearanceSwitch /></div>
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
            <AppearanceSwitch />
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
export { InvestmentModal } from "./financing";
export { DocumentIntegrityCard as VerificationCard } from "./document-integrity";
export function Marketplace() {
  const [filter, setFilter] = useState("All projects");
  const filters = ["All projects", "Agriculture", "Processing", "Storage"];
  const filtered = projects.filter(
    (p) => filter === "All projects" || p.category === filter,
  );
  return (
    <>
      <div className="filter-bar">
        <div className="filters" role="group" aria-label="Filter projects">
          {filters.map((f) => (
            <button
              key={f}
              className={`btn filter ${filter === f ? "selected" : ""}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="result-count" aria-live="polite">
          {filtered.length} projects
        </span>
      </div>
      {filtered.length ? (
        <div className="project-grid">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} index={projects.indexOf(p)} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Leaf size={32} />
          <h2>No {filter.toLowerCase()} projects yet</h2>
          <p>
            New demo opportunities will appear here as the marketplace grows.
          </p>
          <button
            className="btn btn-outline"
            onClick={() => setFilter("All projects")}
          >
            View all projects
          </button>
        </div>
      )}
    </>
  );
}
