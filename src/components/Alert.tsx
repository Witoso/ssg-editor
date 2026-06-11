import { useRef, useEffect } from "react";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import SlAlert from "@shoelace-style/shoelace/dist/react/alert/index.js";
import type SlAlertElement from "@shoelace-style/shoelace/dist/components/alert/alert.js";

import AlertIcon from "pixelarticons/svg/square-alert.svg?url";
import CheckIcon from "pixelarticons/svg/check.svg?url";

import { getFlashMessage } from "./flashMessage";

interface AlertProps {
  error?: string;
  success?: string;
  filename?: string;
}

export function Alert({ error, success, filename }: AlertProps) {
  const alert = useRef<SlAlertElement>(null);

  useEffect(() => {
    if (error || success) {
      alert.current?.toast();
    }
  }, [error, success]);

  const message = getFlashMessage({ error, success, filename });

  if (!message) {
    return null;
  }

  return (
    <>
      <SlAlert
        ref={alert}
        variant={error ? "danger" : "success"}
        duration={4000}
        closable
      >
        <SlIcon slot="icon" src={error ? AlertIcon : CheckIcon} />
        <strong>{message}</strong>
      </SlAlert>
    </>
  );
}
