"use client";

import { useState } from "react";

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // In production, this would call call.postFeedback()
    console.log("Call quality rating:", rating);
    setSubmitted(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        {!submitted ? (
          <>
            <h3 className="modal-title">Call Quality</h3>
            <p className="modal-subtitle">How was your call experience?</p>
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${star <= rating ? "filled" : ""}`}
                  onClick={() => setRating(star)}
                  aria-label={`${star} star`}
                >
                  {star <= rating ? "★" : "☆"}
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={onClose}>
                Skip
              </button>
              <button
                className="modal-btn primary"
                onClick={handleSubmit}
                disabled={rating === 0}
              >
                Submit
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <h3 className="modal-title">Thank you!</h3>
            <p className="modal-subtitle">Your feedback helps improve call quality.</p>
          </>
        )}
      </div>
    </div>
  );
}
