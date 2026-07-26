import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./home.tsx"),
  route("/remotion-intro", "./remotion-intro.tsx"),
  route("/api/lambda/progress", "./progress.tsx"),
  route("/api/lambda/render", "./render.tsx"),
] satisfies RouteConfig;
