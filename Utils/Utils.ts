export function calculateHumanDate(dateString: string){
	const date = new Date(dateString);
	return date.toLocaleDateString(undefined );
}

export function parseRepoUrl(url: string): {owner: string, repo: string} {
	const split = url.split('/');
	return {
		owner: split[3],
		repo: split[4].replace(".git", "")
	}
}
