import { App, Component, MarkdownRenderer, Modal, Notice } from "obsidian";
import { Issue } from "../../Issues/Issue";
import { Octokit } from "@octokit/core";
import { getPasteableTimeDelta, reRenderView } from "../../Utils/Utils";
import { loadingSpinner } from "../../Utils/Loader";
import {
	api_comment_on_issue,
	api_get_issue_comments,
	api_get_issue_details,
	api_update_issue
} from "../../API/ApiHandler";
import { updateIssues } from "../../Issues/IssueUpdater";
import { getTextColor } from "../../Utils/Color.utils";

/**
 * Modal for seeing the issue details
 */
export class IssuesDetailsModal extends Modal {
	issue: Issue;
	octokit: Octokit;
	constructor(app: App, issue: Issue, octokit: Octokit) {
		super(app);
		this.issue = issue;
		this.octokit = octokit;
	}

	async onOpen() {
		const { contentEl } = this;
		const title = contentEl.createEl("h2", { text: this.issue.title + " • #" + this.issue.number });
		title.style.margin = "0";

		const authorAndSutff = contentEl.createSpan({
			text: `Created by ${this.issue.author} ${getPasteableTimeDelta(this.issue.created_at)}`
		});
		authorAndSutff.classList.add("issues-auhtor")

		contentEl.createEl("br");
		const issueLink = contentEl.createEl("a", { text: "View on GitHub" });
		issueLink.setAttribute("href", "https://github.com/" + this.issue.repo?.owner + "/" + this.issue.repo?.name + "/issues/" + this.issue.number);
		issueLink.classList.add("issue-link")
		const spinner = loadingSpinner();
		contentEl.appendChild(spinner);

		//fetch the issue details
		const details = await api_get_issue_details(this.octokit, this.issue);
		spinner.remove();
		if (!details) {
			contentEl.createEl("h3", { text: "Could not fetch issue details" });
			return;
		}

		const stateAndLabelsContainer = contentEl.createDiv();
		stateAndLabelsContainer.classList.add("issues-state-and-label-container")

		const statePill = stateAndLabelsContainer.createDiv();
		statePill.classList.add("issues-state-pill")
		//make it green if state is open
		if (details?.state === "open") {
			statePill.style.backgroundColor = "rgba(31, 118, 41, 0.5)";
		} else {
			statePill.style.backgroundColor = "rgba(116, 58, 222, 0.5)";
		}


		const state = statePill.createEl("span", { text: details?.state });
		state.classList.add("issues-state")

		const labels = stateAndLabelsContainer.createDiv();
		labels.classList.add("issues-labels")
		if (details?.labels.length > 0) {
			//loop through the labels
			// eslint-disable-next-line no-unsafe-optional-chaining
			for (const label of details?.labels) {
				const labelPill = labels.createDiv();
				labelPill.classList.add("issues-label-pill")
				labelPill.style.background = "#" + label.color;

				const labelName = labelPill.createEl("span", { text: label.name });
				labelName.classList.add("issues-label-name")
				labelName.style.color = getTextColor(label.color);
			}
		}



		if (details.assignee.login != undefined) {
			const assigneeContainer = contentEl.createDiv();
			assigneeContainer.classList.add("issues-asignee-container")

			//assignee icon
			const assigneeIcon = assigneeContainer.createEl("img");
			assigneeIcon.classList.add("issues-assignee-icon")
			assigneeIcon.src = details?.assignee.avatar_url;

			//asignee login
			const assignee = assigneeContainer.createSpan({
				text: `Assigned to ${details?.assignee.login}`
			});
			assignee.classList.add("issues-assignee")
		}

		const bodyContainer = contentEl.createDiv();
		bodyContainer.classList.add("issues-body-container")

		const containerTitle = bodyContainer.createEl("h3", { text: "Description" });
		containerTitle.classList.add("issues-container-title")

		const body = bodyContainer.createDiv();
		body.classList.add("issues-body")

		MarkdownRenderer.renderMarkdown(details?.body, body, "", Component.prototype);

		//load the comments
		const spinner2 = loadingSpinner();
		contentEl.appendChild(spinner2);
		const comments = await api_get_issue_comments(this.octokit, this.issue);
		spinner2.remove();
		if (!comments) {
			contentEl.createEl("h3", { text: "Could not fetch comments" });
			return;
		}

		if (comments.length > 0) {
			contentEl.createEl("h3", { text: "Comments" });
		}

		comments.forEach(comment => {
			const commentsContainer = contentEl.createDiv();
			commentsContainer.classList.add("issues-comments-container")

			const authorContainer = commentsContainer.createDiv();
			authorContainer.classList.add("issues-author-container")

			const authorIcon = authorContainer.createEl("img");
			authorIcon.classList.add("issues-author-icon")
			authorIcon.src = comment?.avatar_url;

			const authorName = authorContainer.createEl("span", { text: comment?.login });
			authorName.classList.add("issues-author-name")

			const commentBody = commentsContainer.createDiv();
			commentBody.classList.add("issues-comment-body")

			const commentText = commentBody.createEl("span");
			MarkdownRenderer.renderMarkdown(comment?.body, commentText, "", Component.prototype);
			commentText.classList.add("issues-comment-text")

		});

		const commentsInput = contentEl.createEl("textarea");
		commentsInput.classList.add("issues-comments-input")
		//set the label
		const commentsInputLabel = contentEl.createEl("label", { text: "Write a comment" });
		commentsInputLabel.classList.add("issues-comments-input-label")
		commentsInputLabel.htmlFor = commentsInput.id;


		const buttonsContainer = contentEl.createDiv();
		buttonsContainer.classList.add("issues-buttons-container")

		const commentButton = buttonsContainer.createEl("button", { text: "Comment" });
		commentButton.classList.add("issues-comment-button")

		const closeButton = buttonsContainer.createEl("button", { text: "Close Issue" });
		closeButton.classList.add("issues-close-button")

		commentButton.onclick = async () => {
			const updated = await api_comment_on_issue(this.octokit, this.issue, commentsInput.value);
			if (updated) {
				new Notice("Comment posted");
				this.close();
			}
		}

		closeButton.onclick = async () => {
			const updated = await api_update_issue(this.octokit, this.issue, {
				state: "closed"
			});

			if (updated) {
				reRenderView(this.app);
				this.close();
				new Notice("Issue closed");
			} else {
				new Notice("Could not close issue");
			}
		}

	}
}
