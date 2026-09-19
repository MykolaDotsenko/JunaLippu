import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import BookingProgress from "~/components/BookingProgress";
import LoadingPanel from "~/components/LoadingPanel";
import MissingDetails from "~/components/MissingDetails";
import PageLayout from "~/components/PageLayout";
import { useRadioGroup } from "~/hooks/useRadioGroup";
import { api, type RouterOutputs } from "~/utils/api";

type AvailableSeat = RouterOutputs["booking"]["getSeat"][number];

const asString = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : "";

const SeatsPage = () => {
  const router = useRouter();

  const tripId = asString(router.query.tripId);
  const depStopId = asString(router.query.depStopId);
  const arrivStopId = asString(router.query.arrivStopId);
  const date = asString(router.query.date);
  const travelClass: 1 | 2 = router.query.travelClass === "1" ? 1 : 2;
  const selectedSeatId = Number(asString(router.query.seatId)) || null;

  const hasSegment = Boolean(tripId && depStopId && arrivStopId);

  // The URL is the single source of truth for the choices on this page, so a
  // seat selection survives a refresh and can be shared.
  const replaceQuery = (next: Record<string, string | undefined>) => {
    const merged: Record<string, string> = {};
    for (const [key, value] of Object.entries({ ...router.query, ...next })) {
      if (typeof value === "string" && value !== "") merged[key] = value;
    }
    void router.replace({ pathname: "/seats", query: merged }, undefined, {
      shallow: true,
    });
  };

  const selectTravelClass = (next: 1 | 2) =>
    replaceQuery({ travelClass: String(next), seatId: undefined });

  const selectSeat = (seatId: number) =>
    replaceQuery({ seatId: String(seatId) });

  const segment = {
    trip_id: tripId,
    dep_stop_id: depStopId,
    arriv_stop_id: arrivStopId,
  };

  // The fare depends on the journey and the class, never on which seat is
  // picked, so it is fetched once per class instead of on every seat click.
  const quote = api.booking.getQuote.useQuery(
    { ...segment, travel_class: travelClass },
    { enabled: hasSegment, retry: false, staleTime: Infinity },
  );

  // Availability is the opposite: it must never be served from a stale cache.
  const seats = api.booking.getSeat.useQuery(
    { ...segment, travel_class: travelClass },
    { enabled: hasSegment, retry: 1, staleTime: 0 },
  );

  const availableSeats = useMemo(() => seats.data ?? [], [seats.data]);

  const selectedSeat = availableSeats.find(
    (seat) => seat.seat_id === selectedSeatId,
  );

  const groupedSeats = useMemo(() => {
    const groups = new Map<number, AvailableSeat[]>();
    for (const seat of availableSeats) {
      const group = groups.get(seat.car_number) ?? [];
      group.push(seat);
      groups.set(seat.car_number, group);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a - b);
  }, [availableSeats]);

  const classRadios = useRadioGroup<1 | 2>({
    values: [2, 1],
    value: travelClass,
    onChange: selectTravelClass,
  });

  const handleContinue = () => {
    if (!selectedSeat || !quote.data) return;

    void router.push({
      pathname: "/review",
      query: {
        tripId,
        depStopId,
        arrivStopId,
        seatId: String(selectedSeat.seat_id),
        travelClass: String(travelClass),
        date: quote.data.service_date,
      },
    });
  };

  const seatRadios = useRadioGroup<number>({
    values: availableSeats.map((seat) => seat.seat_id),
    value: selectedSeat ? selectedSeat.seat_id : null,
    onChange: selectSeat,
  });

  if (!router.isReady) {
    return (
      <PageLayout title="Choose a seat · JunaLippu" width="xl">
        <BookingProgress current={3} />
        <LoadingPanel className="h-96" />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Choose a seat · JunaLippu" width="xl">
      <BookingProgress current={3} />

      {!hasSegment ? (
        <MissingDetails
          title="Journey details are missing."
          description="Start a new search to choose a valid train and route."
        />
      ) : (
        <>
          <div className="mb-8">
            <Link
              href={{
                pathname: "/trains",
                query: {
                  depStopId,
                  arrivStopId,
                  departureCity: quote.data?.departure_stop_name ?? "",
                  arrivalCity: quote.data?.arrival_stop_name ?? "",
                  startDate: quote.data?.service_date ?? date,
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
              {quote.data
                ? quote.data.departure_stop_name +
                  " → " +
                  quote.data.arrival_stop_name +
                  " · " +
                  quote.data.departure_time +
                  "–" +
                  quote.data.arrival_time +
                  " · " +
                  quote.data.duration
                : "Loading journey details…"}
            </p>
          </div>

          <section aria-labelledby="class-title">
            <h2 id="class-title" className="text-lg font-bold">
              Travel class
            </h2>
            <div
              role="radiogroup"
              aria-labelledby="class-title"
              className="mt-3 grid gap-3 sm:grid-cols-2"
            >
              {([2, 1] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  {...classRadios.getRadioProps(option)}
                  className={
                    "min-h-20 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 " +
                    (travelClass === option
                      ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                      : "border-slate-200 bg-white hover:border-slate-300")
                  }
                >
                  <div className="font-bold">
                    {option === 1 ? "1st class" : "2nd class"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {option === 1 ? "Premium class · +50%" : "Standard seating"}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="seat-title" className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="seat-title" className="text-lg font-bold">
                  Available seats
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose one seat for this demo reservation.
                </p>
              </div>
              {selectedSeat && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  Car {selectedSeat.car_number} · Seat{" "}
                  {selectedSeat.seat_number}
                </span>
              )}
            </div>

            {seats.isLoading && (
              <div
                aria-live="polite"
                className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6"
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-xl bg-slate-200"
                  />
                ))}
              </div>
            )}

            {seats.error && (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"
              >
                <p className="font-semibold">
                  We could not load available seats.
                </p>
                <button
                  type="button"
                  onClick={() => void seats.refetch()}
                  className="mt-3 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {availableSeats.length === 0 &&
              !seats.isLoading &&
              !seats.error && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600">
                  No seats are available in this class.
                </div>
              )}

            {selectedSeatId !== null && !selectedSeat && !seats.isLoading && (
              <p
                role="status"
                className="mt-4 text-sm font-medium text-amber-700"
              >
                That seat is no longer available. Choose another one.
              </p>
            )}

            <div
              role="radiogroup"
              aria-labelledby="seat-title"
              className="mt-5 space-y-5"
            >
              {groupedSeats.map(([carNumber, carSeats]) => (
                <div
                  key={carNumber}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold">Car {carNumber}</h3>
                    <span className="text-xs text-slate-500">
                      {carSeats.length} available
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {carSeats.map((seat) => {
                      const selected = seat.seat_id === selectedSeat?.seat_id;
                      return (
                        <button
                          key={seat.seat_id}
                          type="button"
                          aria-label={`Car ${carNumber}, seat ${seat.seat_number}`}
                          {...seatRadios.getRadioProps(seat.seat_id)}
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
              <div className="text-sm text-slate-500">
                {selectedSeat ? "Total" : "From"}
              </div>
              <div className="text-2xl font-bold">
                {quote.data ? "€" + quote.data.price.toFixed(2) : "…"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selectedSeat || !quote.data}
              className="mt-4 min-h-12 w-full rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 sm:mt-0 sm:w-auto"
            >
              Review booking
            </button>
          </div>
        </>
      )}
    </PageLayout>
  );
};

export default SeatsPage;
