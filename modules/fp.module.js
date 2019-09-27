const
compose = (...fns) => (...args) => fns.reduceRight((res, fn) => [fn.call(null, ...res)], args)[0],
pipe = (...fns) => (...args) => fns.reduce((res, fn) => [fn.call(null, ...res)], args)[0],
curry = (fn) => { const arity = fn.length; return function _curry(...args) { if (args.length < arity) { return _curry.bind(null, ...args); } return fn.call(null, ...args); }; },
inspect = (x) => { if (x && typeof x.inspect === 'function') { return x.inspect(); } function inspectFn(f) { return f.name ? f.name : f.toString(); } function inspectTerm(t) { switch (typeof t) { case 'string': return `'${t}'`; case 'object': { const ts = Object.keys(t).map(k => [k, inspect(t[k])]); return `{${ts.map(kv => kv.join(': ')).join(', ')}}`; } default: return String(t); } } function inspectArgs(args) { return Array.isArray(args) ? `[${args.map(inspect).join(', ')}]` : inspectTerm(args); } return (typeof x === 'function') ? inspectFn(x) : inspectArgs(x); };
class Either {
	constructor (x) { this.$value = x; }
	static of (x) { return new Right(x); }
}
class Left extends Either {
	get isLeft () { return true; }
	get isRight () { return false; }
	static of (x) { throw new Error('`of` called on class Left (value) instead of Either (type)'); }
	inspect () { return `Left(${inspect(this.$value)})`; }
	map () { return this; }
	ap () { return this; }
	chain () { return this; }
	join () { return this; }
	sequence (of) { return of(this); }
	traverse (of, fn) { return of(this); }
}
class Right extends Either {
	get isLeft () { return false; }
	get isRight () { return true; }
	static of (x) { throw new Error('`of` called on class Right (value) instead of Either (type)'); }
	inspect () { return `Right(${inspect(this.$value)})`; }
	map (fn) { return Either.of(fn(this.$value)); }
	ap (f) { return f.map(this.$value); }
	chain (fn) { return fn(this.$value); }
	join () { return this.$value; }
	sequence (of) { return this.traverse(of, identity); }
	traverse (of, fn) { fn(this.$value).map(Either.of); }
}
class Identity {
	constructor (x) { this.$value = x; }
	inspect () { return `Identity(${inspect(this.$value)})`; }
	static of (x) { return new Identity(x); }
	map(fn) { return Identity.of(fn(this.$value)); }
	ap (f) { return f.map(this.$value); }
	chain (fn) { return this.map(fn).join(); }
	join () { return this.$value; }
	sequence (of) { return this.traverse(of, identity); }
	traverse (of, fn) { return fn(this.$value).map(Identity.of); }
}
class IO {
	constructor (fn) { this.unsafePerformIO = fn; }
	inspect () { return `IO(?)`; }
	static of (x) { return new IO(() => x); }
	map (fn) { return new IO(compose(fn, this.unsafePerformIO)); }
	ap (f) { return this.chain(fn => f.map(fn)); }
	chain (fn) { return this.map(fn).join(); }
	join () { return this.unsafePerformIO(); }
}
class List {
	constructor (xs) { this.$value = xs; }
	inspect () { return `List(${inspect(this.$value)})`; }
	concat (x) { return new List(this.$value.concat(x)); }
	static of (x) { return new List([x]); }
	map (fn) { return new List(this.$value.map(fn)); }
	sequence (of) { return this.traverse(of, identity); }
	traverse (of, fn) { return this.$value.reduce((f, a) => fn(a).map(b => bs => bs.concat(b)).ap(f), of(new List([])),);}
}
class Map {
	constructor (x) { this.$value = x; }
	inspect () { return `Map(${inspect(this.$value)})`; }
	insert (k, v) { const singleton = {}; singleton[k] = v; return Map.of(Object.assign({}, this.$value, singleton)); }
	reduceWithKeys (fn, zero) { return Object.keys(this.$value).reduce((acc, k) => fn(acc, this.$value[k], k), zero); }
	map (fn) { return this.reduceWithKeys( (m, v, k) => m.insert(k, fn(v)), new Map({}), ); }
	sequence (of) { return this.traverse(of, identity); }
	traverse (of, fn) { return this.reduceWithKeys((f, a, k) => fn(a).map(b => m => m.insert(k, b)).ap(f), of(new Map({})),);}
}
class Maybe {
	get isNothing () { return this.$value === null || this.$value === undefined; }
	get isJust () { return !this.isNothing; }
	constructor (x) { this.$value = x; }
	inspect () { return `Maybe(${inspect(this.$value)})`; }
	static of (x) { return new Maybe(x); }
	map (fn) { return this.isNothing ? this : Maybe.of(fn(this.$value)); }
	ap (f) { return this.isNothing ? this : f.map(this.$value); }
	chain (fn) { return this.map(fn).join(); }
	join () { return this.isNothing ? this : this.$value; }
	sequence (of) { this.traverse(of, identity); }
	traverse (of, fn) { return this.isNothing ? of(this) : fn(this.$value).map(Maybe.of); }
}
class Task {
	constructor (fork) { this.fork = fork; }
	inspect () { return 'Task(?)'; }
	static rejected (x) { return new Task((reject, _) => reject(x)); }
	static of (x) { return new Task((_, resolve) => resolve(x)); }
	map (fn) { return new Task((reject, resolve) => this.fork(reject, compose(resolve, fn))); }
	ap (f) { return this.chain(fn => f.map(fn)); }
	chain (fn) { return new Task((reject, resolve) => this.fork(reject, x => fn(x).fork(reject, resolve))); }
	join () { return this.chain(identity); }
}
const
add = curry((a, b) => a + b),
mult = curry((a, b) => a * b),
chain = curry((fn, m) => m.chain(fn)),
concat = curry((a, b) => a.concat(b)),
eq = curry((a, b) => a === b),
filter = curry((fn, xs) => xs.filter(fn)),
flip = curry((fn, a, b) => fn(b, a)),
forEach = curry((fn, xs) => xs.forEach(fn)),
head = xs => xs[0],
intercalate = curry((str, xs) => xs.join(str)),
join = m => m.join(),
last = xs => xs[xs.length - 1],
map = curry((fn, f) => f.map(fn)),
lineMap = compose(map, compose),
match = curry((re, str) => re.test(str)),
prop = curry((p, obj) => obj[p]),
reduce = curry((fn, zero, xs) => xs.reduce(fn, zero)),
replace = curry((re, rpl, str) => str.replace(re, rpl)),
reverse = x => Array.isArray(x) ? x.reverse() : x.split('').reverse().join(''),
safeHead = compose(Maybe.of, head),
safeLast = compose(Maybe.of, last),
safeProp = curry((p, obj) => compose(Maybe.of, prop(p))(obj)),
sequence = curry((of, f) => f.sequence(of)),
sortBy = curry((fn, xs) => { return xs.sort((a, b) => { if (fn(a) === fn(b)) { return 0; } return fn(a) > fn(b) ? 1 : -1; }); }),
split = curry((sep, str) => str.split(sep)),
take = curry((n, xs) => xs.slice(0, n)),
toLowerCase = s => s.toLowerCase(),
toString = String,
toUpperCase = s => s.toUpperCase(),
traverse = curry((of, fn, f) => f.traverse(of, fn)),
unsafePerformIO = io => io.unsafePerformIO(),
either = curry((f, g, e) => { if (e.isLeft) { return f(e.$value); } return g(e.$value); }),
identity = x => x,

left = a => new Left(a),
liftA2 = curry((fn, a1, a2) => a1.map(fn).ap(a2)),
liftA3 = curry((fn, a1, a2, a3) => a1.map(fn).ap(a2).ap(a3)),
maybe = curry((v, f, m) => { if (m.isNothing) { return v; } return f(m.$value); }),
nothing = () => Maybe.of(null),
reject = a => Task.rejected(a),
createCompose = curry((F, G) => class Compose { 
	constructor(x) { this.$value = x; } 
	inspect() { return `Compose(${inspect(this.$value)})`;} 
	static of(x) { return new Compose(F(G(x)));}
	map(fn) { return new Compose(this.$value.map(x => x.map(fn)));} 
	ap(f) {return f.map(this.$value);}}
);

module.exports = {
  compose,
  pipe,
  curry,
  add,
  mult,
  chain,
  concat,
  eq,
  filter,
  flip,
  forEach,
  head,
  intercalate,
  join,
  last,
  map,
  lineMap,
  match,
  prop,
  reduce,
  replace,
  reverse,
  safeHead,
  safeLast,
  safeProp,
  sequence,
  sortBy,
  split,
  take,
  toLowerCase,
  toString,
  toUpperCase,
  traverse,
  unsafePerformIO,
  either,
  identity,
  inspect,
  left,
  liftA2,
  liftA3,
  maybe,
  nothing,
  reject,
  createCompose,
  Either, Left, Right, Identity, IO, List, Map, Maybe, Task
}