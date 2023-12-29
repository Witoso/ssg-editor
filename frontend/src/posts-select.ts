import { html, render } from "lit-html";
import {
  PostResponseSchema,
  PostType,
  PostsListResponseSchema,
} from "../../types/post";

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
    this.fetchPosts();
  }

  render() {
    const template = html`
      <select
        id="posts"
        name="posts"
        class="block w-1/3 mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
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

  private async fetchPosts() {
    const response = await fetch(`${this.apiUrl}/posts`);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    const postsFilenames =
      PostsListResponseSchema.parse(data);

    if (!!postsFilenames.filenames.length) {
      this.isLoading = false;
    }

    this.postsFilenames = postsFilenames.filenames;
  }

  private handleSelectChange = async (event: Event) => {
    const selectedPost = (event.target as HTMLSelectElement).value;

    try {
      const response = await fetch(`${this.apiUrl}/posts/${selectedPost}`);

      if (response.ok) {
        const data = await response.json();

        const postResponse =
          PostResponseSchema.parse(data);

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
  }

  private sendEvent(post: PostType) {
    const postSelected: PostSelectedEvent = new CustomEvent("post-selected", {
      detail: { value: post },
      bubbles: true,
    });

    // Dispatch the event
    this.dispatchEvent(postSelected);
  }
}
