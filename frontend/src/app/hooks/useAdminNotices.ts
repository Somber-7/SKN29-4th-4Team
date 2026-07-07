// @ts-nocheck
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, type AdminNoticesQuery } from "@/api/admin";

/** 관리자 공지 목록 — 검색/필터 전환 시 깜빡임 없이 이전 페이지를 유지한다(§16.2). */
export function useAdminNotices(query: AdminNoticesQuery) {
  return useQuery({
    queryKey: ["admin", "notices", query],
    queryFn: () => adminApi.listNotices(query),
    placeholderData: keepPreviousData,
    staleTime: 10 * 1000,
  });
}

export function useAdminNoticeDetail(id: number | undefined) {
  return useQuery({
    queryKey: ["admin", "notices", id],
    queryFn: () => adminApi.getNotice(id as number),
    enabled: id !== undefined,
  });
}
