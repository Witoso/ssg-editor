import { useRef, useState, type Dispatch, type SetStateAction } from "react";

import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";
import SlInput, {
  type SlInputEvent,
} from "@shoelace-style/shoelace/dist/react/input/index.js";
import type SlInputElement from "@shoelace-style/shoelace/dist/components/input/input.js";

import { FILENAME_PATTERN } from "@/lib/filenames";

export function CreateDialog({
  isDialogOpen,
  setIsDialogOpen,
  currentFolderPath,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
  currentFolderPath: string;
}) {
  const [inputValue, setInputValue] = useState<string>("");
  const filenameRef = useRef<SlInputElement>(null);

  const handleSlInput = (event: SlInputEvent) => {
    const target = event.target as HTMLInputElement;
    const value = target?.value.replace(/\s+/g, "-");
    setInputValue(value);
  };

  // TODO Creating folders
  return (
    <SlDialog
      open={isDialogOpen}
      // autoFocus doesn't reach a web component's inner input; focus it once
      // the dialog has finished animating in.
      onSlAfterShow={() => filenameRef.current?.focus()}
      onSlAfterHide={() => {
        setInputValue("");
        setIsDialogOpen(false);
      }}
    >
      <h1 slot="label">Create a new file</h1>
      <form action="/create" method="POST">
        <SlInput
          ref={filenameRef}
          name="filename"
          value={inputValue}
          placeholder="Enter the name that will go before .md"
          onSlInput={handleSlInput}
          required
          label="File name"
          pattern={FILENAME_PATTERN}
        >
          <span slot="prefix">{`${currentFolderPath}/`}</span>
          <span slot="suffix">.md</span>
        </SlInput>
        <input type="hidden" name="folder-path" value={currentFolderPath} />
        <br />

        <SlButton type="submit" variant="primary">
          Create
        </SlButton>
        <SlButton variant="text" onClick={() => setIsDialogOpen(false)}>
          Cancel
        </SlButton>
      </form>
    </SlDialog>
  );
}
