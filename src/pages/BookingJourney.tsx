import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import BookingProgress from "~/components/BookingProgress";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import TripOptions from "~/components/BookingJourney/TripOptions";
import { api } from "~/utils/api";

const serviceDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const BookingJourney: React.FC = () => {
  const router = useRouter();
  const depStopId =
    typeof router.query.depStopId === "string" ? router.query.depStopId : "";
  const arrivStopId =
    typeof router.query.arrivStopId === "string" ? router.query.arrivStopId : "";
  const startDate =
    typeof router.query.startDate === "string" ? router.query.startDate : "";

  const validInput = Boolean(
    depStopId &&
      arrivStopId &&
      depStopId !== arrivStopId &&
      serviceDatePattern.test(startDate),
  );

  const route = api.search.getRouteContext.useQuery(
    { dep_stop_id: depStopId, arriv_stop_id: arrivStopId },
    { enabled: validInput, retry: false },
  );

  const routeIsValid = validInput && !route.isError && route.data !== null;

  return (
    <>
      <Head>
        <title>Choose a train · JunaLippu</title>
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header />
        <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
          <BookingProgress current={2} />

          {!validInput || route.data === null || route.isError ? (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
              <h1 className="text-xl font-bold">Journey search details are invalid.</h1>
              <p className="mt-2 text-sm">
                Start a new search to choose a valid route and service date.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 font-semibold text-white"
              >
                Back to search
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">
                    ← Change search
                  </Link>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                    {route.data
                      ? `${route.data.departure_stop_name} → ${route.data.arrival_stop_name}`
                      : "Loading route…"}
                  </h1>
                  <p className="mt-2 text-slate-500">
                    {startDate} · 1 passenger · one way
                  </p>
                </div>
                <span className="w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  Demo timetable
                </span>
              </div>

              {routeIsValid && <TripOptions />}
            </>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BookingJourney;
