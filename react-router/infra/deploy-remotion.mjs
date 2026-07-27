import { deployFunction, getOrCreateBucket, deploySite, getRolePolicy } from "@remotion/lambda";
import {
  CreateRoleCommand,
  IAMClient,
  PutRolePolicyCommand,
  UpdateAssumeRolePolicyCommand,
} from "@aws-sdk/client-iam";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { RAM, DISK, TIMEOUT, REGION, SITE_NAME } from "../app/remotion/constants.mjs";

// Run by infra/remotion-lambda.ts (via a Pulumi `command.local.Command`) as a plain `node`
// subprocess, so this file — and the @remotion/lambda/@remotion/bundler dependency tree it
// pulls in — never has to go through SST's own esbuild bundling of sst.config.ts (which fails
// on @remotion/bundler's native compositor/rspack binaries).
//
// The result goes back to remotion-lambda.ts on stdout, as a single line prefixed with
// OUTPUT_PREFIX. deployFunction/getOrCreateBucket/deploySite write their own diagnostics to
// stdout too, hence the prefix (the reader takes the last matching line and ignores the rest).
// Our own progress messages go to stderr to keep them out of the way.

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUTPUT_PREFIX = "REMOTION_DEPLOY_OUTPUT:";

// Credentials come from the AWS SDK's default provider chain — the very same chain `sst deploy`
// itself used to get this far, so if we're running at all, credentials exist.
// @remotion/lambda's getCredentials() returns undefined when no REMOTION_*/AWS_* variables are
// set, which is precisely what makes its SDK clients fall back to that chain (container role on
// CodeBuild / SST AutoDeploy, IMDS on EC2, SSO or a profile locally). What gets in the way is
// its checkCredentials(), which throws on a missing AWS_ACCESS_KEY_ID before the fallback ever
// runs — so opt out of that check. See https://www.remotion.dev/docs/lambda/authentication.
//
// Deliberately no "skip when credentials look missing" branch here: this used to bail out with
// exit 0 whenever AWS_PROFILE/AWS_ACCESS_KEY_ID were unset, which is exactly the case under SST
// AutoDeploy (CodeBuild hands credentials to the container via the ECS credentials endpoint, not
// via env vars). The deploy silently did nothing, `sst deploy` reported success, and the app
// shipped pointing at a Lambda function that had never been created — surfacing much later as
// "Function not found: ...remotion-render-..." when someone pressed Render video. A failure here
// must fail the deploy loudly instead.
process.env.REMOTION_SKIP_AWS_CREDENTIALS_CHECK ||= "1";

// The role the *render function itself* runs as (S3 read/write, invoking its own renderer
// children, CloudWatch logs). Remotion's setup guide has you create this by hand with the
// console or `npx remotion lambda policies role`; doing it here instead keeps a fresh AWS
// account one `sst deploy` away from working. deployFunction() defaults to exactly this role
// name, so no customRoleArn is needed.
//
// The policy document comes from Remotion's own getRolePolicy(), not a copy pasted into this
// repo — an upgrade that needs a new permission then just works instead of failing at render
// time with a permission error that looks like it comes from our code.
const ROLE_NAME = "remotion-lambda-role";
const TRUST_POLICY = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: { Service: "lambda.amazonaws.com" },
      Action: "sts:AssumeRole",
    },
  ],
});

console.error(`Ensuring IAM role "${ROLE_NAME}"...`);
const iam = new IAMClient({ region: REGION });
let roleWasCreated = false;
try {
  await iam.send(
    new CreateRoleCommand({
      RoleName: ROLE_NAME,
      AssumeRolePolicyDocument: TRUST_POLICY,
      Description: "Execution role for Remotion Lambda render functions (managed by this repo)",
    }),
  );
  roleWasCreated = true;
} catch (err) {
  if (err.name !== "EntityAlreadyExists") {
    throw err;
  }
  await iam.send(
    new UpdateAssumeRolePolicyCommand({ RoleName: ROLE_NAME, PolicyDocument: TRUST_POLICY }),
  );
}
// PutRolePolicy is an upsert, so this both creates the policy and re-syncs it on every deploy.
await iam.send(
  new PutRolePolicyCommand({
    RoleName: ROLE_NAME,
    PolicyName: "remotion-lambda-policy",
    PolicyDocument: getRolePolicy(),
  }),
);
console.error(`  ${ROLE_NAME} (${roleWasCreated ? "created" : "already existed"})`);

console.error(`Deploying Remotion Lambda function (region ${REGION})...`);
// A just-created role isn't immediately visible to Lambda's CreateFunction — IAM is eventually
// consistent, and it rejects the call with "The role defined for the function cannot be assumed
// by Lambda" until it has propagated. Only worth retrying on a fresh account, but that's exactly
// the run nobody is watching.
const { functionName, alreadyExisted } = await withRetryOnRolePropagation(() =>
  deployFunction({
    createCloudWatchLogGroup: true,
    memorySizeInMb: RAM,
    region: REGION,
    diskSizeInMb: DISK,
    timeoutInSeconds: TIMEOUT,
  }),
);
console.error(`  ${functionName} (${alreadyExisted ? "already existed" : "created"})`);

console.error("Ensuring Remotion Lambda bucket...");
const { bucketName } = await getOrCreateBucket({ region: REGION });
console.error(`  ${bucketName}`);

console.error(`Deploying Remotion site "${SITE_NAME}"...`);
const { serveUrl } = await deploySite({
  siteName: SITE_NAME,
  bucketName,
  entryPoint: path.join(projectRoot, "app/remotion/index.ts"),
  region: REGION,
});
console.error(`  ${serveUrl}`);

console.log(OUTPUT_PREFIX + JSON.stringify({ functionName, bucketName, serveUrl }));

// Hoisted, so it can sit out of the way of the deploy steps above.
async function withRetryOnRolePropagation(fn) {
  const ATTEMPTS = 8;
  const DELAY_MS = 5000;

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isPropagationDelay = String(err?.message).includes("cannot be assumed by Lambda");
      if (!isPropagationDelay || attempt >= ATTEMPTS) {
        throw err;
      }
      console.error(
        `  IAM role not propagated yet (attempt ${attempt}/${ATTEMPTS}), retrying in ${DELAY_MS / 1000}s...`,
      );
      await sleep(DELAY_MS);
    }
  }
}
