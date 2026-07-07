import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

export function useSiteTexts() {
  return useQuery({
    queryKey: ["siteTexts"],
    queryFn: async () => {
      const { data } = await apiClient.get<Record<string, string>>("/site-texts");
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

