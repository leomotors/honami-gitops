# Honami GitOps

My custom GitOps solution

## Component: Server

Server is written in Elysia.js, see document here: https://elysiajs.com/llms.txt

Security: This server only expose /webhook endpoint to public internet.
It is set in Cloudflare Tunnel to only allow request to this endpoint.
In addition, onRequest hook will check IP as a redundant security measure.

## Component: Frontend (Coming Soon)

Frontend to be built static and served by Elysia.js server.
