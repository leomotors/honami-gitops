# Honami GitOps

When no GitOps solution fits you, so you create your own GitOps solution.

## How it works

- A Repository containing lots of docker compose files.
- Renovate regularly checks for updates and creates PRs. Webhook in this app can also manually trigger that.
- When pull request is merged, webhook will notify this app to update all services.

![](https://media1.tenor.com/m/Upn2HOkE4-8AAAAC/proseka-project-sekai.gif)
