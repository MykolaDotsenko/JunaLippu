import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { api } from "~/utils/api";

const TripOptions: React.FC = () => {
  const router = useRouter();
  const depStopId = typeof router.query.depStopId === "string" ? router.query.depStopId : "";
  const arrivStopId = typeof router.query.arrivStopId === "string" ? router.query.arrivStopId : "";
  const departureCity = typeof router.query.departureCity === "string" ? router.query.departureCity : "";
  const arrivalCity = typeof router.query.arrivalCity === "string" ? router.query.arrivalCity : "";
  const startDate = typeof router.query.startDate === "string" ? router.query.startDate : "";

  const schedule = api.search.getSchedule.useQuery(
    { dep_stop_id: depStopId, arriv_stop_id: arrivStopId },
    { enabled: Boolean(depStopId && arrivStopId) },
  );

  if (schedule.isLoading) {
    return <p className="py-8 text-center text-lg">Searching available journeys…</p>;
  }

  if (schedule.error) {
    return <p className="py-8 text-center text-lg text-red-700">Unable to load journeys.</p>;
  }

  if (!schedule.data?.length) {
    return <p className="py-8 text-center text-lg">No journeys found for this route.</p>;
  }

  return (
    <div className="space-y-4">
      {schedule.data.map((trip) => {
        const price = trip.min_price.toFixed(2);

        return (
          <Link
            key={trip.trip_id}
            href={{
              pathname: "/Journey",
              query: {
                tripId: trip.trip_id,
                depStopId,
                arrivStopId,
                departureCity,
                arrivalCity,
                date: startDate,
                departureTime: trip.departure_time,
                arrivalTime: trip.arrival_time,
                duration: trip.duration,
                price,
              },
            }}
            className="grid grid-cols-3 items-center rounded-md border border-gray-300 bg-gray-100 p-4 transition hover:bg-gray-200"
          >
            <span className="text-lg font-medium">
              {trip.departure_time} – {trip.arrival_time}
            </span>
            <span className="text-center text-lg">{trip.duration}</span>
            <span className="text-right text-lg font-semibold">from €{price}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default TripOptions;
