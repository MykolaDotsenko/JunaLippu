import React from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

import PageLayout from "~/components/PageLayout";
import ReservationSummary from "~/components/ReservationSummary";
import { useGoogleAuthStatus } from "~/hooks/useGoogleAuthStatus";
import { api } from "~/utils/api";

const BookingsPage = () => {
  const { status } = useSession();
  const googleAuthStatus = useGoogleAuthStatus();
  const isAuthenticated = status === "authenticated";

  const bookings = api.booking.listReservations.useInfiniteQuery(
    {},
    {
      enabled: isAuthenticated,
      retry: false,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    },
  );

  const reservations = bookings.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <PageLayout
      title="My bookings · JunaLippu"
      description="Reservations created with your JunaLippu account."
      width="md"
    >
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        My bookings
      </h1>
      <p className="mt-2 text-slate-500">
        Reservations created with your account, newest first.
      </p>

      {status === "loading" && (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-slate-200" />
      )}

      {status === "unauthenticated" && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold">Sign in to see your bookings</h2>
          <p className="mt-2 text-sm text-slate-500">
            Reservations are tied to your Google account.
          </p>
          <button
            type="button"
            onClick={() => {
              if (googleAuthStatus === "available") {
                void signIn("google", { callbackUrl: "/bookings" });
              }
            }}
            disabled={googleAuthStatus !== "available"}
            className="mt-5 min-h-12 w-full rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:w-auto"
          >
            {googleAuthStatus === "unavailable"
              ? "Google sign-in unavailable"
              : googleAuthStatus === "loading"
                ? "Checking sign-in…"
                : "Continue with Google"}
          </button>
        </div>
      )}

      {isAuthenticated && bookings.isLoading && (
        <div className="mt-8 space-y-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      )}

      {bookings.error && (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"
        >
          <p className="font-semibold">We could not load your bookings.</p>
          <p className="mt-1 text-sm">{bookings.error.message}</p>
          <button
            type="button"
            onClick={() => void bookings.refetch()}
            className="mt-3 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      )}

      {isAuthenticated &&
        !bookings.isLoading &&
        !bookings.error &&
        reservations.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <h2 className="font-semibold">No reservations yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Your reservations will appear here once you book a journey.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
            >
              Search trains
            </Link>
          </div>
        )}

      {reservations.length > 0 && (
        <ul className="mt-8 space-y-4">
          {reservations.map((reservation) => (
            <li
              key={reservation.reservation_id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <ReservationSummary reservation={reservation} />
            </li>
          ))}
        </ul>
      )}

      {bookings.hasNextPage && (
        <button
          type="button"
          onClick={() => void bookings.fetchNextPage()}
          disabled={bookings.isFetchingNextPage}
          className="mt-6 min-h-12 w-full rounded-xl border border-slate-300 px-6 font-semibold text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-wait disabled:opacity-60"
        >
          {bookings.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </PageLayout>
  );
};

export default BookingsPage;
