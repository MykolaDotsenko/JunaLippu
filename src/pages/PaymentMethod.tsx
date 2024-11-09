import React from "react";
import { useRouter } from "next/router";
import Header from "~/components/Header";
import Footer from "~/components/Footer";

const PaymentMethod: React.FC = () => {
  const router = useRouter();

  const handleCompletePurchase = () => {
    // Purchase completed
    alert("Purchase completed!");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-8 max-w-2xl mx-auto bg-gray-100">
        <h2 className="text-3xl font-bold mb-6 text-center">Payment Method</h2>

        <div className="bg-white shadow-lg border border-gray-300 rounded-lg p-6 mb-8">
          <h3 className="text-2xl font-semibold mb-4">Select Payment Method</h3>
          <ul className="list-disc list-inside space-y-4 text-lg">
            <li className="p-4 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">Payment Card</li>
            <li className="p-4 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">Invoice</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleCompletePurchase}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Complete Purchase
          </button>
          <button
            onClick={handleBack}
            className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg text-xl font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
