import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import StepButtons from "~/components/BookingJourney/StepButtons";
import TripDetails from "~/components/BookingJourney/TripDetails";
import TripOptions from "~/components/BookingJourney/TripOptions";
import Navigation from "~/components/BookingJourney/Navigation";

const BookingJourney: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-8">
        {/* Steps of booking journey */}
        <section className="mb-8">
          <StepButtons />
        </section>

        {/* Details of journey */}
        <section className="mb-8">
          <TripDetails />
        </section>

        {/* List of journey options */}
        <section className="mb-8">
          <TripOptions />
        </section>

        {/* Navigation days */}
        <section>
          <Navigation />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BookingJourney;
