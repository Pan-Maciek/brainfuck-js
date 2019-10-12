# Brainfuck-js 🧠⚡
This module can compile brainfuck code into `javascript` functions and `webassembly` (wat, wasm).   
### 🙊🤯

## Usage
### Compiling brainfuck code.
```javascript
const { compile, runtimeMode } = require('brainfuck-compiler-js')
// ROT13 example from wikipedia
const code = `-,+[-[>>++++[>++++++++<-]<+<-[>+>+>-[>>>]<[[>+<-]>>+>]<<<<<-]]>>>[-]+>--[-[<->+++[-]]]<[++++++++++++<[>-[>+>>]>[+[<+>-]>+>>]<<<<<-]>>[<+>-]>[-[-<<[-]>>]<<[<<->>-]>>]<<[<<+>>-]]<[-]<.[-]<-,+]`

// (default) returns js function String -> String
compile(code, { mode: runtimeMode.Sync, memSize: 30000 }) 
// returns js function (async String -> String) -> async String
compile(code, { mode: runtimeMode.Async }) 
// returns js function (String -> (), async () -> String) -> async () 
compile(code, { mode: runtimeMode.Callback }) 

// returns wat code
compile(code, { mode: runtimeMode.Wat }) 
// returns wasm binary
compile(code, { mode: runtimeMode.Wasm }) 
// returns promise resolving to wasm function wrapped arround js function async (String -> String)
compile(code, { mode: runtimeMode.WasmFunction }) 
```
### Parsing code.
```javascript
const { parse, instructions } = require('bf-js')

// returns AST { type: Symbol, val: * } for example { type: instructions.Program, val: [...] }
parse(code)
```