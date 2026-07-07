// ─── FAQ 관리 폼 검증 (관리자페이지 개발 계획서 §16.2 — RHF+Zod 표준) ─────────────
// 서버 스키마(webapp/naming/schemas.py의 FAQCreateIn/FAQUpdateIn)와 필드명을 맞춘다.

import { z } from "zod";

export const adminFaqFormSchema = z.object({
  question: z.string().trim().min(1, "질문을 입력해 주세요.").max(200),
  answer: z.string().trim().min(1, "답변을 입력해 주세요."),
  categoryId: z.coerce.number().int().positive("카테고리를 선택해 주세요."),
  isActive: z.boolean(),
  order: z.coerce.number().int().min(0),
});
export type AdminFaqFormValues = z.infer<typeof adminFaqFormSchema>;

export const adminFaqCategoryFormSchema = z.object({
  name: z.string().trim().min(1, "카테고리명을 입력해 주세요.").max(50),
  order: z.coerce.number().int().min(0).default(0),
});
export type AdminFaqCategoryFormValues = z.infer<typeof adminFaqCategoryFormSchema>;
