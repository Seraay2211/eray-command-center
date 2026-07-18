"use client";

import { useEffect, useState } from "react";

interface StandaloneModeState {
  hasMounted: boolean;
  isAppleMobile: boolean;
  isIosSafari: boolean;
  isStandalone: boolean;
}

function readStandaloneState(): Omit<StandaloneModeState, "hasMounted"> {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const isIpadOs =
    platform === "MacIntel" && Number(navigator.maxTouchPoints) > 1;
  const isAppleMobile = /iPad|iPhone|iPod/i.test(userAgent) || isIpadOs;
  const isSafari =
    /Safari/i.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(userAgent);
  const standaloneNavigator = navigator as Navigator & {
    standalone?: boolean;
  };

  return {
    isAppleMobile,
    isIosSafari: isAppleMobile && isSafari,
    isStandalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      standaloneNavigator.standalone === true,
  };
}

export function useStandaloneMode(): StandaloneModeState {
  const [state, setState] = useState<StandaloneModeState>({
    hasMounted: false,
    isAppleMobile: false,
    isIosSafari: false,
    isStandalone: false,
  });

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const legacyMedia = media as MediaQueryList & {
      addListener?: (listener: () => void) => void;
      removeListener?: (listener: () => void) => void;
    };

    function updateState() {
      setState({
        ...readStandaloneState(),
        hasMounted: true,
      });
    }

    updateState();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", updateState);
    } else {
      legacyMedia.addListener?.(updateState);
    }

    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", updateState);
      } else {
        legacyMedia.removeListener?.(updateState);
      }
    };
  }, []);

  return state;
}
