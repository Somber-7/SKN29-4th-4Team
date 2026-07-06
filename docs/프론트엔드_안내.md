# 명가작명소 (Myeongga Jakmyeongso)

근거 있는 이름 짓기 — 대법원 인명용 한자 법령, 81수리, 자원오행, 학술 출처를 결합한
AI 기반 한국 이름 작명 웹 서비스.

## 기술 스택

- **빌드**: Vite 6
- **UI**: React 18 + TypeScript
- **스타일**: Tailwind CSS 4 (+ `src/styles/theme.css` 디자인 토큰)
- **컴포넌트**: Radix UI 프리미티브 + 자체 공통 컴포넌트

## 개발

```bash
npm install
npm run dev     # 개발 서버 (기본 5173 포트)
npm run build   # 프로덕션 빌드 → dist/
```

## 폴더 구조

```
src/
├── assets/          # 이미지 에셋 (로고, 마스코트, 텍스처)
├── styles/          # 전역 CSS (fonts / tailwind / theme 토큰)
├── main.tsx         # 엔트리
└── app/
    ├── App.tsx      # 라우팅 및 전역 상태
    ├── components/
    │   ├── common/  # 공통 컴포넌트 (Button, NameCard 등, PascalCase)
    │   ├── layout/  # GNB, Footer
    │   ├── admin/   # 관리자 레이아웃
    │   └── ui/      # Radix 기반 프리미티브 (kebab-case)
    ├── screens/     # 페이지 단위 스크린 (19개)
    ├── data/        # 정적 데이터 (이름 DB, FAQ 등)
    ├── hooks/       # 커스텀 훅
    └── utils/       # 검증, 파싱 유틸
```

## 데모 계정 (시안 단계)

- 일반 회원: `user@myeongga.co.kr` / `user1234`
- 관리자: `admin@myeongga.co.kr` (비밀번호 무관)

백엔드는 아직 없으며 모든 데이터는 `src/app/data/*.ts` 목업입니다.
서버 연동 지점은 `grep -rn "TODO(API)" src`로 찾을 수 있습니다.
