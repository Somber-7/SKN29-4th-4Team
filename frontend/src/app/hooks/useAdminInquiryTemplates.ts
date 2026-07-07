import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";

export function useAdminInquiryTemplates() {
  return useQuery({
    queryKey: ["admin", "inquiryTemplates"],
    queryFn: () => adminApi.listInquiryTemplates(),
    staleTime: 60 * 1000,
  });
}

export function useAdminInquiryTemplateMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: { category?: string; title: string; body: string; isActive?: boolean }) =>
      adminApi.createInquiryTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiryTemplates"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: { category?: string; title: string; body: string; isActive?: boolean } }) =>
      adminApi.updateInquiryTemplate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiryTemplates"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteInquiryTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiryTemplates"] });
    },
  });

  const useTemplateMutation = useMutation({
    mutationFn: (id: number) => adminApi.useInquiryTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiryTemplates"] });
    },
  });

  return {
    createTemplate: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTemplate: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTemplate: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    useTemplate: useTemplateMutation.mutateAsync,
  };
}

