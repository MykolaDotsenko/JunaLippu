import React from "react";

const PopularRoutes: React.FC = () => {
  return (
    <section className="flex flex-col md:flex-row mb-4 space-y-4 md:space-y-0 md:space-x-4">
      <div 
        className="relative w-full md:w-[677px] h-[348px] bg-cover bg-center"
        style={{ backgroundImage: "url('/images/santa-claus-express-masthead.jpg')" }}
      >
        <h2 className="absolute w-[220px] h-[39px] left-[185px] top-[39px] font-inter italic font-normal text-[32px] leading-[39px] text-black">
          Popular routes
        </h2>
        <p className="absolute w-[301px] h-[38px] left-[146px] top-[126px] font-inter italic font-semibold text-[32px] leading-[39px] text-black">
          Helsinki - Tampere
        </p>
        <p className="absolute w-[305px] h-[39px] left-[146px] top-[191px] font-inter italic font-semibold text-[32px] leading-[39px] text-black">
          Helsinki - Oulu
        </p>
      </div>
      <div 
        className="relative w-full md:w-[617px] h-[345px] bg-cover bg-center md:ml-auto mt-8 md:mt-0"
        style={{ 
          backgroundImage: "url('/images/Group_637-2-2.jpg')",
          backgroundPosition: "right center" // Adjusts background image position to right center
        }}
      >
        <p className="absolute w-[202px] h-[218px] left-[40px] top-[40px] font-inter italic font-light text-[32px] leading-[39px] text-black">
          Experience FINLAND by train
        </p>
      </div>
    </section>
  );
};

export default PopularRoutes;
