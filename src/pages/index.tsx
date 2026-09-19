import React from "react";

import PageLayout from "~/components/PageLayout";
import PopularRoutes from "~/components/home/PopularRoutes";
import RailExperience from "~/components/home/RailExperience";
import SearchJourney from "~/components/home/SearchJourney";

const HomePage = () => (
  <PageLayout
    title="JunaLippu · Train booking demo"
    description="Search demo Finnish train journeys, choose a seat and create an authenticated reservation."
  >
    <SearchJourney />
    <PopularRoutes />
    <RailExperience />
  </PageLayout>
);

export default HomePage;
