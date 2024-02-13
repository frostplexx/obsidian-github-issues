import { Octokit } from "@octokit/core";
import { Issue } from "../Issues/Issue";
import { parseRepoUrl } from "../Utils/Utils";
import { OctokitResponse } from "@octokit/types";
import { Notice } from "obsidian";


/**
 * Checks if the github api is reachable with the given token
 * @param token
 */
export async function api_authenticate(token: string, base_url: string): Promise<Octokit | null> {
	const octokit = new Octokit({
		auth: token,
		baseUrl: base_url
	});

	const res: OctokitResponse<never> = await octokit.request("GET /octocat", {});
	console.log(res)
	if (res.status === 200) {
		return octokit;
	} else {
		return null;
	}
}

/**
 * Returns all the repos of a user specified by the username
 * @param octokit
 */
export async function api_get_repos(octokit: Octokit) {
	const res = await octokit.request('GET /user/repos', {
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})
	console.log(res.data);
	//return an array of the repo names and ids
	return res.data.map((repo) => {
		return {
			id: repo.id,
			name: repo.name,
			language: repo.language,
			updated_at: repo.updated_at,
			owner: repo.owner.login
		} as RepoItem
	}
	);
}

/**
 * Returns all the labels of a repo as an array of strings with their names
 * @param octokit
 * @param repo
 */
export async function api_get_labels(octokit: Octokit, repo: RepoItem): Promise<any[]> {

	const res = await octokit.request('GET /repos/{owner}/{repo}/labels', {
		owner: repo.owner,
		repo: repo.name,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})

	if (res.status == 200) {
		return res.data.map((label) => {
			return {
				name: label.name,
				color: label.color
			};
		})
	} else {
		return [];
	}
}

/**
 * Submit an issue to a repo
 * @param octokit
 * @param repo
 * @param issue
 * @returns true if the issue was submitted successfully
 */
export async function api_submit_issue(octokit: Octokit, repo: RepoItem, issue: SubmittableIssue) {
	const res = await octokit.request('POST /repos/{owner}/{repo}/issues', {
		owner: repo.owner,
		repo: repo.name,
		title: issue.title,
		body: issue.description,
		assignees: [
			repo.owner
		],
		labels: issue.labels,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})

	return res.status == 201;
}

/**
 * Returns all the issues of a repo as an array of Issue objects of a repo specified by the url
 * @param octokit
 * @param url
 */
export async function api_get_issues_by_url(octokit: Octokit, url: string): Promise<Issue[]> {

	const { owner, repo } = parseRepoUrl(url);
	const issues: Issue[] = [];
	try {
		const res = await octokit.request('GET /repos/{owner}/{repo}/issues', {
			owner: owner,
			repo: repo,
			headers: {
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})

		if (res.status == 200) {
			for (const issue of res.data) {
				issues.push(new Issue(
					issue.title,
					issue.body ?? "",
					issue.user?.login ?? "",
					issue.number,
					issue.created_at,
					issue.labels.map((label: any) => {
						return {
							name: label.name,
							color: label.color
						} as Label ?? [];
					})));
			}

			return issues;
		} else {
			return [];
		}

	} catch (e) {
		new Notice("Error while fetching issues: " + e.message);
		return [];
	}


}

/**
 * Returns all the issues of a repo as an array of Issue objects
 * @param octokit
 * @param repo
 */
export async function api_get_own_issues(octokit: Octokit, repo: RepoItem): Promise<Issue[]> {
	const issues: Issue[] = [];
	const res = await octokit.request('GET /repos/{owner}/{repo}/issues', {
		owner: repo.owner,
		repo: repo.name,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})

	if (res.status == 200) {
		for (const issue of res.data) {
			issues.push(new Issue(
				issue.title,
				issue.body ?? "",
				issue.user?.login ?? "",
				issue.number,
				issue.created_at,
				issue.labels.map((label: any) => {
					return {
						name: label.name,
						color: label.color
					} as Label ?? [];
				}),
				repo
			));
		}

		return issues;
	} else {
		return [];
	}
}

export async function api_get_issues_by_id(octokit: Octokit, repo: RepoItem, issueIDs: number[]): Promise<Issue[]> {
	const iss = await api_get_own_issues(octokit, repo);
	//filter the issues to only include the specified ones
	return iss.filter(issue => issueIDs.includes(issue.number));
}

export async function api_get_issue_details(octokit: Octokit, issue: Issue) {
	if (issue.repo == null) return;

	const res = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
		owner: issue.repo?.owner,
		repo: issue.repo?.name,
		issue_number: issue.number,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})

	if (res.status == 200) {
		return {
			title: res.data.title,
			body: res.data.body,
			labels: res.data.labels.map((label: any) => {
				return {
					name: label.name ?? "",
					color: label.color ?? ""
				}
			}),
			state: res.data.state,
			updated_at: res.data.updated_at,
			assignee: {
				avatar_url: res.data.assignee?.avatar_url,
				login: res.data.assignee?.login
			} as Assignee,
			comments: res.data.comments
		} as RepoDetails;
	} else {
		return null;
	}
}

export async function api_comment_on_issue(octokit: Octokit, issue: Issue, comment: string) {
	if (issue.repo == null) return;
	const res = await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
		owner: issue.repo?.owner,
		repo: issue.repo?.name,
		issue_number: issue.number,
		body: comment,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})

	return res.status == 201;
}

/**
 * Updates an issue
 * @param octokit
 * @param issue
 * @param toBeUpdated
 */
export async function api_update_issue(octokit: Octokit, issue: Issue, toBeUpdated: any) {
	if (issue.repo == null) return;

	const options = {
		owner: issue.repo?.owner,
		repo: issue.repo?.name,
		issue_number: issue.number,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	}

	//append the toBeUpdated object to the options object
	Object.assign(options, toBeUpdated);

	const res = await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', options)
	return res.status == 200;
}

export async function api_get_issue_comments(octokit: Octokit, issue: Issue) {
	if (issue.repo == null) return;
	const res = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
		owner: issue.repo?.owner,
		repo: issue.repo?.name,
		issue_number: issue.number,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})

	if (res.status == 200) {
		//return the comments array as RepoComment[]
		return res.data.map((comment) => {
			return {
				body: comment.body,
				login: comment.user?.login || "",
				avatar_url: comment.user?.avatar_url || "",
				created_at: comment.created_at,
				update_at: comment.updated_at,
				author_association: comment.author_association
			} as RepoComment;
		})
	} else {
		return [];
	}
}


export interface RepoComment {
	body: string;
	login: string;
	avatar_url: string;
	created_at: string;
	update_at: string;
	author_association: string;

}

export interface RepoItem {
	id: number;
	name: string;
	language: string;
	updated_at: string;
	owner: string;
}

export interface RepoDetails {
	title: string;
	body: string;
	labels: Label[];
	state: string;
	updated_at: string;
	assignee: Assignee;
	comments: number;
}

export interface Label {
	name: string;
	color: string;
}

export interface Assignee {
	avatar_url: string;
	login: string;

}

export interface SubmittableIssue {
	title: string;
	description: string;
	labels: string[];
}
