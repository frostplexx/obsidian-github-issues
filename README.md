# Obsidian GitHub Issues
Obsidian GitHub Issues is a plugin for the Obsidian note-taking app that enables users to seamlessly integrate GitHub issues into their notes. With this plugin, you can embed existing GitHub issues into your Obsidian notes and create new issues or edit existing ones directly from within Obsidian.

## Features
- **Issue Embedding:** Embed existing GitHub issues into your Obsidian notes. This allows you to reference and view relevant issues alongside your notes.
- **Create New Issues:** Easily create new GitHub issues without leaving the Obsidian app. This feature streamlines your workflow by eliminating the need to switch between applications.
- **Edit Existing Issues:** Edit and update existing GitHub issues directly from within Obsidian. You can read comments, write them yourself and even close the Issue without having to navigate to GitHub
- **Bidirectional Sync:** Changes made to embedded issues in Obsidian are automatically synchronized with the corresponding GitHub issues, ensuring seamless collaboration between your Obsidian notes and GitHub repositories.
- **Rich Preview:** View a comprehensive preview of the embedded issues, including their status, comments, assignees, labels, and other relevant details. This feature helps you quickly gain context and stay informed about the progress of your issues.

## Installation

### Prerequisites
Before installing the Obsidian GitHub Issues plugin, you need to generate a Personal Access Token (PAT) for your GitHub account. This token is used to authenticate your Obsidian app with GitHub and enable the plugin to access your GitHub repositories. To generate a PAT, follow these steps:

- Navigate to your GitHub account settings.
- Click on the "Developer Settings" tab.
- Select "Personal Access Tokens" from the sidebar.
- Click on the "Generate New Token (classic)" button.
- Give it a name and an expiration date.
- The token needs the following permissions:
  - If you want to use the plugin with public and private repositories, you need to select the following permissions: 
    - repo (Full control of private repositories)
  - If you only want to use the plugin with public repositories, you need to select the following permissions:
    - public_repo (Access public repositories)
- Click on the "Generate Token" button.
- Copy the generated token and save it somewhere safe.
- **Note:** This token is only displayed once. If you lose it, you will have to generate a new one.

### Install from Obsidian

To install the Obsidian GitHub Issues plugin, follow these steps:

- Open Obsidian and navigate to the "Community Plugins" section in the settings.
- Ensure that you have enabled third-party plugins.
- Search for "Obsidian GitHub Issues" in the plugin marketplace.
- Click the "Install" button next to the plugin name.
- Once the installation is complete, open the plugin settings and enter your GitHub Username and Personal Access Token

### Install from GitHub

To install the Obsidian GitHub Issues plugin from GitHub, follow these steps:

- Download the latest release of the plugin from the releases page (Its the file with the .zip ending).
- Extract the contents of the zip file into your Obsidian vault's plugins folder.
- Open the plugin settings and enter your GitHub Username and Personal Access Token
- Reload Obsidian to activate the plugin.
