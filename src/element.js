import { ReactiveChild } from "./child.js";
import { bindElement } from "./databind.js";
import { stats } from "./stats.js";
import { assert } from "./util.js";

export class ReactiveElement {
  /**
   *
   * @param {Element} element
   * @param {Array} childArray
   */
  constructor(element, childArray) {
    assert(element instanceof Element);
    assert(Array.isArray(childArray));

    this.element = element;
    this.childs = childArray.flat(Infinity);
    //this.initialChildCount = element.childNodes.length;
    //this.callbacks = [];

    this.#init();

    if (stats._enabled) {
      stats.addTag(this.element.tagName);
      //stats.elements.push(this);
    }
  }

  #init() {
    for (let i = 0; i < this.childs.length; i++) {
      const c = this.childs[i];
      if (typeof c === "function") this.childs[i] = new ReactiveChild(this, c);
    }

    for (const c of this.childs) {
      if (c instanceof ReactiveChild) {
        c.callback.execute();
      } else if (c instanceof ReactiveElement) {
        this.element.append(c.element);
      } else {
        this.element.append(c);
      }
    }
  }

  attr(obj) {
    assert(typeof obj === "object");

    for (const key in obj) {
      this.element.setAttribute(key, obj[key]);
    }

    return this;
  }

  bind(rv) {
    bindElement(this.element, rv);
    return this;
  }

  on(eventName, listener) {
    this.element.addEventListener(eventName, listener);
    return this;
  }

  onclick(listener) {
    this.on("click", listener);
    return this;
  }
}
