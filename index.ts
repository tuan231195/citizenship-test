import Bottleneck from 'bottleneck';
import { crawl, getAnswer } from './crawl';
import path from 'path';
import { renderToFile } from './render';
import flatten from 'lodash.flatten';
import uniqBy from 'lodash.uniqby';

const questionBottleneck = new Bottleneck({
	maxConcurrent: 2,
	minTime: 500, // 2 questions per second
});

const tests = [
	...Array.from({ length: 20 }).map((_, index) => `/free-test/${index + 1}`),
	...Array.from({ length: 10 }).map(
		(_, index) => `/new-practice-tests/${index + 1}`
	),
];
async function main() {
	const crawlResults = await Promise.all(
		tests.map(async (test) => {
			const questions = await questionBottleneck.schedule(() =>
				crawl(test)
			);
			console.log(`Done getting ${test}`);
			return questions;
		})
	);
	const questions = uniqBy(flatten(crawlResults), 'questionHash');
	const outputFile = path.resolve(__dirname, 'out.html');
	await renderToFile(questions, outputFile);
}

main();
