import { App, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import {
	api_authenticate,
	api_get_issues_by_id,
	api_get_own_issues,
	RepoItem,
} from "./API/ApiHandler";
import { IssuesModal } from "./Elements/Modals/IssuesModal";
import { Octokit } from "@octokit/core";
import { updateIssues } from "./Issues/IssueUpdater";
import { NewIssueModal } from "./Elements/Modals/NewIssueModal";
import {
	createCompactIssueElement,
	createDefaultIssueElement,
} from "./Elements/IssueItems";
import { Issue } from "./Issues/Issue";
import { errors } from "./Messages/Errors";
import { parseIssuesToEmbed } from "./Issues/Issues.shared";

//enum for the appearance of the issues when pasted into the editor
export enum IssueAppearance {
	DEFAULT = "default",
	COMPACT = "compact",
}

interface MyPluginSettings {
	username: string;
	password: string;
	issue_appearance: IssueAppearance;
	show_searchbar: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	username: "",
	password: "",
	issue_appearance: IssueAppearance.DEFAULT,
	show_searchbar: true,
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	octokit: Octokit = new Octokit({ auth: "" });

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new GithubIssuesSettings(this.app, this));

		if (this.settings.password == "" || this.settings.username == "") {
			new Notice(
				"Please enter your username and password in the settings.",
			);
		} else {
			try {
				this.octokit = (await api_authenticate(this.settings.password))
					? new Octokit({ auth: this.settings.password })
					: new Octokit({ auth: "" });
				if (!this.octokit) {
					new Notice(
						"Authentication failed. Please check your credentials.",
					);
				}
			} catch (e) {
				new Notice(
					"Authentication failed. Please check your credentials.",
				);
			}
		}

		//register markdown post processor
		this.registerMarkdownCodeBlockProcessor(
			"github-issues",
			async (source, el) => {
				const rows = source.split("\n").filter((row) => row.length > 0);
				const repoName = rows[0].split("/")[1].split("#")[0];
				const owner = rows[0].split("/")[0];

				//parse if the user only wants to embed a single/some issues or all of them
				const parsedIssues = parseIssuesToEmbed(rows[0]);
				const repo: RepoItem = {
					owner: owner,
					name: repoName,
					id: 0,
					language: "",
					updated_at: "",
				};

				if (this.settings.show_searchbar) {
					const searchfield = el.createEl("input");
					searchfield.setAttribute("type", "text");
					searchfield.setAttribute(
						"placeholder",
						"Search Titles, Labels,...",
					);
					searchfield.classList.add("issues-searchfield");

					searchfield.addEventListener("input", () => {
						//go through the children of "el" and hide all that don't match the search if the search is empty show all
						const search = searchfield.value.toLowerCase();
						el.childNodes.forEach((child) => {
							if (child instanceof HTMLElement) {
								if (
									child.innerText
										.toLowerCase()
										.includes(search)
								) {
									child.style.display = "flex";
								} else if (child !== searchfield) {
									child.style.display = "none";
								}
							}
						});
					});
				}

				let issues: Issue[] = [];
				if (parsedIssues.length != 0) {
					issues = await api_get_issues_by_id(
						this.octokit,
						repo,
						parsedIssues,
					);
				} else {
					issues = await api_get_own_issues(this.octokit, repo);
				}

				issues.forEach((issue) => {
					switch (this.settings.issue_appearance) {
						case IssueAppearance.DEFAULT:
							createDefaultIssueElement(
								el,
								issue,
								this.octokit,
								app,
							);
							break;
						case IssueAppearance.COMPACT:
							createCompactIssueElement(
								el,
								issue,
								this.octokit,
								app,
							);
							break;
					}
				});
			},
		);

		//add issues of repo command
		this.addCommand({
			id: "embed-issues",
			name: "Embed open Issues",
			callback: () => {
				if (this.octokit) {
					//check if repo already exists in file
					new IssuesModal(this.app, {
						octokit: this.octokit,
						plugin_settings: this.settings,
					} as OctoBundle).open();
				} else {
					new Notice(errors.noCreds);
				}
			},
		});

		this.addCommand({
			id: "update-issues",
			name: "Force-update Issues",
			callback: () => {
				if (this.octokit) {
					new Notice("Updating issues...");
					updateIssues(this.app, this.octokit);
				} else {
					new Notice(errors.noCreds);
				}
			},
		});

		this.addCommand({
			id: "new-issue",
			name: "Create new Issue",
			callback: () => {
				if (this.octokit) {
					new NewIssueModal(this.app, {
						octokit: this.octokit,
						plugin_settings: this.settings,
					} as OctoBundle).open();
				} else {
					new Notice(errors.noCreds);
				}
			},
		});
	}

	// onunload() {
	//
	// }

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class GithubIssuesSettings extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Github Authentication" });

		containerEl
			.createSpan({
				text: "To use this plugin, you need to create a personal access token. You can find a guide on how to do that in the ",
			})
			.createEl("a", {
				text: "README.",
				href: "https://github.com/Frostplexx/obsidian-github-issues#prerequisites",
			});

		// username
		new Setting(containerEl)
			.setName("Username")
			.setDesc("Your Github Username or Email")
			.addText((text) =>
				text
					.setPlaceholder("John Doe")
					.setValue(this.plugin.settings.username)
					.onChange(async (value) => {
						console.log("Username: " + value);
						this.plugin.settings.username = value;
						await this.plugin.saveSettings();
						this.plugin.octokit = (await api_authenticate(
							this.plugin.settings.password,
						))
							? new Octokit({
								auth: this.plugin.settings.password,
							})
							: new Octokit({});
						if (
							this.plugin.octokit &&
							this.plugin.settings.password
						) {
							new Notice("Successfully authenticated!");
						}
					}),
			);

		// password
		new Setting(containerEl)
			.setName("Personal Authentication Token")
			.setDesc("Personal Authentication Token")
			.addText((text) =>
				text
					.setPlaceholder("XXXXXXXXXXXXXXX")
					.setValue(this.plugin.settings.password)
					.onChange(async (value) => {
						console.log("Password: " + value);
						this.plugin.settings.password = value;
						await this.plugin.saveSettings();
						//trigger reauthentication
						this.plugin.octokit = (await api_authenticate(
							this.plugin.settings.password,
						))
							? new Octokit({
								auth: this.plugin.settings.password,
							})
							: new Octokit({});
						if (
							this.plugin.octokit &&
							this.plugin.settings.username
						) {
							new Notice("Successfully authenticated!");
						}
					}),
			);

		containerEl.createEl("h2", { text: "Appearance" });
		new Setting(containerEl)
			.setName("Issues Appearance")
			.setDesc("How should the issues be displayed?")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(IssueAppearance.DEFAULT, "Default")
					.addOption(IssueAppearance.COMPACT, "Compact")
					.setValue(this.plugin.settings.issue_appearance)
					.onChange(async (value: IssueAppearance) => {
						console.log("Appearance: " + value);
						this.plugin.settings.issue_appearance = value;
						await this.plugin.saveSettings();
						//TODO trigger a rerender of the issues
					}),
			);
		new Setting(containerEl)
			.setName("Show Searchbar")
			.setDesc("Show a searchbar above the issues in the embed.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.show_searchbar)
					.onChange(async (value) => {
						console.log("Show Searchbar: " + value);
						this.plugin.settings.show_searchbar = value;
						await this.plugin.saveSettings();
						//TODO trigger a rerender of the issues
					}),
			);
	}
}

export interface OctoBundle {
	octokit: Octokit;
	plugin_settings: MyPluginSettings;
}
