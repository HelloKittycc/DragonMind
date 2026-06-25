import { InputCapture } from "@/components/input/InputCapture";

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1 className="brand">DragonMind</h1>
          <p className="muted">Record first. Analyze later.</p>
        </div>
      </header>
      <InputCapture />
    </main>
  );
}
