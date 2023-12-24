import chalk from "chalk";

export const log = {
  normal: (message: string) =>
    console.log(`[${new Date().toLocaleString("th-TH")}] ${message}`),
  info: (message: string) => log.normal(chalk.magenta(message)),
  error: (message: string) => log.normal(chalk.red(message)),
};
