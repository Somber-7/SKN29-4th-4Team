import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { NameRequest } from "@/app/types";

/**
 * processing·results·chat 세 화면은 원래(App.tsx 수제 라우팅) hash가 없는
 * "플로우 오버레이"였다 — 주소창 URL을 바꾸지 않고 같은 화면 위에 겹쳐 그려졌으며,
 * 새로고침하면 마지막 실제 경로(hash가 있던 화면)로 돌아갔다. react-router 전환 후에도
 * 이 동작을 그대로 유지하기 위해 이 세 화면은 라우트를 만들지 않고, 이 Provider의
 * 로컬 상태로만 표시 여부를 제어한다 (router.tsx의 RootLayout이 이 상태를 읽어 렌더링).
 *
 * 문(대문) 열림 연출은 더 이상 이 플로우에 속하지 않는다 — "작명 시작하기" 클릭이
 * 아니라 브라우저 접속 시(세션당 1회) router.tsx의 RootLayout에서 직접 노출한다.
 */
export type FlowScreen = "processing" | "results" | "chat" | null;

interface NamingFlowContextValue {
  flow: FlowScreen;
  request: NameRequest | undefined;
  chatQuestion: string | undefined;
  /** InputScreen 제출 → processing 오버레이 진입 */
  submitRequest: (request: NameRequest) => void;
  /** processing 완료 → results 오버레이 진입 */
  completeProcessing: () => void;
  /** processing 중단/취소 → input(실제 라우트)로 복귀 */
  cancelProcessing: () => void;
  /** results → chat 오버레이 진입 */
  openChat: (question: string | undefined) => void;
  /** chat → results 오버레이 복귀 */
  backToResults: () => void;
  /** results "다시 추천" → input(실제 라우트)로 복귀 */
  retryFromResults: () => void;
  /** history 목록에서 과거 요청 다시 열기 → results 오버레이 진입 */
  openHistoryResult: (request: NameRequest) => void;
  /**
   * processing/results/chat 오버레이를 즉시 닫는다. GNB 등에서 실제 라우트(랜딩·인사이트 등)로
   * 이동할 때 호출한다 — RootLayout은 flow가 남아있으면 라우트가 바뀌어도 오버레이를 계속
   * 렌더링하므로, 이 함수 없이는 오버레이가 떠 있는 동안 GNB 클릭이 화면에 반영되지 않는다.
   */
  exitFlow: () => void;
}

const NamingFlowContext = createContext<NamingFlowContextValue | null>(null);

export function NamingFlowProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<FlowScreen>(null);
  const [request, setRequest] = useState<NameRequest | undefined>(undefined);
  const [chatQuestion, setChatQuestion] = useState<string | undefined>(undefined);

  const submitRequest = useCallback((req: NameRequest) => {
    setRequest(req);
    setFlow("processing");
  }, []);

  const completeProcessing = useCallback(() => setFlow("results"), []);

  const cancelProcessing = useCallback(() => {
    setFlow(null);
    navigate("/input");
  }, [navigate]);

  const openChat = useCallback((question: string | undefined) => {
    setChatQuestion(question);
    setFlow("chat");
  }, []);

  const backToResults = useCallback(() => setFlow("results"), []);

  const retryFromResults = useCallback(() => {
    setFlow(null);
    navigate("/input");
  }, [navigate]);

  const openHistoryResult = useCallback((req: NameRequest) => {
    setRequest(req);
    setFlow("results");
  }, []);

  const exitFlow = useCallback(() => setFlow(null), []);

  const value: NamingFlowContextValue = {
    flow,
    request,
    chatQuestion,
    sub