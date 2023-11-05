import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import { findPostsInDirectory, parsePostFromFile } from "./post.js";
import { PostResponseSchema, PostsListResponseSchema } from "../../types/post.js";

const app: Express = express();
const port = process.env.SW_PORT || "8989";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TODO this should be env var.
const rootDir = "/Users/witold/workspace/ssg-wysiwyg/backend/demo";

app.use(express.static(join(__dirname, "public")));

// TODO only on dev.
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.get("/", (_req: Request, res: Response) => {
  res.sendFile("./public/index.html", { root: __dirname });
});

app.get("/posts", async (_req: Request, res: Response) => {
  try {
    const posts = await findPostsInDirectory(`${rootDir}`);
    const postsPaths = posts.map((post) => post.fileName);

    const response = {
      status: "success",
      filenames: postsPaths,
      message: null,
    };

    PostsListResponseSchema.parse(response);
    res.json(response);
  } catch (error) {
    const errorResponse = {
      status: "error",
      filenames: [],
      message: "Couldn't find the file.",
    };

    console.log(`⚡️[SSG WYSIWYG]: Error ${error.message}`);
    PostsListResponseSchema.parse(errorResponse);

    res.status(404).json(errorResponse);
  }
});

app.get("/posts/:fileName", async (req, res) => {
  const { fileName } = req.params;

  try {
    const postPath = `${rootDir}/${fileName}`;
    const post = await parsePostFromFile(postPath);
    console.log(post)

    const response = {
      status: "success",
      post: post.toJSON(),
      message: null,
    };

    PostResponseSchema.parse(response);
    res.json(response);

  } catch (error) {
    const errorResponse = {
      status: "error",
      post: null,
      message: error.message,
    };

    PostResponseSchema.parse(errorResponse);

    res.status(404).json(errorResponse);
  }

});

app.listen(port, () => {
  console.log(`⚡️[SSG WYSIWYG]: Server is running at http://localhost:${port}`);
});
