import React from "react";
import Head from "next/head";

import Footer from "~/components/Footer";
import Header from "~/components/Header";
import PopularRoutes from "~/components/MainPage/PopularRoutes";
import SearchJourney from "~/components/MainPage/SearchJourney";

const MainPage: React.FC = () => (
  <>
    <Head>
      <title>JunaLippu · Train booking demo</title>
      <meta
        name="description"
        content="Search demo Finnish train journeys, choose a seat and create an authenticated reservation."
      />
    </Head>
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <SearchJourney />
        <PopularRoutes />
      </main>
      <Footer />
    </div>
  </>
);

export default MainPage;
