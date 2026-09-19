import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import { formatServiceDate } from "~/utils/serviceDate";

const asString = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : "";

const SearchJourney = () => {
  const router = useRouter();
  const stationsQuery = api.search.getStationName.useQuery(undefined, {
    retry: 1,
    // The station list is fixed for the lifetime of the app.
    staleTime: Infinity,
  });
  const stations = useMemo(
    () => stationsQuery.data ?? [],
    [stationsQuery.data],
  );

  // The search lives in the URL rather than in component state, so a search
  // can be shared, bookmarked and restored by the back button — and no effect
  // is needed to keep the two in sync.
  const from = asString(router.query.from);
  const to = asString(router.query.to);
  const date = asString(router.query.date);

  const replaceQuery = (next: Record<string, string | undefined>) => {
    const merged: Record<string, string> = {};
    for (const [key, value] of Object.entries({ ...router.query, ...next })) {
      if (typeof value === "string" && value !== "") merged[key] = value;
    }
    void router.replace({ pathname: "/", query: merged }, undefined, {
      shallow: true,
    });
  };

  const selectFrom = (value: string) =>
    replaceQuery({ from: value, date: undefined });
  const selectTo = (value: string) =>
    replaceQuery({ to: value, date: undefined });
  const selectDate = (value: string) => replaceQuery({ date: value });

  const invalidRoute = Boolean(from && to && from === to);

  const availableDatesQuery = api.search.getAvailableDates.useQuery(
    {
      dep_stop_id: from,
      arriv_stop_id: to,
    },
    {
      enabled: Boolean(from && to) && !invalidRoute,
      retry: 1,
      // Service dates come from a fixed historical dataset.
      staleTime: Infinity,
    },
  );

  const availableDates = useMemo(
    () => availableDatesQuery.data ?? [],
    [availableDatesQuery.data],
  );

  // A shared link can name a date the route no longer runs on.
  const selectedDate = availableDates.includes(date) ? date : "";

  const demoDateRange = useMemo(() => {
    const first = availableDates.at(0);
    const last = availableDates.at(-1);
    if (!first || !last) return null;
    return first === last
      ? formatServiceDate(first)
      : `${formatServiceDate(first)} – ${formatServiceDate(last)}`;
  }, [availableDates]);

  const stationNameById = useMemo(
    () =>
      new Map(stations.map((station) => [station.stop_id, station.stop_name])),
    [stations],
  );

  const datePlaceholder =
    !from || !to
      ? "Choose route first"
      : availableDatesQuery.isLoading
        ? "Loading dates…"
        : availableDates.length === 0
          ? "No dates available"
          : "Choose service date";

  const canSearch = Boolean(from && to && selectedDate && !invalidRoute);

  const swapStations = () =>
    replaceQuery({ from: to, to: from, date: undefined });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSearch) return;

    void router.push({
      pathname: "/trains",
      query: {
        depStopId: from,
        arrivStopId: to,
        departureCity: stationNameById.get(from) ?? from,
        arrivalCity: stationNameById.get(to) ?? to,
        startDate: selectedDate,
      },
    });
  };

  return (
    <section
      id="search"
      className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-xl"
    >
      <Image
        src="/images/fiska.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-900/50"
        aria-hidden="true"
      />

      <div className="relative grid gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-12 lg:py-16">
        <div className="max-w-xl text-white">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
            Finland by rail
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Find a train in seconds.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-200 sm:text-lg">
            A focused booking demo: choose a route and service date, select a
            train and seat, then reserve securely with Google sign-in.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Search journey
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                One way · 1 passenger
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              Demo timetable
            </span>
          </div>

          {stationsQuery.error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              We could not load stations.
              <button
                type="button"
                onClick={() => void stationsQuery.refetch()}
                className="ml-2 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                From
              </span>
              <select
                value={from}
                onChange={(event) => selectFrom(event.target.value)}
                disabled={stationsQuery.isLoading}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="">Select station</option>
                {stations.map((station) => (
                  <option key={station.stop_id} value={station.stop_id}>
                    {station.stop_name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={swapStations}
              disabled={!from && !to}
              aria-label="Swap departure and arrival stations"
              className="min-h-12 min-w-12 rounded-xl border border-slate-300 bg-white px-3 text-lg text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-40"
            >
              ⇄
            </button>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                To
              </span>
              <select
                value={to}
                onChange={(event) => selectTo(event.target.value)}
                disabled={stationsQuery.isLoading}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="">Select station</option>
                {stations.map((station) => (
                  <option key={station.stop_id} value={station.stop_id}>
                    {station.stop_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Service date
            </span>
            <select
              value={selectedDate}
              onChange={(event) => selectDate(event.target.value)}
              disabled={availableDates.length === 0}
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">{datePlaceholder}</option>
              {availableDates.map((serviceDate) => (
                <option key={serviceDate} value={serviceDate}>
                  {formatServiceDate(serviceDate)}
                </option>
              ))}
            </select>
          </label>

          {demoDateRange && (
            <p role="status" className="mt-2 text-sm text-slate-500">
              Demo timetable covers {demoDateRange}.
            </p>
          )}

          {from &&
            to &&
            !invalidRoute &&
            availableDatesQuery.isSuccess &&
            availableDates.length === 0 && (
              <p
                role="status"
                className="mt-3 text-sm font-medium text-amber-700"
              >
                No direct demo journeys are available for this route.
              </p>
            )}

          {invalidRoute && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-700">
              Departure and arrival stations must be different.
            </p>
          )}

          <button
            type="submit"
            disabled={!canSearch}
            className="mt-5 min-h-12 w-full rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Search trains
          </button>
        </form>
      </div>
    </section>
  );
};

export default SearchJourney;
