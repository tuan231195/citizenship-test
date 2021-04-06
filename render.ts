import { Question } from './types';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
	// @ts-ignore
	return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

export async function renderToFile(questions: Question[], fileName: string) {
	const templateContent = fs.readFileSync(
		path.resolve(__dirname, 'template.hbs'),
		{
			encoding: 'utf-8',
		}
	);
	const template = Handlebars.compile(templateContent);
	const output = template({ questions });
	fs.writeFileSync(fileName, output, {
		encoding: 'utf-8',
	});
}
