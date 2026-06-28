import type { ReactNode } from "react";
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
          <div className="sf-brand-mark">DM</div>
          <strong>DragonMind</strong>
          <time>{dateText}</time>
        </header>
        {children}
        <BottomCaptureBar />
      </section>
    </main>
  );
}
