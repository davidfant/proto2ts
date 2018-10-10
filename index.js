
class Proto2TS {

	static convert(protoString, namespaceName = null) {
		// 1. replace line breaks since regex matching is easier without it.
		const trimmedProtoString = protoString.replace(/(?:\r|\n|\t)/g, ' ');


		// 2. match message blocks
		const messageBlocks = trimmedProtoString.match(this.messageRegex());

		// 3. parse message block strings to messages
		const messages = messageBlocks.map((msg) => this.parseMessage(msg));

		// 4. serialize messages
		// If we have a namespace, we want to later wrap everything in 
		// that name space, so we need another level of indentation
		const messageIndent = !!namespaceName ? '\t' : '';
		let serializedMessages = messages.map((msg) => this.serializeMessage(msg, messageIndent));

		// 4. if we have a namespace, wrap everything
		if (!!namespaceName) {
			serializedMessages = [
				``,
				`export namespace ${namespaceName} {`,
					...serializedMessages,
				`}`,
				``,
			];
		}

		return serializedMessages.join('\n\n');
	}

	/*
		Regex for finding:
		"message MessageName { ...MessageContent }"

		This is a function because this regex has to be created every
		time it is used. Otherwise the regex' state makes it return
		null for some strings that should match.
		TODO(fant): look into why that is happening

		"?" stops the groups from being greedy
	*/
	static messageRegex() { 
		return /message (.+?) {(.+?)}/g;
	}

	/*
		Parse a stringified proto message to our own message type

		INPUT STRING
		message MessageName { 
			string prop_name = 1;
			repeated int32 array_prop_name = 2;
		}

		OUTPUT TYPE
		interface Message {
			name: string;
			props: Prop[];
		}
	*/
	static parseMessage(messageString) {
		// 1. get the different string parts
		const match = this.messageRegex().exec(messageString);
		const [fullMatchedString, messageName, messageContent] = match;

		// 2. divide the message's props by ";"
		//		message MessageName { 
		//			string prop_name = 1;
		//			repeated int32 array_prop_name = 2;
		//		}
		const propsBlocks = messageContent
			.split(';')
			.map((block) => block.trim())
			.filter((block) => !!block.length);

		const props = propsBlocks.map((prop) => this.parseProp(prop));

		return {
			name: messageName,
			props,
		};
	}

	/*
		Parses a stringified proto message's prop to our own prop type.
		The input string is assumed to be trimmed

		// INPUT STRING
		(1) "string prop_name = 1"
		(2) "repeated int32 array_prop_name = 2"

		// OUTPUT
		interface Prop {
			isArray: boolean;
			type: string;
			name: string;
			index: number;	
		}
	*/
	static parseProp(propString) {
		const isArray = (propString.indexOf('repeated') == 0);

		let match;
		// match differently depending on if the prop is repeated
		// (see 1 and 2 in Input String in the docs above)
		if (isArray) match = /repeated (.+?) (.+?)=(.*)/.exec(propString);
		else match = /(.+?) (.+?)=(.*)/.exec(propString);

		const [fullMatchedString, type, name, index] = match;

		return {
			isArray,
			type: type.trim(),
			name: name.trim(),
			index: Number(index.trim()),
		}
	}

	/*
		Serialize a message type (created from parseMessage) to 
		a typescript interface string.

		export interface <MessageName> {
			// for every prop do:
			<PropName>: <TypeScriptPropType>([] if array);
		}
	*/
	static serializeMessage(message, indent) {
		return [
			`export interface ${message.name} {`,
				...message.props.map((prop) => this.serializeProp(prop, '\t')),
			`}`
		]
			.map((line) => `${indent}${line}`)
			.join('\n');
	}

	/*
		Serialize a message prop type (created from parseProp) to
		a typescript string,

		// INPUT 
		{ isArray: true, type: 'int32', name: 'propName', index: 1 }

		// OUTPUT
		"propName: number[];"
	*/
	static serializeProp(prop, indent) {
		let str = indent;
		str += prop.name;
		str += ': ';
		str += this.protoTypeToTypescriptType(prop.type);
		if (prop.isArray) str += '[]';
		str += ';';
		return str;
	}

	/*
		Convert a proto type to Typescript type.
		Eg "int32" => "number"

		TODO(fant): here we'd add more types
	*/
	static protoTypeToTypescriptType(propType) {
		if (['float', 'int32'].includes(propType)) return 'number';
		if (['string'].includes(propType)) return 'string';
		if (['bool'].includes(propType)) return 'boolean';
		// If no basic type is found, we return the propType
		// (eg if it is a custom type)
		return propType;
	}

}

module.exports.Proto2TS = Proto2TS;
