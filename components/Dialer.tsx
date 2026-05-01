"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Device, Call } from "@twilio/voice-sdk";
import DialPad from "./DialPad";
import CallHistory, { CallRecord } from "./CallHistory";
import FeedbackModal from "./FeedbackModal";
import StatusBar from "./StatusBar";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
type NetworkQuality = "good" | "warning" | "poor";

export default function Dialer() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [callState, setCallState] = useState<"idle" | "connecting" | "ringing" | "active">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>("good");
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showDialpadInCall, setShowDialpadInCall] = useState(false);

  const deviceRef = useRef<Device | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartRef = useRef<number>(0);
  const lastCallRef = useRef<{ number: string; start: number } | null>(null);

  // Load call history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("twilio-call-history");
      if (saved) setCallHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // Save call history
  useEffect(() => {
    try {
      localStorage.setItem("twilio-call-history", JSON.stringify(callHistory.slice(0, 50)));
    } catch {}
  }, [callHistory]);

  // Initialize Twilio Device
  const initDevice = useCallback(async () => {
    try {
      setConnectionStatus("connecting");
      const res = await fetch("/api/token");
      if (!res.ok) throw new Error("Failed to fetch token");
      const data = await res.json();

      if (deviceRef.current) {
        deviceRef.current.destroy();
      }

      const device = new Device(data.token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        allowIncomingWhileBusy: false,
      });

      device.on("registered", () => setConnectionStatus("connected"));
      device.on("unregistered", () => setConnectionStatus("disconnected"));
      device.on("error", (err) => {
        console.error("Twilio Device Error:", err);
        setConnectionStatus("error");
        setTimeout(() => setConnectionStatus("disconnected"), 3000);
      });

      device.on("tokenWillExpire", async () => {
        try {
          const res = await fetch("/api/token");
          const data = await res.json();
          device.updateToken(data.token);
        } catch (err) {
          console.error("Token refresh failed:", err);
        }
      });

      device.on("incoming", (call: Call) => {
        call.accept();
        setupCallEvents(call, "incoming");
      });

      await device.register();
      deviceRef.current = device;
    } catch (err) {
      console.error("Device init error:", err);
      setConnectionStatus("error");
    }
  }, []);

  useEffect(() => {
    initDevice();
    return () => {
      if (deviceRef.current) deviceRef.current.destroy();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initDevice]);

  const setupCallEvents = (call: Call, number: string) => {
    setActiveCall(call);
    setCallState("connecting");
    lastCallRef.current = { number, start: Date.now() };

    call.on("accept", () => {
      setCallState("active");
      callStartRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000));
      }, 1000);
    });

    call.on("ringing", () => setCallState("ringing"));

    call.on("disconnect", () => {
      endCallCleanup();
      setShowFeedback(true);
    });

    call.on("cancel", () => endCallCleanup());
    call.on("reject", () => endCallCleanup());

    call.on("error", (err: Error) => {
      console.error("Call error:", err);
      endCallCleanup();
    });

    call.on("warning", (name: string) => {
      if (name === "high-packet-loss") {
        setNetworkQuality("poor");
        setWarningMessage("Poor network — high packet loss");
      } else if (name === "high-jitter" || name === "high-rtt") {
        setNetworkQuality("warning");
        setWarningMessage(`Network warning: ${name}`);
      }
    });

    call.on("warning-cleared", () => {
      setNetworkQuality("good");
      setWarningMessage(null);
    });
  };

  const endCallCleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (lastCallRef.current) {
      const duration = Math.floor((Date.now() - lastCallRef.current.start) / 1000);
      const record: CallRecord = {
        id: Date.now().toString(),
        number: lastCallRef.current.number,
        duration,
        timestamp: lastCallRef.current.start,
        type: "outbound",
      };
      setCallHistory((prev) => [record, ...prev]);
      lastCallRef.current = null;
    }

    setActiveCall(null);
    setCallState("idle");
    setIsMuted(false);
    setCallDuration(0);
    setNetworkQuality("good");
    setWarningMessage(null);
    setShowDialpadInCall(false);
  };

  const makeCall = async () => {
    if (!deviceRef.current || !phoneNumber.trim()) return;
    const cleanNum = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber.replace(/\D/g, "")}`;

    try {
      const call = await deviceRef.current.connect({
        params: { To: cleanNum },
      });
      setupCallEvents(call, cleanNum);
    } catch (err) {
      console.error("Failed to make call:", err);
    }
  };

  const hangUp = () => {
    if (activeCall) activeCall.disconnect();
  };

  const toggleMute = () => {
    if (activeCall) {
      const newMuted = !isMuted;
      activeCall.mute(newMuted);
      setIsMuted(newMuted);
    }
  };

  const sendDTMF = (digit: string) => {
    if (activeCall) activeCall.sendDigits(digit);
  };

  const handleDigitPress = (digit: string) => {
    if (activeCall && showDialpadInCall) {
      sendDTMF(digit);
    } else {
      setPhoneNumber((prev) => {
        if (prev.replace(/\D/g, "").length >= 15) return prev;
        return prev + digit;
      });
    }
    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleRedial = (number: string) => {
    setPhoneNumber(number);
  };

  const clearHistory = () => setCallHistory([]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatPhoneDisplay = (num: string) => {
    // If it already has +, show as-is with spacing
    if (num.startsWith("+")) {
      const digits = num.slice(1).replace(/\D/g, "");
      if (digits.length <= 1) return `+${digits}`;
      if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)})`;
      if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
      return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }
    const digits = num.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    // 11+ digits: treat first digit as country code
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  };

  return (
    <div className="dialer-wrapper">
      {warningMessage && <div className="warning-toast">⚠ {warningMessage}</div>}

      <div className="glass-card">
        <StatusBar status={connectionStatus} networkQuality={networkQuality} onReconnect={initDevice} />

        {callState === "idle" ? (
          <>
            {/* Phone Input */}
            <div className="phone-input-area">
              <div className={`phone-display ${!phoneNumber ? "empty" : ""}`}>
                {phoneNumber ? formatPhoneDisplay(phoneNumber) : "Enter a number"}
                {phoneNumber && (
                  <button className="backspace-btn" onClick={handleBackspace} aria-label="Delete">
                    ⌫
                  </button>
                )}
              </div>
            </div>

            {/* Dial Pad */}
            <DialPad onDigitPress={handleDigitPress} />

            {/* Call Button */}
            <div className="call-actions">
              <button
                className="call-btn call"
                onClick={makeCall}
                disabled={!phoneNumber.trim() || connectionStatus !== "connected"}
                aria-label="Make call"
              >
                📞
              </button>
            </div>
          </>
        ) : (
          /* Active Call View */
          <div className="active-call">
            <div className="call-status-text">
              {callState === "connecting" ? "Connecting..." : callState === "ringing" ? "Ringing..." : "Connected"}
            </div>
            <div className="call-number">{formatPhoneDisplay(phoneNumber)}</div>
            <div className="call-timer">{formatTime(callDuration)}</div>

            {showDialpadInCall && <DialPad onDigitPress={handleDigitPress} />}

            <div className="call-controls">
              <button className={`control-btn ${isMuted ? "active" : ""}`} onClick={toggleMute}>
                {isMuted ? "🔇" : "🎤"}
                <span className="control-label">Mute</span>
              </button>

              <button
                className={`control-btn ${showDialpadInCall ? "active" : ""}`}
                onClick={() => setShowDialpadInCall(!showDialpadInCall)}
              >
                ⌨️
                <span className="control-label">Keypad</span>
              </button>

              <button className="call-btn end" onClick={hangUp} aria-label="End call">
                📵
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Call History */}
      {callState === "idle" && callHistory.length > 0 && (
        <div className="history-section glass-card">
          <CallHistory history={callHistory} onRedial={handleRedial} onClear={clearHistory} />
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  );
}
