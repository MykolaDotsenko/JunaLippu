import React from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";

import Footer from "~/components/Footer";
import Header from "~/components/Header";
import { api } from "~/utils/api";

const PaymentMethod: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const tripId = typeof router.query.tripId === "string" ? router.query.tripId : "";
  const depStopId = typeof router.query.depStopId === "string" ? router.query.depStopId : "";
  const arrivStopId = typeof router.query.arrivStopId === "string" ? router.query.arrivStopId : "";
  const departureCity = typeof router.query.departureCity === "string" ? router.query.departureCity : "";
  const arrivalCity = typeof router.query.arrivalCity === "string" ? router.query.arrivalCity : "";
  const departureTime = typeof router.query.departureTime === "string" ? router.query.departureTime : "";
  const arrivalTime = typeof router.query.arrivalTime === "string" ? router.query.arrivalTime : "";
  const price = Number(typeof router.query.price === "string" ? router.query.price : "0");
  const seatId = Number(typeof router.query.seatId === "string" ? router.query.seatId : "0");
  const seatNumber = typeof router.query.seatNumber === "string" ? router.query.seatNumber : "";
  const carNumber = typeof router.query.carNumber === "string" ? router.query.carNumber : "";

  const createReservation = api.booking.createReservation.useMutation({
    onSuccess: (reservation) => {
      void router.push({
        pathname: "/",
        query: { booked: reservation.reservation_id.toString() },
      });
    },
  });

  const handleCompletePurchase = () => {
    if (!session) {
      void signIn("google", { callbackUrl: router.asPath });
      return;
    }

    if (!tripId || !depStopId || !arrivStopId || !seatId) return;

    createReservation.mutate({
      seat_id: seatId,
      trip_id: tripId,
      dep_stop_id: depStopId,
      arriv_stop_id: arrivStopId,
      price,
      departure_time: departureTime,
      arrival_time: arrivalTime,
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-grow bg-gray-100 p-8">
        <h2 className="mb-6 text-center text-3xl font-bold">Confirm booking</h2>

        <div className="mb-8 rounded-lg border border-gray-300 bg-white p-6 shadow">
          <p><strong>Route:</strong> {departureCity} → {arrivalCity}</p>
          <p><strong>Time:</strong> {departureTime} – {arrivalTime}</p>
          <p><strong>Car:</strong> {carNumber}</p>
          <p><strong>Seat:</strong> {seatNumber}</p>
          <p><strong>Total:</strong> €{price.toFixed(2)}</p>
        </div>

        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          This portfolio version creates a real reservation in the application database.
          Payment processing itself is intentionally not implemented.
        </div>

        {!session && status !== "loading" && (
          <p className="mb-4 text-center text-sm text-gray-700">
            Sign in with Google to complete the reservation.
          </p>
        )}

        {createReservation.error && (
          <p className="mb-4 rounded bg-red-100 p-3 text-red-800">
            {createReservation.error.message}
          </p>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleCompletePurchase}
            disabled={status === "loading" || createReservation.isPending}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-xl font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {!session ? "Sign in and reserve" : createReservation.isPending ? "Reserving…" : "Confirm reservation"}
          </button>
          <button
            onClick={() => router.back()}
            className="w-full rounded-lg bg-gray-600 px-6 py-3 text-xl font-semibold text-white hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentMethod;
