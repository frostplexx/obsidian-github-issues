import {App, Modal} from "obsidian";
import {Octokit} from "@octokit/core";
import {api_get_repos, RepoItem} from "../API/ApiHandler";
import {OcotoBundle} from "../main";
import {calculateHumanDate} from "../Utils/Utils";
import {insertIssues} from "../Issues/IssueCreator";

export class IssuesModal extends Modal {

	octobundle: OcotoBundle;
	constructor(app: App, octobundle: OcotoBundle) {
		super(app);
		this.octobundle = octobundle;
	}

	async onOpen() {

		const {contentEl} = this;

		//insert from url
		contentEl.createEl('h2', {text: 'Insert from URL'});
		const urlInput = this.contentEl.createEl('input');
		urlInput.setAttribute('type', 'text');
		urlInput.setAttribute('placeholder', 'https://github.com/Frostplexx/obsidian-github-issues.git');
		urlInput.style.width = '100%';
		urlInput.style.padding = '5px';
		urlInput.style.marginBottom = '10px';

		const urlButton = this.contentEl.createEl('button', {text: 'Insert'});
		urlButton.style.width = '100%';
		urlButton.style.padding = '5px';
		urlButton.style.marginBottom = '10px';
		urlButton.addEventListener('click', () => {
			insertIssues(this.app, this.octobundle, urlInput.value, this.octobundle.plugin_settings.issue_appearance);
			this.close();
		});

		//title "Select a repo"
		contentEl.createEl('h2', {text: 'Your Repositories'});

		//loading indicator for repos
		const loadingEl = contentEl.createEl('h4', {text: 'Loading...'});
		loadingEl.style.textAlign = 'center';
		loadingEl.style.paddingTop = '50px';


		api_get_repos(this.octobundle.octokit, this.octobundle.plugin_settings.username).then((repos) => {
			loadingEl.remove();
			//create a list of clickable repo names
			const listEl = contentEl.createEl('ul');
			listEl.addClass('nav');
			listEl.addClass('nav-list');
			listEl.style.listStyle = "none";
			listEl.style.padding = "0";
			listEl.style.overflow = "auto";
			listEl.style.height = "300px";

			//remove the * from the list and add more padding

			for (const repo of repos) {
				const itemEl = repoItem(repo);
				itemEl.addEventListener('click', () => {
					insertIssues(this.app, this.octobundle, repo, this.octobundle.plugin_settings.issue_appearance);
					this.close();
				});
				listEl.appendChild(itemEl);
			}
		});

	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

}

// repo list item
const repoItem = (repo: RepoItem) => {
	const opacity = '0.7';
	const itemEl = document.createElement('li');

	itemEl.addClass('nav-item');
	itemEl.addClass('nav-link');
	itemEl.style.paddingTop = '15px';
	itemEl.style.paddingRight = '15px';
	itemEl.style.overflow = 'hidden';
	itemEl.style.textOverflow = 'ellipsis';
	itemEl.style.whiteSpace = 'nowrap';
	itemEl.style.cursor = 'pointer';

	const containter = document.createElement('div');
	containter.style.display = 'flex';
	containter.style.flexDirection = 'column';
	containter.style.justifyContent = 'center';
	containter.style.border = '1px solid #838284';
	containter.style.padding = '5px';
	containter.style.borderRadius = '5px';
	containter.style.opacity = opacity;
	itemEl.appendChild(containter);

	const itemTitle = document.createElement('span');
	itemTitle.style.fontSize = '1.1em';
	itemTitle.style.opacity = opacity;
	itemTitle.innerText = repo.name;
	containter.appendChild(itemTitle);

	const itemSubtitle = document.createElement('span');
	itemSubtitle.style.fontSize = '0.8em';
	itemSubtitle.style.opacity = opacity;
	itemSubtitle.style.paddingTop = '2px';
	itemSubtitle.innerText = `${repo.language} • Updated on ${calculateHumanDate(repo.updated_at)}`

	containter.appendChild(itemSubtitle);

	itemEl.addEventListener('mouseenter', () => {
		itemTitle.style.opacity = '1';
		containter.style.opacity = '1';
	});

	itemEl.addEventListener('mouseleave', () => {
		itemTitle.style.opacity = opacity;
		containter.style.opacity = opacity;
	});

	return itemEl;
}

