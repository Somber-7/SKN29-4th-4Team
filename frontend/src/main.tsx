
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { QueryProvider } from "./app/providers/QueryProvider";
  import { AuthProvider } from "./app/providers/AuthProvider";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <QueryProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryProvider>,
  );
