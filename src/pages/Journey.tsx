import React from "react";
import { useRouter } from "next/router";
import Header from "~/components/Header";
import Footer from "~/components/Footer";

const Journey: React.FC = () => {
  const router = useRouter();
  const { time, duration, price, date, departureCity, arrivalCity } = router.query;

  const handleContinue = () => {
    router.push("/PaymentMethod");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-8 max-w-4xl mx-auto bg-gray-100">
        <h2 className="text-3xl font-bold text-center mb-6">Customized Departure Itinerary, Seat, and Class</h2>
        
        <p className="text-xl mb-4 text-center"><strong>Date:</strong> {date}</p>
        <p className="text-xl mb-4 text-center"><strong>Departure City:</strong> {departureCity}</p>
        <p className="text-xl mb-6 text-center"><strong>Arrival City:</strong> {arrivalCity}</p>
        <p className="text-xl mb-6 text-center"><strong>Details:</strong> {time} - {duration} - {price}</p>

        <h3 className="text-2xl font-semibold mb-4 text-center">Travel Class</h3>
        <div className="flex justify-center gap-4 mb-6">
          <div className="flex-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-2 hover:bg-blue-700">1st Class</button>
            <div className="text-xl font-bold">{price}</div>
          </div>
          <div className="flex-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg mb-2 hover:bg-green-700">2nd Class</button>
            <div className="text-xl font-bold">{(price && price !== 'NaN') ? (parseFloat(price)/2).toFixed(2) : 'N/A'}</div>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4">Seat No:</h3>
        <input 
          type="text" 
          placeholder="Enter seat number" 
          className="w-full p-3 border border-gray-300 rounded-lg mb-6"
        />

        <h3 className="text-2xl font-semibold mb-4">Van No:</h3>
        <input 
          type="text" 
          placeholder="Enter van number" 
          className="w-full p-3 border border-gray-300 rounded-lg mb-6"
        />

        <h3 className="text-2xl font-semibold mb-4 text-center">Total Price: <span className="text-blue-600">{price}</span></h3>
        <p className="text-center mb-6">---</p>

        <button 
          onClick={handleContinue} 
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Continue
        </button>
      </main>
      <Footer />
    </div>
  );
};

export default Journey;
