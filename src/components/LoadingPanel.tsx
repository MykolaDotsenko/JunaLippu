import React from "react";

const LoadingPanel = ({ className = "h-72" }: { className?: string }) => (
  <div
    role="status"
    aria-label="Loading"
    className={`animate-pulse rounded-2xl bg-slate-200 ${className}`}
  />
);

export default LoadingPanel;
