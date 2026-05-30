/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import type { ReactNode } from "react";

// Initializes the react app with the given child (typically the page that should be rendered)
export function start(children?: ReactNode) {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <App>
      {children}
    </App>
  );
}
