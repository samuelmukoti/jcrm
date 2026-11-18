import { createContext, useContext } from "react";
import type { AiState, ModalState, Snapshot } from "./types";
export type AppContextValue = {
  data: Snapshot;
  period: string;
  owner: string;
  setFilters: (period: string, owner: string) => void;
  openModal: (modal: ModalState) => void;
  openAI: (state: AiState) => void;
  notify: (
    message: string,
    action?: { label: string; run: () => void },
  ) => void;
  refresh: () => Promise<void>;
};
export const AppContext = createContext<AppContextValue | null>(null);
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("Workspace not ready");
  return value;
}
