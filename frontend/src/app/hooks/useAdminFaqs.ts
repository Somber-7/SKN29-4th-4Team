// @ts-nocheck
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, type AdminFaqsQuery } from "@/api/admin";

/** 관리자 FAQ 목록 — 검색/필터 전환 시 깜빡임 없이 이전 페이지를 유지한다(§16.2). */
export function useAdminFaqs(query: AdminFaqsQuery) {
  return useQuery({
    queryKey: ["admin", "faqs", query],
    queryFn: () => adminApi.listFaqs(query),
    placeholderData: keepPreviousData,
    staleTime: 10 * 1000,
  });
}

export function useAdminFaqCategories() {
  return useQuery({
    queryKey: ["admin", "faqCategories"],
    queryFn: () => adminApi.listFaqCategories(),
    staleTime: Infinity,
  });
}
