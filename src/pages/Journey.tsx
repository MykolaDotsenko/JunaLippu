import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import BookingProgress from "~/components/BookingProgress";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import { api } from "~/utils/api";

const Journey: React.FC = () => {
  const router = useRouter();

  const tripId = typeof router.query.tripId === "string" ? router.query.tripId : "";
  const depStopId = typeof router.query.depStopId === "string" ? router.query.depStopId : "";
  const arrivStopId = typeof router.query.arrivStopId === "string" ? router.query.arrivStopId : "";
  const departureCity = typeof router.query.departureCity === "string" ? router.query.departureCity : "";
  const arrivalCity = typeof router.query.arrivalCity === "string" ? router.query.arrivalCity : "";
  const departureTime = typeof router.query.departureTime === "string" ? router.query.departureTime : "";
  const arrivalTime = typeof router.query.arrivalTime === "string" ? router.query.arrivalTime : "";
  const duration = typeof router.query.duration === "string" ? router.query.duration : "";
  const date = typeof router.query.date === "string" ? router.query.date : "";

  const [travelClass, setTravelClass] = useState<1 | 2>(2);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);

  const seats = api.booking.getSeat.useQuery(
    { travel_class: travelClass, trip_id: tripId },
    { enabled: Boolean(tripId), retry: 1 },
  );

  const selectedSeat = useMemo(
    () => seats.data?.find((seat) => seat.seat_id === selectedSeatId),
    [seats.data, selectedSeatId],
  );

  const review = api.booking.getReview.useQuery(
    {
      seat_id: selectedSeatId ?? 0,
      trip_id: tripId,
      dep_stop_id: depStopId,
      arriv_stop_id: arrivStopId,
      travel_class: travelClass,
    },
    {
      enabled: Boolean(selectedSeatId && tripId && depStopId && arrivStopId),
      retry: false,
    },
  );

  const groupedSeats = useMemo(() => {
    const groups = new Map<number, NonNullable<typeof seats.data>>();
    for (const seat of seats.data ?? []) {
      const group = groups.get(seat.car_number) ?? [];
      group.push(seat);
      groups.set(seat.car_number, group);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a - b);
  }, [seats.data]);

  const handleContinue = () => {
    if (!selectedSeat || !review.data) return;

    void router.push({
      pathname: "/ReviewBooking",
      query: {
        tripId,
        depStopId,
        arrivStopId,
        seatId: selectedSeat.seat_id.toString(),
        travelClass: travelClass.toString(),
        date,
        departureCity,
        arrivalCity,
        departureTime,
        arrivalTime,
        duration,
      },
    });
  };

  return (
    <>
      <Head>
        <title>Choose a seat · JunaLippu</title>
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <BookingProgress current={3} />

          <div className="mb-8">
            <Link
              href={{
                pathname: "/BookingJourney",
                query: {
                  depStopId,
                  arrivStopId,
                  departureCity,
                  arrivalCity,
                  startDate: date,
                },
              }}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              ← Back to trains
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Choose class and seat
            </h1>
            <p className="mt-2 text-slate-500">
              {departureCity} → {arrivalCity} · {departureTime}–{arrivalTime}
              {duration ? " · " + duration : ""}
            </p>
          </div>

          <section aria-labelledby="class-title">
            <h2 id="class-title" className="text-lg font-bold">Travel class</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={travelClass === 2}
                onClick={() => {
                  setTravelClass(2);
                  setSelectedSeatId(null);
                }}
                className={
                  "min-h-20 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 " +
                  (travelClass === 2
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "border-slate-200 bg-white hover:border-slate-300")
                }
              >
                <div className="font-bold">2nd class</div>
                <div className="mt-1 text-sm text-slate-500">Standard seating</div>
              </button>

              <button
                type="button"
                aria-pressed={travelClass === 1}
                onClick={() => {
                  setTravelClass(1);
                  setSelectedSeatId(null);
                }}
                className={
                  "min-h-20 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 " +
                  (travelClass === 1
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "border-slate-200 bg-white hover:border-slate-300")
                }
              >
                <div className="font-bold">1st class</div>
                <div className="mt-1 text-sm text-slate-500">Premium class · +50%</div>
              </button>
            </div>
          </section>

          <section aria-labelledby="seat-title" className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="seat-title" className="text-lg font-bold">Available seats</h2>
                <p className="mt-1 text-sm text-slate-500">Choose one seat for this demo reservation.</p>
              </div>
              {selectedSeat && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  Car {selectedSeat.car_number} · Seat {selectedSeat.seat_number}
                </span>
              )}
            </div>

            {seats.isLoading && (
              <div aria-live="polite" className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {Array.from({ length: 12 }, (_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-200" />
                ))}
              </div>
            )}

            {seats.error && (
              <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
                <p className="font-semibold">We could not load available seats.</p>
                <button
                  type="button"
                  onClick={() => void seats.refetch()}
                  className="mt-3 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {seats.data?.length === 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600">
                No seats are available in this class.
              </div>
            )}

            <div className="mt-5 space-y-5">
              {groupedSeats.map(([carNumber, carSeats]) => (
                <div key={carNumber} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold">Car {carNumber}</h3>
                    <span className="text-xs text-slate-500">{carSeats.length} available</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {carSeats.map((seat) => {
                      const selected = seat.seat_id === selectedSeatId;
                      return (
                        <button
                          key={seat.seat_id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setSelectedSeatId(seat.seat_id)}
                          className={
                            "min-h-12 rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 " +
                            (selected
                              ? "border-green-600 bg-green-50 text-green-900 ring-1 ring-green-600"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50")
                          }
                        >
                          Seat {seat.seat_number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="sticky bottom-4 mt-8 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-slate-500">Total</div>
              <div className="text-2xl font-bold">
                {review.isFetching
                  ? "Calculating…"
                  : review.data
                    ? "€" + review.data.price.toFixed(2)
                    : "Select a seat"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selectedSeat || !review.data}
              className="mt-4 min-h-12 w-full rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 sm:mt-0 sm:w-auto"
            >
              Review booking
            </button>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Journey;
