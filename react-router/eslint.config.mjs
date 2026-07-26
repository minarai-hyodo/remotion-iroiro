import { makeConfig } from "@remotion/eslint-config-flat";

const conf = makeConfig({
  remotionDir: ["app/remotion/**"],
});

export default [
  {
    ignores: [".react-router", ".sst", "infra/deploy-remotion.mjs"],
  },
  ...conf,
];
