import { useQuery } from "@tanstack/react-query";

import { adminApi, AdminAccountsQuery } from "@/api/admin";

export function useAdminAccounts(query: AdminAccountsQuery) {
  return useQuery({
    queryKey: ["admin", "accounts", query],
    queryFn: () => adminApi.listAccounts(query),
    staleTime: 5 * 60 * 1000,
  });
}

