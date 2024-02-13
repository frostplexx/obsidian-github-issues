import { Issue } from "../Issues/Issue";
import { getPasteableTimeDelta } from "../Utils/Utils";
import { IssuesDetailsModal } from "./Modals/IssuesDetailsModal";
import { App } from "obsidian";
import { Octokit } from "@octokit/core";
import { getTextColor } from "../Utils/Color.utils";

/*
 * Creates a default issue element
 * @param el - the element to append the issue to
 * @param issue - the issue to append
 * @param reponame - the name of the repo the issue is in
 */
export function createDefaultIssueElement(
	el: HTMLElement,
	issue: Issue,
	ocotokit: Octokit,
	app: App,
) {
	const container = el.createDiv({ cls: "issue-container" });

	const title = container.createEl("h5", { text: issue.title });
	title.classList.add("issue-title");

	const details = container.createDiv({ cls: "issue-details" });
	details.classList.add("issue-details");
	const detailsText = details.createEl("span", {
		text: `#${issue.number} opened ${getPasteableTimeDelta(
			issue.created_at,
		)} by ${issue.author}`,
	});
	detailsText.classList.add("issue-details-text");

	const labelContainer = title.createDiv({ cls: "label-container" });
	issue.labels.forEach((label) => {
		const labelEl = labelContainer.createDiv({ cls: "label" });
		labelEl.style.backgroundColor = `#${label.color}`;
		labelEl.style.color = getTextColor(label.color);
		labelEl.innerText = label.name;
		labelEl.classList.add("labelEl");
	});

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

export function createCompactIssueElement(
	el: HTMLElement,
	issue: Issue,
	ocotokit: Octokit,
	app: App,
) {
	const container = el.createDiv({ cls: "issue-container" });
	container.classList.add("compact");

	const text = container.createSpan({
		text: `#${issue.number} • ${issue.title} `,
	});
	text.classList.add("compact");

	const text2 = container.createSpan({
		text: `Opened ${getPasteableTimeDelta(issue.created_at)} by ${issue.author
			}`,
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
