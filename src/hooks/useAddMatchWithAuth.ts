// hooks/useAddMatchWithAuth.ts

import { isRatioBattle } from "../utils/logic";
import { useAuth } from "./useAuth";

export function useAddMatchWithAuth(
  addMatchItem: (data: any) => Promise<void>,
  currentRatios: any,
  maxRatio: number,
  isRegistrationAllowed: boolean,
) {
  const { user } = useAuth();

  return async (data: {
    first: Trio;
    second: Trio;
    winner: Winner;
    matchDate: number | null;
  }) => {
    if (!isRegistrationAllowed) return;

    await addMatchItem({
      ...data,
      ratio: isRatioBattle(data.first, data.second, currentRatios, maxRatio),
      userId: user?.uid ?? null,
      matchDate: data.matchDate,
    });
  };
}
