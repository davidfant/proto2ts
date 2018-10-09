#!/usr/bin/env node
const fs = require('fs');

// first 2 items are node path and executable path
const [filePath, outputPath, namespaceName] = process.argv.slice(2);

if (!filePath || !outputPath) {
	throw new Error('No file path provided. Run like "proto2ts $PATH_TO_PROTO $OUTPUT_PATH ($NAMESPACE_NAME)"');
}

const proto = fs.readFileSync(filePath, 'utf8').replace(/(?:\r|\n|\t)/g, ' ');

// .*? 	? stops this from being greedy
const regex = /message (.*?) {(.*?)}/g
const messagesStr = proto.match(regex);

const messages = messagesStr.map((message) => {
	// createnew regex every time, otherwise it returns null after a while...
	const match = new RegExp(regex).exec(message);
	const [fullMatch, messageName, messageContent] = match;

	// divide the message's props by ";"
	const messagePropsStr = messageContent
		.split(';')
		.map((p) => p.trim())
		.filter((p) => !!p.length);

	const messageProps = messagePropsStr.map((prop) => {
		const isArray = (prop.indexOf('repeated') == 0);
		let match;

		// different regexes if the prop is repeated (aka array) or not
		if (isArray) { match = /repeated (.+?) (.+?)=(.*)/.exec(prop); } 
		else { match = /(.+?) (.+?)=(.*)/.exec(prop); }

		const [fullMatch, type, name, index] = match;

		return {
			isArray,
			type: type.trim(),
			name: name.trim(),
			index: Number(index.trim()),
		};
	});

	return {
		name: messageName,
		props: messageProps,
	};
});

const protoTypeToTypescriptType = (type) => {
	if (['float', 'int32'].includes(type)) return 'number';
	if (['string'].includes(type)) return 'string';
	return type;
}

const propToString = (prop, indent = '') => {
	let str = indent;
	str += prop.name;
	str += ': ';
	str += protoTypeToTypescriptType(prop.type);
	if (prop.isArray) str += '[]';
	str += ';';
	return str;
}

const messageToString = (message, indent = '') => [
	`export interface ${message.name} {`,
	...message.props.map((prop) => propToString(prop, '\t')),
	`}`
]
	.map((line) => `${indent}${line}`)
	.join('\n');

let string;
if (!!namespaceName) {
	string = [
		'',
		`export namespace ${namespaceName} {`,
		...messages.map((message) => messageToString(message, '\t')),
		`}`,
		'',
	].join('\n\n');
} else {
	string = messages.map((message) => messageToString(message)).join('\n\n');
}

fs.writeFileSync(outputPath, string);


