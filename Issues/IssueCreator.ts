import {App, MarkdownView, Notice} from "obsidian";
import {IssueAppearance, OctoBundle} from "../main";
import {Issue} from "./Issue";
import {api_get_issues_by_url, api_get_own_issues, RepoItem} from "../API/ApiHandler";
import {pasteIssues} from "./Issues.shared";



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
	pasteIssues(view, arg, issues, issue_appearance);

}


