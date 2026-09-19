import React, { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";

const Header: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showDescription, setShowDescription] = useState(false);

  const handleAuth = () => {
    if (session) {
      void signOut({ callbackUrl: "/" });
      return;
    }

    void signIn("google", { callbackUrl: "/" });
  };

  return (
    <header className="relative flex h-24 items-center justify-between p-4 text-white">
      <button
        type="button"
        onClick={() => void router.push("/")}
        className="absolute left-[50px] top-0 flex h-full items-center"
        aria-label="Go to home page"
      >
        <img
          src="/images/logo.png"
          alt="JunaLippu"
          className="h-full w-[199px] rounded-[60px]"
        />
      </button>

      <nav className="ml-auto pr-[236px]">
        <ul className="flex space-x-4">
          <li>
            <button
              onClick={() => void router.push("/")}
              className="px-4 py-2 text-2xl font-bold italic text-black hover:text-gray-500"
            >
              HOME
            </button>
          </li>
          <li>
            <button
              onClick={() => setShowDescription((open) => !open)}
              className="px-4 py-2 text-2xl font-bold italic text-black hover:text-gray-500"
            >
              ABOUT
            </button>
          </li>
          <li>
            <button
              onClick={handleAuth}
              disabled={status === "loading"}
              className="px-4 py-2 text-2xl font-bold italic text-black hover:text-gray-500 disabled:opacity-50"
            >
              {session ? "LOG OUT" : "LOG IN"}
            </button>
          </li>
        </ul>
      </nav>

      {showDescription && (
        <div className="absolute right-0 top-16 z-20 max-w-sm rounded-lg bg-white p-6 shadow-lg">
          <h3 className="mb-2 text-xl font-semibold text-gray-800">About JunaLippu</h3>
          <p className="text-base leading-relaxed text-gray-600">
            JunaLippu is a demo railway booking application for searching journeys,
            selecting seats, and creating authenticated reservations.
          </p>
        </div>
      )}
    </header>
  );
};

export default Header;
