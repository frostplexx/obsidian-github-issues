import { App } from "obsidian";

/** 
 * Re-renders the current view
 * @param app - the app to re-render
 * @returns void
 */
export function reRenderView(app: App) {
	const activeLeafObj = app.workspace.getLeaf();
	// @ts-ignore
	activeLeafObj.rebuildView();
}


/**
 * Parses the given date string into a human readable date
 * @param dateString
 */
export function calculateHumanDate(dateString: string) {
	const date = new Date(dateString);
	return date.toLocaleDateString(undefined);
}

/**
 * Parses a repo url into owner and repo
 * @param url
 */
export function parseRepoUrl(url: string): { owner: string, repo: string } {
	const split = url.split('/');
	return {
		owner: split[3],
		repo: split[4].replace(".git", "")
	}
}

/**
 * Verfiys that the given url is an actual valid url
 * @param url
 */
export function verifyURL(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch (_) {
		return false;
	}
}
/*
 * Parses the given date string into a human readable delta e.g. 1 day, 2 hours, 5 min ago or a human readable date if the date is older than 1 week
 */
export function getPasteableTimeDelta(dateString: string) {
	const date = new Date(dateString);
	const now = new Date();
	const delta = now.getTime() - date.getTime();
	const seconds = Math.floor(delta / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);
	if (weeks > 0) {
		return "on " + date.toLocaleDateString(undefined);
	} else if (days > 0) {
		return `${days} days ago`;
	} else if (hours > 0) {
		return `${hours} hours ago`;
	} else if (minutes > 0) {
		return `${minutes} minutes ago`;
	} else {
		return `${seconds} seconds ago`;
	}
}
