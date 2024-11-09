import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface City {
  id: number;
  name: string;
}

const SearchJourney: React.FC = () => {
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [passengers, setPassengers] = useState<number>(1);

  useEffect(() => {
    const fetchCities = async () => {
      const response = await fetch('/api/cities');
      const data = await response.json();
      setCities(data);
    };

    fetchCities();
  }, []);

  const handleSearchJourney = () => {
    const startDateStr = startDate ? startDate.toISOString() : '';
    const returnDateStr = returnDate ? returnDate.toISOString() : '';

    router.push({
      pathname: "/BookingJourney",
      query: {
        from,
        to,
        startDate: startDateStr,
        returnDate: returnDateStr,
        passengers: passengers.toString(),
      },
    });
  };

  return (
    <section className="relative w-full h-[597px] bg-cover bg-center" style={{ backgroundImage: "url('/images/fiska.jpg')" }}>
      <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex flex-col items-center justify-center">
        <h2 className="text-white text-2xl font-bold mb-6">Where do you want to go?</h2>
        <form className="relative bg-white bg-opacity-20 p-8 rounded-lg shadow-lg w-11/12 max-w-4xl">
          <div className="mb-6 flex space-x-4">
            <div className="flex flex-col w-full">
              <label htmlFor="from" className="text-lg font-semibold mb-2">From:</label>
              <select
                id="from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="to" className="text-lg font-semibold mb-2">To:</label>
              <select
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-6 flex space-x-4">
            <div className="flex flex-col w-full">
              <label htmlFor="date" className="text-lg font-semibold mb-2">Date:</label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select start date"
                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="return" className="text-lg font-semibold mb-2">Return Date:</label>
              <DatePicker
                selected={returnDate}
                onChange={(date: Date | null) => setReturnDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select return date"
                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="passengers" className="text-lg font-semibold mb-2">Passengers:</label>
              <select
                id="passengers"
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSearchJourney}
            className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search journey
          </button>
        </form>
      </div>
    </section>
  );
};

export default SearchJourney;
