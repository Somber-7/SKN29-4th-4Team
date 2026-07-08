import { createRoot } from "react-dom/client";
import AdminApp from "./app/AdminApp.tsx";
import "./styles/index.css";

// 사용자 진입점(main.tsx)과 분리된 관리자 전용 진입점. admin.html이 이 파일만 로드하고,
// 사용자 진입점은 AdminApp을 import하지 않으므로 서로의 코드가 섞이지 않는다.
createRoot(document.getElementById("root")!).render(<AdminApp />);
