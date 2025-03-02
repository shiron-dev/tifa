import process from "node:process";
import { Octokit } from "@octokit/rest";

import { markAllRenovateMergedNotificationsAsDone, searchOldReviewRequestedPullRequests } from "./api";

import { sendDiscordWebhook } from "./discord";
import "dotenv/config";

async function main() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  await markAllRenovateMergedNotificationsAsDone(octokit);

  const hours = Number(process.env.REVIEW_REQUESTED_HOURS);
  const prs = await searchOldReviewRequestedPullRequests(octokit, hours) || [];

  for (const pr of prs) {
    if (process.env.DISCORD_WEBHOOK_URL) {
      sendDiscordWebhook(`[${pr.title}](${pr.url})`, process.env.DISCORD_WEBHOOK_URL);
    }
  }
}

main();
