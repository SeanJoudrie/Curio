import { Component, type ReactNode } from "react";
import { exportData } from "./storage";

// A single thrown render must never white-screen the whole app. Catch it, show
// a calm fallback, and give the user a one-tap backup so a crash can't cost
// them their cabinet (local-only data).
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }

  backup = () => {
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([exportData()], { type: "application/json" }));
      a.download = "curio-backup.json";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* ignore — nothing more we can do */ }
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 28, gap: 12, background: "var(--paper)", color: "var(--ink)" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 26 }}>Something hiccupped.</div>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, maxWidth: "34ch", lineHeight: 1.5 }}>
          Your cabinet is safe on this device. Reload to keep going — or back it up first, just in case.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button className="btn-primary" style={{ width: "auto", padding: "12px 22px" }} onClick={() => location.reload()}>Reload</button>
          <button className="btn-ghost" style={{ width: "auto", padding: "12px 22px" }} onClick={this.backup}>Back up my cabinet</button>
        </div>
      </div>
    );
  }
}
