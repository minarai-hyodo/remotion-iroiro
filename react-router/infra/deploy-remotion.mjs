import { deployFunction, getOrCreateBucket, deploySite } from "@remotion/lambda";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { RAM, DISK, TIMEOUT, REGION, SITE_NAME } from "../app/remotion/constants.mjs";

// Run by infra/remotion-lambda.ts (via a Pulumi `command.local.Command`) as a plain `node`
// subprocess, so this file — and the @remotion/lambda/@remotion/bundler dependency tree it
// pulls in — never has to go through SST's own esbuild bundling of sst.config.ts (which fails
// on @remotion/bundler's native compositor/rspack binaries). The result is written to
// OUTPUT_FILE rather than stdout, since deployFunction/getOrCreateBucket/deploySite are free to
// write their own diagnostics to stdout and we don't want that corrupting a hand-parsed result.

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUTPUT_FILE = path.join(os.tmpdir(), "remotion-lambda-deploy-output.json");

// @remotion/lambda resolves credentials itself, in order: REMOTION_AWS_PROFILE/AWS_PROFILE,
// REMOTION_AWS_ACCESS_KEY_ID/SECRET, then plain AWS_ACCESS_KEY_ID/SECRET (the same variables the
// AWS CLI/SDK use) — see https://www.remotion.dev/docs/lambda/authentication. So a
// Remotion-specific credential pair is optional. REMOTION_SKIP_AWS_CREDENTIALS_CHECK opts out of
// this check entirely for other auth methods (e.g. an EC2/IAM role). If none of these are
// configured, skip the Lambda deploy instead of failing the whole `sst deploy`.
const hasCredentials = Boolean(
  process.env.REMOTION_AWS_PROFILE ||
    process.env.AWS_PROFILE ||
    process.env.REMOTION_AWS_ACCESS_KEY_ID ||
    process.env.REMOTION_AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.REMOTION_SKIP_AWS_CREDENTIALS_CHECK,
);

if (!hasCredentials) {
  console.error(
    "No AWS credentials configured for Remotion Lambda (checked REMOTION_AWS_PROFILE/AWS_PROFILE, " +
      "REMOTION_AWS_ACCESS_KEY_ID/SECRET, AWS_ACCESS_KEY_ID/SECRET, and REMOTION_SKIP_AWS_CREDENTIALS_CHECK). " +
      "Skipping the Remotion Lambda + site deploy — see the Remotion Lambda setup guide. " +
      "The rest of `sst deploy` will continue.",
  );
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify({ functionName: null, bucketName: null, serveUrl: null }),
  );
  process.exit(0);
}

console.error("Deploying Remotion Lambda function...");
const { functionName } = await deployFunction({
  createCloudWatchLogGroup: true,
  memorySizeInMb: RAM,
  region: REGION,
  diskSizeInMb: DISK,
  timeoutInSeconds: TIMEOUT,
});

console.error("Ensuring Remotion Lambda bucket...");
const { bucketName } = await getOrCreateBucket({ region: REGION });

console.error("Deploying Remotion site...");
const { serveUrl } = await deploySite({
  siteName: SITE_NAME,
  bucketName,
  entryPoint: path.join(projectRoot, "app/remotion/index.ts"),
  region: REGION,
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ functionName, bucketName, serveUrl }));
