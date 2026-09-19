import React, { useState } from "react";
import { useRouter } from "next/router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { api } from "~/utils/api";

const SearchJourney: React.FC = () => {
  const router = useRouter();
  const { data: stations = [], isLoading } = api.search.getStationName.useQuery();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [passengers, setPassengers] = useState(1);

  const handleSearchJourney = () => {
    if (!from || !to || from === to || !startDate) return;

    const departure = stations.find((station) => station.stop_id === from);
    const arrival = stations.find((station) => station.stop_id === to);

    void router.push({
      pathname: "/BookingJourney",
      query: {
        depStopId: from,
        arrivStopId: to,
        departureCity: departure?.stop_name ?? from,
        arrivalCity: arrival?.stop_name ?? to,
        startDate: startDate.toISOString(),
        returnDate: returnDate?.toISOString() ?? "",
        passengers: passengers.toString(),
      },
    });
  };

  return (
    <section
      className="relative h-[597px] w-full bg-cover bg-center"
      style={{ backgroundImage: "url('/images/fiska.jpg')" }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-50">
        <h2 className="mb-6 text-2xl font-bold text-white">Where do you want to go?</h2>

        <form className="relative w-11/12 max-w-4xl rounded-lg bg-white bg-opacity-20 p-8 shadow-lg">
          <div className="mb-6 flex space-x-4">
            <div className="flex w-full flex-col">
              <label htmlFor="from" className="mb-2 text-lg font-semibold">From:</label>
              <select
                id="from"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                disabled={isLoading}
                className="rounded-lg border border-gray-300 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select station</option>
                {stations.map((station) => (
                  <option key={station.stop_id} value={station.stop_id}>
                    {station.stop_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full flex-col">
              <label htmlFor="to" className="mb-2 text-lg font-semibold">To:</label>
              <select
                id="to"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                disabled={isLoading}
                className="rounded-lg border border-gray-300 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select station</option>
                {stations.map((station) => (
                  <option key={station.stop_id} value={station.stop_id}>
                    {station.stop_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6 flex space-x-4">
            <div className="flex w-full flex-col">
              <label className="mb-2 text-lg font-semibold">Date:</label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                dateFormat="dd/MM/yyyy"
                minDate={new Date()}
                placeholderText="Select start date"
                className="rounded-lg border border-gray-300 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex w-full flex-col">
              <label className="mb-2 text-lg font-semibold">Return Date:</label>
              <DatePicker
                selected={returnDate}
                onChange={(date: Date | null) => setReturnDate(date)}
                minDate={startDate ?? new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="Optional"
                className="rounded-lg border border-gray-300 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex w-full flex-col">
              <label htmlFor="passengers" className="mb-2 text-lg font-semibold">Passengers:</label>
              <select
                id="passengers"
                value={passengers}
                onChange={(event) => setPassengers(Number(event.target.value))}
                className="rounded-lg border border-gray-300 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4].map((count) => (
                  <option key={count} value={count}>{count}</option>
                ))}
              </select>
            </div>
          </div>

          {from && to && from === to && (
            <p className="mb-3 text-sm font-semibold text-red-700">
              Departure and arrival stations must be different.
            </p>
          )}

          <button
            type="button"
            onClick={handleSearchJourney}
            disabled={!from || !to || from === to || !startDate}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search journey
          </button>
        </form>
      </div>
    </section>
  );
};

export default SearchJourney;
