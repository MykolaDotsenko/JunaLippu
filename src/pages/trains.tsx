import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import BookingProgress from "~/components/BookingProgress";
import PageLayout from "~/components/PageLayout";
import TripOptions from "~/components/trains/TripOptions";

const TrainsPage: React.FC = () => {
  const router = useRouter();
  const departureCity =
    typeof router.query.departureCity === "string"
      ? router.query.departureCity
      : "";
  const arrivalCity =
    typeof router.query.arrivalCity === "string"
      ? router.query.arrivalCity
      : "";
  const startDate =
    typeof router.query.startDate === "string" ? router.query.startDate : "";

  return (
    <PageLayout title="Choose a train · JunaLippu" width="lg">
      <BookingProgress current={2} />

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/"
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            ← Change search
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {departureCity || "Departure"} → {arrivalCity || "Arrival"}
          </h1>
          <p className="mt-2 text-slate-500">
            {startDate || "Service date"} · 1 passenger · one way
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
          Demo timetable
        </span>
      </div>

      <TripOptions />
    </PageLayout>
  );
};

export default TrainsPage;
