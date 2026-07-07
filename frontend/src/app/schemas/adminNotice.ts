// ─── 공지사항 관리 폼 검증 (관리자페이지 개발 계획서 §16.2 — RHF+Zod 표준) ─────────
// 서버 스키마(webapp/naming/schemas.py의 NoticeCreateIn/NoticeUpdateIn)와 필드명을 맞춘다.

import { z } from "zod";

export const adminNoticeFormSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(200),
  body: z.string().trim().min(1, "본문을 입력해 주세요."),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ENDED"]),
  isPinned: z.boolean(),
  startAt: z.string().trim().optional().or(z.literal("")),
  endAt: z.string().trim().optional().or(z.literal("")),
});
export type AdminNoticeFormValues = z.infer<typeof adminNoticeFormSchema>;
