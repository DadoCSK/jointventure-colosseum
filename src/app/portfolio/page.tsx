import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { WalletPanel } from "@/components/wallet";
import { OnchainProject, FinancingHistory } from "@/components/financing";
export const metadata: Metadata = { title: "Portfolio" };
export default function Portfolio() {
  return <div className="container page-content focused-portfolio">
    <PageHeader eyebrow="BAVARIA · YOUR ONCHAIN RECORDS" title="Portfolio" />
    <OnchainProject portfolio />
    <FinancingHistory />
    <WalletPanel />
  </div>;
}
