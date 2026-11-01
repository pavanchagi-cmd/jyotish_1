"use client";

/** Last-resort error page (root layout failed). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#14112B", color: "#F4F1FF", fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <main style={{ maxWidth: 480, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 style={{ margin: 0 }}>Something went wrong</h1>
          <p style={{ margin: 0, color: "#B8B3D6" }}>Please try again. If it keeps happening, the site owner can open /api/health to see what needs fixing.</p>
          {error.digest ? <p style={{ margin: 0, fontSize: 12, color: "#B8B3D6" }}>Error reference: {error.digest}</p> : null}
          <button type="button" onClick={reset} style={{ height: 48, borderRadius: 12, border: 0, background: "#F5A524", color: "#1A1405", fontWeight: 600 }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
