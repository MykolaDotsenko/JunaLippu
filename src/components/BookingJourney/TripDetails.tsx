import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const TripDetails: React.FC = () => {
  const router = useRouter();
  const [departure, setDeparture] = useState<string>('');
  const [arrival, setArrival] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<number>(1);

  useEffect(() => {
    const { from, to, startDate, returnDate, passengers } = router.query;

    if (typeof from === 'string') setDeparture(from);
    if (typeof to === 'string') setArrival(to);
    if (typeof startDate === 'string') {
      const date = new Date(startDate);
      setDepartureDate(date.toLocaleDateString());
    }
    if (typeof returnDate === 'string' && returnDate) {
      const date = new Date(returnDate);
      setReturnDate(date.toLocaleDateString());
    }
    if (typeof passengers === 'string') {
      const parsedPassengers = parseInt(passengers, 10);
      setPassengers(parsedPassengers);
    }
  }, [router.query]);

  return (
    <div className="flex flex-wrap gap-8 justify-center">
      {/* Departure */}
      <div className="flex flex-col w-[705px] h-[101px] bg-[rgba(56,86,37,0.45)] border border-black rounded-[25px] p-4 flex items-center">
        <div className="flex flex-col items-center w-full h-full justify-center">
          <label htmlFor="departure" className="italic font-semibold text-[32px] leading-[39px] text-black mb-2 text-center">Departure:</label>
          <input 
            type="text" 
            id="departure" 
            value={departure} 
            readOnly 
            className="bg-transparent border-none outline-none text-black text-[32px] font-semibold leading-[39px] text-center w-full h-full"
          />
        </div>
      </div>
      
      {/* Arrival */}
      <div className="flex flex-col w-[705px] h-[101px] bg-[rgba(56,86,37,0.45)] border border-black rounded-[25px] p-4 flex items-center">
        <div className="flex flex-col items-center w-full h-full justify-center">
          <label htmlFor="arrival" className="italic font-semibold text-[32px] leading-[39px] text-black mb-2 text-center">Arrival:</label>
          <input 
            type="text" 
            id="arrival" 
            value={arrival} 
            readOnly 
            className="bg-transparent border-none outline-none text-black text-[32px] font-semibold leading-[39px] text-center w-full h-full"
          />
        </div>
      </div>
      
      {/* Departure Date */}
      <div className="flex flex-col w-[557px] h-[105px] bg-[#E1EFD9] border border-black rounded-[25px] p-4 flex items-center">
        <div className="flex flex-col items-center w-full h-full justify-center">
          <label htmlFor="departureDate" className="font-medium text-[32px] leading-[39px] text-black mb-2 text-center">Departure Date:</label>
          <input 
            type="text" 
            id="departureDate" 
            value={departureDate} 
            readOnly 
            className="bg-transparent border-none outline-none text-black text-[32px] font-medium leading-[39px] text-center w-full h-full"
          />
        </div>
      </div>
      
      {/* Return Date */}
      {returnDate && (
        <div className="flex flex-col w-[598px] h-[105px] bg-[#E1EFD9] border border-black rounded-[25px] p-4 flex items-center">
          <div className="flex flex-col items-center w-full h-full justify-center">
            <label htmlFor="returnDate" className="font-medium text-[32px] leading-[39px] text-black mb-2 text-center">Return Date:</label>
            <input 
              type="text" 
              id="returnDate" 
              value={returnDate} 
              readOnly 
              className="bg-transparent border-none outline-none text-black text-[32px] font-medium leading-[39px] text-center w-full h-full"
            />
          </div>
        </div>
      )}
      
      {/* Passengers */}
      <div className="flex flex-col w-[225px] h-[105px] bg-[#D9D9D9] border border-black rounded-[25px] p-4 flex items-center">
        <div className="flex flex-col items-center w-full h-full justify-center">
          <label htmlFor="passengers" className="font-normal text-[32px] leading-[39px] text-black mb-2 text-center">Passengers:</label>
          <input 
            type="text" 
            id="passengers" 
            value={passengers} 
            readOnly 
            className="bg-transparent border-none outline-none text-black text-[32px] font-normal leading-[39px] text-center w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
