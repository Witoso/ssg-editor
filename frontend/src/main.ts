import { BalloonEditor } from "./ckeditor";
import "./main.css";

const apiUrl = "http://localhost:8989";

const editorElement = document.getElementById("editor");
const postsSelect = document.getElementById("posts") as HTMLSelectElement;

const editor = await BalloonEditor.create(editorElement, {
  placeholder: "Start writing...",
});

// editor.enableReadOnlyMode("post-not-loaded");

try {
  const response = await fetch(`${apiUrl}/posts`);
  const posts = await response.json();

  posts.map(async (post) => {
    const option = document.createElement("option");
    option.text = post;
    option.value = post;

    postsSelect.add(option);
  });

  if (!!posts.length) {
    postsSelect.removeAttribute("disabled");
  }
} catch {
  console.error("Bad network request...");
}
