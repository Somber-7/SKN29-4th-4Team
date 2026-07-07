// ─── 게시물 관리 폼 검증 (관리자페이지 개발 계획서 §16.2 — RHF+Zod 표준) ───────────
// 서버 스키마(webapp/naming/schemas.py의 PostCreateIn/PostUpdateIn)와 필드명을 맞춘다.

import { z } from "zod";

export const adminPostFormSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(200),
  body: z.string().trim().min(1, "본문을 입력해 주세요."),
  categoryId: z.coerce.number().int().positive("카테고리를 선택해 주세요."),
});
export type AdminPostFormValues = z.infer<typeof adminPostFormSchema>;

export const adminPostCategoryFormSchema = z.object({
  name: z.string().trim().min(1, "카테고리명을 입력해 주세요.").max(50),
  order: z.coerce.number().int().min(0).default(0),
});
export type AdminPostCategoryFormValues = z.infer<typeof adminPostCategoryFormSchema>;
