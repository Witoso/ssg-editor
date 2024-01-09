import { AddPost } from "./add-post";
import { CKEditorComponent } from "./ckeditor";
import { PostsSelect } from "./posts-select";

import "./main.css";

customElements.define("posts-select", PostsSelect);
customElements.define("ckeditor-component", CKEditorComponent);
customElements.define("add-post", AddPost);
