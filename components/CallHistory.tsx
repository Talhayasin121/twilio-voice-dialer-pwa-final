"use client";

export interface CallRecord {
  id: string;
  number: string;
  duration: number;
  timestamp: number;
  type: "outbound" | "incoming";
}

interface CallHistoryProps {
  history: CallRecord[];
  onRedial: (number: string) => void;
  onClear: () => void;
}

export default function CallHistory({ history, onRedial, onClear }: CallHistoryProps) {
  const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div className="history-header">
        <span className="history-title">Recent Calls</span>
        <button className="history-clear" onClick={onClear}>
          Clear All
        </button>
      </div>
      <ul className="history-list">
        {history.map((call) => (
          <li key={call.id} className="history-item" onClick={() => onRedial(call.number)}>
            <div className="history-item-left">
              <div className="history-icon">
                {call.type === "outbound" ? "↗" : "↙"}
              </div>
              <div>
                <div className="history-number">{call.number}</div>
                <div className="history-time">{formatTimestamp(call.timestamp)}</div>
              </div>
            </div>
            <div className="history-duration">{formatDuration(call.duration)}</div>
          </li>
        ))}
      </ul>
    </>
  );
}
