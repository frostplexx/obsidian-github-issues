import { Octokit } from "@octokit/core";
import {Issue} from "../Issues/Issue";
import {IssuesModal} from "../Modals/IssuesModal";
import {parseRepoUrl} from "../Utils/Utils";
import {OctokitResponse} from "@octokit/types";


// authenticate
export async function api_authenticate(token: string): Promise<Octokit | null> {
	const octokit = new Octokit({
		auth: token
	});

	const res: OctokitResponse<any> = await octokit.request("GET /octocat", {});
	console.log(res)
	if (res.status === 200) {
		return octokit;
	} else {
		return null;
	}
}

export async function api_get_repos(octokit: Octokit, username: string) {
	const res = await octokit.request('GET /user/repos', {
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})
	console.log(res.data);
	//return an array of the repo names and ids
	return res.data.map((repo: any) => {
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

export async function api_get_issues_by_url(octokit: Octokit, url: string): Promise<Issue[]> {

	const {owner, repo} = parseRepoUrl(url);
	const issues: Issue[] = [];
	const res = await octokit.request('GET /repos/{owner}/{repo}/issues', {
		owner: owner,
		repo: repo,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})

	for (const issue of res.data) {
		issues.push({
			title: issue.title,
			number: issue.number,
			author: issue.user?.login,
			description: issue.body,
			created_at: issue.created_at,
		} as Issue);
	}

	return issues;
}

export async function api_get_own_issues(octokit: Octokit, repo: RepoItem): Promise<Issue[]> {
	const issues: Issue[] = [];
	const res = await octokit.request('GET /repos/{owner}/{repo}/issues', {
		owner: repo.owner,
		repo: repo.name,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})

	console.log(res.data);

	for (const issue of res.data) {
		issues.push({
			title: issue.title,
			number: issue.number,
			author: issue.user?.login,
			description: issue.body,
			created_at: issue.created_at,
		} as Issue);
	}
	return issues;
}

export interface RepoItem {
	id: number;
	name: string;
	language: string;
	updated_at: string;
	owner: string;
}
