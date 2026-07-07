import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, SiteTextSettingUpdateInput } from "@/api/admin";

export function useAdminSiteTexts() {
  return useQuery({
    queryKey: ["admin", "siteTexts"],
    queryFn: () => adminApi.listSiteTexts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminSiteTextMutations() {
  const queryClient = useQueryClient();

  const updateSiteText = useMutation({
    mutationFn: ({ key, input }: { key: string; input: SiteTextSettingUpdateInput }) =>
      adminApi.updateSiteText(key, input),
    onSuccess: () => {
      toast.success("문구가 수정되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["admin", "siteTexts"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "문구 수정에 실패했습니다.";
      toast.error(msg);
    },
  });

  return { updateSiteText };
}

