// Remotion Lambdaの関数パラメータ。`constants.mjs` から切り出してあるのは、こちらを
// sst.config.ts 側（infra/remotion-lambda.ts）からも読みたいため。`constants.mjs` は
// SITE_NAME のために `remotion` 本体を import しており、それをSSTのesbuildバンドルに
// 巻き込みたくない。値はここが唯一の定義で、`constants.mjs` は再エクスポートしている。

// Remotionの推奨は 3009（3008MBを超えると2vCPU目がフルに付く境界）だが、このAWSアカウントは
// Lambdaのメモリ上限が既定の3008MBに制限されていて、3009だと deployFunction() が
// ValidationException: 'MemorySize' ... must have value less than or equal to 3008 で落ちる。
// 上限緩和はAWSサポート/クォータ引き上げ待ちなので、それまでは上限ぴったりの3008で運用する。
export const RAM = 3008;
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
