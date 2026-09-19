import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import { formatServiceDate } from "~/utils/serviceDate";

const SearchJourney: React.FC = () => {
  const router = useRouter();
  const stationsQuery = api.search.getStationName.useQuery(undefined, {
    retry: 1,
  });
  const stations = useMemo(
    () => stationsQuery.data ?? [],
    [stationsQuery.data],
  );

  const [from, setFrom] = useState(
    typeof router.query.from === "string" ? router.query.from : "",
  );
  const [to, setTo] = useState(
    typeof router.query.to === "string" ? router.query.to : "",
  );
  const [date, setDate] = useState("");

  useEffect(() => {
    setFrom(typeof router.query.from === "string" ? router.query.from : "");
    setTo(typeof router.query.to === "string" ? router.query.to : "");
    setDate("");
  }, [router.query.from, router.query.to]);

  const invalidRoute = Boolean(from && to && from === to);

  const availableDatesQuery = api.search.getAvailableDates.useQuery(
    {
      dep_stop_id: from,
      arriv_stop_id: to,
    },
    {
      enabled: Boolean(from && to) && !invalidRoute,
      retry: 1,
    },
  );

  const availableDates = useMemo(
    () => availableDatesQuery.data ?? [],
    [availableDatesQuery.data],
  );

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

  const canSearch = Boolean(from && to && date && !invalidRoute);

  const swapStations = () => {
    setFrom(to);
    setTo(from);
    setDate("");
  };

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
        startDate: date,
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
                onChange={(event) => {
                  setFrom(event.target.value);
                  setDate("");
                }}
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
                onChange={(event) => {
                  setTo(event.target.value);
                  setDate("");
                }}
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
              value={date}
              onChange={(event) => setDate(event.target.value)}
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
