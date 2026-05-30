import { start } from "../frontend";
import { ChatPage } from "./ChatPage";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => start(<ChatPage />));
} else {
  start(<ChatPage />);
}
