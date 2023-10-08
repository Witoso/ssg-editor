import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import { findPostsInDirectory } from "./post.js";

const app: Express = express();
const port = process.env.SW_PORT || "8989";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = "/Users/witold/workspace/static-wyswig/backend";

app.use(express.static(join(__dirname, "public")));
// TODO only on dev
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.get("/", (req: Request, res: Response) => {
  res.sendFile("./public/index.html", { root: __dirname });
});

app.get("/posts", async (req: Request, res: Response) => {
  const posts = await findPostsInDirectory(`${rootDir}/demo`);
  const postsPaths = posts.map((post) => post.filename);
  res.json(postsPaths);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
