import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchJourney from "../components/MainPage/SearchJourney";
import SummerTravels from "../components/MainPage/SummerTravels";
import PopularRoutes from "../components/MainPage/PopularRoutes";

const MainPage: React.FC = () => {
  return (
    <div>
      <Header />
      <main className="p-4">
        <SearchJourney />
        <SummerTravels />
        <PopularRoutes />
      </main>
      <Footer />
    </div>
  );
};

export default MainPage;
