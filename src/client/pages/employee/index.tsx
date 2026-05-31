import { start } from "../frontend";
import { EmployeePage } from "./EmployeePage";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => start(<EmployeePage />));
} else {
  start(<EmployeePage />);
}
