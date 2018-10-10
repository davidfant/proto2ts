
# Generate Typescript from Proto definition

## Installation
```bash
npm install p2ts --global
```

## Usage
```
p2ts /path/to/definition.proto /output/path/for.ts [NamespaceName]
```

## What it does
Converts a proto definition file like:
```proto
	
message SomeMessage {
	int32 int_prop = 1;
	repeated string string_array_prop = 2;
	CustomType custom_type_prop = 3;
}

message CustomType {
	bool bool_prop = 1;
}

```

to

```ts

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


```
