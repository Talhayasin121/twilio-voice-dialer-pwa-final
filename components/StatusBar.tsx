"use client";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
type NetworkQuality = "good" | "warning" | "poor";

interface StatusBarProps {
  status: ConnectionStatus;
  networkQuality: NetworkQuality;
  onReconnect: () => void;
}

const statusLabels: Record<ConnectionStatus, string> = {
  connecting: "Connecting...",
  connected: "Ready",
  disconnected: "Offline",
  error: "Error",
};

export default function StatusBar({ status, networkQuality, onReconnect }: StatusBarProps) {
  const dotClass = status === "connected" ? "connected" : status === "connecting" ? "connecting" : "disconnected";

  return (
    <div className="status-bar">
      <div className="status-label">
        <span className={`status-dot ${dotClass}`} />
        <span className="status-text">{statusLabels[status]}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="network-indicator">
          {[8, 12, 16, 20].map((h, i) => {
            let barClass = "";
            if (networkQuality === "good") barClass = i <= 3 ? "active" : "";
            else if (networkQuality === "warning") barClass = i <= 1 ? "warning" : "";
            else barClass = i === 0 ? "poor" : "";
            return <div key={i} className={`network-bar ${barClass}`} style={{ height: h }} />;
          })}
        </div>
        {(status === "disconnected" || status === "error") && (
          <button
            onClick={onReconnect}
            style={{
              background: "none",
              border: "1px solid var(--border-glass)",
              color: "var(--text-secondary)",
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Reconnect
          </button>
        )}
      </div>
    </div>
  );
}
