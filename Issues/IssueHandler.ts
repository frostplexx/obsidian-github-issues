import {App, MarkdownView} from "obsidian";
import {OcotoBundle} from "../main";
import {Issue} from "./Issue";
import {api_get_issues_by_url, api_get_own_issues, RepoItem} from "../API/ApiHandler";


export async function insertIssues(app: App, octobundle: OcotoBundle, arg: string | RepoItem): Promise<void> {
	let issues: Issue[];
	if (typeof arg === 'string') {
		issues = await api_get_issues_by_url(octobundle.octokit, arg);
	} else {
		issues = await api_get_own_issues(octobundle.octokit, arg);
	}

	const view = app.workspace.getActiveViewOfType(MarkdownView)
	if (view) {
		const editor = view.editor;

		//insert the issues as a new list
		editor.replaceSelection('\n\n');
		for (const issue of issues) {
			editor.replaceSelection(`- #${issue.number} • "${issue.title}" by ${issue.author}\n`);
		}
	}

}

