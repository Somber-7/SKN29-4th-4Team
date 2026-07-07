import { z } from "zod";

export const adminAccountCreateSchema = z.object({
  username: z
    .string()
    .min(4, "아이디는 최소 4자 이상이어야 합니다.")
    .max(20, "아이디는 20자를 초과할 수 없습니다.")
    .regex(/^[a-zA-Z0-9]+$/, "영문과 숫자만 사용 가능합니다."),
  displayName: z.string().min(1, "이름을 입력해주세요.").max(50, "이름이 너무 깁니다."),
  role: z.enum(["SUPERADMIN", "ADMIN", "ANALYST"], {
    errorMap: () => ({ message: "올바른 역할을 선택해주세요." }),
  }),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다."),
});

export type AdminAccountCreateFormValues = z.infer<typeof adminAccountCreateSchema>;

export const adminAccountUpdateSchema = z.object({
  displayName: z.string().min(1, "이름을 입력해주세요.").max(50, "이름이 너무 깁니다."),
  isActiveAdmin: z.boolean(),
});

export type AdminAccountUpdateFormValues = z.infer<typeof adminAccountUpdateSchema>;
