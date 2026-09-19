import { useEffect, useState } from "react";
import { getProviders } from "next-auth/react";

type GoogleAuthStatus = "loading" | "available" | "unavailable";

export const useGoogleAuthStatus = (): GoogleAuthStatus => {
  const [status, setStatus] = useState<GoogleAuthStatus>("loading");

  useEffect(() => {
    let active = true;

    void getProviders()
      .then((providers) => {
        if (active) setStatus(providers?.google ? "available" : "unavailable");
      })
      .catch(() => {
        if (active) setStatus("unavailable");
      });

    return () => {
      active = false;
    };
  }, []);

  return status;
};
