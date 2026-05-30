import { EmployeesPage } from "./EmployeesPage";
import { start } from "../frontend";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => start(<EmployeesPage />));
} else {
  start(<EmployeesPage />);
}
