export interface Question {
	explanation?: string;
	answers: string[];
	rightAnswerIndex: number;
	title: string;
	questionHash: string;
}
