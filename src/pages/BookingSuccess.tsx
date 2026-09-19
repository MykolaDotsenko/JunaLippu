import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import Footer from "~/components/Footer";
import Header from "~/components/Header";
import { api } from "~/utils/api";

const BookingSuccess: React.FC = () => {
  const router = useRouter();
  const reservationId = Number(
    typeof router.query.reservationId === "string" ? router.query.reservationId : "0",
  );

  const reservation = api.booking.getReservation.useQuery(
    { reservation_id: reservationId },
    { enabled: reservationId > 0, retry: false },
  );

  return (
    <>
      <Head>
        <title>Reservation confirmed · JunaLippu</title>
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header />
        <main id="main-content" className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          {reservationId <= 0 && (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
              <h1 className="text-xl font-bold">Reservation number is missing.</h1>
              <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 font-semibold text-white">
                Back to home
              </Link>
            </div>
          )}

          {reservationId > 0 && reservation.isLoading && (
            <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />
          )}

          {reservation.error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
              <h1 className="text-xl font-bold">We could not load this reservation.</h1>
              <p className="mt-2 text-sm">{reservation.error.message}</p>
              <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 font-semibold text-white">
                Back to home
              </Link>
            </div>
          )}

          {reservation.data && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-lg sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
                ✓
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
                Reservation confirmed
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                You’re booked.
              </h1>
              <p className="mt-2 text-slate-500">
                Booking #{reservation.data.reservation_id}
              </p>

              <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-left">
                <div className="text-lg font-bold">
                  {reservation.data.departure_stop_name} → {reservation.data.arrival_stop_name}
                </div>
                <div className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-slate-500">Date</span>
                    {reservation.data.service_date}
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-slate-500">Time</span>
                    {reservation.data.departure_time}–{reservation.data.arrival_time}
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-slate-500">Train</span>
                    {reservation.data.train_number}
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-slate-500">Seat</span>
                    Car {reservation.data.car_number} · Seat {reservation.data.seat_number}
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-slate-500">Class</span>
                    {reservation.data.travel_class === 1 ? "1st class" : "2nd class"}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="font-semibold text-slate-600">Total</span>
                  <span className="text-xl font-bold">€{reservation.data.price.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/"
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Book another journey
              </Link>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BookingSuccess;
