import process from "node:process";
import { Octokit } from "@octokit/rest";

import { markAllRenovateMergedNotificationsAsDone } from "./api";

import "dotenv/config";

async function main() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  await markAllRenovateMergedNotificationsAsDone(octokit);
}

main();
