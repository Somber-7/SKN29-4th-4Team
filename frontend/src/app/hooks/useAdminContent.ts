import { useMemo } from "react";

export function useAdminContent() {
  return useMemo(
    () => ({
      hanja: [],
      sources: [],
    }),
    [],
  );
}
