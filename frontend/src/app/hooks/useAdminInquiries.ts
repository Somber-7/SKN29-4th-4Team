// @ts-nocheck
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, type AdminInquiriesQuery } from "@/api/admin";

/** 관리자 문의 목록 — 검색/필터 전환 시 깜빡임 없이 이전 페이지를 유지한다(§16.2). */
export function useAdminInquiries(query: AdminInquiriesQuery) {
  return useQuery({
    queryKey: ["admin", "inquiries", query],
    queryFn: () => adminApi.listInquiries(query),
    placeholderData: keepPreviousData,
    staleTime: 10 * 1000,
  });
}

export function useAdminInquiryDetail(id: number | undefined) {
  return useQuery({
    queryKey: ["admin", "inquiries", id],
    queryFn: () => adminApi.getInquiry(id as number),
    enabled: id !== undefined,
  });
}
