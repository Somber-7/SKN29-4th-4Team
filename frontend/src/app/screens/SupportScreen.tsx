import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Mail, Clock, MessageCircleQuestion } from "lucide-react";
import { toast } from "sonner";
import type { FaqCategory, Screen } from "@/app/types";
import { useFaq } from "@/app/hooks/useFaq";
import { isValidEmail } from "@/app/utils/validation";
import { supportApi } from "@/api/support";
import { ApiError } from "@/api/client";
import { PageHeader } from "@/app/components/common/PageHeader";
import { EmptyState } from "@/app/components/common/EmptyState";
import { Reveal } from "@/app/components/common/Reveal";
import { PrimaryButton, GhostButton } from "@/app/components/common/Button";
import { Footer } from "@/app/components/layout/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";

export type SupportTab = "faq" | "contact";


// ─── FAQ 섹션 ─────────────────────────────────────────────────────────────────

type FaqFilter = "all" | FaqCategory;

function FaqSection({ onGoContact }: { onGoContact: () => void }) {
  const { data: faq } = useFaq();
  const faqItems = faq?.items ?? [];
  const categoryLabels = faq?.categoryLabels;

  const [filter, setFilter] = useState<FaqFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");

  // 검색 디바운스 — 타이핑이 멈춘 뒤 250ms 후 반영
  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 250);
    return () => clearTimeout(t);
  }, [keyword]);

  const FAQ_FILTERS: { value: FaqFilter; label: string }[] = [
    { value: "all", label: "전체" },
    ...Object.entries(categoryLabels || {}).map(([key, label]) => ({
      value: key as FaqFilter,
      label: label as string,
    })),
  ];

  const items = useMemo(() => {
    return faqItems.filter((item: import("@/app/types").FaqItem) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (!debounced) return true;
      return (
        item.question.includes(debounced) || item.answer.includes(debounced)
      );
    });
  }, [faqItems, filter, debounced]);

  return (
    <div>
      {/* 검색 */}
      <div className="relative mb-5">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="궁금한 내용을 검색해 보세요 (예: 인명용 한자, 환불)"
          aria-label="FAQ 검색"
          className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-border placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* 카테고리 필터 + 결과 수 */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {FAQ_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`px-3.5 py-1.5 text-xs font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
              filter === f.value
                ? "bg-foreground text-background border-foreground"
                : "bg-white text-label border-border hover:border-primary hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-hint" aria-live="polite">
          총 {items.length}개
        </span>
      </div>

      {/* 목록 / 빈 상태 */}
      {items.length === 0 ? (
        <div className="bg-white border border-border">
          <EmptyState
            title="검색 결과가 없습니다"
            description={`"${debounced}"에 해당하는 질문을 찾지 못했습니다. 검색어를 바꿔 보시거나, 직접 문의를 남겨 주세요.`}
            action={
              <GhostButton onClick={onGoContact} className="px-5 py-2.5 text-sm">
                문의 남기기
              </GhostButton>
            }
          />
        </div>
      ) : (
        <Accordion type="single" collapsible className="bg-white border border-border">
          {items.map((item: import("@/app/types").FaqItem, i: number) => (
            // 구분선은 Reveal 래퍼에 — AccordionItem이 각 래퍼의 유일한 자식이라
            // last: 변형이 항목마다 적용되는 문제를 피한다
            <Reveal
              key={item.id}
              delay={Math.min(i, 6) * 60}
              className="border-b border-border last:border-b-0"
            >
              <AccordionItem
                value={`faq-${item.id}`}
                className="border-b-0 px-5 sm:px-6"
              >
                <AccordionTrigger className="py-5 text-sm sm:text-[15px] font-medium text-foreground hover:no-underline hover:text-primary transition-colors gap-4 text-left focus-visible:ring-1 focus-visible:ring-primary [&>svg]:text-faint">
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-[10px] tracking-[0.18em] text-caption uppercase flex-shrink-0 w-[72px] text-center"
                      aria-hidden="true"
                    >
                      {categoryLabels?.[item.category] ?? item.category}
                    </span>
                    <span className="break-keep">{item.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-sm text-ink leading-relaxed break-keep">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            </Reveal>
          ))}
        </Accordion>
      )}

      {/* 하단 CTA — 문의 탭으로 전환 */}
      <Reveal delay={80}>
        <div className="mt-10 bg-secondary border border-border-warm px-6 sm:px-8 py-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground mb-1">
              원하는 답을 찾지 못하셨나요?
            </h2>
            <p className="text-sm text-ink break-keep">
              문의를 남겨 주시면 평균 1영업일 안에 답변해 드립니다.
            </p>
          </div>
          <PrimaryButton
            onClick={onGoContact}
            className="px-6 py-3 flex-shrink-0 self-start sm:self-auto"
          >
            문의하기
          </PrimaryButton>
        </div>
      </Reveal>
    </div>
  );
}

// ─── 문의 섹션 ────────────────────────────────────────────────────────────────

const TOPICS = ["서비스 이용", "작명 결과 문의", "계정·결제", "제휴 제안", "기타"];

interface FormState {
  name: string;
  email: string;
  topic: string;
  subject: string;
  message: string;
  agree: boolean;
}

type Errors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = {
  name: "",
  email: "",
  topic: TOPICS[0],
  subject: "",
  message: "",
  agree: false,
};

function ContactSection({
  onGoFaq,
  onNavigate,
}: {
  onGoFaq: () => void;
  onNavigate: (s: Screen) => void;
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const fieldRefs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    subject: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // blur 시점 개별 필드 검증
  const validateField = (key: keyof FormState): string | undefined => {
    const v = form[key];
    switch (key) {
      case "name":
        if (!String(v).trim()) return "이름을 입력해 주세요.";
        break;
      case "email":
        if (!String(v).trim()) return "이메일을 입력해 주세요.";
        if (!isValidEmail(String(v)))
          return "올바른 이메일 형식이 아닙니다.";
        break;
      case "subject":
        if (!String(v).trim()) return "제목을 입력해 주세요.";
        break;
      case "message":
        if (String(v).trim().length < 10) return "문의 내용을 10자 이상 입력해 주세요.";
        break;
      case "agree":
        if (!v) return "개인정보 수집·이용에 동의해 주세요.";
        break;
    }
    return undefined;
  };

  const handleBlur = (key: keyof FormState) => {
    const message = validateField(key);
    if (message) setErrors((prev) => ({ ...prev, [key]: message }));
  };

  const handleSubmit = async () => {
    const next: Errors = {};
    (["name", "email", "subject", "message", "agree"] as (keyof FormState)[]).forEach((key) => {
      const message = validateField(key);
      if (message) next[key] = message;
    });
    setErrors(next);

    // 첫 에러 필드로 포커스 이동
    const firstError = (["name", "email", "subject", "message"] as const).find((k) => next[k]);
    if (firstError) {
      fieldRefs[firstError].current?.focus();
      return;
    }
    if (next.agree) return;

    setSubmitting(true);
    try {
      await supportApi.submitContact({
        name: form.name,
        email: form.email,
        topic: form.topic,
        subject: form.subject,
        message: form.message,
      });
      setForm(INITIAL);
      toast.success("문의가 접수되었습니다.", {
        description: "평균 1영업일 안에 입력하신 이메일로 답변드립니다.",
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2.5 text-sm border bg-white placeholder:text-faint focus:outline-none transition-all ${
      hasError
        ? "border-destructive focus:ring-1 focus:ring-destructive"
        : "border-border focus:ring-1 focus:ring-primary focus:border-primary"
    }`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-8 lg:items-start">
      {/* 안내 카드 */}
      <Reveal>
        <aside className="bg-white border border-border p-6 sm:p-7 space-y-6">
          <div className="flex items-start gap-3.5">
            <Mail size={17} className="text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-medium text-foreground mb-0.5">이메일</h2>
              <p className="text-sm text-ink">hello@myeongga.co.kr</p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <Clock size={17} className="text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-medium text-foreground mb-0.5">운영 시간</h2>
              <p className="text-sm text-ink">평일 10:00 – 18:00 (주말·공휴일 휴무)</p>
              <p className="text-xs text-caption mt-1">평균 응답 시간 1영업일</p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <MessageCircleQuestion
              size={17}
              className="text-primary mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-medium text-foreground mb-0.5">먼저 확인해 보세요</h2>
              <p className="text-sm text-ink break-keep mb-2">
                작명 근거·환불 등 자주 받는 질문은 FAQ에 정리되어 있습니다.
              </p>
              <button
                onClick={onGoFaq}
                className="text-sm text-primary font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                자주 묻는 질문 보기 →
              </button>
            </div>
          </div>
        </aside>
      </Reveal>

      {/* 문의 폼 */}
      <Reveal delay={80}>
        <form
          className="bg-white border border-border p-6 sm:p-7 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          noValidate
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="ct-name" className="block text-xs font-medium text-label mb-1.5">
                이름 <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                id="ct-name"
                ref={fieldRefs.name}
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="홍길동"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "ct-name-error" : undefined}
                className={inputClass(!!errors.name)}
              />
              {errors.name && (
                <p id="ct-name-error" role="alert" className="text-xs text-destructive mt-1">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="ct-email" className="block text-xs font-medium text-label mb-1.5">
                이메일 <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                id="ct-email"
                ref={fieldRefs.email}
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="name@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "ct-email-error" : undefined}
                className={inputClass(!!errors.email)}
              />
              {errors.email && (
                <p id="ct-email-error" role="alert" className="text-xs text-destructive mt-1">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="ct-topic" className="block text-xs font-medium text-label mb-1.5">
              문의 유형
            </label>
            <select
              id="ct-topic"
              value={form.topic}
              onChange={(e) => set("topic", e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ct-subject" className="block text-xs font-medium text-label mb-1.5">
              제목 <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="ct-subject"
              ref={fieldRefs.subject}
              type="text"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              onBlur={() => handleBlur("subject")}
              placeholder="문의 제목을 입력해 주세요"
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? "ct-subject-error" : undefined}
              className={inputClass(!!errors.subject)}
            />
            {errors.subject && (
              <p id="ct-subject-error" role="alert" className="text-xs text-destructive mt-1">
                {errors.subject}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="ct-message" className="block text-xs font-medium text-label">
                문의 내용 <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <span
                className={`text-[11px] ${form.message.length > 0 && form.message.trim().length < 10 ? "text-destructive" : "text-hint"}`}
                aria-hidden="true"
              >
                {form.message.length} / 1000
              </span>
            </div>
            <textarea
              id="ct-message"
              ref={fieldRefs.message}
              rows={6}
              maxLength={1000}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              onBlur={() => handleBlur("message")}
              placeholder="문의하실 내용을 자세히 적어 주세요. 작명 결과 문의라면 요청 날짜와 입력했던 조건을 함께 남겨 주시면 빠르게 확인할 수 있습니다."
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "ct-message-error" : undefined}
              className={`${inputClass(!!errors.message)} resize-y leading-relaxed`}
            />
            {errors.message && (
              <p id="ct-message-error" role="alert" className="text-xs text-destructive mt-1">
                {errors.message}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => set("agree", e.target.checked)}
                aria-invalid={!!errors.agree}
                aria-describedby={errors.agree ? "ct-agree-error" : undefined}
                className="w-4 h-4 accent-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <span className="text-xs text-ink leading-relaxed break-keep">
                문의 처리를 위한 개인정보 수집·이용에 동의합니다.{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("privacy");
                  }}
                  className="text-primary underline underline-offset-2 hover:text-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  개인정보처리방침
                </button>{" "}
                <span className="text-destructive" aria-hidden="true">*</span>
              </span>
            </label>
            {errors.agree && (
              <p id="ct-agree-error" role="alert" className="text-xs text-destructive mt-1.5">
                {errors.agree}
              </p>
            )}
          </div>

          <PrimaryButton
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 active:scale-[0.98] transition-transform"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block w-3.5 h-3.5 border-2 border-background/40 border-t-background rounded-full"
                  style={{ animation: "mg-spin 0.7s linear infinite" }}
                  aria-hidden="true"
                />
                접수 중…
              </span>
            ) : (
              "문의 보내기"
            )}
          </PrimaryButton>
        </form>
      </Reveal>
    </div>
  );
}

// ─── 고객센터 화면 (FAQ · 문의 통합) ─────────────────────────────────────────

export function SupportScreen({
  tab,
  onNavigate,
}: {
  tab: SupportTab;
  onNavigate: (s: Screen) => void;
}) {
  return (
    <div className="pt-16 min-h-screen bg-background flex flex-col">
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 sm:px-8 py-14 sm:py-16">
        <PageHeader
          eyebrow="Support"
          title="고객센터"
          description="자주 받는 질문을 먼저 확인하시고, 원하는 답이 없다면 문의를 남겨 주세요."
          watermark="問"
        />

        {/* 탭 전환 — 화면 id와 동기화되어 해시 딥링크·푸터 링크가 그대로 동작 */}
        <div className="flex gap-2 mb-10" role="tablist" aria-label="고객센터 메뉴">
          {(
            [
              { label: "자주 묻는 질문", screen: "faq", selected: tab === "faq" },
              { label: "문의하기", screen: "contact", selected: tab === "contact" },
            ] as { label: string; screen: Screen; selected: boolean }[]
          ).map((t) => (
            <button
              key={t.label}
              role="tab"
              aria-selected={t.selected}
              onClick={() => onNavigate(t.screen)}
              className={`px-4 py-2 text-xs font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                t.selected
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white text-label border-border hover:border-primary hover:text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>


        {tab === "faq" && <FaqSection onGoContact={() => onNavigate("contact")} />}
        {tab === "contact" && (
          <ContactSection onGoFaq={() => onNavigate("faq")} onNavigate={onNavigate} />
        )}
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
