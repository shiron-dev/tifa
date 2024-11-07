import process from "node:process";
import { Octokit } from "@octokit/core";

import { markAllRenovateMergedNotificationsAsDone } from "./api";

async function main() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  await markAllRenovateMergedNotificationsAsDone(octokit);
}

export default main;
