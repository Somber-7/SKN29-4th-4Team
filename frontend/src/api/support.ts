// ─── 고객센터(FAQ · 문의) 도메인 API ────────────────────────────────────────────
// TODO(API): FAQ는 정적 콘텐츠로 유지 가능(연동 후순위). 문의 제출은 Django 접수 엔드포인트 필요.

import { USE_MOCK, apiClient, mockDelay } from "./client";
import type { FaqCategory, FaqItem } from "@/app/types";
import { FAQ_CATEGORY_LABELS, FAQ_ITEMS } from "./mock/faq.mock";

export interface FaqBundle {
  items: FaqItem[];
  categoryLabels: Record<FaqCategory, string>;
}

export interface ContactInput {
  name: string;
  email: string;
  topic: string;
  subject: string;
  message: string;
}

export interface SupportApi {
  getFaq(): Promise<FaqBundle>;
  submitContact(input: ContactInput): Promise<void>;
}

const MOCK_FAQ: FaqBundle = {
  items: FAQ_ITEMS,
  categoryLabels: FAQ_CATEGORY_LABELS,
};

const mockAdapter: SupportApi = {
  getFaq: () => mockDelay(MOCK_FAQ, 0),
  async submitContact() {
    await mockDelay(undefined, 900);
  },
};

const realAdapter: SupportApi = {
  getFaq: () => apiClient.get<FaqBundle>("/support/faq"),
  submitContact: (input) => apiClient.post<void>("/support/contact", input),
};

export const supportApi: SupportApi = USE_MOCK ? mockAdapter : realAdapter;

/** mock 모드에서 useFaq 훅의 initialData로 재사용 */
export const MOCK_FAQ_BUNDLE = MOCK_FAQ;
