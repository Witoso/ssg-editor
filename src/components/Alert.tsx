import { useRef, useEffect } from "react";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import SlAlert from "@shoelace-style/shoelace/dist/react/alert/index.js";

import AlertIcon from "pixelarticons/svg/alert.svg?url";
import CheckIcon from "pixelarticons/svg/check.svg?url";

interface AlertProps {
  error?: string;
  success?: string;
  filename?: string;
}

export function Alert({ error, success, filename }: AlertProps) {
  const alert = useRef<any>(null);

  useEffect(() => {
    if (error || success) {
      alert.current?.toast();
    }
  }, [error, success]);

  const getMessage = () => {
    switch (error) {
      case 'file_exists':
        return `File "${filename}" already exists.`;
      case 'invalid_input':
        return 'Invalid input provided.';
      case 'server_error':
        return 'Server error occurred.';
      default:
        return 'File created successfully.';
    }
  };

  return (
    <>
      <SlAlert ref={alert} variant={error ? 'danger' : 'success'} duration={4000} closable>
        <SlIcon slot="icon" src={error ? AlertIcon : CheckIcon} />
        <strong>{getMessage()}</strong>
      </SlAlert>
    </>
  );
}
