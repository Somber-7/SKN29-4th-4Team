import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/app/types";
import { SourceChip } from "@/app/components/common/SourceChip";
import { PrimaryButton } from "@/app/components/common/Button";

const DEFAULT_CHAT: ChatMessage[] = [
  {
    role: "user",
    content: "도현이라는 이름에서 水 기운이 충분한가요?",
  },
  {
    role: "assistant",
    content:
      "도현(道賢)을 분석하면, 道(도)는 자원오행상 土에 해당하며, 賢(현) 또한 土行으로 분류됩니다. 순수한 水 기운을 원하신다면 澤(택)·海(해)·淵(연) 등 水行 한자를 포함한 이름을 추가로 추천해 드릴 수 있습니다.",
  },
];

// TODO(API): POST /chat (스트리밍) 응답으로 대체
const CANNED_REPLY =
  "말씀하신 내용을 한자 자원오행 문헌 및 81수리 체계를 기준으로 검토해 드리겠습니다. 구체적인 출처와 함께 상세한 분석을 제공해 드릴 수 있습니다.";

/** 목업 어시스턴트 답변이 타이핑 표시 후 도착하기까지의 지연 */
const ASSISTANT_REPLY_DELAY_MS = 1600;

export function ChatScreen({
  initialQuestion,
  onBack,
}: {
  initialQuestion?: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialQuestion ? [{ role: "user", content: initialQuestion }] : DEFAULT_CHAT
  );
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Answer the question carried over from the Results screen
  useEffect(() => {
    if (!initialQuestion) return;
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", content: CANNED_REPLY }]);
    }, ASSISTANT_REPLY_DELAY_MS);
    return () => clearTimeout(t);
  }, [initialQuestion]);

  useEffect(() => {
    composerRef.current?.focus();
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", content: CANNED_REPLY }]);
    }, ASSISTANT_REPLY_DELAY_MS);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className="pt-16 h-screen bg-background flex flex-col">
      {/* Sub-header */}
      <div className="border-b border-border px-8 py-3 flex items-center gap-4 bg-white flex-shrink-0">
        <button
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          ← 결과로
        </button>
        <span className="text-sm font-medium text-foreground">추가 질문</span>
        <span className="ml-auto text-[11px] text-hint">Enter 전송 · Shift+Enter 줄바꿈</span>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-8 py-6"
        role="log"
        aria-live="polite"
        aria-label="대화 내역"
      >
        <div className="max-w-3xl mx-auto space-y-5">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}
          >
            {msg.role === "assistant" && (
              <div
                className="font-hanja w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0 mt-0.5"
              >
                명
              </div>
            )}
            <div
              className={`max-w-xl ${
                msg.role === "user"
                  ? "bg-foreground text-background px-4 py-2.5 text-sm"
                  : "bg-white border border-border px-4 py-3 text-sm text-foreground"
              }`}
            >
              <p className="break-keep leading-relaxed">{msg.content}</p>
              {msg.role === "assistant" && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-muted">
                  <SourceChip type="hanja" label="한자 자원오행" />
                  <SourceChip type="suri" label="81수리" />
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start items-center gap-3">
            <div
              className="font-hanja w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0"
            >
              명
            </div>
            <div className="bg-white border border-border px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  className="w-1.5 h-1.5 rounded-full bg-hint"
                  style={{ animation: `mg-bounce 0.8s ease infinite ${j * 0.14}s` }}
                />
              ))}
            </div>
          </div>
        )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-white px-8 py-4 flex-shrink-0">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <textarea
            ref={composerRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="추가 질문을 입력해 주세요..."
            rows={1}
            className="flex-1 px-3 py-2 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all"
          />
          <PrimaryButton onClick={handleSend} disabled={!input.trim()} className="px-6 py-2">
            전송
          </PrimaryButton>
        </div>
        <p className="max-w-3xl mx-auto mt-2 text-[11px] text-hint text-center">
          명가작명소의 답변은 참고용 정보이며 법적 효력이 없습니다.
        </p>
      </div>
    </div>
  );
}
