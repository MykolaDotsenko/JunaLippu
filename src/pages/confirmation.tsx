import React, { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import LoadingPanel from "~/components/LoadingPanel";
import MissingDetails from "~/components/MissingDetails";
import PageLayout from "~/components/PageLayout";
import ReservationSummary from "~/components/ReservationSummary";
import { useGoogleAuthStatus } from "~/hooks/useGoogleAuthStatus";
import { api } from "~/utils/api";

const ConfirmationPage = () => {
  const router = useRouter();
  const [routerReady, setRouterReady] = useState(false);
  const { status } = useSession();
  const googleAuthStatus = useGoogleAuthStatus();

  useEffect(() => {
    if (router.isReady) setRouterReady(true);
  }, [router.isReady]);

  const reservationId = Number(
    typeof router.query.reservationId === "string"
      ? router.query.reservationId
      : "0",
  );
  const isAuthenticated = status === "authenticated";

  const reservation = api.booking.getReservation.useQuery(
    { reservation_id: reservationId },
    {
      enabled: routerReady && isAuthenticated && reservationId > 0,
      retry: false,
    },
  );

  if (!routerReady || status === "loading") {
    return (
      <PageLayout title="Reservation confirmed · JunaLippu" width="sm">
        <LoadingPanel className="h-80" />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Reservation confirmed · JunaLippu" width="sm">
      {reservationId <= 0 && (
        <MissingDetails
          title="Reservation number is missing."
          linkLabel="Back to home"
        />
      )}

      {reservationId > 0 && status === "unauthenticated" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Sign in to view this reservation</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Reservation details are private and only available to the account
            that created them.
          </p>
          <button
            type="button"
            onClick={() => {
              if (googleAuthStatus === "available") {
                void signIn("google", { callbackUrl: router.asPath });
              }
            }}
            disabled={googleAuthStatus !== "available"}
            className="mt-6 min-h-12 w-full rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {googleAuthStatus === "unavailable"
              ? "Google sign-in unavailable"
              : googleAuthStatus === "loading"
                ? "Checking sign-in…"
                : "Continue with Google"}
          </button>
        </div>
      )}

      {reservationId > 0 && isAuthenticated && reservation.isLoading && (
        <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />
      )}

      {isAuthenticated && reservation.error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"
        >
          <h1 className="text-xl font-bold">
            We could not load this reservation.
          </h1>
          <p className="mt-2 text-sm">{reservation.error.message}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/bookings"
              className="inline-flex min-h-11 items-center rounded-xl bg-red-800 px-4 font-semibold text-white"
            >
              My bookings
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-xl border border-red-300 bg-white px-4 font-semibold text-red-900"
            >
              Back to search
            </Link>
          </div>
        </div>
      )}

      {reservation.data && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-lg sm:p-10">
          <div
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700"
          >
            ✓
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
            Reservation confirmed
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            You&rsquo;re booked.
          </h1>
          <p className="mt-2 text-slate-500">
            Booking #{reservation.data.reservation_id}
          </p>

          <div className="mt-8">
            <ReservationSummary reservation={reservation.data} />
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href="/bookings"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-6 font-semibold text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              My bookings
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Book another journey
            </Link>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ConfirmationPage;
