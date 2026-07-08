import type { UserInquiryEntry } from "@/app/types";

export const INQUIRIES_ENTRIES: UserInquiryEntry[] = [
  {
    id: 1,
    topic: "이용 문의",
    subject: "작명 결과는 언제까지 보관되나요?",
    message: "어제 작명을 진행했는데, 결과가 언제까지 보관되는지 궁금합니다. 나중에도 다시 볼 수 있나요?",
    status: "answered",
    adminReply: "안녕하세요. 명가작명소입니다.\n회원님의 작명 기록은 회원 탈퇴 전까지 안전하게 보관되며, 언제든지 마이페이지의 '작명 기록' 탭에서 다시 확인하실 수 있습니다.\n감사합니다.",
    createdAt: "2026-07-06T10:30:00Z",
    answeredAt: "2026-07-06T14:15:00Z",
  },
  {
    id: 2,
    topic: "결제/환불",
    subject: "환불 규정이 어떻게 되나요?",
    message: "실수로 결제를 두 번 진행했습니다. 환불 절차가 어떻게 되는지 알려주세요.",
    status: "in_progress",
    adminReply: "",
    createdAt: "2026-07-07T09:20:00Z",
    answeredAt: null,
  },
  {
    id: 3,
    topic: "기타",
    subject: "개명 절차 관련 문의",
    message: "여기서 지은 이름으로 개명을 하려고 하는데, 필요한 서류나 절차에 대해 안내받을 수 있을까요?",
    status: "received",
    adminReply: "",
    createdAt: "2026-07-08T08:10:00Z",
    answeredAt: null,
  }
];
