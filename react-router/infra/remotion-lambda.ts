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
