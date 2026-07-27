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
    const { deployRemotionLambda, remotionRenderPermissions } = await import(
      "./infra/remotion-lambda"
    );
    const remotionLambda = deployRemotionLambda();

    new sst.aws.React("RemotionIroiroWeb", {
      // サーバー側の render / progress アクションがRemotionのレンダー関数を叩けるようにする。
      permissions: remotionRenderPermissions(),
    });

    return {
      remotionFunctionName: remotionLambda.functionName,
      remotionBucketName: remotionLambda.bucketName,
      remotionServeUrl: remotionLambda.serveUrl,
    };
  },
});
