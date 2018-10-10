
const { Proto2TS } = require('./index');


// TODO(fant): should write more tests
const inputNamespaceName = 'NamespaceName';
const inputProtoString = `

message SomeMessage {
	int32 int_prop = 1;
	repeated string string_array_prop = 2;
	CustomType custom_type_prop = 3;
}

message CustomType {
	bool bool_prop = 1;
}

`;

const expectedOutputTypescriptString = `

export namespace NamespaceName {

	export interface SomeMessage {
		int_prop: number;
		string_array_prop: string[];
		custom_type_prop: CustomType;
	}

	export interface CustomType {
		bool_prop: boolean;
	}

}

`;

const outputTypescriptString = Proto2TS.convert(inputProtoString, inputNamespaceName);

if (outputTypescriptString !== expectedOutputTypescriptString) {
	console.log('----------');
	console.log(outputTypescriptString);
	console.log('----------');
	console.log(expectedOutputTypescriptString);
	console.log('----------');
	throw new Error('Strings not matching');
}

