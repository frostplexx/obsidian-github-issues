import {App, MarkdownView, Notice} from "obsidian";
import { OctoBundle} from "../main";
import {insertIssues} from "./IssueCreator";


export function updateIssues(app: App, octobundle: OctoBundle) {
	const repo = getRepoInFile(app);
	const view = app.workspace.getActiveViewOfType(MarkdownView)

	if(repo && view){
		const editor = view.editor;
		const url = "https://github.com/" + name + "/" + repo + ".git";

		//delete the lines between the start and end line
		editor.replaceRange("", {line: repo.start_line, ch: 0}, {line: repo.end_line + 2, ch: 0});

		//set the cursor to the start line
		editor.setCursor({line: repo.start_line, ch: 0});

		//insert the issues
		insertIssues(app, octobundle, url, octobundle.plugin_settings.issue_appearance).then(r => {
			console.log("done");
			new Notice("Updated issues");
		})

	} else {
		new Notice("No active view");
	}

}

export function getRepoInFile(app: App) {
	//get the current editor
	const view = app.workspace.getActiveViewOfType(MarkdownView)
	if (view) {
		const editor = view.editor;
		//detect the start and end of the issues where <!-- GITHUB_ISSUES_START [user/repo]--> and <!-- GITHUB_ISSUES_STOP --> are. user/repo are always different

		//get the start line where <!-- GITHUB_ISSUES_START [user/repo]--> is
		//loop trough the document and print every line
		let start_line = 0;
		let end_line = 0;
		for (let i = 0; i < editor.lineCount(); i++) {
			const line = editor.getLine(i);
			if (line.includes("<!-- GITHUB_ISSUES_START")) {
				start_line = i;
			}
			if (line.includes("<!-- GITHUB_ISSUES_STOP")) {
				end_line = i;
			}
		}
		//print the start and end line
		console.log(start_line);
		console.log(end_line);

		//parse the name and the repo from the start line
		const start_line_text = editor.getLine(start_line);
		const start_line_text_splitted = start_line_text.split(" ");
		const name_and_repo = start_line_text_splitted[2];
		const name_and_repo_splitted = name_and_repo.split("/");
		const name = name_and_repo_splitted[0].replace("[", "");
		const repo = name_and_repo_splitted[1].replace("]-->", "");
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
