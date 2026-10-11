import Link from "next/link";
import { Brand } from "./brand";
export function Footer() {
  return <footer className="site-footer compact-footer"><div className="container">
    <div><Link href="/" className="footer-brand"><Brand /></Link><span>Finance real infrastructure. Verify what your capital is building.</span></div>
    <p>Prototype · Devnet SOL has no monetary value · Facility data is simulated. Business facts are developer-supplied; documents are not independently authenticated.</p>
  </div></footer>;
}
