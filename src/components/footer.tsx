import Link from "next/link";
import { Brand } from "./brand";
export function Footer() {
  return <footer className="site-footer compact-footer"><div className="container">
    <div><Link href="/" className="footer-brand"><Brand /></Link><span>Fund real productive infrastructure. See what your capital is building.</span></div>
    <p>Prototype · Devnet tokens have no monetary value · Facility data is simulated. Business facts are developer-supplied; documents are not independently authenticated.</p>
  </div></footer>;
}
