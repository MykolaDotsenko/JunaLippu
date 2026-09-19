import React from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import BookingProgress from "~/components/BookingProgress";
import LoadingPanel from "~/components/LoadingPanel";
import MissingDetails from "~/components/MissingDetails";
import PageLayout from "~/components/PageLayout";
import { api } from "~/utils/api";

const ReviewPage: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const tripId =
    typeof router.query.tripId === "string" ? router.query.tripId : "";
  const depStopId =
    typeof router.query.depStopId === "string" ? router.query.depStopId : "";
  const arrivStopId =
    typeof router.query.arrivStopId === "string"
      ? router.query.arrivStopId
      : "";
  const seatId = Number(
    typeof router.query.seatId === "string" ? router.query.seatId : "0",
  );
  const travelClass =
    router.query.travelClass === "1"
      ? 1
      : router.query.travelClass === "2"
        ? 2
        : null;
  const date = typeof router.query.date === "string" ? router.query.date : "";
  const effectiveTravelClass: 1 | 2 = travelClass ?? 2;

  const input = {
    seat_id: seatId,
    trip_id: tripId,
    dep_stop_id: depStopId,
    arriv_stop_id: arrivStopId,
    travel_class: effectiveTravelClass,
  };

  const hasBookingDetails = Boolean(
    seatId && tripId && depStopId && arrivStopId && travelClass,
  );

  const review = api.booking.getReview.useQuery(input, {
    enabled: hasBookingDetails,
    retry: false,
  });

  const reserve = api.booking.createReservation.useMutation({
    onSuccess: (reservation) => {
      void router.replace({
        pathname: "/confirmation",
        query: { reservationId: reservation.reservation_id.toString() },
      });
    },
  });

  const handleReserve = () => {
    if (!session) {
      void signIn("google", { callbackUrl: router.asPath });
      return;
    }
    if (!review.data) return;
    reserve.mutate(input);
  };

  if (!router.isReady) {
    return (
      <PageLayout title="Review booking · JunaLippu" width="md">
        <BookingProgress current={4} />
        <LoadingPanel className="h-96" />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Review booking · JunaLippu" width="md">
      <BookingProgress current={4} />

      {!hasBookingDetails ? (
        <MissingDetails
          title="Booking details are missing."
          description="Start a new search to build a valid reservation."
        />
      ) : (
        <>
          <Link
            href={{
              pathname: "/seats",
              query: {
                tripId,
                depStopId,
                arrivStopId,
                date: review.data?.service_date ?? date,
                travelClass: travelClass?.toString() ?? "",
              },
            }}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            ← Change seat
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Review your booking
          </h1>
          <p className="mt-2 text-slate-500">
            Check the details before creating the reservation.
          </p>

          {review.isLoading && (
            <div className="mt-8 h-72 animate-pulse rounded-2xl bg-slate-200" />
          )}

          {review.error && (
            <div
              role="alert"
              className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"
            >
              <p className="font-semibold">We could not verify this booking.</p>
              <p className="mt-1 text-sm">{review.error.message}</p>
            </div>
          )}

          {review.data && (
            <>
              <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Journey
                    </div>
                    <h2 className="mt-2 text-2xl font-bold">
                      {review.data.departure_stop_name} →{" "}
                      {review.data.arrival_stop_name}
                    </h2>
                    <p className="mt-2 text-slate-600">
                      {review.data.service_date} · {review.data.departure_time}–
                      {review.data.arrival_time}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {review.data.duration} · Train {review.data.train_number}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm">
                    <div className="font-semibold">
                      {review.data.travel_class === 1
                        ? "1st class"
                        : "2nd class"}
                    </div>
                    <div className="mt-1 text-slate-600">
                      Car {review.data.car_number} · Seat{" "}
                      {review.data.seat_number}
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Total</span>
                    <span className="text-2xl font-bold">
                      €{review.data.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </section>

              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                This portfolio demo creates a real reservation record in the app
                database. No card details or real payments are processed.
              </div>

              {reserve.error && (
                <div
                  role="alert"
                  className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                  {reserve.error.message}
                </div>
              )}

              <button
                type="button"
                onClick={handleReserve}
                disabled={status === "loading" || reserve.isPending}
                className="mt-6 min-h-12 w-full rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                {!session
                  ? "Continue with Google"
                  : reserve.isPending
                    ? "Creating reservation…"
                    : "Reserve seat"}
              </button>
            </>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default ReviewPage;
