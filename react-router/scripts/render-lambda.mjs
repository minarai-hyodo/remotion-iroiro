import { spawn } from "node:child_process";
import { COMPOSITION_ID, SITE_NAME } from "../app/remotion/constants.mjs";

// SITE_NAME bakes in the Remotion VERSION, so deriving the render command from constants.mjs
// (instead of hardcoding the site name in package.json) keeps it in sync across Remotion upgrades.
const kebabCase = (value) => value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const outName = `out/${kebabCase(COMPOSITION_ID)}-lambda-rendered.mp4`;

const child = spawn("remotionb", ["lambda", "render", SITE_NAME, COMPOSITION_ID, outName], {
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
