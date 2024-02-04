/* eslint-disable no-undef */
module.exports = {
  platform: "github",
  onboardingConfig: {
    extends: ["config:recommended"],
  },
  hostRules: [
    {
      matchHost: "ghcr.io",
      username: "leomotors-bot",
      password: process.env.RENOVATE_TOKEN,
    },
  ],
  packageRules: [
    {
      packagePatterns: ["local/*"],
      enabled: false,
    },
  ],
};
