import { Static, t } from "elysia";

export const ContainerStatusSchema = t.Union([
  t.Literal("Down"),
  t.Literal("Outdated"),
  t.Literal("Up"),
  t.Literal("Unhealthy"),
  t.Literal("Healthy"),
  t.Literal("Completed"),
]);

export type ContainerStatus = Static<typeof ContainerStatusSchema>;

export const OutdatedDetailType = t.Union([
  t.Literal("image"),
  t.Literal("environment"),
  t.Literal("labels"),
  t.Literal("volumes"),
  t.Literal("ports"),
]);

export type OutdatedDetailType = Static<typeof OutdatedDetailType>;

export const OutdatedDetailSchema = t.Object({
  type: OutdatedDetailType,
  message: t.String(),
});

export type OutdatedDetail = Static<typeof OutdatedDetailSchema>;

export const ContainerInfoSchema = t.Object({
  name: t.String(),
  image: t.String(),
  status: ContainerStatusSchema,
  outdatedDetails: t.Optional(t.Array(OutdatedDetailSchema)),
  ports: t.Array(
    t.Object({
      target: t.Number(),
      published: t.Optional(t.String()),
      hostIp: t.Optional(t.String()),
      protocol: t.Optional(t.String()),
    }),
  ),
  environment: t.Record(t.String(), t.Union([t.String(), t.Null()])),
  volumes: t.Array(
    t.Object({
      type: t.String(),
      source: t.Optional(t.String()),
      target: t.String(),
      read_only: t.Optional(t.Boolean()),
    }),
  ),
  labels: t.Record(t.String(), t.String()),
});

export type ContainerInfo = Static<typeof ContainerInfoSchema>;

export const ComposeInfoSchema = t.Object({
  path: t.String(),
  status: ContainerStatusSchema,
  containers: t.Array(ContainerInfoSchema),
});

export type ComposeInfo = Static<typeof ComposeInfoSchema>;

export const ComposeListResponseSchema = t.Object({
  composeFiles: t.Array(ComposeInfoSchema),
  metadata: t.Object({
    datetime: t.String(),
    timeTaken: t.Number(),
  }),
});
