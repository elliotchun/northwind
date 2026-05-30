import { start } from "../frontend";
import { UploadPage } from "./UploadPage";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => start(<UploadPage />));
} else {
  start(<UploadPage />);
}
