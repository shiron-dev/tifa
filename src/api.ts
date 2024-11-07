import type { Octokit } from "@octokit/core";
import process from "node:process";

import "dotenv/config";

export async function markAllRenovateMergedNotificationsAsDone(octokit: Octokit) {
  try {
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const { data: notifications } = await octokit.request(
        "GET /notifications",
        {
          all: false,
          page,
          per_page: 50,
        },
      );

      if (notifications.length === 0) {
        hasMorePages = false;
        break;
      }

      for (const notification of notifications) {
        const { subject, repository, id: threadId } = notification;

        if (subject.type !== "PullRequest")
          continue;

        const prNumber = subject.url.split("/").pop();
        const prResponse = await octokit.request(
          `GET /repos/${repository.full_name}/pulls/${prNumber}`,
        );
        const prData = prResponse.data;

        process.stdout.write(prData.user.login, prData.merged);
        if (prData.user.login === "renovate[bot]" && prData.merged) {
          await octokit.request(
            `DELETE /notifications/threads/${threadId}`,
          );
        }
      }

      page += 1;
    }
  }
  catch (error) {
    console.error("Error processing notifications:", error);
  }
}
