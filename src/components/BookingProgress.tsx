import React from "react";

const steps = ["Search", "Train", "Seat", "Review"] as const;

const BookingProgress = ({ current }: { current: 1 | 2 | 3 | 4 }) => (
  <nav aria-label="Booking progress" className="mb-8">
    <p className="mb-3 text-sm font-semibold text-slate-500">
      Step {current} of {steps.length} · {steps[current - 1]}
    </p>
    <ol className="grid grid-cols-4 gap-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCurrent = stepNumber === current;
        const isComplete = stepNumber < current;

        return (
          <li
            key={step}
            aria-current={isCurrent ? "step" : undefined}
            className="space-y-2"
          >
            <div
              aria-hidden="true"
              className={`h-1.5 rounded-full ${
                stepNumber <= current ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
            <span className="sr-only">
              {isComplete ? "Completed: " : isCurrent ? "Current: " : ""}
              {step}
            </span>
            <span
              aria-hidden="true"
              className="hidden text-xs font-medium text-slate-500 sm:block"
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  </nav>
);

export default BookingProgress;
