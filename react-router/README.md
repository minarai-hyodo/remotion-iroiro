# Remotion + React Router 7 Starter Kit

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

This is a [React Router 7 starter kit](https://reactrouter.com/home) with [Remotion](https://remotion.dev), [`@remotion/player`](https://remotion.dev/player) and [`@remotion/lambda`](https://remotion.dev/lambda) built in.  
It lets you render a video from a React Router app with AWS Lambda.

## Getting started

Install dependencies using

<!-- create-video will replace this with the package manager specific command -->

```
bun install
```

## Run the React Router app

Run the example app using:

```
bun run dev
```

## Edit the video

Start the Remotion Preview (the editor interface) using:

```
bun run remotion:studio
```

## Render videos with AWS Lambda

Follow these steps to set up video rendering:

1. Follow the steps in [Remotion Lambda setup guide](https://www.remotion.dev/docs/lambda/setup).
2. Rename the `.env.example` file to `.env`.
3. Fill in the `REMOTION_AWS_ACCESS_KEY_ID` and `REMOTION_AWS_SECRET_ACCESS_KEY` values that you got from the first step.
4. Run `sst deploy` (or `sst dev`). It provisions the Lambda render function and the Remotion site automatically as part of the deploy — see `infra/remotion-lambda.ts`. Re-run it whenever you've upgraded Remotion or changed the video template; it's safe to run repeatedly.

## Commands

Start the app in development mode:

```
bun run dev
```

Build the app for production:

```
bun run build
```

Start the app in production mode (after build is done):

```
bun run dev
```

Start the Remotion Studio:

```
bun run remotion:studio
```

Render the example video locally:

```
bunx remotion render
```

Upgrade all Remotion packages:

```
bunx remotion upgrade
```

Render the example video on AWS Lambda:

```
bun run remotion:renderlambda
```

Deploy/update the Remotion Lambda function and site (and the rest of the app):

```
bunx sst deploy
```

## Upgrading Remotion

When upgrading Remotion to a newer version, you will need to redeploy your function and update your site using the commands above.  
If your functions or sites are already used in production, make sure to not overwrite them - [read here](https://www.remotion.dev/docs/lambda/upgrading) for more details about upgrading.

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).  
See the [React Router Docs](https://reactrouter.com/) to read about the framework.

## Help

Join the [Remotion Discord server](https://remotion.dev/discord) to chat with other Remotion builders.

## Issues

Found an issue with Remotion? [File an issue here](https://remotion.dev/issue).

## License

Note that for some entities a Remotion company license is needed. Read [the terms here](https://remotion.dev/license).
