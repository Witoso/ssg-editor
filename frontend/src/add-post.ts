import { html, render } from "lit-html";
import {
  PostCreateRequestSchema,
  PostCreateResponseSchema,
} from "../../types/post";
import { setFilenameToUrl } from "./url";

export class AddPost extends HTMLElement {
  private isOpen: boolean;
  private filenameError: string;

  constructor() {
    super();
    this.isOpen = false;
  }

  connectedCallback() {
    this.render();
    this.querySelector("button").addEventListener(
      "click",
      this.toggleDropdown.bind(this),
    );
    this.addEventListener("focusout", this.handleFocusOut.bind(this));

    this.querySelector('input[name="filename"]').addEventListener(
      "input",
      this.replaceSpacesWithDashes.bind(this),
    );
  }

  disconnectedCallback() {
    this.querySelector("button").removeEventListener(
      "click",
      this.toggleDropdown.bind(this),
    );

    this.removeEventListener("focusout", this.handleFocusOut.bind(this));
    this.querySelector('input[name="filename"]').removeEventListener(
      "input",
      this.replaceSpacesWithDashes.bind(this),
    );
  }

  toggleDropdown() {
    // Ensure that we toggle only when the button is clicked
    this.isOpen = !this.isOpen;
    this.render();
  }

  handleFocusOut(event: FocusEvent) {
    // Check if the new focused element is outside this component

    if (!this.contains(event.relatedTarget as HTMLElement)) {
      this.isOpen = false;
      this.render();
    }
  }

  replaceSpacesWithDashes(event: InputEvent) {
    (event.target as HTMLInputElement).value = (
      event.target as HTMLInputElement
    ).value.replace(/\s+/g, "-");
  }

  async handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    const filename = `${form.elements["filename"].value}.md`;

    const apiUrl = "http://localhost:8989/posts/create";
    const data = {
      filename: filename,
    };

    try {
      const postSaveRequest = PostCreateRequestSchema.parse(data);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postSaveRequest),
      });

      const body = await response.json();
      const createResponse = PostCreateResponseSchema.parse(body);

      if (createResponse.status === "error") {
        if (createResponse.message === "Post exists") {
          this.filenameError = "Post already exists.";
        } else {
          this.filenameError = "Internal error.";
        }
      } else {
        form.elements["filename"].value = "";
        this.isOpen = false;
        setFilenameToUrl(filename);
        this.sendRefreshEvent();
      }
      this.render();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  private sendRefreshEvent() {
    const refreshEvent = new CustomEvent("refresh-posts", {
      bubbles: true,
    });

    // Dispatch the event
    this.dispatchEvent(refreshEvent);
  }

  render() {
    const dropdownClasses = `absolute mt-1 rounded-md bg-white shadow-lg z-50 right-0 ${
      this.isOpen ? "" : "hidden"
    }`;
    const template = html`
      <div class="flex justify-center h-full">
        <button class="text-gray-300 hover:text-black text-2xl font-bold">
          <svg
            class="text-gray-300 hover:text-black"
            width="20px"
            height="20px"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <rect x="45" y="10" width="10" height="80" />
            <rect x="10" y="45" width="80" height="10" />
          </svg>
        </button>
      </div>
      <div class="${dropdownClasses}">
        <div class="flex flex-col">
          <form
            class="px-4 py-3 flex items-center"
            @submit="${(event: SubmitEvent) => this.handleSubmit(event)}"
          >
            <div class="flex items-center flex-grow">
              <input
                type="text"
                name="filename"
                id="filename"
                class="focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 block w-full rounded-l-md sm:text-sm border-gray-300 py-2 h-10"
                placeholder="Enter file name"
              />
              <span
                class="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm h-10"
                >.md</span
              >
              <button
                type="submit"
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md h-10"
              >
                Add
              </button>
            </div>
          </form>
          ${this.filenameError
            ? html`<span class="text-red-500 text-sm block px-4 pb-2"
                >${this.filenameError}</span
              >`
            : ""}
        </div>
      </div>
    `;
    render(template, this);
  }
}
