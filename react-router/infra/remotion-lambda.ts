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
import * as os from "node:os";
import * as path from "node:path";
import { REGION, RENDER_FUNCTION_PREFIX } from "../app/remotion/lambda-config.mjs";

const OUTPUT_FILE = path.join(os.tmpdir(), "remotion-lambda-deploy-output.json");

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

export function deployRemotionLambda() {
  // Only re-run the (slow) Lambda function + site deploy when the composition source actually
  // changed, not on every unrelated `sst deploy`.
  const compositionHash = hashDirectory(path.join(process.cwd(), "app/remotion"));

  const deploy = new command.local.Command("RemotionLambdaDeploy", {
    dir: process.cwd(),
    create: "node infra/deploy-remotion.mjs",
    triggers: [compositionHash],
  });

  // deploy-remotion.mjs writes its result to OUTPUT_FILE rather than stdout, since
  // deployFunction/getOrCreateBucket/deploySite are free to write their own diagnostics to
  // stdout and we don't want that corrupting a hand-parsed result. `deploy.stdout` is only used
  // here to sequence this read after the command has finished — its value isn't parsed itself.
  const outputs = deploy.stdout.apply(
    () =>
      JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8")) as {
        functionName: string | null;
        bucketName: string | null;
        serveUrl: string | null;
      },
  );

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
export function remotionRenderInvokePermission() {
  const accountId = aws.getCallerIdentityOutput({}).accountId;

  return {
    actions: ["lambda:InvokeFunction"],
    resources: [
      $interpolate`arn:aws:lambda:${REGION}:${accountId}:function:${RENDER_FUNCTION_PREFIX}*`,
    ],
  };
}
