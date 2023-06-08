import {App, Modal, Notice} from "obsidian";
import {Issue} from "../../Issues/Issue";
import {Octokit} from "@octokit/core";
import {getPasteableTimeDelta} from "../../Utils/Utils";
import {loadingSpinner} from "../../Utils/Loader";
import {
	api_comment_on_issue,
	api_get_issue_comments,
	api_get_issue_details,
	api_submit_issue,
	api_update_issue
} from "../../API/ApiHandler";
import {updateIssues} from "../../Issues/IssueUpdater";

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
		const {contentEl} = this;
		const title = contentEl.createEl("h2", {text: this.issue.title + " • #" + this.issue.number});
		title.style.margin = "0";


		const authorAndSutff = contentEl.createSpan({
			text: `Created by ${this.issue.author} ${getPasteableTimeDelta(this.issue.created_at)}`
		});
		authorAndSutff.style.margin = "0";
		authorAndSutff.style.marginTop = "5px";
		authorAndSutff.style.padding = "0";
		authorAndSutff.style.opacity = "0.7";

		const spinner = loadingSpinner();
		contentEl.appendChild(spinner);

		//fetch the issue details
		const details = await api_get_issue_details(this.octokit, this.issue);
		spinner.remove();
		if (!details){
			contentEl.createEl("h3", {text: "Could not fetch issue details"});
			return;
		}

		const stateAndLabelsContainer = contentEl.createDiv();
		stateAndLabelsContainer.style.display = "flex";
		stateAndLabelsContainer.style.flexDirection = "row";
		stateAndLabelsContainer.style.alignItems = "start";
		stateAndLabelsContainer.style.justifyContent = "start";
		stateAndLabelsContainer.style.paddingTop = "10px";

		const statePill = stateAndLabelsContainer.createDiv();
		statePill.style.display = "flex";
		statePill.style.flexDirection = "row";
		statePill.style.alignItems = "center";
		statePill.style.justifyContent = "center";
		statePill.style.padding = "5px";
		statePill.style.borderRadius = "10px";
		statePill.style.marginRight = "5px";
		//make it green if state is open
		if (details?.state === "open"){
			statePill.style.backgroundColor = "rgba(31, 118, 41, 0.5)";
		} else {
			statePill.style.backgroundColor = "rgba(116, 58, 222, 0.5)";
		}


		const state = statePill.createEl("span", {text: details?.state});
		state.style.margin = "0";
		state.style.padding = "0";

		const lables = stateAndLabelsContainer.createDiv();
		lables.style.display = "flex";
		lables.style.flexDirection = "row";
		lables.style.alignItems = "start";
		lables.style.justifyContent = "start";
		lables.style.gap = "5px";
		lables.style.padding = "0";
		lables.style.opacity = "0.7";
		if(details?.labels.length > 0){
			//loop through the labels
			// eslint-disable-next-line no-unsafe-optional-chaining
			for (const label of details?.labels){
				const labelPill = lables.createDiv();
				labelPill.style.display = "flex";
				labelPill.style.flexDirection = "row";
				labelPill.style.alignItems = "center";
				labelPill.style.justifyContent = "center";
				labelPill.style.padding = "5px";
				labelPill.style.backgroundColor = "var(--interactive-accent)";
				labelPill.style.borderRadius = "10px";
				labelPill.style.margin = "0";

				const labelName = labelPill.createEl("span", {text: label});
				labelName.style.margin = "0";
			}
		}



		if (details.assignee.login != undefined){
			const assigneeContainer = contentEl.createDiv();
			assigneeContainer.style.display = "flex";
			assigneeContainer.style.flexDirection = "row";
			assigneeContainer.style.alignItems = "start";
			assigneeContainer.style.justifyContent = "start";
			assigneeContainer.style.paddingTop = "20px";


			//assignee icon
			const assigneeIcon = assigneeContainer.createEl("img");
			assigneeIcon.src = details?.assignee.avatar_url;
			assigneeIcon.style.width = "20px";
			assigneeIcon.style.height = "20px";
			assigneeIcon.style.borderRadius = "50%";
			assigneeIcon.style.margin = "0";
			assigneeIcon.style.marginTop = "5px";
			assigneeIcon.style.marginInlineEnd = "5px";
			assigneeIcon.style.padding = "0";

			//asignee login
			const asignee = assigneeContainer.createSpan({
				text: `Assigned to ${details?.assignee.login}`
			});
			asignee.style.margin = "0";
			asignee.style.marginTop = "5px"
		}

		const bodyContainer = contentEl.createDiv();
		bodyContainer.style.marginTop = "10px";
		bodyContainer.style.display = "flex";
		bodyContainer.style.flexDirection = "column";
		bodyContainer.style.alignItems = "start";
		bodyContainer.style.justifyContent = "start";
		bodyContainer.style.boxShadow = "var(--embed-block-shadow-hover)";
		bodyContainer.style.borderRadius = "var(--radius-s)";
		bodyContainer.style.padding = "10px";

		const containerTitle = bodyContainer.createEl("h3", {text: "Description"});
		containerTitle.style.margin = "0";
		containerTitle.style.padding = "0";
		containerTitle.style.fontSize = "1.2em"



		const body = bodyContainer.createDiv();
		body.style.margin = "0";
		body.style.marginTop = "5px";
		body.style.padding = "0";
		body.style.whiteSpace = "pre-wrap";
		body.innerText = details?.body;


		//load the comments
		const spinner2 = loadingSpinner();
		contentEl.appendChild(spinner2);
		const comments = await api_get_issue_comments(this.octokit, this.issue);
		spinner2.remove();
		if (!comments){
			contentEl.createEl("h3", {text: "Could not fetch comments"});
			return;
		}

		if(comments.length > 0){
			contentEl.createEl("h3", {text: "Comments"});
		}

		comments.forEach(comment => {
			const commentsContainer = contentEl.createDiv();
			commentsContainer.style.marginTop = "10px";
			commentsContainer.style.display = "flex";
			commentsContainer.style.flexDirection = "column";
			commentsContainer.style.alignItems = "start";
			commentsContainer.style.justifyContent = "start";
			commentsContainer.style.boxShadow = "var(--embed-block-shadow-hover)";
			commentsContainer.style.borderRadius = "var(--radius-s)";

			const authorContainer = commentsContainer.createDiv();
			authorContainer.style.display = "flex";
			authorContainer.style.flexDirection = "row";
			authorContainer.style.alignItems = "start";
			authorContainer.style.justifyContent = "start";
			authorContainer.style.paddingTop = "5px";
			authorContainer.style.paddingLeft = "5px";


			const authorIcon = authorContainer.createEl("img");
			authorIcon.src = comment?.avatar_url;
			authorIcon.style.width = "20px";
			authorIcon.style.height = "20px";
			authorIcon.style.marginRight = "5px";
			authorIcon.style.borderRadius = "50%";


			const authorName = authorContainer.createEl("span", {text: comment?.login});
			authorName.style.margin = "0";

			const commentBody = commentsContainer.createDiv();
			commentBody.style.margin = "0";
			commentBody.style.marginTop = "5px";
			commentBody.style.marginLeft = "10px";
			commentBody.style.padding = "0";
			commentBody.style.marginBottom = "5px"

			const commentText = commentBody.createEl("span", {text: comment?.body});
			commentText.style.margin = "0";
			commentText.style.padding = "0";
			commentText.style.fontSize = "1.05em";
			commentText.style.whiteSpace = "pre-wrap";


		});

		const commentsInput = contentEl.createEl("textarea");
		commentsInput.style.marginTop = "30px";
		commentsInput.style.width = "100%";
		commentsInput.style.height = "100px";
		commentsInput.style.maxWidth = "100%";
		commentsInput.style.minWidth = "100%";
		commentsInput.style.maxHeight = "200px";
		commentsInput.style.minHeight = "50px";
		commentsInput.style.borderRadius = "var(--radius-s)";
		//set the label
		const commentsInputLabel = contentEl.createEl("label", {text: "Write a comment"});
		commentsInputLabel.style.margin = "0";
		commentsInputLabel.htmlFor = commentsInput.id;


		const buttonsContainer = contentEl.createDiv();
		buttonsContainer.style.display = "flex";
		buttonsContainer.style.flexDirection = "row";
		buttonsContainer.style.alignItems = "center";
		buttonsContainer.style.justifyContent = "center";
		buttonsContainer.style.marginTop = "10px";

		const commentButton = buttonsContainer.createEl("button", {text: "Comment"});
		commentButton.style.margin = "0";
		commentButton.style.marginRight = "10px";
		commentButton.style.padding = "5px";
		commentButton.style.borderRadius = "var(--radius-s)";


		const closeButton = buttonsContainer.createEl("button", {text: "Close Issue"});
		closeButton.style.margin = "0";
		closeButton.style.padding = "5px";
		closeButton.style.borderRadius = "var(--radius-s)";

		commentButton.onclick = async () => {
			const updated = await api_comment_on_issue(this.octokit, this.issue, commentsInput.value);
			if(updated){
				new Notice("Comment posted");
				this.close();
			}
		}

		closeButton.onclick = async () => {
			const updated = await api_update_issue(this.octokit, this.issue, {
				state: "closed"
			});

			if(updated){
				this.close();
				new Notice("Issue closed");
				await updateIssues(this.app, this.octokit)
			} else {
				new Notice("Could not close issue");
			}
		}

	}
}
