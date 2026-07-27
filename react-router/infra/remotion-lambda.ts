/// <reference path="../.sst/platform/config.d.ts" />

// Runs @remotion/lambda's own deploy APIs (deployFunction/getOrCreateBucket/deploySite — see
// ./deploy-remotion.mjs) as part of `sst deploy`, so the Remotion Lambda render function + site
// get provisioned/updated automatically instead of requiring a manual `node deploy.mjs` run.
//
// deploy-remotion.mjs runs as a separate `node` subprocess (via a Pulumi local command) rather
// than being imported directly here, because @remotion/bundler (which deploySite uses) pulls in
// native compositor/rspack/lightningcss binaries that SST's esbuild bundling of sst.config.ts
// cannot resolve.

import * as command from "@pulumi/command";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { REGION, RENDER_FUNCTION_PREFIX } from "../app/remotion/lambda-config.mjs";

// Must match deploy-remotion.mjs. That script prints its result as one stdout line behind this
// prefix; everything else on stdout is @remotion/lambda's own diagnostics and gets ignored.
const OUTPUT_PREFIX = "REMOTION_DEPLOY_OUTPUT:";

function hashDirectory(dir: string): string {
  const hash = crypto.createHash("sha1");
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    hash.update(entry.name);
    hash.update(entry.isDirectory() ? hashDirectory(fullPath) : fs.readFileSync(fullPath));
  }
  return hash.digest("hex");
}

// The same value `constants.mjs` builds SITE_NAME from (`remotion`'s exported VERSION), read
// from disk so that sst.config.ts doesn't have to import the `remotion` package itself.
function installedRemotionVersion(): string {
  const pkg = path.join(process.cwd(), "node_modules/remotion/package.json");
  return (JSON.parse(fs.readFileSync(pkg, "utf-8")) as { version: string }).version;
}

export function deployRemotionLambda() {
  // Only re-run the (slow) Lambda function + site deploy when something it depends on actually
  // changed, not on every unrelated `sst deploy`. Note that the deploy script itself is part of
  // the trigger: without it, fixing a bug in deploy-remotion.mjs would leave the command marked
  // up-to-date and the fix would never actually run.
  const trigger = crypto
    .createHash("sha1")
    .update(hashDirectory(path.join(process.cwd(), "app/remotion")))
    .update(fs.readFileSync(path.join(process.cwd(), "infra/deploy-remotion.mjs")))
    // The installed Remotion version decides both the render function's name and SITE_NAME, so
    // after an upgrade both point at something that doesn't exist yet.
    .update(installedRemotionVersion())
    .digest("hex");

  const deploy = new command.local.Command("RemotionLambdaDeploy", {
    dir: process.cwd(),
    create: "node infra/deploy-remotion.mjs",
    triggers: [trigger],
  });

  // deploy-remotion.mjs prints its result as a single OUTPUT_PREFIX-prefixed stdout line, mixed
  // in with @remotion/lambda's own stdout diagnostics — so pick the last matching line rather
  // than parsing the whole stream. Going through stdout (instead of a tmpfile, as this used to)
  // keeps the values in Pulumi state, so they survive on a fresh runner where the command itself
  // is up-to-date and never re-runs.
  const outputs = deploy.stdout.apply((stdout) => {
    const line = stdout
      .split("\n")
      .reverse()
      .find((l) => l.trimStart().startsWith(OUTPUT_PREFIX));

    if (!line) {
      return { functionName: null, bucketName: null, serveUrl: null };
    }

    return JSON.parse(line.trimStart().slice(OUTPUT_PREFIX.length)) as {
      functionName: string | null;
      bucketName: string | null;
      serveUrl: string | null;
    };
  });

  return {
    functionName: outputs.apply((o) => o.functionName),
    bucketName: outputs.apply((o) => o.bucketName),
    serveUrl: outputs.apply((o) => o.serveUrl),
  };
}

// Webサーバー（sst.aws.React のサーバーLambda）がレンダーを依頼するには、レンダー関数を
// invokeする権限が要る。`renderMediaOnLambda()` も `getRenderProgress()` も、実体はどちらも
// レンダー関数のinvoke（進捗はS3を直接読まず、status呼び出しで取得している）なので、
// lambda:InvokeFunction だけで両方まかなえる。これが無いと Render video ボタンが
// "is not authorized to perform: lambda:InvokeFunction" で落ちる。
//
// リソースを関数名そのものではなく `remotion-render-*` の前方一致で指定しているのは、関数名に
// Remotionのバージョン・RAM・DISK・TIMEOUTが埋め込まれていて（speculateFunctionName() が
// 逆算しているのと同じ規則）、それらを変えるたびにポリシー側も追随させたくないため。
// アカウントIDは自アカウントに固定して、ワイルドカードの範囲を関数名だけに留めている。
export function remotionRenderPermissions() {
  const accountId = aws.getCallerIdentityOutput({}).accountId;

  return [
    {
      actions: ["lambda:InvokeFunction"],
      resources: [
        $interpolate`arn:aws:lambda:${REGION}:${accountId}:function:${RENDER_FUNCTION_PREFIX}*`,
      ],
    },
    {
      // 並列数をアカウントの同時実行数の上限から決めるため（app/lib/render-concurrency.server.ts）。
      // GetAccountSettings はアカウント単位の情報なので、リソースは "*" しか指定できない。
      actions: ["lambda:GetAccountSettings"],
      resources: ["*"],
    },
  ];
}
