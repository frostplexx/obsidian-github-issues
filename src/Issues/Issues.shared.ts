import { App, MarkdownView } from "obsidian";
import { RepoItem } from "../API/ApiHandler";

/**
 * Inserts author/repo combination into the active Markdown editor.
 * Only works with MarkdownView.
 *
 * @param {App} app - The Obsidian app object.
 * @param {string | RepoItem} arg - The GitHub repository name or author/repo combination.
 *
 * @returns {boolean} - Returns true if the repository name is successfully inserted, otherwise returns false.
 */
export function pasteRepoName(app: App, arg: string | RepoItem): boolean {
	const view = app.workspace.getActiveViewOfType(MarkdownView)
	if (view) {
		const editor = view.editor;

		//insert text to detect where issues start
		editor.replaceSelection("```github-issues\n")
		editor.replaceSelection(parseArgToAuthorAndRepoName(arg) + "\n");

		//insert text to detect where issues stop
		editor.replaceSelection("```\n");
		return true;
	} else {
		return false;
	}
}


function parseArgToAuthorAndRepoName(arg: string | RepoItem): string {
	if (typeof arg === 'string') {
		const url = new URL(arg);
		return `${url.pathname.substring(1)}`.replace(".git", "");
	} else {
		return `${arg.owner}/${arg.name}`;
	}
}

/**
 * Parses a string to extract issue numbers and returns them as an array of numbers.
 *
 * @param {string} string - The input string to parse.
 * @return {number[]} - An array containing extracted issue numbers.
 */
export function parseIssuesToEmbed(string: string): number[] {
	const regex = /#\d+([,-]\d+)*/g;
	const resultArray: number[] = [];
	const matchArray = string.match(regex);

	if (matchArray !== null) {
		for (const match of matchArray) {
			const issueNums = match.replace('#', '').split(',');

			for (const num of issueNums) {
				if (num.includes('-')) {
					const [start, end] = num.split('-').map(Number);
					for (let i = start; i <= end; i++) {
						if (!resultArray.includes(i)) {
							resultArray.push(i);
						}
					}
				} else {
					const issue = Number(num);
					if (!resultArray.includes(issue)) {
						resultArray.push(issue);
					}
				}
			}
		}
	}
	return resultArray;
}


