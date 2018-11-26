function lex(code) {
	code = code.split('\n');

	code = {
		src: code,
		height: code.length,
		width: 0
	}

	code.src = code.src.map(line => { code.width = Math.max(code.width, line.length); return line.split(''); });
	code.src = code.src.map(line => { while(line.length < code.width) line.push(' '); return line; });

	dbg(code);

	ip = {
		x: 0,
		y: code.height - 1,
		get: () => code.src[ip.y][ip.x],
		climb: () => { ip.x++; ip.y--; },
		fall: () => { ip.x++; ip.y++; },
		peek: (down) => {
			let peekX = (ip.x + 1);
			let peekY = (ip.y + ((down) ? 1 : -1));
			dbg('Peeking at [' + peekX + ', ' + peekY + ']');
			if (peekX < 0 || peekY < 0 || peekX >= code.width || peekY >= code.height) {
				dbg('Out of bounds peek, returning null');
				return null;
			}
			let peeked = code.src[peekY][peekX];
			dbg('Found ' + peeked);
			return peeked;
		},
		text: () => '[' + ip.x + ', ' + ip.y + ']'
	};

	dbg(ip);
	dbg(ip.text());

	if (ip.get() !== '/') {
		return lexError(ip, code, 'Expected entry point but found ' + ip.get());
	}

	function getSize(height) {
		dbg('Getting size of ' + height);
		let size = 0;
		while(--height) {
			size += height * 2;
		}
		dbg('Size is ' + size);
		return size;
	}

	function getMtHeight(ip, code, offset) {
		dbg('Getting mt starting at ' + ip.text() + ' with offset ' + offset);
		let mtHeight = offset + 1;
		while(ip.peek() === '/') {
			ip.climb();
			mtHeight++;
			dbg(ip.text());
			if (ip.y === 0) break;
		}

		ip.x++;
		dbg(ip.text());
		if (ip.get() !== '\\') {
			return lexError(ip, code, 'Expected peak but found `' + ip.get() + "'");
		}

		dbg('Starting descent from peak at ' + ip.text());
		let otherSide = 1
		while(ip.peek(true) === '\\') {
			ip.fall();
			otherSide++;
			if (ip.y === code.height - 1) break;
		}

		let extraOffset = 0;
		if (ip.peek(true) === '/') {
			otherSide++;
			extraOffset++;
		}
		while(ip.get() !== '/' && ip.x++ < code.width) {  }

		let heightDiff = mtHeight - otherSide;
		let mtSize = 0;
		if (heightDiff < 0) {
			return lexError(ip, code, 'Mountain other side is longer than main side!\n\tMain side is ' + mtHeight + ' (with ' + offset + ' offset), but other side is ' + otherSide);
		} else if (heightDiff === 0) {
			mtSize = getSize(mtHeight);
		} else {
			mtSize = getSize(otherSide) + (otherSide * heightDiff);
		}

		return [mtSize, heightDiff + extraOffset];
	}

	let ast = [];
	let offset = 0;
	while(ip.x < code.width) {
		size = getMtHeight(ip, code, offset);
		if (!size) return false;
		dbg('Got size ' + size[0] + ' and offset ' + size[1]);
		offset = size[1];
		ast.push(size[0]);
	}

	return ast;
}

class StackyTape extends Array {
	constructor() { super(); }

	peek() { return this[this.length - 1]; }

	rot(back) { back ? this.rotBack() : this.rotForward() }
	rotBack() { this.push(this.shift()) }
	rotForward() { this.unshift(this.pop()) }

	toString() { return JSON.stringify(this); }
}

function parse(ast) {
	stackyTape = new StackyTape();

	var printed = false;

	function getNextVal(codes) {
		let val = codes.shift();
		if (val == undefined) val = 0;
		return val;
	}
	function safePop(data, def) {
		let v = data.pop();
		if (v === undefined) v = def;
		return v;
	}
	function getDiadic(data, codes) {
		let val = getNextVal(codes);
		let v = safePop(data, val);
		dbg('Got v as ' + v + ' and val as ' + val);
		return [v, val];
	}
	function applyOperator(a1, a2, op) {
		return eval('' + a1 + op + a2);
	}
	function operatorOp(data, codes, op) {
		let vals = getDiadic(data, codes);
		let result = applyOperator(vals[0], vals[1], op);
		dbg('Result of ' + vals[0] + op + vals[1] + ' is ' + result);
		return result;
	}

	let opCodes = [
	// 00: no-op
		(data, codes) => 0,
	// 01: push
		(data, codes) => data.push(codes.shift()),
	// 02: add
		(data, codes) => {
			dbg('Adding');
			let result = operatorOp(data, codes, '+');
			data.push(result);
			dbg(data);
		},
	// 03: sub
		(data, codes) => {
			dbg('Subtracting');
			let result = operatorOp(data, codes, '-');
			data.push(result);
			dbg(data);
		},
	// 04: mul
		(data, codes) => {
			dbg('Multiplying');
			let result = operatorOp(data, codes, '*');
			data.push(result);
			dbg(data);
		},
	// 05: div
		(data, codes) => {
			dbg('Dividing');
			let result = operatorOp(data, codes, '/');
			data.push(result);
			dbg(data);
		},
	// 06: print
		(data, codes) => { printed = true; process.stdout.write(String.fromCharCode(safePop(data, 0) % 127)) },
	// 07: mod
		(data, codes) => {
			dbg('Modulusing');
			let result = operatorOp(data, codes, '%');
			data.push(result);
			dbg(data);
		},
	// 08: pow
		(data, codes) => {
			dbg('Powering');
			let result = operatorOp(data, codes, '**');
			data.push(result);
			dbg(data);
		},
	// 09: no-op
		(data, codes) => 0,
	// 10: dupe
		(data, codes) => data.push(safePop(data, 0)),
	// 11: no-op
		(data, codes) => 0,
	// 12: rot
		(data, codes) => data.rot(),
	];

	while(ast.length) {
		let code = ast.shift();
		dbg('StackyTape is');
		dbg(stackyTape);
		dbg('and code to execute is ' + code);
		dbg(opCodes[code]);
		opCodes[code](stackyTape, ast);
	}

	dbg('StackyTape is');
	dbg(stackyTape);

	if (!printed) console.log(JSON.stringify(stackyTape));
}

function lexError(ip, code, msg) {
	process.stderr.write('   ' + ' '.repeat(ip.x) + 'v' + (ip.x < code.width ? ' '.repeat(code.width - ip.x - 1) : '') + '   \n');
	process.stderr.write('  ┏' + '━'.repeat(code.width) + '┓  \n');
	for(y = 0; y < code.height; y++) {
		process.stderr.write((y == ip.y ? '>' : ' ') + ' ┃');
		for(x = 0; x < code.width; x++) {
			process.stderr.write(code.src[y][x]);
		}
		process.stderr.write('┃ ' + (y == ip.y ? '<' : ' ') + '\n');
	}

	process.stderr.write('  ┗' + '━'.repeat(code.width) + '┛  \n');
	process.stderr.write('   ' + ' '.repeat(ip.x) + '^' + (ip.x < code.width ? ' '.repeat(code.width - ip.x - 1) : '') + '   \n');

	process.stderr.write(ip.text() + ' ' + msg);
	return false;
}

function dbg(msg) {
	if (typeof(msg) === 'object' || typeof(msg) === 'array') msg = JSON.stringify(msg);
	if (typeof(msg) !== 'string') msg = msg.toString();
	if (debug) console.log('[dbg]', msg);
}

let rawCode = process.argv[2];
if (!rawCode) { process.stderr.write('No code was given!'); process.exit(1); }
let dI = 3;
if (rawCode === '-f') {
	dI++;
	const fs = require('fs');
	if (!process.argv[3]) { process.stderr.write('No file path was given!'); process.exit(2); }
	try {
		rawCode = fs.readFileSync(process.argv[3], 'utf8');
	} catch (e) {
		process.stderr.write('Could not read file!\n');
		process.stderr.write(e.message);
		process.exit(3);
	}
}
const debug = process.argv[dI] && process.argv[dI] == '-v';
rawCode = rawCode.replace(/^[\r\n]+|[\r\n]+$/g, '');
let ast = lex(rawCode);
if (!ast) process.exit(4);

dbg('Lexing done, AST is: ' + JSON.stringify(ast));
dbg('='.repeat(21));
dbg(' *' + ' '.repeat(17) + '* ');
dbg(' * Beginning parse * ');
dbg(' *' + ' '.repeat(17) + '* ');
dbg('='.repeat(21));

parse(ast);
