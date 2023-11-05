import {
  PostResponseSchema,
  PostResponseType,
  PostsListResponseSchema,
  PostsListResponseType,
} from "../../types/post";
import { ClassicEditor } from "./ckeditor";
import "./main.css";

const apiUrl = "http://localhost:8989";

const editorElement = document.getElementById("editor");
const postsSelect = document.getElementById("posts") as HTMLSelectElement;
const frontmatter = document.getElementById(
  "frontmatter"
) as HTMLTextAreaElement;

const editor = await ClassicEditor.create(editorElement, {
  placeholder: "Start writing...",
});

editor.enableReadOnlyMode("post-not-loaded");

fetchPosts();
handlePostsSelect();

async function fetchPosts() {
  const response = await fetch(`${apiUrl}/posts`);

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();

  const postsFilenames: PostsListResponseType =
    PostsListResponseSchema.parse(data);

  postsFilenames.filenames.map((post: string) => {
    const option = document.createElement("option");
    option.text = post;
    option.value = post;

    postsSelect.add(option);
  });

  if (!!postsFilenames.filenames.length) {
    postsSelect.removeAttribute("disabled");
  }
}

async function handlePostsSelect() {
  postsSelect.addEventListener("change", async (event) => {
    const selectedPost = (event.target as HTMLSelectElement).value;

    try {
      const response = await fetch(`${apiUrl}/posts/${selectedPost}`);

      if (response.ok) {
        const data = await response.json();
        console.log(data);

        const postResponse: PostResponseType = PostResponseSchema.parse(data);

        if (postResponse.status === "error") {
          console.error(`API request failed. Error: ${postResponse.message}`);
          return;
        }

        frontmatter.value = postResponse.post.frontmatter;
        frontmatter.removeAttribute("disabled");

        editor.setData(postResponse.post.content);
        editor.disableReadOnlyMode("post-not-loaded");
      } else {
        console.error("API request failed", response);
      }
    } catch (error) {
      console.error("An error occurred", error);
    }
  });
}
