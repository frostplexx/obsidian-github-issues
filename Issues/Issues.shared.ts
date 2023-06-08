import {MarkdownView} from "obsidian";
import {RepoItem} from "../API/ApiHandler";
import {Issue} from "./Issue";

/**
 * Paste the issues into the view
 * @param view
 * @param arg
 * @param issues
 */
export function pasteIssues(view: MarkdownView | null, arg: string | RepoItem, issues: Issue[]) {
	if (view) {
		const editor = view.editor;

		//insert text to detect where issues start
		editor.replaceSelection("```github-issues\n")
		editor.replaceSelection(parseArgToAuthorAndRepoName(arg) + "\n");
		//insert the issues as a new list
		for (const issue of issues) {
			editor.replaceSelection(`${issue.number},${issue.title},${issue.author},${issue.created_at}\n`);
		}

		//insert text to detect where issues stop
		editor.replaceSelection("```\n");
		return true;
	} else {
		return false;
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
