import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";

import Footer from "~/components/Footer";
import Header from "~/components/Header";
import { api } from "~/utils/api";

const Journey: React.FC = () => {
  const router = useRouter();

  const tripId = typeof router.query.tripId === "string" ? router.query.tripId : "";
  const depStopId = typeof router.query.depStopId === "string" ? router.query.depStopId : "";
  const arrivStopId = typeof router.query.arrivStopId === "string" ? router.query.arrivStopId : "";
  const departureCity = typeof router.query.departureCity === "string" ? router.query.departureCity : "";
  const arrivalCity = typeof router.query.arrivalCity === "string" ? router.query.arrivalCity : "";
  const departureTime = typeof router.query.departureTime === "string" ? router.query.departureTime : "";
  const arrivalTime = typeof router.query.arrivalTime === "string" ? router.query.arrivalTime : "";
  const duration = typeof router.query.duration === "string" ? router.query.duration : "";
  const date = typeof router.query.date === "string" ? router.query.date : "";
  const basePrice = Number(typeof router.query.price === "string" ? router.query.price : "0");

  const [travelClass, setTravelClass] = useState<1 | 2>(2);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);

  const seats = api.booking.getSeat.useQuery(
    { travel_class: travelClass, trip_id: tripId },
    { enabled: Boolean(tripId) },
  );

  const selectedSeat = useMemo(
    () => seats.data?.find((seat) => seat.seat_id === selectedSeatId),
    [seats.data, selectedSeatId],
  );

  const totalPrice = travelClass === 1 ? basePrice * 1.5 : basePrice;

  const handleContinue = () => {
    if (!selectedSeat) return;

    void router.push({
      pathname: "/PaymentMethod",
      query: {
        tripId,
        depStopId,
        arrivStopId,
        departureCity,
        arrivalCity,
        departureTime,
        arrivalTime,
        duration,
        date,
        price: totalPrice.toFixed(2),
        seatId: selectedSeat.seat_id.toString(),
        seatNumber: selectedSeat.seat_number.toString(),
        carNumber: selectedSeat.car_number.toString(),
        travelClass: travelClass.toString(),
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-grow bg-gray-100 p-8">
        <h2 className="mb-6 text-center text-3xl font-bold">Choose class and seat</h2>

        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <p><strong>Route:</strong> {departureCity} → {arrivalCity}</p>
          <p><strong>Date:</strong> {date ? new Date(date).toLocaleDateString() : "—"}</p>
          <p><strong>Time:</strong> {departureTime} – {arrivalTime}</p>
          <p><strong>Duration:</strong> {duration}</p>
        </div>

        <h3 className="mb-4 text-2xl font-semibold">Travel class</h3>
        <div className="mb-8 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setTravelClass(1);
              setSelectedSeatId(null);
            }}
            className={`rounded-lg border p-4 text-left ${travelClass === 1 ? "border-blue-600 bg-blue-50" : "border-gray-300 bg-white"}`}
          >
            <div className="text-xl font-bold">1st class</div>
            <div>€{(basePrice * 1.5).toFixed(2)}</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setTravelClass(2);
              setSelectedSeatId(null);
            }}
            className={`rounded-lg border p-4 text-left ${travelClass === 2 ? "border-blue-600 bg-blue-50" : "border-gray-300 bg-white"}`}
          >
            <div className="text-xl font-bold">2nd class</div>
            <div>€{basePrice.toFixed(2)}</div>
          </button>
        </div>

        <h3 className="mb-4 text-2xl font-semibold">Available seats</h3>

        {seats.isLoading && <p>Loading seats…</p>}
        {seats.error && <p className="text-red-700">Unable to load available seats.</p>}
        {seats.data && seats.data.length === 0 && <p>No seats available in this class.</p>}

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {seats.data?.map((seat) => (
            <button
              key={seat.seat_id}
              type="button"
              onClick={() => setSelectedSeatId(seat.seat_id)}
              className={`rounded-lg border p-3 text-left ${selectedSeatId === seat.seat_id ? "border-green-600 bg-green-50" : "border-gray-300 bg-white"}`}
            >
              <div className="font-semibold">Car {seat.car_number}</div>
              <div>Seat {seat.seat_number}</div>
              <div className="text-sm text-gray-600">Train {seat.train_number}</div>
            </button>
          ))}
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 text-center text-xl font-semibold shadow">
          Total: €{totalPrice.toFixed(2)}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedSeat}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-xl font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue to confirmation
        </button>
      </main>
      <Footer />
    </div>
  );
};

export default Journey;
