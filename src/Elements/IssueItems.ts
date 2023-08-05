import {Issue} from "../Issues/Issue";
import {getPasteableTimeDelta} from "../Utils/Utils";
import {IssuesDetailsModal} from "./Modals/IssuesDetailsModal";
import {App} from "obsidian";
import {Octokit} from "@octokit/core";
import {getTextColor} from "../Utils/Color.utils";

/*
 * Creates a default issue element
 * @param el - the element to append the issue to
 * @param issue - the issue to append
 * @param reponame - the name of the repo the issue is in
 */
export function createDefaultIssueElement(el: HTMLElement, issue: Issue, ocotokit: Octokit, app: App){


	const container = el.createDiv({cls: "issue-container"});
	container.style.cursor = "pointer";
	container.style.padding = "0";
	container.style.margin = "0";
	container.style.marginBottom = "5px";
	container.style.marginTop = "7px";
	container.style.boxShadow = "var(--embed-block-shadow-hover)";
	container.style.borderRadius = "var(--radius-s)";
	container.style.width = "80%";
	container.style.overflow = "hidden";
	container.style.textOverflow = "ellipsis";
	container.style.whiteSpace = "nowrap";

	const title = container.createEl("h5", {text: issue.title});
	title.style.margin = "0";
	title.style.display = "flex";
	title.style.flexDirection = "row";
	title.style.alignItems = "center";
	title.style.marginLeft = "7px";
	title.style.marginTop = "7px";
	title.style.padding = "0";
	title.style.textOverflow = "ellipsis";
	title.style.whiteSpace = "nowrap";
	title.style.overflow = "hidden";


	const details = container.createDiv({cls: "issue-details"});
	details.style.padding = "0";
	details.style.margin = "0";
	details.style.display = "flex";
	details.style.flexDirection = "row";
	details.style.alignItems = "top"
	const detailsText = details.createEl("span", {text: `#${issue.number} opened ${getPasteableTimeDelta(issue.created_at)} by ${issue.author}`});
	detailsText.style.margin = "0";
	detailsText.style.fontSize = "14px";
	detailsText.style.marginLeft = "7px";
	detailsText.style.marginBottom = "7px";
	detailsText.style.padding = "0";
	detailsText.style.opacity = "0.7"

	issue.labels.forEach(label => {
		const labelEl = title.createDiv({cls: "label"});
		labelEl.style.backgroundColor = `#${label.color}`;
		labelEl.style.color = getTextColor(label.color);
		labelEl.style.padding = "2px";
		labelEl.style.margin = "2px";
		labelEl.style.borderRadius = "var(--radius-s)";
		labelEl.style.fontSize = "10px";
		labelEl.style.opacity = "0.8";
		labelEl.innerText = label.name;
	})

	container.addEventListener("mouseenter", () => {
		container.style.opacity = "0.7";
	});

	container.addEventListener("mouseleave", () => {
		container.style.opacity = "1";
	});

	container.addEventListener("click", () => {
		container.style.opacity = "0.5";
		new IssuesDetailsModal(app, issue, ocotokit).open();
	});

}




export function createCompactIssueElement(el: HTMLElement, issue: Issue, ocotokit: Octokit, app: App){

	const container = el.createDiv({cls: "issue-container"});
	container.style.cursor = "pointer";
	container.style.padding = "0";
	container.style.margin = "0";
	container.style.marginBottom = "5px";
	container.style.marginTop = "5px";
	container.style.boxShadow = "var(--embed-block-shadow-hover)";
	container.style.borderRadius = "var(--radius-s)";
	container.style.width = "80%";
	container.style.overflow = "hidden";
	container.style.textOverflow = "ellipsis";
	container.style.whiteSpace = "nowrap";
	container.style.fontSize = "1.1em";

	const text = container.createSpan({text:
		`#${issue.number} • ${issue.title} `
	});
	text.style.margin = "0";
	text.style.marginLeft = "5px";
	text.style.padding = "0";
	text.style.textOverflow = "ellipsis";
	text.style.whiteSpace = "nowrap";
	text.style.overflow = "hidden";

	const text2 = container.createSpan({text:
		`opened ${getPasteableTimeDelta(issue.created_at)} by ${issue.author}`
	});
	text2.style.opacity = "0.7";

	container.addEventListener("mouseenter", () => {
		container.style.opacity = "0.7";
	});

	container.addEventListener("mouseleave", () => {
		container.style.opacity = "1";
	});

	container.addEventListener("click", () => {
		container.style.opacity = "0.5";
		new IssuesDetailsModal(app, issue, ocotokit).open();
	});

}
