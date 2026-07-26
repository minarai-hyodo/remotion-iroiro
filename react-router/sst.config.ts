/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "react-router",
      removal: input?.stage === "production" ? "retain" : "remove",
      // protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    new sst.aws.React("RemotionIroiroWeb");

    const { deployRemotionLambda } = await import("./infra/remotion-lambda");
    const remotionLambda = deployRemotionLambda();

    return {
      remotionFunctionName: remotionLambda.functionName,
      remotionBucketName: remotionLambda.bucketName,
      remotionServeUrl: remotionLambda.serveUrl,
    };
  },
});
