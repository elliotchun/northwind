import { start } from "../frontend";
import { ReceiptsPage } from "./ReceiptsPage";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => start(<ReceiptsPage />));
} else {
  start(<ReceiptsPage />);
}
