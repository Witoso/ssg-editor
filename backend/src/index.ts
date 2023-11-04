import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import { findPostsInDirectory, parsePostFromFile } from "./post.js";
import { PostsListResponseSchema } from "../../types/post.js";

const app: Express = express();
const port = process.env.SW_PORT || "8989";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TODO this should be env var.
const rootDir = "/Users/witold/workspace/static-wyswig/backend/demo";

app.use(express.static(join(__dirname, "public")));

// TODO only on dev.
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.get("/", (req: Request, res: Response) => {
  res.sendFile("./public/index.html", { root: __dirname });
});

app.get("/posts", async (req: Request, res: Response) => {
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
      message: error.message,
    };

    PostsListResponseSchema.parse(errorResponse);

    res.status(500).json(errorResponse);
  }
});

app.get("/posts/:fileName", async (req, res) => {
  // Access the filename parameter from the URL
  const { fileName } = req.params;

  try {
    const postPath = `${rootDir}/${fileName}`;
    console.log(postPath);
    const post = await parsePostFromFile(postPath);
    res.json(post);
  } catch (e) {
    console.error("Error: Cannot return a post");
  }

  // Do something with the filename, e.g., retrieve the post data

  // Send a response (this is just an example response)
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
