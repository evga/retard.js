class Stack {
  #stack = [];

  constructor() { }

  push(item) {
    this.#stack.push(item);
  }

  pop() {
    if(this.#stack.length === 0)
      throw new Error('unbalanced stack');
      
    return this.#stack.pop();
  }

  get length() {
    return this.#stack.length;
  }

  get current() {
    return this.#stack[this.#stack.length - 1];
  }
}

export const stack = new Stack();
