import React from "react";

const LoadingPanel: React.FC<{ className?: string }> = ({
  className = "h-72",
}) => (
  <div
    role="status"
    aria-label="Loading"
    className={`animate-pulse rounded-2xl bg-slate-200 ${className}`}
  />
);

export default LoadingPanel;
