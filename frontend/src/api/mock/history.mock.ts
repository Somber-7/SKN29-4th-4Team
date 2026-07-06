import type { HistoryEntry } from "@/app/types";

// TODO(API): GET /me/history 로 대체
// ─── 작명 기록 더미 데이터 (백엔드 연동 전 프론트 전용) ──────────────────────
// 이관 전 위치: src/app/data/history.ts (원본은 _deprecated/app-data/history.ts 보관)

export const HISTORY_ENTRIES: HistoryEntry[] = [
  {
    id: 1,
    date: "2026.06.28",
    query: "윤씨 성에 물(水) 기운을 보완하는, 획수 좋은 두 글자 남자 이름",
    resultCount: 5,
    savedCount: 2,
    topName: { hanja: "尹道賢", hangul: "윤도현" },
    status: "완료",
  },
  {
    id: 2,
    date: "2026.06.21",
    query: "밝고 지혜롭다는 뜻이 담긴 중성적인 이름, 발음이 부드러웠으면 좋겠어요",
    resultCount: 5,
    savedCount: 1,
    topName: { hanja: "尹智皓", hangul: "윤지호" },
    status: "완료",
  },
  {
    id: 3,
    date: "2026.06.14",
    query: "첫째 이름 서준이랑 돌림자 없이 어울리는 둘째 이름",
    resultCount: 5,
    savedCount: 0,
    topName: { hanja: "尹瑞俊", hangul: "윤서준" },
    status: "완료",
  },
];
