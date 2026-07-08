import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";

export function useInquiries() {
  return useQuery({
    queryKey: ["me", "inquiries"],
    queryFn: () => authApi.getInquiries(),
    staleTime: 60 * 1000,
  });
}
