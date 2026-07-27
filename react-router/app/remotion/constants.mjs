import { VERSION } from "remotion";

export const COMPOSITION_FPS = 30;
export const COMPOSITION_WIDTH = 1920;
export const COMPOSITION_HEIGHT = 1080;
export const COMPOSITION_ID = "RemotionIntro";
export const SITE_NAME = "remotion-react-router-example-" + VERSION;

// Lambda関数のパラメータ（RAM / DISK / TIMEOUT / REGION）の実体は lambda-config.mjs にある。
// sst.config.ts からも読めるよう、`remotion` を import しないファイルに分けてある。
export { RAM, DISK, TIMEOUT, REGION } from "./lambda-config.mjs";
