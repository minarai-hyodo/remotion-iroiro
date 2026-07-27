// Remotion Lambdaの関数パラメータ。`constants.mjs` から切り出してあるのは、こちらを
// sst.config.ts 側（infra/remotion-lambda.ts）からも読みたいため。`constants.mjs` は
// SITE_NAME のために `remotion` 本体を import しており、それをSSTのesbuildバンドルに
// 巻き込みたくない。値はここが唯一の定義で、`constants.mjs` は再エクスポートしている。

export const RAM = 3009;
export const DISK = 10240;
export const TIMEOUT = 240;

/**
 * Use autocomplete to get a list of available regions.
 * @type {import('@remotion/lambda').AwsRegion}
 */
export const REGION = "us-east-1";

/**
 * `deployFunction()` が作るレンダー関数名の接頭辞（`speculateFunctionName()` の出力も
 * 必ずこれで始まる）。IAMポリシーの対象を絞るのに使う。
 */
export const RENDER_FUNCTION_PREFIX = "remotion-render-";
