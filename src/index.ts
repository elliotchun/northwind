import staticPlugin from "@elysia/static";
import { Elysia } from "elysia";

const app = new Elysia()
  .use(staticPlugin({
    assets: 'src/client/',
    bunFullstack: true,
    prefix: '/',
  }))
  .listen(3000);


console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
