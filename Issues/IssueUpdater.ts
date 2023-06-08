import {App, MarkdownView, Notice} from "obsidian";
import {api_get_issues_by_url} from "../API/ApiHandler";
import {verifyURL} from "../Utils/Utils";
import {pasteIssues} from "./Issues.shared";
import {Octokit} from "@octokit/core";

/**
 * Fetches issues from the given url and updates them in the current editor
 * @param app
 * @param octokit
 */
export async function updateIssues(app: App, octokit: Octokit) {
	const repo = getRepoInFile(app);
	const view = app.workspace.getActiveViewOfType(MarkdownView)

	if (repo && view) {
		const editor = view.editor;
		const url = "https://github.com/" + repo.name + "/" + repo.repo + ".git";

		//verify the url
		if(!verifyURL(url)){
			new Notice("Error building url: " + url)
			return;
		}

		const issues = await fetchIssues(octokit, url);

		if (issues) {
			//delete the lines between the start and end line
			editor.replaceRange("", {line: repo.start_line, ch: 0}, {line: repo.end_line + 2, ch: 0});

			//set the cursor to the start line
			editor.setCursor({line: repo.start_line, ch: 0});

			//insert the issues
			const pasted = pasteIssues(view, url, issues);
			if (pasted){
				new Notice("Updated issues");
			} else {
				new Notice("Some error occurred while pasting the issues")
			}
		}
	} else {
		new Notice("No active view");
	}

}

/**
 * Fetches issues from the given url
 * @param octokit
 * @param url
 */
async function fetchIssues(octokit: Octokit, url: string) {
	const issues = await api_get_issues_by_url(octokit, url);
	if (issues.length === 0){
		return null;
	}
	return issues;
}

/**
 * Gets the repo name and repo from the current file
 * This is very hacky and should be replaced with a better solution
 * @param app
 */
export function getRepoInFile(app: App) {
	//get the current editor
	const view = app.workspace.getActiveViewOfType(MarkdownView)
	if (view) {
		const editor = view.editor;

		//loop trough the document and print every line
		let start_line = 0;
		let end_line = 0;
		for (let i = 0; i < editor.lineCount(); i++) {
			const line = editor.getLine(i);
			console.log(line);
			if (line.includes("```github-issues")) {
				start_line = i;
			}
			if (line.includes("```")) {
				end_line = i;
			}
		}
		//print the start and end line
		console.log(start_line);
		console.log(end_line);

		//parse the name and the repo from the start line
		const start_line_text = editor.getLine(start_line + 1);
		const name_and_repo_split = start_line_text.split("/");
		const name = name_and_repo_split[0];
		const repo = name_and_repo_split[1];
		console.log(name);
		console.log(repo);

		return {
			name: name,
			repo: repo,
			start_line: start_line,
			end_line: end_line
		} as FileRepo
	}
	return null;
}

interface FileRepo {
	name: string,
	repo: string,
	start_line: number,
	end_line: number
}
