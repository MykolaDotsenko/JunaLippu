import React from "react";

const steps = ["Search", "Train", "Seat", "Review"];

const BookingProgress: React.FC<{ current: 1 | 2 | 3 | 4 }> = ({ current }) => (
  <div aria-label={`Booking progress: step ${current} of 4`} className="mb-8">
    <p className="mb-3 text-sm font-semibold text-slate-500">
      Step {current} of 4 · {steps[current - 1]}
    </p>
    <div className="grid grid-cols-4 gap-2" aria-hidden="true">
      {steps.map((step, index) => (
        <div key={step} className="space-y-2">
          <div
            className={`h-1.5 rounded-full ${
              index < current ? "bg-blue-600" : "bg-slate-200"
            }`}
          />
          <span className="hidden text-xs font-medium text-slate-500 sm:block">{step}</span>
        </div>
      ))}
    </div>
  </div>
);

export default BookingProgress;
