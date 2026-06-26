"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="shell">
      <section className="panel stack">
        <h1>读取失败。请稍后重试。</h1>
        <button className="button" onClick={reset} type="button">
          重试
        </button>
      </section>
    </main>
  );
}
