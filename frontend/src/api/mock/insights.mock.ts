// ─── 작명 정보(인사이트) 목업 데이터 (백엔드 연동 전 프론트 전용) ────────────
// TODO(API): GET /insights/trends 로 대체 — 통계청 출생신고 통계·대법원 전산 데이터
// 이관 전 위치: src/app/data/insights.ts (원본은 _deprecated/app-data/insights.ts 보관)

/** 인기 이름 순위 (2026 상반기, 출생신고 기준 목업) */
interface TrendName {
  rank: number;
  name: string;
  hanja: string;
  count: number;
  /** 전년 대비 순위 변동 (+상승 / -하락 / 0 유지) */
  delta: number;
}

export const TREND_NAMES_BOY: TrendName[] = [
  { rank: 1, name: "이준", hanja: "李準", count: 1842, delta: 1 },
  { rank: 2, name: "서준", hanja: "瑞俊", count: 1731, delta: -1 },
  { rank: 3, name: "도윤", hanja: "道潤", count: 1655, delta: 0 },
  { rank: 4, name: "하준", hanja: "河準", count: 1520, delta: 1 },
  { rank: 5, name: "은우", hanja: "恩宇", count: 1483, delta: -1 },
  { rank: 6, name: "시우", hanja: "時宇", count: 1391, delta: -2 },
  { rank: 7, name: "지호", hanja: "智皓", count: 1287, delta: 1 },
  { rank: 8, name: "유준", hanja: "裕俊", count: 1194, delta: 3 },
];

export const TREND_NAMES_GIRL: TrendName[] = [
  { rank: 1, name: "서아", hanja: "瑞雅", count: 1768, delta: 0 },
  { rank: 2, name: "이서", hanja: "理序", count: 1692, delta: 1 },
  { rank: 3, name: "아윤", hanja: "雅潤", count: 1571, delta: -1 },
  { rank: 4, name: "하윤", hanja: "夏潤", count: 1498, delta: 0 },
  { rank: 5, name: "지안", hanja: "智安", count: 1402, delta: 0 },
  { rank: 6, name: "아린", hanja: "雅潾", count: 1315, delta: 0 },
  { rank: 7, name: "시아", hanja: "時雅", count: 1248, delta: -2 },
  { rank: 8, name: "유나", hanja: "裕娜", count: 1173, delta: 1 },
];

interface TotalTrendPoint {
  year: string;
  count: number;
}

/** 연도별 전체 출생신고 건수 (남녀 합산) — 트렌드 대시보드 라인 차트용 */
export const TOTAL_TREND_COMBINED: TotalTrendPoint[] = [
  { year: "2022", count: 27200 },
  { year: "2023", count: 26100 },
  { year: "2024", count: 25400 },
  { year: "2025", count: 24900 },
  { year: "2026", count: 24800 },
];

/** 트렌드 대시보드 메타 (시안용) */
export const TREND_META = {
  sample: "128,400건",
  period: "2022–2026 출생신고",
  updatedAt: "2026.06.30",
};

/** 한눈에 보는 트렌드 요약 카드 */
interface InsightCard {
  hanja: string;
  title: string;
  desc: string;
  stat: string;
}

export const INSIGHT_CARDS: InsightCard[] = [
  {
    hanja: "音",
    title: "부드러운 발음 강세",
    desc: "받침이 없거나 ㄴ·ㅇ 받침으로 끝나는 부드러운 발음의 이름이 상위권을 지키고 있습니다.",
    stat: "TOP 20 중 16개",
  },
  {
    hanja: "獨",
    title: "외자 이름의 귀환",
    desc: "준(準)·윤(潤)·설(雪) 등 한 글자 이름의 출생신고 비중이 3년 연속 늘고 있습니다.",
    stat: "전년 대비 +18%",
  },
  {
    hanja: "中",
    title: "중성적 이름 선호",
    desc: "지안·시우·하윤처럼 남녀 모두에게 쓰이는 이름이 늘며 성별 경계가 옅어지고 있습니다.",
    stat: "TOP 100 중 27개",
  },
];

/** 정보 게시판 아티클 */
export type InsightCategory = "trend" | "hanja" | "guide";

export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  trend: "트렌드 리포트",
  hanja: "한자 상식",
  guide: "작명 가이드",
};

export interface InsightArticle {
  id: number;
  category: InsightCategory;
  title: string;
  /** YYYY.MM.DD */
  date: string;
  views: number;
  paragraphs: string[];
}

export const INSIGHT_ARTICLES: InsightArticle[] = [
  {
    id: 1,
    category: "trend",
    title: "2026 상반기 신생아 이름 리포트 — 물(水) 기운 한자가 늘고 있습니다",
    date: "2026.06.28",
    views: 4213,
    paragraphs: [
      "2026년 상반기 출생신고 데이터를 분석한 결과, 潤(윤)·河(하)·澤(택) 등 물 기운을 담은 자원오행 水行 한자의 사용 비중이 눈에 띄게 늘었습니다. 밝고 유연한 기운을 선호하는 최근 흐름과 맞닿아 있는 변화입니다.",
      "발음 측면에서는 받침 없는 음절로 끝나는 이름(서아, 이서, 시우)이 강세를 이어가고 있으며, 세 글자 성명 기준 총 획수 20~25획 구간이 가장 선호되는 것으로 나타났습니다.",
    ],
  },
  {
    id: 2,
    category: "trend",
    title: "외자 이름, 다시 늘고 있습니다 — 준·윤·설의 재발견",
    date: "2026.05.14",
    views: 3187,
    paragraphs: [
      "한동안 줄어들던 외자 이름이 최근 3년 연속 증가세입니다. 짧고 강렬한 인상, 부르기 쉬운 발음, 그리고 성과 이름의 획수 조합이 단순해져 81수리 배치가 유리하다는 점이 재조명되고 있습니다.",
      "다만 외자 이름은 성씨와의 획수 조합 선택지가 좁아지는 만큼, 원격·형격·이격·정격 네 격의 균형을 더 꼼꼼히 확인하는 것이 좋습니다.",
    ],
  },
  {
    id: 3,
    category: "hanja",
    title: "인명용 한자 8,142자 — 어떤 글자까지 이름에 쓸 수 있나요?",
    date: "2026.04.02",
    views: 5872,
    paragraphs: [
      "출생신고에 쓸 수 있는 한자는 대법원이 고시하는 '인명용 한자' 목록으로 제한됩니다. 2026년 현재 8,142자가 등재되어 있으며, 목록에 없는 한자로는 출생신고가 접수되지 않습니다.",
      "명가작명소의 모든 추천 이름은 이 목록과 자동 대조를 거치므로, 추천받은 이름은 바로 출생신고에 사용할 수 있습니다.",
    ],
  },
  {
    id: 4,
    category: "hanja",
    title: "같은 '수'라도 다릅니다 — 자원오행과 발음오행 이야기",
    date: "2026.03.18",
    views: 2954,
    paragraphs: [
      "오행 작명에서 한자의 기운을 읽는 기준은 두 가지입니다. 글자의 뿌리(부수·자원)에서 오는 자원오행과, 소리의 첫 자음에서 오는 발음오행입니다. 예컨대 洙(수)는 물 수 변이 있어 자원오행이 水行이지만, 발음오행으로는 ㅅ 소리라 金에 속합니다.",
      "사주의 부족한 기운을 보완하려면 통상 자원오행을 우선으로 보되, 성과 이름의 발음오행 상생 흐름도 함께 확인하는 것이 정석입니다.",
    ],
  },
  {
    id: 5,
    category: "guide",
    title: "81수리 4격 읽는 법 — 원·형·이·정이 뜻하는 것",
    date: "2026.02.25",
    views: 3521,
    paragraphs: [
      "81수리는 이름의 획수 조합을 81가지 수리로 풀이하는 성명학 체계입니다. 초년운을 보는 원격(元格), 중년운의 형격(亨格), 장년운의 이격(利格), 그리고 일생 전체를 관통하는 정격(貞格) 네 가지 격으로 나누어 봅니다.",
      "네 격이 모두 길수(吉數)에 놓이는 조합은 생각보다 드뭅니다. 명가작명소는 후보 이름의 4격을 전부 산출해 대길·길·중길 판정과 함께 제시합니다.",
    ],
  },
  {
    id: 6,
    category: "guide",
    title: "출생신고 전 마지막 점검 — 꼭 확인할 세 가지",
    date: "2026.01.30",
    views: 4690,
    paragraphs: [
      "첫째, 인명용 한자 등재 여부입니다. 목록 밖 한자는 접수가 반려됩니다. 둘째, 가족 항렬자·형제자매 이름과의 조화입니다. 셋째, 발음 시 놀림감이 될 수 있는 동음이의어나 이니셜 조합을 소리 내어 확인해 보세요.",
      "명가작명소 추천 결과 화면의 근거 카드에서 첫 번째 항목은 자동으로 검증되며, 나머지 두 가지는 가족과 함께 소리 내어 읽어보시는 것을 권합니다.",
    ],
  },
];
