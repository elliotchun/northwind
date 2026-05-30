import { LoginPage } from "./LoginPage";
import { start } from "../frontend";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => start(<LoginPage />));
} else {
  start(<LoginPage />);
}
