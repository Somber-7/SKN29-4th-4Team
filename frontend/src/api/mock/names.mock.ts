import type { NameResult } from "@/app/types";

// ─── Mock data (백엔드 연동 전 프론트 전용) ──────────────────────────────────
// 이관 전 위치: src/app/data/names.ts (원본은 _deprecated/app-data/names.ts 보관)

/** 현재 목업에서 공통으로 사용하는 성씨 정보 (윤) */
const LAST_NAME_YUN = {
  char: "尹",
  reading: "윤",
  meaning: "다스릴 윤",
  strokes: 4,
  element: "水",
};

/** 표시용 성씨 사전 — TODO(API): GET /names/results 서버 추천 결과로 대체 */
export const LAST_NAMES: Record<string, NameResult["lastName"]> = {
  김: { char: "金", reading: "김", meaning: "쇠 금", strokes: 8, element: "金" },
  이: { char: "李", reading: "이", meaning: "오얏 리", strokes: 7, element: "木" },
  박: { char: "朴", reading: "박", meaning: "순박할 박", strokes: 6, element: "木" },
  최: { char: "崔", reading: "최", meaning: "높을 최", strokes: 11, element: "土" },
  정: { char: "鄭", reading: "정", meaning: "나라 정", strokes: 19, element: "火" },
  윤: LAST_NAME_YUN,
};

// TODO(API): GET /names/results — 아래 목업은 서버 추천 결과로 대체
export const NAME_RESULTS: NameResult[] = [
  {
    id: 1,
    lastName: LAST_NAME_YUN,
    hanja: "道賢",
    hangul: "도현",
    ruby: [
      { char: "道", reading: "도", meaning: "길 도", strokes: 12, element: "水" },
      { char: "賢", reading: "현", meaning: "어질 현", strokes: 15, element: "土" },
    ],
    sukgyeok: "27수 · 吉",
    sukgyeokDetail: [
      { name: "원격(元格)", value: 27, fortune: "대길" },
      { name: "형격(亨格)", value: 16, fortune: "길" },
      { name: "이격(利格)", value: 19, fortune: "중길" },
      { name: "정격(貞格)", value: 31, fortune: "대길" },
    ],
    sources: [
      { type: "hanja", label: "한자 자원오행" },
      { type: "suri", label: "81수리" },
      { type: "beopryeong", label: "법령: 인명용 한자" },
    ],
  },
  {
    id: 2,
    lastName: LAST_NAME_YUN,
    hanja: "瑞俊",
    hangul: "서준",
    ruby: [
      { char: "瑞", reading: "서", meaning: "상서 서", strokes: 13, element: "水" },
      { char: "俊", reading: "준", meaning: "준재 준", strokes: 9, element: "木" },
    ],
    sukgyeok: "22수 · 吉",
    sukgyeokDetail: [
      { name: "원격(元格)", value: 22, fortune: "길" },
      { name: "형격(亨格)", value: 17, fortune: "길" },
      { name: "이격(利格)", value: 13, fortune: "대길" },
      { name: "정격(貞格)", value: 26, fortune: "중길" },
    ],
    sources: [
      { type: "hanja", label: "한자 자원오행" },
      { type: "suri", label: "81수리" },
      { type: "beopryeong", label: "법령: 인명용 한자" },
      { type: "nonmun", label: "논문: 인명용한자 연구(2019)" },
    ],
  },
  {
    id: 3,
    lastName: LAST_NAME_YUN,
    hanja: "智皓",
    hangul: "지호",
    ruby: [
      { char: "智", reading: "지", meaning: "슬기 지", strokes: 12, element: "木" },
      { char: "皓", reading: "호", meaning: "밝을 호", strokes: 12, element: "水" },
    ],
    sukgyeok: "24수 · 大吉",
    sukgyeokDetail: [
      { name: "원격(元格)", value: 24, fortune: "대길" },
      { name: "형격(亨格)", value: 16, fortune: "길" },
      { name: "이격(利格)", value: 16, fortune: "길" },
      { name: "정격(貞格)", value: 28, fortune: "대길" },
    ],
    sources: [
      { type: "hanja", label: "한자 자원오행" },
      { type: "suri", label: "81수리" },
      { type: "beopryeong", label: "법령: 인명용 한자" },
    ],
  },
  {
    id: 4,
    lastName: LAST_NAME_YUN,
    hanja: "承澤",
    hangul: "승택",
    ruby: [
      { char: "承", reading: "승", meaning: "이을 승", strokes: 8, element: "水" },
      { char: "澤", reading: "택", meaning: "윤택 택", strokes: 16, element: "水" },
    ],
    sukgyeok: "24수 · 大吉",
    sukgyeokDetail: [
      { name: "원격(元格)", value: 24, fortune: "대길" },
      { name: "형격(亨格)", value: 12, fortune: "길" },
      { name: "이격(利格)", value: 20, fortune: "중길" },
      { name: "정격(貞格)", value: 28, fortune: "대길" },
    ],
    sources: [
      { type: "hanja", label: "한자 자원오행" },
      { type: "suri", label: "81수리" },
      { type: "beopryeong", label: "법령: 인명용 한자" },
    ],
  },
];

export const SAMPLE_PREVIEW_RESULTS: NameResult[] = [
  NAME_RESULTS[0],
  NAME_RESULTS[2],
  {
    id: 99,
    lastName: LAST_NAME_YUN,
    hanja: "瑞姸",
    hangul: "서연",
    ruby: [
      { char: "瑞", reading: "서", meaning: "상서 서", strokes: 13, element: "水" },
      { char: "姸", reading: "연", meaning: "고울 연", strokes: 9, element: "火" },
    ],
    sukgyeok: "22수 · 吉",
    sukgyeokDetail: [
      { name: "원격(元格)", value: 22, fortune: "길" },
      { name: "형격(亨格)", value: 17, fortune: "길" },
      { name: "이격(利格)", value: 13, fortune: "대길" },
      { name: "정격(貞格)", value: 26, fortune: "중길" },
    ],
    sources: [
      { type: "hanja", label: "한자 자원오행" },
      { type: "suri", label: "81수리" },
      { type: "beopryeong", label: "법령: 인명용 한자" },
    ],
  },
];
