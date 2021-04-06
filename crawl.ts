import axios from 'axios';
import { Question } from './types';
import * as cheerio from 'cheerio';
import Bottleneck from 'bottleneck';
import * as querystring from 'querystring';
import md5 from 'md5';

const answerBottleneck = new Bottleneck({
	maxConcurrent: 10,
	minTime: 50, // 20 requests per second
});

const axiosInstance = axios.create({
	baseURL: 'https://www.aussiecitizenshiptest.com',
	transformResponse: (data, headers) => {
		const contentType = headers['content-type'];
		if (contentType && contentType.includes('text/html')) {
			return cheerio.load(data);
		}
		return data;
	},
});

export async function crawl(url: string): Promise<Question[]> {
	console.log(`Crawling link ${url}`);
	const { data } = await axiosInstance.get(url);
	const $ = data as cheerio.Root;
	return Promise.all(
		Array.from($('.questions .question')).map(async (questionNode) => {
			const questionElement = $(questionNode);
			const questionTitle = questionElement.find('> p').text().trim();
			const answerList = Array.from(
				questionElement.find('ul').children()
			).map((answerNode) => {
				return $(answerNode).text().trim();
			});
			const questionId = questionElement.find('input').val();
			const questionHash = md5(questionTitle);

			const explanation = questionElement
				.next('.in_correct')
				.children()
				.last()
				.text()
				.trim();

			const rightAnswerIndex = await answerBottleneck.schedule(() =>
				getAnswer(url.startsWith('/new'), questionId)
			);

			return {
				title: questionTitle,
				answers: answerList,
				explanation,
				rightAnswerIndex,
				questionHash,
			};
		})
	);
}

export async function getAnswer(isNew: boolean, questionId: string) {
	const formData = querystring.stringify({ qresult: `${questionId}_1` });
	const { data } = await axiosInstance.post(
		isNew ? '/new-practice-tests/ajaxtest.php' : '/ajaxtest.php',
		formData,
		{
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		}
	);
	const $ = data as cheerio.Root;
	const correctAnswer = $('.abold');
	return correctAnswer.index('li');
}
