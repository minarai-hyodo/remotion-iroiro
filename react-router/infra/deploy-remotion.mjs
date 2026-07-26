import { deployFunction, getOrCreateBucket, deploySite } from "@remotion/lambda";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RAM, DISK, TIMEOUT, REGION, SITE_NAME } from "../app/remotion/constants.mjs";

// Run by infra/remotion-lambda.ts (via a Pulumi `command.local.Command`) as a plain `node`
// subprocess, so this file — and the @remotion/lambda/@remotion/bundler dependency tree it
// pulls in — never has to go through SST's own esbuild bundling of sst.config.ts (which fails
// on @remotion/bundler's native compositor/rspack binaries). Only JSON on the final stdout line
// is meaningful; everything else is diagnostic output on stderr.

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

if (!process.env.AWS_ACCESS_KEY_ID && !process.env.REMOTION_AWS_ACCESS_KEY_ID) {
  throw new Error(
    "REMOTION_AWS_ACCESS_KEY_ID (or AWS_ACCESS_KEY_ID) is not set. Follow the Remotion Lambda setup guide and add credentials before running `sst deploy`.",
  );
}
if (!process.env.AWS_SECRET_ACCESS_KEY && !process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
  throw new Error(
    "REMOTION_AWS_SECRET_ACCESS_KEY (or AWS_SECRET_ACCESS_KEY) is not set. Follow the Remotion Lambda setup guide and add credentials before running `sst deploy`.",
  );
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

process.stdout.write(JSON.stringify({ functionName, bucketName, serveUrl }));
