import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import {
  Post,
  findPostsInDirectory,
  parsePostFromFile,
  postExists,
  savePostToFile,
} from "./post.js";
import {
  PostCreateRequestSchema,
  PostCreateResponseSchema,
  PostCreateResponseType,
  PostResponseSchema,
  PostSaveRequestSchema,
  PostSaveResponseSchema,
  PostsListResponseSchema,
} from "../../types/post.js";

const app: Express = express();
const port = process.env.SW_PORT || "8989";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TODO this should be on development only, provided by user.
const rootDir = "/Users/witold/workspace/ssg-wysiwyg/demo";

app.use(express.static(join(__dirname, "public")));

app.use(express.json());

// TODO only on dev.
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
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

    console.error(`⚡️[SSG WYSIWYG]: Error ${error.message}`);
    PostsListResponseSchema.parse(errorResponse);

    res.status(404).json(errorResponse);
  }
});

app.get("/posts/:fileName", async (req, res) => {
  const { fileName } = req.params;

  try {
    const postPath = `${rootDir}/${fileName}`;
    const post = await parsePostFromFile(postPath);

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

app.post("/posts", async (req, res) => {
  try {
    const postData = PostSaveRequestSchema.parse(req.body);

    const post = new Post(postData.content, `${rootDir}/${postData.filename}`);

    await savePostToFile(post);

    const response = {
      status: "success",
      message: null,
    };

    PostSaveResponseSchema.parse(response);
    res.json(response);
  } catch (error) {
    const errorResponse = {
      status: "error",
      message: error.message,
    };

    PostSaveResponseSchema.parse(errorResponse);
    res.status(400).json(errorResponse);
    console.error(`⚡️[SSG WYSIWYG]: Error ${error.message}`);
  }
});

app.post("/posts/create", async (req, res) => {
  let errorResponse: PostCreateResponseType;
  try {
    const postData = PostCreateRequestSchema.parse(req.body);

    const exists = await postExists(`${rootDir}/${postData.filename}`);

    if (!exists) {
      const post = new Post("", `${rootDir}/${postData.filename}`);

      await savePostToFile(post);

      const response = {
        status: "success",
        message: null,
      };

      PostCreateResponseSchema.parse(response);
      res.json(response);
      return;
    } else {
      errorResponse = {
        status: "error",
        message: "Post exists",
      };
    }
  } catch (error) {
    console.error(`⚡️[SSG WYSIWYG]: Error ${error.message}`);
    errorResponse = {
      status: "error",
      message: error.message,
    };
  }
  PostCreateResponseSchema.parse(errorResponse);
  res.status(400).json(errorResponse);
});

app.listen(port, () => {
  console.log(
    `⚡️[SSG WYSIWYG]: Server is running at http://localhost:${port}`,
  );
});
