// ─── 고객센터(FAQ · 문의) 도메인 API ────────────────────────────────────────────
// TODO(API): FAQ는 정적 콘텐츠로 유지 가능(연동 후순위). 문의 제출은 Django 접수 엔드포인트 필요.

import { USE_MOCK, apiClient, mockDelay } from "./client";
import type { FaqCategory, FaqItem, NoticeItem } from "@/app/types";
import { FAQ_CATEGORY_LABELS, FAQ_ITEMS } from "./mock/faq.mock";

export interface FaqBundle {
  items: FaqItem[];
  categoryLabels: Record<FaqCategory, string>;
}

export interface NoticeBundle {
  items: NoticeItem[];
  total: number;
}

export interface ContactInput {
  name: string;
  email: string;
  topic: string;
  subject: string;
  message: string;
}

export interface Heartbeat {
  status: string;
  maintenance: boolean;
  reason: string;
}

export interface SupportApi {
  getFaq(): Promise<FaqBundle>;
  getNotices(): Promise<NoticeBundle>;
  submitContact(input: ContactInput): Promise<void>;
  getHeartbeat(): Promise<Heartbeat>;
}

const MOCK_FAQ: FaqBundle = {
  items: FAQ_ITEMS,
  categoryLabels: FAQ_CATEGORY_LABELS,
};

const mockAdapter: SupportApi = {
  getFaq: () => mockDelay(MOCK_FAQ, 0),
  getNotices: () => mockDelay({ items: [], total: 0 }, 100),
  async submitContact() {
    await mockDelay(undefined, 900);
  },
  getHeartbeat: () => mockDelay({ status: "ok", maintenance: false, reason: "" }, 100),
};

const realAdapter: SupportApi = {
  getFaq: () => apiClient.get<FaqBundle>("/support/faqs"),
  getNotices: () => apiClient.get<NoticeBundle>("/support/notices"),
  submitContact: (input) => apiClient.post<void>("/support/contact", input),
  getHeartbeat: () => apiClient.get<Heartbeat>("/support/heartbeat"),
};

export const supportApi: SupportApi = USE_MOCK ? mockAdapter : realAdapter;

/** mock 모드에서 useFaq 훅의 initialData로 재사용 */
export const MOCK_FAQ_BUNDLE = MOCK_FAQ;
