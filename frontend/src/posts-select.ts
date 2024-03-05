import { html, render } from "lit-html";
import {
  PostResponseSchema,
  PostType,
  PostsListResponseSchema,
} from "../../types/post";
import { getFilenameFromUrl, setFilenameToUrl } from "./url";

export interface PostSelectedEvent extends Event {
  detail: { value: PostType };
}

export class PostsSelect extends HTMLElement {
  private apiUrl = "http://localhost:8989";
  private isLoading = true;
  private _postsFilenames = [];

  constructor() {
    super();
  }

  async connectedCallback() {
    this.render();
    this.refresh();
    this.listenForRefresh();
  }

  render() {
    const template = html`
      <select
        id="posts"
        name="posts"
        class="block sm:w-80 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
        ?disabled="${this.isLoading}"
        @change="${this.handleSelectChange}"
      >
        <option value="" disabled selected hidden>Select a post</option>
        ${this._postsFilenames.map((post) => {
          return html`<option value="${post}">${post}</option>`;
        })}
      </select>
    `;

    render(template, this);
  }

  set postsFilenames(newValue: string[]) {
    this._postsFilenames = newValue;
    this.render();
  }

  async refresh() {
    await this.fetchPosts();
    this.selectPostFromUrl();
  }

  private async fetchPosts() {
    const response = await fetch(`${this.apiUrl}/posts`);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    const postsFilenames = PostsListResponseSchema.parse(data);

    if (postsFilenames.filenames.length) {
      this.isLoading = false;
    }

    this.postsFilenames = postsFilenames.filenames;
  }

  private handleSelectChange = async (event: Event) => {
    const selectedPost = (event.target as HTMLSelectElement).value;

    // Update the URL with the selected filename
    setFilenameToUrl(selectedPost);

    try {
      const response = await fetch(`${this.apiUrl}/posts/${selectedPost}`);

      if (response.ok) {
        const data = await response.json();

        const postResponse = PostResponseSchema.parse(data);

        if (postResponse.status === "error") {
          console.error(`API request failed. Error: ${postResponse.message}`);
          return;
        }

        this.sendEvent(postResponse.post);
      } else {
        console.error("API request failed", response);
      }
    } catch (error) {
      console.error("An error occurred", error);
    }
  };

  private sendEvent(post: PostType) {
    const postSelected: PostSelectedEvent = new CustomEvent("post-selected", {
      detail: { value: post },
      bubbles: true,
    });

    // Dispatch the event
    this.dispatchEvent(postSelected);
  }

  private selectPostFromUrl() {
    const filename = getFilenameFromUrl();

    if (filename && this._postsFilenames.includes(filename)) {
      const selectElement = this.querySelector<HTMLSelectElement>("#posts");
      if (selectElement) {
        selectElement.value = filename;
        const event = new Event("change", { bubbles: true });
        selectElement.dispatchEvent(event);
      }
    }
  }

  private listenForRefresh = () => {
    document.addEventListener("refresh-posts", () => {
      this.refresh();
    });
  };
}
