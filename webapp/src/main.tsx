import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./index.css";
import { initTheme } from "./lib/theme";
import { registerSW } from "virtual:pwa-register";

// Apply saved theme before first render to avoid flash
initTheme();

registerSW({
	immediate: true,
});

createRoot(document.getElementById("root")!).render(<App />);
