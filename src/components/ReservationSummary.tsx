import React from "react";

import { type RouterOutputs } from "~/utils/api";

type Reservation = RouterOutputs["booking"]["getReservation"];

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <span className="block text-xs uppercase tracking-wide text-slate-400">
      {label}
    </span>
    {children}
  </div>
);

const ReservationSummary: React.FC<{ reservation: Reservation }> = ({
  reservation,
}) => (
  <div className="rounded-2xl bg-slate-50 p-5 text-left">
    <div className="text-lg font-bold">
      {reservation.departure_stop_name} → {reservation.arrival_stop_name}
    </div>
    <div className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
      <Field label="Date">{reservation.service_date}</Field>
      <Field label="Time">
        {reservation.departure_time}–{reservation.arrival_time}
      </Field>
      <Field label="Train">{reservation.train_number}</Field>
      <Field label="Seat">
        Car {reservation.car_number} · Seat {reservation.seat_number}
      </Field>
      <Field label="Class">
        {reservation.travel_class === 1 ? "1st class" : "2nd class"}
      </Field>
      <Field label="Booking">#{reservation.reservation_id}</Field>
    </div>
    <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
      <span className="font-semibold text-slate-600">Total</span>
      <span className="text-xl font-bold">€{reservation.price.toFixed(2)}</span>
    </div>
  </div>
);

export default ReservationSummary;
