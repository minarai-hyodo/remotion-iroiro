import { getAwsClient } from "@remotion/lambda/client";
import {
  CONCURRENCY_HEADROOM,
  REGION,
  REMOTION_MAX_DEFAULT_CONCURRENCY,
  RENDER_CONCURRENCY_FALLBACK,
} from "~/remotion/constants.mjs";

/**
 * レンダリングに使う並列数を、AWSアカウントのLambda同時実行数の上限から決める。
 *
 * Remotionの既定（尺に応じて75〜150並列）は、同時実行数が新規アカウント既定の10しかない
 * アカウントでは即 "AWS Concurrency limit reached" になる。かといって定数で絞ってしまうと、
 * クォータを引き上げたときに絞ったままなのを忘れて遅いレンダリングを続けることになる。
 * ので、その都度アカウントに聞く。上限が上がれば**再デプロイなしで**そのぶん速くなる。
 *
 * @returns 明示的に指定する並列数。`undefined` は「Remotionの既定に任せる」の意味。
 */
export const resolveRenderConcurrency = async (): Promise<number | undefined> => {
  let limit: number | undefined;

  try {
    // `@remotion/lambda/client` 越しに取るのは、認証情報の解決をRemotionと同じ経路に
    // 揃えるため（と、SDKを別途依存に足さないため）。同時実行数はリージョンごとの値なので、
    // Webサーバー自身のリージョン（ap-northeast-1）ではなくレンダー関数のリージョンを見る。
    const { client, sdk } = getAwsClient({ region: REGION, service: "lambda" });
    const { AccountLimit } = await client.send(new sdk.GetAccountSettingsCommand({}));

    // 予約済み同時実行数を差し引いた実際に使える数。無ければアカウント全体の上限で代用する。
    limit = AccountLimit?.UnreservedConcurrentExecutions ?? AccountLimit?.ConcurrentExecutions;
  } catch (err) {
    // ここで落とすとレンダリング自体ができなくなる。安全側（＝小さい方）に倒して続行する。
    // 呼べていない事実はログに残す。
    console.warn(
      "Could not read the account's Lambda concurrency limit, falling back to " +
        `${RENDER_CONCURRENCY_FALLBACK}:`,
      err,
    );
    return RENDER_CONCURRENCY_FALLBACK;
  }

  if (!limit) {
    console.warn(
      `GetAccountSettings returned no concurrency limit, falling back to ${RENDER_CONCURRENCY_FALLBACK}.`,
    );
    return RENDER_CONCURRENCY_FALLBACK;
  }

  // main関数1個と、進捗ポーリングのstatus呼び出しのぶんを空けておく（CONCURRENCY_HEADROOM）。
  const usable = limit - CONCURRENCY_HEADROOM;

  // 上限に余裕があるなら、尺に応じて並列数を決めるRemotionの既定の方が賢い。
  if (usable >= REMOTION_MAX_DEFAULT_CONCURRENCY) {
    return undefined;
  }

  return Math.max(1, usable);
};
