import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import { TRPCProvider } from "@/providers/trpc";
import App from "./App.tsx";

const redirectTo = sessionStorage.getItem("redirectTo");
if (redirectTo) {
  sessionStorage.removeItem("redirectTo");
  window.history.replaceState(null, "", redirectTo);
}

const basename = import.meta.env.BASE_URL.replace(/\/+$/, "");

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={basename}>
    <TRPCProvider>
      <App />
    </TRPCProvider>
  </BrowserRouter>
);
