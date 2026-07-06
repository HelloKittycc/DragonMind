import type { ReactNode } from "react";
import { AdvisorDrawer } from "@/components/layout/AdvisorDrawer";
import { BottomCaptureBar } from "./BottomCaptureBar";

type Props = {
  children: ReactNode;
  dateText: string;
};

export function MobileShell({ children, dateText }: Props) {
  return (
    <main className="sf-page">
      <section className="sf-phone">
        <header className="sf-header">
          <AdvisorDrawer buttonClassName="sf-brand-mark sf-menu-button" />
          <strong>DragonMind</strong>
          <time>{dateText}</time>
        </header>
        {children}
        <BottomCaptureBar />
      </section>
    </main>
  );
}
