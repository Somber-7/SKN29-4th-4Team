// ─── 회원 관리 폼 검증 (관리자페이지 개발 계획서 §16.2 — RHF+Zod 표준) ───────────
// 서버 스키마(webapp/naming/schemas.py의 UserCreateIn/UserUpdateIn/UserApprovalIn)와
// 필드명을 맞춘다 — 계약이 어긋나면 이 파일과 서버 스키마를 함께 갱신한다.

import { z } from "zod";

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(150),
  email: z.string().trim().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
});
export type AdminUserCreateFormValues = z.infer<typeof adminUserCreateSchema>;

export const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(150),
  email: z.string().trim().email("올바른 이메일 형식이 아닙니다."),
});
export type AdminUserUpdateFormValues = z.infer<typeof adminUserUpdateSchema>;

export const adminUserRejectSchema = z.object({
  rejectedReason: z.string().trim().min(1, "거절 사유를 입력해 주세요.").max(200),
});
export type AdminUserRejectFormValues = z.infer<typeof adminUserRejectSchema>;
