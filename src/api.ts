import type { Octokit } from "@octokit/rest";

export async function markAllRenovateMergedNotificationsAsDone(
  octokit: Octokit,
) {
  try {
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      // eslint-disable-next-line no-console
      console.log(`page: ${page}`);
      const { data: notifications } = await octokit.rest.activity.listNotificationsForAuthenticatedUser(
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
        const { subject, repository } = notification;
        const threadId = Number(notification.id);

        if (subject.type !== "PullRequest")
          continue;

        const prNumber = Number(subject.url.split("/").pop());
        if (!repository.owner.name) {
          // eslint-disable-next-line no-console
          console.log(`owner: ${repository.owner.name}`);
          continue;
        }

        const prResponse = await octokit.rest.pulls.get(
          {
            owner: repository.owner.name,
            repo: repository.name,
            pull_number: prNumber,
          },
        );
        const prData = prResponse.data;
        const limit = prResponse.headers["x-ratelimit-remaining"];

        if (prData.user.login === "renovate[bot]" && prData.merged) {
          await octokit.rest.activity.markThreadAsDone({
            thread_id: threadId,
          });

          // eslint-disable-next-line no-console
          console.log(`done ${limit} ${repository.full_name} : ${prData.title}`);
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
