import { useState, type Dispatch, type SetStateAction } from "react";

import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";
import SlInput, {
  type SlInputEvent,
} from "@shoelace-style/shoelace/dist/react/input/index.js";

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

  // Handle the sl-change event and replace spaces with hyphens
  // Handle the sl-change event and replace spaces with hyphens
  const handleSlInput = (event: SlInputEvent) => {
    const target = event.target as HTMLInputElement; // Cast event target to SlInput
    const value = target?.value.replace(/\s+/g, "-"); // Replace spaces with hyphens
    setInputValue(value);
  };

  // TODO Creating folders
  return (
    <SlDialog open={isDialogOpen} onSlAfterHide={() => setIsDialogOpen(false)}>
      <h1 slot="label">Create a new file</h1>
      <form action="/create" method="POST">
        <SlInput
          autoFocus
          name="filename"
          value={inputValue}
          placeholder="Enter the name that will go before .md"
          onSlInput={handleSlInput} // Listen for the sl-change event
          help-text=""
          required
          label="File name"
          pattern="[a-zA-Z0-9_\-]+"
        >
          <span slot="prefix">{`${currentFolderPath}/`}</span>
          <span slot="suffix">.md</span>
        </SlInput>
        <SlInput
          style={{ display: "none" }}
          name="folder-path"
          value={`${currentFolderPath}/`}
        ></SlInput>
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
