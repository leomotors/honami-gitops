# Changelog

Version 1 is implemented without Docker. (Git Clone and systemctl service) which is quite painful to maintain.

There is no versioning before 2.0.0 so the changelog is not here.

## [2.7.0] - 2026-02-02

- fix: normalize Docker Compose escaped dollar signs (`$$` to `$`) in label comparison to prevent false outdated detection
- refactor: reorder metadata and composeFiles fields in response schema for better readability
- chore: delay renovate first run from 3 minutes to 15 minutes

## [2.6.0] - 2026-01-30

- feat: change ownership of changed files after git sync to prevent issues
- feat: endpoint to restart all outdated compose services

## [2.5.0] - 2026-01-26

- (preview) update compose endpoint to print more information

## [2.4.0] - 2025-12-30

- migrate image to bundle source code instead of compile to binary

## [2.3.0] - 2025-12-30

- fix: wrong path for webhooks

## [2.2.0] - 2025-12-27

- refactor code to by domain
- new compose module

## [2.1.0] - 2025-12-26

- docs: update docs for endpoints
- only allow webhooks part from external

## [2.0.4] - 2025-12-09

- refactor to docker image
- fastify -> elysia
