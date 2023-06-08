import {MarkdownView} from "obsidian";
import {RepoItem} from "../API/ApiHandler";
import {Issue} from "./Issue";
import {IssueAppearance} from "../main";
import {calculateHumanDate} from "../Utils/Utils";

/**
 * Paste the issues into the view
 * @param view
 * @param arg
 * @param issues
 * @param issue_appearance
 */
export function pasteIssues(view: MarkdownView | null, arg: string | RepoItem, issues: Issue[], issue_appearance: IssueAppearance) {
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
