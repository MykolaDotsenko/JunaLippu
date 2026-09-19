import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { api } from "~/utils/api";

const TripOptions: React.FC = () => {
  const router = useRouter();
  const depStopId =
    typeof router.query.depStopId === "string" ? router.query.depStopId : "";
  const arrivStopId =
    typeof router.query.arrivStopId === "string" ? router.query.arrivStopId : "";
  const startDate =
    typeof router.query.startDate === "string" ? router.query.startDate : "";

  const schedule = api.search.getSchedule.useQuery(
    {
      dep_stop_id: depStopId,
      arriv_stop_id: arrivStopId,
      travel_date: startDate,
    },
    {
      enabled: Boolean(depStopId && arrivStopId && startDate),
      retry: 1,
    },
  );

  if (schedule.isLoading) {
    return (
      <div aria-live="polite" className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (schedule.error) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="font-semibold text-red-900">We could not load journeys.</h2>
        <p className="mt-1 text-sm text-red-700">Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => void schedule.refetch()}
          className="mt-4 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!schedule.data?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <h2 className="font-semibold text-slate-950">No journeys found</h2>
        <p className="mt-2 text-sm text-slate-500">
          Try another service date or change your route.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          Change search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedule.data.map((trip) => (
        <article
          key={trip.trip_id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold tracking-tight text-slate-950">
                  {trip.departure_time}
                </span>
                <span className="text-slate-400">→</span>
                <span className="text-2xl font-bold tracking-tight text-slate-950">
                  {trip.arrival_time}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>{trip.duration}</span>
                <span>Direct</span>
                <span>Train {trip.train_number}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-5 sm:justify-end">
              <div className="text-right">
                <div className="text-xs text-slate-500">from</div>
                <div className="text-xl font-bold text-slate-950">€{trip.min_price.toFixed(2)}</div>
              </div>
              <Link
                href={{
                  pathname: "/Journey",
                  query: {
                    tripId: trip.trip_id,
                    depStopId,
                    arrivStopId,
                    date: startDate,
                  },
                }}
                className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Select
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default TripOptions;
