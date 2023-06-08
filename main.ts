import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import {api_authenticate, RepoItem} from "./API/ApiHandler";
import {IssuesModal} from "./Elements/Modals/IssuesModal";
import {Octokit} from "@octokit/core";
import {updateIssues} from "./Issues/IssueUpdater";
import {NewIssueModal} from "./Elements/Modals/NewIssueModal";
import {createCompactIssueElement, createDefaultIssueElement} from "./Elements/IssueItems";
import {CSVIssue, Issue} from "./Issues/Issue";

//enum for the appearance of the issues when pasted into the editor
export enum IssueAppearance {
	DEFAULT = "default",
	COMPACT = "compact"
}
interface MyPluginSettings {
	username: string;
	password: string
	issue_appearance: IssueAppearance;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	username: '',
	password: '',
	issue_appearance: IssueAppearance.DEFAULT
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();





		let octokit: Octokit | null = null

		try {
			octokit = await api_authenticate(this.settings.password);
			if (!octokit){
				new Notice("Authentication failed. Please check your credentials.")
				return;
			}
		} catch (e) {
			new Notice("Authentication failed. Please check your credentials.")
			return;
		}


		//register markdown post processor
		this.registerMarkdownCodeBlockProcessor("github-issues", (source, el, ctx ) => {
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

			rows.forEach((row, index) => {
				if(index === 0) return;
				const issue: Issue = new CSVIssue(row, repo);

				switch (this.settings.issue_appearance) {
					case IssueAppearance.DEFAULT:
						createDefaultIssueElement(el,issue, octokit!, app);
				break;
			case IssueAppearance.COMPACT:
				createCompactIssueElement(el, issue, octokit!, app);
				break;
			}
		});
	})

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');


		//add issues of repo command
		this.addCommand({
			id: 'embed-issues',
			name: 'Embed open Issues',
			callback: () => {
				new IssuesModal(this.app, {
					octokit: octokit,
					plugin_settings: this.settings
				} as OctoBundle).open();
			}
		});

		this.addCommand({
			id: 'update-issues',
			name: 'Update Issues',
			callback: () => {
				new Notice("Updating issues...")
				updateIssues(this.app, octokit!)
			}
		})

		this.addCommand({
			id: "new-issue",
			name: "Create new Issue",
			callback: () => {
				new NewIssueModal(this.app, {octokit: octokit!, plugin_settings: this.settings} as OctoBundle).open()
			}
		})

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new GithubIssuesSettings(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

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
				}));

		containerEl.createEl("h2",{text: "Appearance"});
		new Setting(containerEl)
			.setName("Issues Appearance")
			.setDesc("How should the issues be displayed?")
			.addDropdown(dropdown => dropdown
				.addOption(IssueAppearance.DEFAULT, "Default")
				.addOption(IssueAppearance.COMPACT, "Compact")
				.setValue("default")
				.onChange(async (value: IssueAppearance) => {
					console.log("Appearance: " + value)
					this.plugin.settings.issue_appearance = value;
					await this.plugin.saveSettings()


					//TODO trigger a rerender of the issues
				}));
	}
}


export interface OctoBundle {
	octokit: Octokit,
	plugin_settings: MyPluginSettings
}
