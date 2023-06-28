import {App, Notice, Plugin, PluginSettingTab, setIcon, Setting} from 'obsidian';
import {api_authenticate, RepoItem} from "./API/ApiHandler";
import {IssuesModal} from "./Elements/Modals/IssuesModal";
import {Octokit} from "@octokit/core";
import {softUpdateIssues, updateIssues} from "./Issues/IssueUpdater";
import {NewIssueModal} from "./Elements/Modals/NewIssueModal";
import {createCompactIssueElement, createDefaultIssueElement} from "./Elements/IssueItems";
import {CSVIssue, Issue} from "./Issues/Issue";
// @ts-ignore
import {errors} from "./Messages/Errors";

//enum for the appearance of the issues when pasted into the editor
export enum IssueAppearance {
	DEFAULT = "default",
	COMPACT = "compact"
}

interface MyPluginSettings {
	username: string;
	password: string
	issue_appearance: IssueAppearance;
	show_searchbar: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	username: '',
	password: '',
	issue_appearance: IssueAppearance.DEFAULT,
	show_searchbar: true
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	octokit: Octokit = new Octokit({auth: ""});

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new GithubIssuesSettings(this.app, this));

		if (this.settings.password == "" || this.settings.username == "") {
			new Notice("Please enter your username and password in the settings.")
		} else {
			try {
				this.octokit = await api_authenticate(this.settings.password) ? new Octokit({auth: this.settings.password}) : new Octokit({auth: ""});
				if (!this.octokit) {
					new Notice("Authentication failed. Please check your credentials.")
				}
			} catch (e) {
				new Notice("Authentication failed. Please check your credentials.")
			}
		}


		//register markdown post processor
		this.registerMarkdownCodeBlockProcessor("github-issues", (source, el) => {

			//backgroundupdate the issues
			softUpdateIssues(this.app, this.octokit)

			const rows = source.split("\n").filter((row) => row.length > 0);
			const repoName = rows[0].split("/")[1]
			const owner = rows[0].split("/")[0]

			const repo: RepoItem = {
				owner: owner,
				name: repoName,
				id: 0,
				language: "",
				updated_at: "",
			}

			el.style.display = "flex";
			el.style.flexDirection = "column";
			el.style.alignItems = "center";
			el.style.justifyContent = "center";


			//add a refresh button
			const refreshButton = el.createEl("button")
			refreshButton.addEventListener("click", () => {
				softUpdateIssues(this.app, this.octokit)
			});
			setIcon(refreshButton, "sync")
			refreshButton.style.backgroundColor = "inherit";
			refreshButton.style.border = 'none'
			refreshButton.style.outline = 'none'
			refreshButton.style.boxShadow = 'none'
			refreshButton.style.padding = '10px'
			refreshButton.style.display = 'none'
			refreshButton.style.alignItems = 'center'
			refreshButton.style.justifyContent = 'center'
			refreshButton.style.margin = '0'
			refreshButton.style.cursor = "pointer"
			//force the button to be on the left
			refreshButton.style.position = "absolute"
			refreshButton.style.left = "3px"
			refreshButton.style.top = "3px"

			if(this.settings.show_searchbar) {
				const searchfield = el.createEl("input")
				searchfield.setAttribute("type", "text")
				searchfield.setAttribute("placeholder", "Search Titles, Labels,...")
				searchfield.style.backgroundColor = "inherit";
				searchfield.style.width = "80%"
				searchfield.style.marginTop = "10px"
				searchfield.style.height = "30px"
				searchfield.style.boxShadow = 'none'
				searchfield.style.padding = '10px'
				searchfield.style.alignItems = 'center'
				searchfield.style.justifyContent = 'center'

				searchfield.addEventListener("input", () => {
					//go through the children of "el" and hide all that don't match the search if the search is empty show all
					const search = searchfield.value.toLowerCase()
					el.childNodes.forEach((child) => {
						if (child instanceof HTMLElement) {
							if (child.innerText.toLowerCase().includes(search)) {
								child.style.display = "flex"
							} else if (child !== refreshButton && child !== searchfield) {
								child.style.display = "none"
							}
						}
					})
				});	searchfield.style.cursor = "pointer"
			}

			refreshButton.addEventListener("mouseenter", () => {
				refreshButton.style.background = "var(--background-modifier-hover)"
			});

			refreshButton.addEventListener("mouseleave", () => {
				refreshButton.style.background = "inherit"
			});

			//show the button when el is hovered
			el.addEventListener("mouseenter", () => {
				refreshButton.style.display = "flex"
			})
			el.addEventListener("mouseleave", () => {
				refreshButton.style.display = "none"
			})

			rows.forEach((row, index) => {
				if(index === 0) return;
				const issue: Issue = new CSVIssue(row, repo);

				switch (this.settings.issue_appearance) {
					case IssueAppearance.DEFAULT:
						createDefaultIssueElement(el,issue, this.octokit, app);
						break;
					case IssueAppearance.COMPACT:
						createCompactIssueElement(el, issue, this.octokit, app);
						break;
				}});

		})

		// // This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });
		// Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');


		//add issues of repo command
		this.addCommand({
			id: 'embed-issues',
			name: 'Embed open Issues',
			callback: () => {
				if (this.octokit){
					new IssuesModal(this.app, {
						octokit: this.octokit,
						plugin_settings: this.settings
					} as OctoBundle).open();
				} else {
					new Notice(errors.noCreds);
				}
			}
		});

		this.addCommand({
			id: 'update-issues',
			name: 'Force-update Issues',
			callback: () => {
				if(this.octokit){
					new Notice("Updating issues...")
					updateIssues(this.app, this.octokit)
				} else {
					new Notice(errors.noCreds);
				}
			}
		})

		this.addCommand({
			id: "new-issue",
			name: "Create new Issue",
			callback: () => {
				if(this.octokit){
					new NewIssueModal(this.app, {octokit: this.octokit, plugin_settings: this.settings} as OctoBundle).open()
				} else {
					new Notice(errors.noCreds);
				}
			}
		})


		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}
		//
		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });



		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}
//
// 	onOpen() {
// 		const {contentEl} = this;
// 		contentEl.setText('Woah!');
// 	}
//
// 	onClose() {
// 		const {contentEl} = this;
// 		contentEl.empty();
// 	}
// }
//
class GithubIssuesSettings extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Github Authentication'});

		containerEl.createSpan({
			text: "For authenticating you need to provide your Github Username and a Personal Authentication Token. You can create a new token "
		}).createEl('a', {
			text: "here.",
			href: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token"
		})

		// username
		new Setting(containerEl)
			.setName('Username')
			.setDesc('Your Github Username or Email')
			.addText(text => text
				.setPlaceholder('John Doe')
				.setValue(this.plugin.settings.username)
				.onChange(async (value) => {
					console.log('Username: ' + value);
					this.plugin.settings.username = value;
					await this.plugin.saveSettings();
					this.plugin.octokit = await api_authenticate(this.plugin.settings.password) ? new Octokit({auth: this.plugin.settings.password}) : new Octokit({});
					if (this.plugin.octokit && this.plugin.settings.password) {
						new Notice("Successfully authenticated!")
					}
				}));

		// password
		new Setting(containerEl)
			.setName("Personal Authentication Token")
			.setDesc("Personal Authentication Token")
			.addText(text => text
				.setPlaceholder("XXXXXXXXXXXXXXX")
				.setValue(this.plugin.settings.password)
				.onChange(async  (value) => {
					console.log("Password: " + value)
					this.plugin.settings.password = value;
					await this.plugin.saveSettings()
					//trigger reauthentication
					this.plugin.octokit = await api_authenticate(this.plugin.settings.password) ? new Octokit({auth: this.plugin.settings.password}) : new Octokit({});
					if (this.plugin.octokit && this.plugin.settings.username){
						new Notice("Successfully authenticated!")
					}
				}));

		containerEl.createEl("h2",{text: "Appearance"});
		new Setting(containerEl)
			.setName("Issues Appearance")
			.setDesc("How should the issues be displayed?")
			.addDropdown(dropdown => dropdown
				.addOption(IssueAppearance.DEFAULT, "Default")
				.addOption(IssueAppearance.COMPACT, "Compact")
				.setValue(this.plugin.settings.issue_appearance)
				.onChange(async (value: IssueAppearance) => {
					console.log("Appearance: " + value)
					this.plugin.settings.issue_appearance = value;
					await this.plugin.saveSettings()
					//TODO trigger a rerender of the issues
				}));
		new Setting(containerEl)
			.setName("Show Searchbar")
			.setDesc("Show a searchbar above the issues in the embed.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.show_searchbar)
				.onChange(async (value) => {
					console.log("Show Searchbar: " + value)
					this.plugin.settings.show_searchbar = value;
					await this.plugin.saveSettings()
					//TODO trigger a rerender of the issues

				}));
	}
}


export interface OctoBundle {
	octokit: Octokit,
	plugin_settings: MyPluginSettings
}
