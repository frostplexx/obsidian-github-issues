import {RepoItem} from "../API/ApiHandler";

/**
 * Issue class
 */
export class Issue {
	number: number;
	title: string;
	description: string;
	author: string | undefined;
	created_at: string;
    repo: RepoItem | undefined;

	constructor(title: string, description: string, author: string, number: number, created_at: string, repo?: RepoItem) {
		this.title = title;
		this.description = description;
		this.author = author;
		this.number = number;
		this.created_at = created_at;
        this.repo = repo;
	}
}

/**
 * Issue class for CSV
 */
export class CSVIssue extends Issue {
    constructor(csv: string, repo: RepoItem){
        super("", "", "", 0, "", repo);
        const split = csv.split(',');
        this.number = parseInt(split[0]);
        this.title = split[1];
        this.author = split[2];
        this.created_at = split[3];
    }
}
