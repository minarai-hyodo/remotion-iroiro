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

// この関数はmain（全体の指揮 + 結合）としてもrenderer（chunk1個分の描画）としても動くので、
// タイムアウトは「動画全体を撮り切る時間」を賄えないといけない。RENDER_CONCURRENCY を絞った
// ぶん1つあたりの担当フレームが増えるため、240秒だとmainが先に落ちる（実測: 240秒で78%）。
// Lambdaの上限いっぱいの900秒にしてある。タイムアウトは上限であって課金は実使用ぶんなので、
// 余らせても損はしない。
export const TIMEOUT = 900;

// レンダリングの並列数は定数ではなく、AWSアカウントのLambda同時実行数の上限から
// その都度決めている（`app/lib/render-concurrency.server.ts`）。Remotionの既定は尺に応じて
// 75〜150並列で、同時実行数が新規アカウント既定の10しかないと即 "AWS Concurrency limit
// reached (Rate Exceeded)" になる。かといって定数で絞ると、クォータを引き上げたときに
// 絞ったままなのを忘れる。以下はその計算に使う値。
// @see https://www.remotion.dev/docs/lambda/troubleshooting/rate-limit

/**
 * 同時実行数の上限のうち、rendererに使わずに空けておく数。
 * 内訳は main 1個 + 進捗ポーリングのstatus呼び出し 1個 + 安全余裕 2個。
 */
export const CONCURRENCY_HEADROOM = 4;

/**
 * アカウントの同時実行数を取得できなかったときに使う並列数。上限10のアカウントで
 * フル尺のレンダリングが完走することを実測した値なので、安全側に倒した既定として使える。
 */
export const RENDER_CONCURRENCY_FALLBACK = 6;

/**
 * Remotionが既定で使う並列数の上限（尺に応じて75〜150に補間される、その上端）。
 * これだけ余裕があるなら、こちらで指定するより尺を見て決めるRemotionの既定の方が賢い。
 */
export const REMOTION_MAX_DEFAULT_CONCURRENCY = 150;

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
