import { useQuery } from "@tanstack/react-query";
import { supportApi } from "@/api/support";
import { PageHeader } from "@/app/components/common/PageHeader";
import { EmptyState } from "@/app/components/common/EmptyState";
import { Reveal } from "@/app/components/common/Reveal";
import { Footer } from "@/app/components/layout/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import type { Screen } from "@/app/types";

export function NoticesScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: () => supportApi.getNotices(),
  });
  const notices = data?.items ?? [];

  return (
    <div className="pt-16 min-h-screen bg-background flex flex-col">
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 sm:px-8 py-14 sm:py-16">
        <PageHeader
          eyebrow="Notices"
          title="공지사항"
          description="명가작명소의 새로운 소식과 안내 사항을 알려드립니다."
          watermark="報"
        />

        <div className="bg-white border border-border">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-hint">로딩 중...</div>
          ) : notices.length === 0 ? (
            <EmptyState title="등록된 공지사항이 없습니다" description="" />
          ) : (
            <Accordion type="single" collapsible className="bg-white border border-border">
              {notices.map((notice, i) => (
                <Reveal key={notice.id} delay={Math.min(i, 6) * 60} className="border-b border-border last:border-b-0">
                  <AccordionItem value={`notice-${notice.id}`} className="border-b-0 px-5 sm:px-6">
                    <AccordionTrigger className="py-5 text-sm sm:text-[15px] font-medium text-foreground hover:no-underline hover:text-primary transition-colors gap-4 text-left focus-visible:ring-1 focus-visible:ring-primary [&>svg]:text-faint">
                      <span className="flex flex-col gap-1 min-w-0">
                        {notice.isPinned && <span className="text-[10px] tracking-[0.1em] text-primary uppercase font-bold">중요</span>}
                        <span className="break-keep">{notice.title}</span>
                        <span className="text-xs text-caption font-normal">{new Date(notice.createdAt).toLocaleDateString('ko-KR')}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 text-sm text-ink leading-relaxed break-keep whitespace-pre-wrap">
                      {notice.body || "내용이 없습니다."}
                    </AccordionContent>
                  </AccordionItem>
                </Reveal>
              ))}
            </Accordion>
          )}
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
