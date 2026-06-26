import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <>
      <div className="app-shell">{children}</div>
      <nav className="mobile-bottom-nav" aria-label="移动端导航">
        <Link href="/">观察</Link>
        <Link href="/workspace">工作区</Link>
        <Link href="/#quick-capture">记录</Link>
      </nav>
    </>
  );
}

type PageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="brand">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}
