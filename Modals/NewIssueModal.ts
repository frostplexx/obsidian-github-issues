import {App, Modal, Notice, setIcon} from "obsidian";
import {OctoBundle} from "../main";
import {getRepoInFile, updateIssues} from "../Issues/IssueUpdater";
import {api_get_labels, api_submit_issue, RepoItem, SubmittableIssue} from "../API/ApiHandler";

export class NewIssueModal extends Modal {
	ocotoBundle: OctoBundle;
	constructor(app: App, ocotoBundle: OctoBundle) {
		super(app);
		this.ocotoBundle = ocotoBundle;
	}

	async onOpen() {

		//get the repo name from the current file
		const repo: () => (RepoItem | null) = () => {
			const repo = getRepoInFile(this.app);
			if (!repo) return null;
			return {
				name: repo.repo,
				owner: repo.name,
			} as RepoItem;
		}

		if (repo()) {

			//get the labels
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const labels = await api_get_labels(this.ocotoBundle.octokit, repo()!);
			console.log(labels);


			const {contentEl} = this
			contentEl.createEl('h2', {text: 'New Issue'})
			//title input field
			const titleInput = contentEl.createEl('input')
			titleInput.setAttribute('type', 'text')
			titleInput.setAttribute('placeholder', 'Title')
			titleInput.style.width = '100%'
			titleInput.style.padding = '5px'
			titleInput.style.marginBottom = '10px'

			//description input field
			const descriptionInput = contentEl.createEl('textarea')
			descriptionInput.setAttribute('type', 'text')
			descriptionInput.setAttribute('placeholder', 'Description')
			descriptionInput.style.width = '100%'
			descriptionInput.style.maxWidth = '100%'
			descriptionInput.style.minWidth = '100%'
			descriptionInput.style.padding = '5px'
			descriptionInput.style.marginBottom = '10px'
			descriptionInput.style.height = '100px'
			descriptionInput.style.maxHeight = '500px'
			//display as markdown
			descriptionInput.style.fontFamily = 'monospace'
			descriptionInput.style.fontSize = '12px'

			//selected labels field
			const selectedLabels = contentEl.createEl('div');
			selectedLabels.style.display = 'flex'
			selectedLabels.style.flexWrap = 'wrap'




			//dropdown where you can select multiple labels
			const labelDropdown = contentEl.createEl('select')
			labelDropdown.style.width = '100%'
			labelDropdown.style.padding = '5px'
			labelDropdown.style.marginBottom = '10px'
			labelDropdown.style.height = '30px'
			labelDropdown.style.maxHeight = '30px'
			labelDropdown.style.maxWidth = '100%'
			labelDropdown.style.fontSize = '12px'
			labelDropdown.style.borderRadius = '5px'

			//add the labels to the dropdown
			labelDropdown.createEl('option', {
				value: 'Select Labels',
				text: 'Select Labels'
			})

			for (const label of labels) {
				const option = labelDropdown.createEl('option')
				option.setAttribute('value', label)
				option.text = label
			}

			let elements: string[] = []

			//add the selected label to the selected labels field
			labelDropdown.addEventListener('change', () => {
				const value = labelDropdown.value
				labelDropdown.value = 'Select Labels'
				const tag = selectedLabels.createEl('div');
				tag.style.display = 'flex'
				tag.style.alignItems = 'center'
				tag.style.justifyContent = 'center'
				tag.style.padding = '5px'
				tag.style.margin = '5px'
				tag.style.marginBottom = '10px'
				tag.style.borderRadius = '5px'
				tag.style.backgroundColor = 'var(--background-modifier-form-field)'
				//create button to remove the tag
				tag.createEl('span', {text: value})
				const removeButton = tag.createEl('button');
				removeButton.style.backgroundColor = "inherit";
				removeButton.style.border = 'none'
				removeButton.style.outline = 'none'
				removeButton.style.boxShadow = 'none'
				removeButton.style.padding = '0'
				removeButton.style.margin = '0'
				setIcon(removeButton, 'x')

				removeButton.onclick = () => {
					selectedLabels.removeChild(tag)
					elements = elements.filter(e => e !== value);
					labelDropdown.childNodes.forEach((node: ChildNode) => {
						if (node instanceof HTMLOptionElement) {
							if (node.value === value) {
								node.disabled = false
							}
						}
					})
				}
				removeButton.style.marginLeft = '5px'
				elements.push(value)
				labelDropdown.childNodes.forEach((node: ChildNode) => {
					if (node instanceof HTMLOptionElement) {
						if (node.value === value) {
							node.disabled = true
						}
					}
				})
			});



			//submit button
			const submitButton = contentEl.createEl('button', {text: 'Submit'})

			//submit the issue
			submitButton.addEventListener('click', async () => {

				const submitted = await api_submit_issue(this.ocotoBundle.octokit,repo()!, {
					labels: elements,
					title: titleInput.value,
					description: descriptionInput.value,
				} as SubmittableIssue)

				if (submitted) {
					new Notice('Submitted Issue')
					this.close()
					await new Promise(resolve => setTimeout(resolve, 1000));
					updateIssues(this.app, this.ocotoBundle)
				} else {
					new Notice('Failed to submit issue')
				}
			});


		} else {
			new Notice('You are not in a GitHub repo')
			this.close()
		}

	}
}

