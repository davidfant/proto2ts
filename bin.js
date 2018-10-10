#!/usr/bin/env node

const fs = require('fs');
const { Proto2TS } = require('./index');

// 1. get command line args
// first 2 items are node path and executable path
const [filePath, outputPath, namespaceName] = process.argv.slice(2);

if (!filePath || !outputPath) {
	throw new Error('No file path provided. Run like "proto2ts $PATH_TO_PROTO $OUTPUT_PATH ($NAMESPACE_NAME)"');
}

// 2. read the input file from disk
const protoString = fs.readFileSync(filePath, 'utf8');

// 3. convert to ts
const tsString = Proto2TS.convert(protoString, namespaceName);

// 4. write output file
fs.writeFileSync(outputPath, tsString);
