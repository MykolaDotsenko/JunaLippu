import React from "react";

import PageLayout from "~/components/PageLayout";
import PopularRoutes from "~/components/home/PopularRoutes";
import SearchJourney from "~/components/home/SearchJourney";

const HomePage = () => (
  <PageLayout
    title="JunaLippu · Train booking demo"
    description="Search demo Finnish train journeys, choose a seat and create an authenticated reservation."
  >
    <SearchJourney />
    <PopularRoutes />
  </PageLayout>
);

export default HomePage;
