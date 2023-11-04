import {
  PostsListResponseSchema,
  PostsListResponseType,
} from "../../types/post";
import { ClassicEditor } from "./ckeditor";
import "./main.css";

const apiUrl = "http://localhost:8989";

const editorElement = document.getElementById("editor");
const postsSelect = document.getElementById("posts") as HTMLSelectElement;

const editor = await ClassicEditor.create(editorElement, {
  placeholder: "Start writing...",
});

// editor.enableReadOnlyMode("post-not-loaded");

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

  postsFilenames.filenames.map((post) => {
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
    // Get the selected value
    const selectedPost = (event.target as HTMLSelectElement).value;
    console.log(selectedPost);

    // Perform API call
    try {
      const response = await fetch(
        `${apiUrl}/posts/${selectedPost}`
      );

      if (response.ok) {
        const data = await response.json();
        // Do something with the data
        console.log(data);
      } else {
        console.error("API request failed", response);
      }
    } catch (error) {
      console.error("An error occurred", error);
    }
  });
}
