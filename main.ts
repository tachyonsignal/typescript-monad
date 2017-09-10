/**
 * A context that which can be fmapped over.
 */
interface Functor<T> {
  fmap<U>(f: (a:T)=> U): Functor<U>;
}

/**
 * A Functor which further defines how to wrap values into
 * context.
 */
interface Applicative<T> extends Functor<T> {
    /**
     * Introduces value into context.
     */
    pure(a: T): Applicative<T>;

    /**
     * This is the '<*>' function in Haskell, which consists of invalid identifier
     * characters in TypeScript.  Moreover, there is no-pronounceable name for the thing.
     * This is a kind of apply, though.
     */
    ap<U>(f: Functor<U>): Functor<U>;
}

/**
 * Haskell defines 
 */
interface Monad<T> extends Applicative<T> {
    bind<U>(f: (a: T) => Monad<U>): Monad<U>;

    returnz(a: T): Monad<T>;
}


class Just<T> implements Monad<T> {
    constructor(public value: T) { }

    fmap<U>(f: ((a: T) => U)): Maybe<U> {
        // Should we support Just(null)?
        if (!this.value) {
            return Nothing.Instance;
        }
        const x: U = f(this.value);
        return x == null ? Nothing.Instance : new Just(x);
    }

    pure(a: T): Just<T> {
        return new Just(a);
    }

    ap<U>(f: Functor<U>): Functor<U> {
        // This container context type T must be a function. 
        const x: (a: U) => U = <(a: U) => U><any>this.value;
        return f.fmap(x);
    }

    bind<U>(f: (a: T) => Maybe<U>): Maybe<U> {
        return f(this.value);
    }

    returnz(a: T): Just<T> {
        return new Just(a);
    }

    toString() {
        return `Just(${this.value.toString()})`;
    }
}


class Nothing<T> implements Monad<T> {
    private static instance: Nothing<any>;

    private constructor() { }

    fmap<U>(f: (a: T) => U): Maybe<U> {
        return <Nothing<U>><any>this;
    }

    pure(a: T): Nothing<T> {
        return Nothing.Instance;
    }

    ap<U>(f: Functor<U>): Functor<U> {
        return <Nothing<U>><any>this;
    }

    bind<U>(f: (a: T) => Maybe<U>): Maybe<U> {
        return <Nothing<U>><any>this;
    }

    returnz(a: T): Nothing<T> {
        return Nothing.Instance;
    }

    toString(): string {
        return 'Nothing()';
    }

    static get Instance(): Nothing<any> {
        return this.instance || (this.instance = new this<any>());
    }
}

type Maybe<T> = Just<T> | Nothing<T>;

console.log('Simple monad container.');
const a: Maybe<number> = new Just(1);
console.log('\t' + a.toString());
const b: Maybe<string> = a.fmap<string>(x => 'hi');
console.log('\t' + b.toString());
console.log('\n');

/**
 * Horribly contrived value classes to illustrated nested
 * context and value of Monads. */
class Parent {
    getChild(): Maybe<Child> {
        return new Just(new Child("David"));
    }
}
class Child {
    constructor(readonly name: string) { };
    toString() {
        return `Child(${this.name})`;
    }
    getSon(): Maybe<GrandChild> {
        return new Just(new GrandChild());
    }
    getDaughter(): Maybe<GrandChild> {
        return Nothing.Instance;
    }
}
class GrandChild {
    toString(): string {
        return "I exist";
    }
}

const dad: Maybe<Parent> = new Just(new Parent());
// Nested contexts.....
console.log('Nested containers with just fmap');
const maybeMaybeChild: Maybe<Maybe<Child>> = dad.fmap(
    (x: Parent) => x.getChild()
);
console.log('\t' + maybeMaybeChild.toString());
console.log('\n');

// Nested context with Nothing in the monad chain.
console.log('Nested container with head of sequence being nothing.');
const mom: Maybe<Parent> = Nothing.Instance;
const momsStepson: Maybe<Maybe<Child>> = mom.fmap((x: Parent) => x.getChild());
console.log('\t' + momsStepson.toString());
console.log('\n');

// Unflattening nested context.
console.log('Un-nest with bind');
const maybeChild: Maybe<Child> = dad.bind((x: Parent) => x.getChild());
console.log('\t' + maybeChild.toString());
console.log('\n');

// Chained unflattening.
console.log('Chained Unflattening');
const maybeGranddaughter: Maybe<GrandChild> = dad
    .bind((x: Parent) => x.getChild())
    .bind((x: Child) => x.getDaughter());
console.log('\t' + maybeGranddaughter.toString());
const maybeGrandson: Maybe<GrandChild> = dad
    .bind((x: Parent) => x.getChild())
    .bind((x: Child) => x.getSon());
console.log('\t' + maybeGrandson.toString());
console.log('\t');

// Applicatives
const maybeFn: Maybe<(x: string) => string> = new Just(
    function(word: string): string {
        return word + word;
    });
const twoApplications: Functor<string> = maybeFn.ap(
    maybeFn.ap(new Just("yoooo")));
console.log(twoApplications.toString());
