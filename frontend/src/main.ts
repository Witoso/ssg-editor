import { CKEditorComponent } from "./ckeditor";
import { PostsSelect } from "./posts-select";
import { Frontmatter } from "./frontmatter";

import "./main.css";

customElements.define("posts-select", PostsSelect);
customElements.define("post-frontmatter", Frontmatter);
customElements.define("ckeditor-component", CKEditorComponent);
