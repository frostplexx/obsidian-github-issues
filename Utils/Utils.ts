/**
 * Parses the given date string into a human readable date
 * @param dateString
 */
export function calculateHumanDate(dateString: string){
	const date = new Date(dateString);
	return date.toLocaleDateString(undefined );
}

/**
 * Parses a repo url into owner and repo
 * @param url
 */
export function parseRepoUrl(url: string): {owner: string, repo: string} {
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
