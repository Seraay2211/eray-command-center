"use client";

import { createContext, useContext } from "react";

interface CommandPaletteContextValue {
  closePalette: () => void;
  isOpen: boolean;
  openPalette: () => void;
  togglePalette: () => void;
}

export const CommandPaletteContext =
  createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);

  if (!context) {
    throw new Error(
      "useCommandPalette must be used inside CommandPaletteProvider.",
    );
  }

  return context;
}
