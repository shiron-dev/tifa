import type { Octokit } from "@octokit/rest";

export async function markAllRenovateMergedNotificationsAsDone(
  octokit: Octokit,
) {
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
      if (!repository.owner.login) {
        console.error(`error owner: ${repository.owner.login}`);
        continue;
      }

      const prResponse = await octokit.rest.pulls.get(
        {
          owner: repository.owner.login,
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

function getPastDateByHours(hours: number): string {
  const pastDate = new Date();
  pastDate.setTime(pastDate.getTime() - hours * 60 * 60 * 1000); // 指定時間分、過去に遡る
  const year = pastDate.getFullYear();
  const month = String(pastDate.getMonth() + 1).padStart(2, "0");
  const day = String(pastDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface SearchIssuesAndPullRequest {
  title: string
  url: string
}

export async function searchOldReviewRequestedPullRequests(octokit: Octokit, hours: number): Promise<SearchIssuesAndPullRequest[] | undefined> {
  if (Number.isNaN(hours) || hours <= 0) {
    console.error("error: hours is invalid.");
    return;
  }

  const pastDate = getPastDateByHours(hours);
  const query = `is:open is:pr review-requested:@me archived:false review:none created:<${pastDate}`;

  try {
    const response = await octokit.rest.search.issuesAndPullRequests({
      q: query,
    });

    if (response.data.items.length > 0) {
      const ret: SearchIssuesAndPullRequest[] = [];

      response.data.items.forEach((item) => {
        if (item.pull_request) {
          ret.push({
            title: item.title,
            url: item.html_url,
          });
        }
      });

      return ret;
    }
  }
  catch (error: any) {
    console.error("error:", error.message);
    if (error.status === 403) {
      console.error("API rate limit exceeded.");
    }
  }
}
