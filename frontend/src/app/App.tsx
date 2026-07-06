import { HashRouter } from "react-router-dom";
import { NamingFlowProvider } from "@/app/providers/NamingFlowProvider";
import { AppRoutes } from "@/app/router";

// 화면별 상태·가드·GNB 분기 등 실제 로직은 router.tsx(RootLayout/AppRoutes)와
// NamingFlowProvider·AuthProvider로 이전되었다. App.tsx는 HashRouter(기존 해시
// 딥링크 #/faq 등을 그대로 유지) 안에 NamingFlowProvider를 두어 라우팅 컨텍스트
// 안에서 useNavigate를 사용할 수 있게 연결하는 역할만 한다.
export default function App() {
  return (
    <HashRouter>
      <NamingFlowProvider>
        <AppRoutes />
      </NamingFlowProvider>
    </HashRouter>
  );
}
