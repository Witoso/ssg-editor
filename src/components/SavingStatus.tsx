import { useStore } from "@nanostores/react";

import CheckIcon from "pixelarticons/svg/check.svg?url";
import AlertIcon from "pixelarticons/svg/square-alert.svg?url";

import { saveStatus, type SaveStatus as Status } from "./savingStore.js";

const statusText: Record<Status, string> = {
  idle: "Saved",
  saving: "Saving…",
  error: "Save failed — retrying",
};

const spinnerDelays = ["0ms", "50ms", "100ms", "150ms"];

export function SavingStatus() {
  const status = useStore(saveStatus);

  return (
    <div
      className="flex items-center gap-2 px-3 font-mono text-sm"
      aria-live="polite"
    >
      {status === "idle" && (
        <img src={CheckIcon} alt="" aria-hidden="true" className="h-6 w-6" />
      )}
      {status === "saving" && (
        <div className="flex h-6 items-center justify-center gap-1">
          {spinnerDelays.map((delay) => (
            <div
              key={delay}
              className="h-1 w-1 animate-pixel-bounce bg-black"
              style={{ animationDelay: delay }}
            ></div>
          ))}
        </div>
      )}
      {status === "error" && (
        <img src={AlertIcon} alt="" aria-hidden="true" className="h-6 w-6" />
      )}
      <span className={status === "error" ? "text-red-700" : "text-gray-600"}>
        {statusText[status]}
      </span>
    </div>
  );
}
