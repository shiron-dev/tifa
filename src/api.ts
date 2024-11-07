import type { Octokit } from "@octokit/core";

import "dotenv/config";

export async function markAllRenovateMergedNotificationsAsDone(
  octokit: Octokit,
) {
  try {
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      // eslint-disable-next-line no-console
      console.log(`page: ${page}`);
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
        const limit = prResponse.headers["x-ratelimit-remaining"];

        if (prData.user.login === "renovate[bot]" && prData.merged) {
          await octokit.request(`DELETE /notifications/threads/${threadId}`);

          // eslint-disable-next-line no-console
          console.log(`done ${limit} ${prData.repo.full_name} : ${prData.title}`);
        }
        else {
          // eslint-disable-next-line no-console
          console.log(`${limit} ${prData.user.login} : ${prData.merged}`);
        }
      }

      page += 1;
    }
  }
  catch (error) {
    console.error("Error processing notifications:", error);
  }
}
