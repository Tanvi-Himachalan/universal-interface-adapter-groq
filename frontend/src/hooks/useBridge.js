/**
 * useBridge.js
 * Custom hook that manages the postMessage bridge between
 * the overlay iframe and the parent page's content script.
 */

import { useEffect, useCallback, useRef } from "react";

export function useBridge(onMessage) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const handler = (event) => {
      // Only accept messages from our content script
      if (event.data?.source !== "UIA_CONTENT") return;
      onMessageRef.current(event.data);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const sendMessage = useCallback((type, payload = {}) => {
    window.parent.postMessage({ source: "UIA_OVERLAY", type, payload }, "*");
  }, []);

  return { sendMessage };
}
