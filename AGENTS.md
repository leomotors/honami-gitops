# Honami GitOps

My custom GitOps solution

## Component: Server

Server is written in Elysia.js, see document here: https://elysiajs.com/llms.txt

Security: This server only expose /webhook endpoint to public internet.
It is set in Cloudflare Tunnel to only allow request to this endpoint.
In addition, onRequest hook will check IP as a redundant security measure.

This server write files to `docs/openapi.json` and `docs/openapi.yaml` for API documentation every time it is started in development mode. Please use this as reference for frontend.

## Component: Frontend (Coming Soon)

Frontend to be built static and served by Elysia.js server.

During development, it will run by command `bun run web:dev` and is served by Vite. Therefore having different origin from the server.

On production, it will be built to static files and served by Elysia.js server.
Therefore having same origin as the server.

### API Client

Please see `web/lib/apiClient.ts` for API client which use library `@elysiajs/eden` to interact with the server.

### UI

Located under folder `web/components`.
Build new ones or use existing ones.
