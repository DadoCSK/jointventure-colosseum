"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

export type UiVariant = "classic" | "industrial";
const preferenceKey = "jv-ui-variant";
const changeEvent = "jv-appearance-change";

// Runs synchronously in the head, before content paints. Only appearance is stored.
export const appearanceScript = `(function(){var v="classic";try{if(localStorage.getItem("${preferenceKey}")==="industrial")v="industrial"}catch(e){}document.documentElement.dataset.uiVariant=v;document.documentElement.dataset.theme=v==="industrial"?"jointventure-industrial":"jointventure"})()`;

function snapshot(): UiVariant {
  return document.documentElement.dataset.uiVariant === "industrial" ? "industrial" : "classic";
}
function apply(variant: UiVariant) {
  document.documentElement.dataset.uiVariant = variant;
  document.documentElement.dataset.theme = variant === "industrial" ? "jointventure-industrial" : "jointventure";
  window.dispatchEvent(new Event(changeEvent));
}
function subscribe(listener: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === preferenceKey || event.key === null) apply(event.newValue === "industrial" ? "industrial" : "classic");
  };
  window.addEventListener(changeEvent, listener);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(changeEvent, listener);
    window.removeEventListener("storage", storage);
  };
}
const AppearanceContext = createContext<{ variant: UiVariant; setVariant: (variant: UiVariant) => void } | null>(null);

export function UiVariantProvider({ children }: { children: ReactNode }) {
  const variant = useSyncExternalStore(subscribe, snapshot, () => "classic" as const);
  function setVariant(next: UiVariant) {
    apply(next);
    try { localStorage.setItem(preferenceKey, next); } catch { /* Session switching works without storage. */ }
  }
  return <AppearanceContext.Provider value={{ variant, setVariant }}>{children}</AppearanceContext.Provider>;
}

export function AppearanceSwitch() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("AppearanceSwitch requires UiVariantProvider");
  return <div className="appearance-switch" role="group" aria-label="Appearance">
    {(["classic", "industrial"] as const).map(variant => <button
      key={variant}
      type="button"
      data-appearance={variant}
      aria-pressed={context.variant === variant}
      onClick={() => context.setVariant(variant)}
    >{variant === "classic" ? "Classic" : "Industrial"}</button>)}
  </div>;
}
