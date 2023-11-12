import { html, render } from "lit-html";
import { PostSelectedEvent } from "./posts-select";

export class Frontmatter extends HTMLElement {
  private isDisabled = true;
  private _textareaText = "";

  constructor() {
    super();
  }

  set textareaText(newContent: string) {
    this._textareaText = newContent;
    this.render();
  }

  connectedCallback() {
    this.render();
    this.listenForPostChange();
  }

  render() {
    const template = html` <h2>Frontmatter</h2>
      <textarea
        id="frontmatter"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
        ?disabled="${this.isDisabled}"
        .value="${this._textareaText}"
      ></textarea>`;
    render(template, this);
  }

  private listenForPostChange = () => {
    document.addEventListener("post-selected", (event: Event) => {
      const post = event as PostSelectedEvent;
      const frontmatter = post.detail.value.frontmatter;
      this.isDisabled = false;
      this.textareaText = frontmatter;
    });
  };
}
