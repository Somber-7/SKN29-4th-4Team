import { useEffect, useMemo, useState } from "react";
import { Search, MoreHorizontal, ArrowUpDown, Plus } from "lucide-react";
import { toast } from "sonner";
import type { AdminHanjaRow, AdminSourceRow, Screen, SourceType } from "@/app/types";
import { useAdminContent } from "@/app/hooks/useAdminContent";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { EmptyState } from "@/app/components/common/EmptyState";
import { PrimaryButton, GhostButton } from "@/app/components/common/Button";
import { SourceChip } from "@/app/components/common/SourceChip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

const ELEMENTS = ["木", "火", "土", "金", "水"];
const PAGE_SIZE = 6;

type Tab = "hanja" | "sources";

// ─── 한자 생성/수정 폼 다이얼로그 ────────────────────────────────────────────

interface HanjaForm {
  char: string;
  reading: string;
  meaning: string;
  strokes: string;
  element: string;
  inCourtList: boolean;
}

const EMPTY_HANJA_FORM: HanjaForm = {
  char: "",
  reading: "",
  meaning: "",
  strokes: "",
  element: "水",
  inCourtList: true,
};

function HanjaFormDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: AdminHanjaRow | null;
  onClose: () => void;
  onSave: (form: HanjaForm, id: number | null) => void;
}) {
  const [form, setForm] = useState<HanjaForm>(EMPTY_HANJA_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof HanjaForm, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      setSaving(false);
      setForm(
        initial
          ? {
              char: initial.char,
              reading: initial.reading,
              meaning: initial.meaning,
              strokes: String(initial.strokes),
              element: initial.element,
              inCourtList: initial.inCourtList,
            }
          : EMPTY_HANJA_FORM,
      );
    }
  }, [open, initial]);

  const set = <K extends keyof HanjaForm>(key: K, value: HanjaForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = () => {
    const next: typeof errors = {};
    if (!form.char.trim()) next.char = "한자를 입력해 주세요.";
    else if ([...form.char.trim()].length !== 1) next.char = "한 글자만 입력해 주세요.";
    if (!form.reading.trim()) next.reading = "음(읽기)을 입력해 주세요.";
    if (!form.meaning.trim()) next.meaning = "훈·음을 입력해 주세요. (예: 어질 현)";
    const strokes = Number(form.strokes);
    if (!form.strokes.trim() || !Number.isInteger(strokes) || strokes < 1 || strokes > 40)
      next.strokes = "1~40 사이의 획수를 입력해 주세요.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // TODO: API 연동 — 저장 시뮬레이션
    setSaving(true);
    setTimeout(() => {
      onSave(form, initial?.id ?? null);
      setSaving(false);
    }, 700);
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2.5 text-sm border bg-white placeholder:text-faint focus:outline-none transition-all ${
      hasError
        ? "border-destructive focus:ring-1 focus:ring-destructive"
        : "border-border focus:ring-1 focus:ring-primary focus:border-primary"
    }`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-none border-border p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold">
            {initial ? "한자 정보 수정" : "새 한자 추가"}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink break-keep">
            인명용 한자 데이터베이스에 {initial ? "등록된 정보를 수정합니다" : "새 글자를 등록합니다"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hj-char" className="block text-xs font-medium text-label mb-1.5">
                한자 <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                id="hj-char"
                value={form.char}
                onChange={(e) => set("char", e.target.value)}
                placeholder="賢"
                aria-invalid={!!errors.char}
                aria-describedby={errors.char ? "hj-char-err" : undefined}
                className={`${inputClass(!!errors.char)} font-hanja`}
              />
              {errors.char && (
                <p id="hj-char-err" role="alert" className="text-xs text-destructive mt-1">{errors.char}</p>
              )}
            </div>
            <div>
              <label htmlFor="hj-reading" className="block text-xs font-medium text-label mb-1.5">
                음 <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                id="hj-reading"
                value={form.reading}
                onChange={(e) => set("reading", e.target.value)}
                placeholder="현"
                aria-invalid={!!errors.reading}
                aria-describedby={errors.reading ? "hj-reading-err" : undefined}
                className={inputClass(!!errors.reading)}
              />
              {errors.reading && (
                <p id="hj-reading-err" role="alert" className="text-xs text-destructive mt-1">{errors.reading}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="hj-meaning" className="block text-xs font-medium text-label mb-1.5">
              훈·음 <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="hj-meaning"
              value={form.meaning}
              onChange={(e) => set("meaning", e.target.value)}
              placeholder="어질 현"
              aria-invalid={!!errors.meaning}
              aria-describedby={errors.meaning ? "hj-meaning-err" : undefined}
              className={inputClass(!!errors.meaning)}
            />
            {errors.meaning && (
              <p id="hj-meaning-err" role="alert" className="text-xs text-destructive mt-1">{errors.meaning}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hj-strokes" className="block text-xs font-medium text-label mb-1.5">
                획수 <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                id="hj-strokes"
                type="number"
                min={1}
                max={40}
                value={form.strokes}
                onChange={(e) => set("strokes", e.target.value)}
                placeholder="15"
                aria-invalid={!!errors.strokes}
                aria-describedby={errors.strokes ? "hj-strokes-err" : undefined}
                className={inputClass(!!errors.strokes)}
              />
              {errors.strokes && (
                <p id="hj-strokes-err" role="alert" className="text-xs text-destructive mt-1">{errors.strokes}</p>
              )}
            </div>
            <div>
              <label htmlFor="hj-element" className="block text-xs font-medium text-label mb-1.5">
                자원오행
              </label>
              <select
                id="hj-element"
                value={form.element}
                onChange={(e) => set("element", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              >
                {ELEMENTS.map((el) => (
                  <option key={el} value={el}>
                    {el}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.inCourtList}
              onChange={(e) => set("inCourtList", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-xs text-ink">대법원 인명용 한자 목록에 등재된 글자입니다.</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <GhostButton onClick={onClose} className="px-4 py-2.5 text-xs">
            취소
          </GhostButton>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 text-xs active:scale-[0.98] transition-transform"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 border-2 border-background/40 border-t-background rounded-full"
                  style={{ animation: "mg-spin 0.7s linear infinite" }}
                  aria-hidden="true"
                />
                저장 중…
              </span>
            ) : initial ? (
              "수정 저장"
            ) : (
              "추가하기"
            )}
          </PrimaryButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

export function AdminContentScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { data: initialContent } = useAdminContent();
  const [tab, setTab] = useState<Tab>("hanja");
  const [hanjaRows, setHanjaRows] = useState<AdminHanjaRow[]>(initialContent?.hanjaRows ?? []);
  const [sourceRows, setSourceRows] = useState<AdminSourceRow[]>(initialContent?.sourceRows ?? []);

  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);

  // 폼 다이얼로그 / 삭제 확인
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminHanjaRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ tab: Tab; id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 250);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => setPage(1), [debounced, tab]);

  const filteredHanja = useMemo(() => {
    let rows = hanjaRows.filter(
      (r) =>
        !debounced ||
        r.char.includes(debounced) ||
        r.reading.includes(debounced) ||
        r.meaning.includes(debounced),
    );
    if (sortAsc !== null)
      rows = [...rows].sort((a, b) => (sortAsc ? a.strokes - b.strokes : b.strokes - a.strokes));
    return rows;
  }, [hanjaRows, debounced, sortAsc]);

  const filteredSources = useMemo(
    () =>
      sourceRows.filter(
        (r) =>
          !debounced || r.label.includes(debounced) || r.publisher.includes(debounced),
      ),
    [sourceRows, debounced],
  );

  const totalPages = Math.max(1, Math.ceil(filteredHanja.length / PAGE_SIZE));

  // 삭제·검색으로 전체 페이지 수가 줄면 마지막 페이지로 보정 (빈 페이지 방지)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedHanja = filteredHanja.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSaveHanja = (form: HanjaForm, id: number | null) => {
    const today = new Date()
      .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
      .replace(/\. /g, ".")
      .replace(/\.$/, "");
    if (id === null) {
      setHanjaRows((prev) => [
        {
          id: Math.max(...prev.map((r) => r.id), 0) + 1,
          char: form.char.trim(),
          reading: form.reading.trim(),
          meaning: form.meaning.trim(),
          strokes: Number(form.strokes),
          element: form.element,
          inCourtList: form.inCourtList,
          updatedAt: today,
        },
        ...prev,
      ]);
      toast.success(`한자 '${form.char.trim()}'이(가) 추가되었습니다.`);
    } else {
      setHanjaRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                char: form.char.trim(),
                reading: form.reading.trim(),
                meaning: form.meaning.trim(),
                strokes: Number(form.strokes),
                element: form.element,
                inCourtList: form.inCourtList,
                updatedAt: today,
              }
            : r,
        ),
      );
      toast.success("한자 정보가 수정되었습니다.");
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    // TODO: API 연동 — 삭제 시뮬레이션
    setDeleting(true);
    setTimeout(() => {
      if (deleteTarget.tab === "hanja") {
        setHanjaRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      } else {
        setSourceRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      }
      toast.success(`'${deleteTarget.label}'이(가) 삭제되었습니다.`);
      setDeleting(false);
      setDeleteTarget(null);
    }, 700);
  };

  const rowMenu = (onEdit: (() => void) | null, onDelete: () => void) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-8 h-8 flex items-center justify-center text-faint hover:text-foreground border border-transparent hover:border-border transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          aria-label="행 작업 메뉴"
        >
          <MoreHorizontal size={15} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none border-border min-w-[120px]">
        {onEdit && (
          <DropdownMenuItem onClick={onEdit} className="text-xs cursor-pointer rounded-none">
            수정
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={onDelete}
          className="text-xs cursor-pointer rounded-none text-destructive focus:text-destructive"
        >
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const emptyResult = (
    <EmptyState
      title="검색 결과가 없습니다"
      description={`"${debounced}"에 해당하는 항목을 찾지 못했습니다. 검색어를 바꿔 보세요.`}
      action={
        <GhostButton onClick={() => setKeyword("")} className="px-5 py-2.5 text-xs">
          검색 초기화
        </GhostButton>
      }
    />
  );

  return (
    <AdminLayout
      active="adminContent"
      title="콘텐츠 관리"
      description="추천에 사용되는 인명용 한자 데이터와 근거 출처를 관리합니다."
      onNavigate={onNavigate}
      actions={
        tab === "hanja" ? (
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="px-4 py-2.5 text-xs inline-flex items-center gap-1.5"
          >
            <Plus size={13} aria-hidden="true" />새 한자 추가
          </PrimaryButton>
        ) : undefined
      }
    >
      {/* 탭 */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="콘텐츠 유형">
        {(
          [
            { value: "hanja", label: `인명용 한자 (${hanjaRows.length})` },
            { value: "sources", label: `근거 출처 (${sourceRows.length})` },
          ] as { value: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-xs font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
              tab === t.value
                ? "bg-foreground text-background border-foreground"
                : "bg-white text-label border-border hover:border-primary hover:text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 검색 + 결과 수 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={tab === "hanja" ? "한자·음·뜻 검색" : "출처명·발행처 검색"}
            aria-label="콘텐츠 검색"
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-border placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <span className="text-xs text-hint" aria-live="polite">
          {tab === "hanja" ? filteredHanja.length : filteredSources.length}건
        </span>
      </div>

      {/* ── 한자 탭 ── */}
      {tab === "hanja" && (
        <section className="bg-white border border-border" style={{ animation: "mg-fadein 0.3s ease-out both" }}>
          {filteredHanja.length === 0 ? (
            emptyResult
          ) : (
            <>
              <div className="relative">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50 text-left">
                        <th scope="col" className="px-5 py-2.5 text-xs font-medium text-caption">한자</th>
                        <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption">훈·음</th>
                        <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption">
                          <button
                            onClick={() => setSortAsc((prev) => (prev === null ? true : prev ? false : null))}
                            className="inline-flex items-center gap-1 hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                            aria-label={`획수 정렬 ${sortAsc === null ? "" : sortAsc ? "(오름차순)" : "(내림차순)"}`}
                          >
                            획수
                            <ArrowUpDown
                              size={11}
                              className={sortAsc === null ? "text-faint" : "text-primary"}
                              aria-hidden="true"
                            />
                          </button>
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption">자원오행</th>
                        <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption whitespace-nowrap">인명용 등재</th>
                        <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption whitespace-nowrap">수정일</th>
                        <th scope="col" className="px-4 py-2.5 w-12">
                          <span className="sr-only">작업</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedHanja.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors duration-150"
                        >
                          <td className="px-5 py-3">
                            <span className="font-hanja text-xl text-foreground" lang="ko-Hani">
                              {row.char}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">{row.meaning}</td>
                          <td className="px-4 py-3 text-xs text-ink tabular-nums">{row.strokes}획</td>
                          <td className="px-4 py-3 text-xs text-ink">
                            <span className="font-hanja">{row.element}</span>行
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 text-[11px] font-medium border ${
                                row.inCourtList
                                  ? "bg-pine/8 text-pine border-pine/25"
                                  : "bg-seal/8 text-seal border-seal/25"
                              }`}
                            >
                              {row.inCourtList ? "등재" : "미등재"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-caption whitespace-nowrap tabular-nums">{row.updatedAt}</td>
                          <td className="px-4 py-3">
                            {rowMenu(
                              () => {
                                setEditing(row);
                                setFormOpen(true);
                              },
                              () => setDeleteTarget({ tab: "hanja", id: row.id, label: `${row.char} (${row.meaning})` }),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden"
                  aria-hidden="true"
                />
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <nav
                  className="flex items-center justify-center gap-1 py-4 border-t border-border"
                  aria-label="페이지 이동"
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs text-label border border-border hover:border-primary hover:text-primary transition-colors disabled:opacity-35 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    이전
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      aria-current={page === n ? "page" : undefined}
                      className={`w-8 h-8 text-xs border transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                        page === n
                          ? "bg-foreground text-background border-foreground"
                          : "text-label border-border hover:border-primary hover:text-primary"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs text-label border border-border hover:border-primary hover:text-primary transition-colors disabled:opacity-35 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    다음
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      )}

      {/* ── 출처 탭 ── */}
      {tab === "sources" && (
        <section className="bg-white border border-border" style={{ animation: "mg-fadein 0.3s ease-out both" }}>
          {filteredSources.length === 0 ? (
            emptyResult
          ) : (
            <div className="relative">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50 text-left">
                      <th scope="col" className="px-5 py-2.5 text-xs font-medium text-caption">유형</th>
                      <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption w-full">출처명</th>
                      <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption whitespace-nowrap">발행처</th>
                      <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption">연도</th>
                      <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption whitespace-nowrap">연결 이름</th>
                      <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption">상태</th>
                      <th scope="col" className="px-4 py-2.5 w-12">
                        <span className="sr-only">작업</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSources.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors duration-150"
                      >
                        <td className="px-5 py-3 whitespace-nowrap">
                          <SourceChip type={row.type as SourceType} label={
                            { hanja: "자원오행", suri: "81수리", beopryeong: "법령", nonmun: "논문" }[row.type]
                          } />
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground break-keep min-w-[220px]">{row.label}</td>
                        <td className="px-4 py-3 text-xs text-ink whitespace-nowrap">{row.publisher}</td>
                        <td className="px-4 py-3 text-xs text-ink tabular-nums">{row.year}</td>
                        <td className="px-4 py-3 text-xs text-ink tabular-nums whitespace-nowrap">
                          {row.linked.toLocaleString()}개
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 text-[11px] font-medium border whitespace-nowrap ${
                              row.status === "게시"
                                ? "bg-pine/8 text-pine border-pine/25"
                                : "bg-hanji text-primary border-border-warm"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {rowMenu(null, () =>
                            setDeleteTarget({ tab: "sources", id: row.id, label: row.label }),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden"
                aria-hidden="true"
              />
            </div>
          )}
        </section>
      )}

      {/* 생성/수정 다이얼로그 */}
      <HanjaFormDialog
        open={formOpen}
        initial={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSaveHanja}
      />

      {/* 삭제 확인 모달 — 기본 포커스는 '취소'(Radix 기본), 삭제 중 로딩 표시 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-none border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">정말 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-ink break-keep">
              <span className="font-medium text-foreground">{deleteTarget?.label}</span> 항목이
              목록에서 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-none text-xs border-border hover:border-primary hover:text-primary"
            >
              취소
            </AlertDialogCancel>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-none text-xs px-4 py-2 bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full"
                    style={{ animation: "mg-spin 0.7s linear infinite" }}
                    aria-hidden="true"
                  />
                  삭제 중…
                </span>
              ) : (
                "삭제"
              )}
            </button>
          </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
