// @ts-nocheck
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminApi, type AdminUsersQuery } from "@/api/admin";

/**
 * 관리자 회원 목록 — 검색어를 칠 때마다 서버(§5.1 마스킹)를 다시 조회하되,
 * placeholderData: keepPreviousData(TanStack Query v5)로 새 페이지가 오기 전까지
 * 이전 목록을 계속 보여줘 테이블이 깜빡이지 않게 한다(계획서 §16.2 검토 반영).
 */
export function useAdminUsers(query: AdminUsersQuery) {
  return useQuery({
    queryKey: ["admin", "users", query],
    queryFn: () => adminApi.listUsers(query),
    placeholderData: keepPreviousData,
    staleTime: 10 * 1000,
  });
}

/** 회원 상세 — id가 없으면(라우트 파라미터 파싱 전) 쿼리를 비활성화한다. */
export function useAdminUserDetail(id: number | undefined) {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => adminApi.getUser(id as number),
    enabled: id !== undefined,
  });
}

/** 회원 활동 로그(로그인/작명 요청) — 탭·페이지 전환 시에도 깜빡이지 않도록 동일 패턴 적용. */
export function useAdminUserActivity(id: number | undefined, type: "login" | "naming", page: number) {
  return useQuery({
    queryKey: ["admin", "users", id, "activity", type, page],
    queryFn: () => adminApi.getUserActivity(id as number, type, page, 10),
    enabled: id !== undefined,
    placeholderData: keepPreviousData,
  });
}
