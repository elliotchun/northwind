import type { ReactNode } from "react";
import { Provider } from "../components/ui/provider";
import "./index.css";
import { Navbar } from "../components/Navbar";
import { RequireAuth } from "../components/RequireAuth";

interface AppProps {
  children?: ReactNode
}

export function App({ children }: AppProps) {
  return (
    <Provider>
      <RequireAuth>
        <Navbar />
        {children}
      </RequireAuth>
    </Provider>
  )
}

export default App;
