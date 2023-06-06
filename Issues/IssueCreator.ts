import {App, MarkdownView, Notice} from "obsidian";
import {IssueAppearance, OctoBundle} from "../main";
import {Issue} from "./Issue";
import {api_get_issues_by_url, api_get_own_issues, RepoItem} from "../API/ApiHandler";
import {calculateHumanDate} from "../Utils/Utils";

//insert issues into the active view
export async function insertIssues(app: App, octobundle: OctoBundle, arg: string | RepoItem, issue_appearance: IssueAppearance): Promise<void> {
	let issues: Issue[];
	if (typeof arg === 'string') {
		issues = await api_get_issues_by_url(octobundle.octokit, arg);
	} else {
		issues = await api_get_own_issues(octobundle.octokit, arg);
	}

	if (issues.length === 0){
		new Notice("No issues found")
		return;
	}

	const view = app.workspace.getActiveViewOfType(MarkdownView)
	if (view) {
		const editor = view.editor;

		//insert text to detect where issues start
		editor.replaceSelection(`<!-- GITHUB_ISSUES_START [${parseArgToAuthorAndRepoName(arg)}]-->\n`);

		//insert the issues as a new list
		for (const issue of issues) {
			const defaultAppearance = () => editor.replaceSelection(`- ##### [#${issue.number} • "${issue.title}"](https://github.com/${getOwnerNameFromArg(arg)}/${getReponameFromArg(arg)}/issues/${issue.number})\n\topened ${calculateHumanDate(issue.created_at)} by [${issue.author}](https://github.com/${issue.author})\n`);
			const compactAppearance = () => editor.replaceSelection(`- [#${issue.number} • "${issue.title}"](https://github.com/${getOwnerNameFromArg(arg)}/${getReponameFromArg(arg)}/issues/${issue.number})\n`);

			switch (issue_appearance) {
				case IssueAppearance.DEFAULT:
					defaultAppearance();
					break;
				case IssueAppearance.COMPACT:
					compactAppearance();
					break;
				default:
					defaultAppearance();
			}


		}

		//insert text to detect where issues stop
		editor.replaceSelection('\n<!-- GITHUB_ISSUES_STOP -->\n');
	}

}


function parseArgToAuthorAndRepoName(arg: string | RepoItem): string{
	if (typeof arg === 'string') {
		const url = new URL(arg);
		return `${url.pathname.substring(1)}`.replace(".git", "");
	} else {
		return `${arg.owner}/${arg.name}`;
	}
}


function getOwnerNameFromArg(arg: string | RepoItem): string {
	if (typeof arg === 'string') {
		const url = new URL(arg);
		return url.pathname.split('/')[1];
	} else {
		return arg.owner;
	}
}

function getReponameFromArg(arg: string | RepoItem): string{
	if (typeof arg === 'string') {
		const url = new URL(arg);
		return url.pathname.split('/')[2].replace(".git", "");
	} else {
		return arg.name;
	}
}
