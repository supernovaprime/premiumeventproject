import React from "react";

export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div
      role="alert"
      style={{
        padding: "20px",
        background: "#ffe5e5",
        border: "1px solid #ff4d4d",
        borderRadius: "8px",
        margin: "20px",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#b30000" }}>Something went wrong</h2>
      <p>{error?.message || "Unexpected error occurred"}</p>
      <button
        onClick={resetErrorBoundary}
        style={{
          marginTop: "10px",
          padding: "10px 15px",
          background: "#ff4d4d",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
