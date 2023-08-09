import {App, Modal} from "obsidian";
import {api_get_repos, RepoItem} from "../../API/ApiHandler";
import {OctoBundle} from "../../main";
import {calculateHumanDate} from "../../Utils/Utils";
import {loadingSpinner} from "../../Utils/Loader";
import {pasteRepoName} from "../../Issues/Issues.shared";

/*
* Modal for choosing and inserting issues
 */
export class IssuesModal extends Modal {

	octobundle: OctoBundle;
	constructor(app: App, octobundle: OctoBundle) {
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
		urlInput.classList.add("issues-url-input")

		const urlButton = this.contentEl.createEl('button', {text: 'Insert'});
		urlButton.classList.add("issues-url-button")
		urlButton.addEventListener('click', () => {
			pasteRepoName(this.app, urlInput.value)
			this.close();
		});

		//title "Select a repo"
		contentEl.createEl('h2', {text: 'Your Repositories'});

		//add search bar
		const searchInput = contentEl.createEl('input');
		searchInput.setAttribute('type', 'text');
		searchInput.setAttribute('placeholder', 'Search...');
		searchInput.classList.add("issues-search-input")
		searchInput.addEventListener('input', () => {
			const listEl = contentEl.querySelector('ul');
			if (listEl) {
				const items = listEl.querySelectorAll('li');
				// @ts-ignore
				for (const item of items) {
					if (item.textContent.toLowerCase().includes(searchInput.value.toLowerCase())) {
						item.style.display = 'block';
					} else {
						item.style.display = 'none';
					}
				}
			}
		});

		//loading indicator for repos
		const loadingEl = loadingSpinner();
		contentEl.appendChild(loadingEl);

		api_get_repos(this.octobundle.octokit).then((repos) => {
			loadingEl.remove();
			//create a list of clickable repo names
			const listEl = contentEl.createEl('ul');
			listEl.addClass('nav');
			listEl.addClass('nav-list');

			//remove the * from the list and add more padding

			for (const repo of repos) {
				const itemEl = repoItem(repo);
				itemEl.addEventListener('click', () => {
					pasteRepoName(this.app, repo)
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

	const containter = document.createElement('div');
	containter.classList.add("issues-modal-container")
	containter.style.opacity = opacity;
	itemEl.appendChild(containter);

	const itemTitle = document.createElement('span');
	itemTitle.classList.add("issues-modal-item-title")
	itemTitle.style.opacity = opacity;
	itemTitle.innerText = repo.name;
	containter.appendChild(itemTitle);

	const itemSubtitle = document.createElement('span');
	itemSubtitle.classList.add("issues-item-subtitle")
	itemSubtitle.style.opacity = opacity;
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

