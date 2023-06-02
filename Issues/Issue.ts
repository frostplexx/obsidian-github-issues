export class Issue {
	number: number;
	title: string;
	description: string;
	author: string | undefined;
	created_at: string;

	constructor(title: string, description: string, author: string, number: number, created_at: string) {
		this.title = title;
		this.description = description;
		this.author = author;
		this.number = number;
		this.created_at = created_at;
	}

}
