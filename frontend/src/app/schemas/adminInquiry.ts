// ─── 문의 답변 폼 검증 (관리자페이지 개발 계획서 §16.2 — RHF+Zod 표준) ──────────────
// 서버 스키마(webapp/naming/schemas.py의 InquiryReplyIn)와 필드명을 맞춘다.

import { z } from "zod";

export const adminInquiryReplyFormSchema = z.object({
  status: z.enum(["received", "in_progress", "answered"]),
  adminReply: z.string().trim().max(2000),
});
export type AdminInquiryReplyFormValues = z.infer<typeof adminInquiryReplyFormSchema>;
