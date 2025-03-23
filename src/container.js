import { assert } from './util.js';
import { ReactiveCallback } from './callback.js';
import { regAddCallback, regDetach } from './registry.js';

/*

TAG(
  'a', 
  () => TAG( () => 'b' ), 
  'c'
)

ReactiveElement
  > ReactiveContainer
    > 'a'
    > ReactiveChild
      > ReactiveElement
        > ReactiveContainer
          > 'b'
    > 'c'

*/

export class ReactiveContainer {
  /**
   * 
   * @param {Element} element 
   * @param {Array} childArray
   */
  constructor(element, childArray) {
    assert(element instanceof Element);
    assert(Array.isArray(childArray));

    this.element = element;
    this.initialChildCount = element.childNodes.length;

    this.childs = childArray
      .flat(Infinity)
      .map(c => (typeof c === 'function' ? new ReactiveChild(this, c) : c));

    this.#init();
  }

  #init() {
    for (const c of this.childs) {
      if (c instanceof ReactiveChild) {
        c.callback.execute();
      } else if (c && c.container instanceof ReactiveContainer) {
        this.element.append(c.container.element);
      } else {
        this.element.append(c);
      }
    }

    this.check();
  }

  #renderedChildCount() {
    const cb = (prev, cur) => prev + (cur instanceof ReactiveChild ? cur.clen : 1);
    return this.childs.reduce(cb, this.initialChildCount);
  }

  check() {
    const currentChildCount = this.element.childNodes.length;
    const renderedChildCount = this.#renderedChildCount();

    if (currentChildCount !== renderedChildCount)
      throw new Error(`element desync current=${currentChildCount} render=${renderedChildCount}`);
  }
}

class ReactiveChild {

  /**
   * @param {ReactiveContainer} container 
   * @param {Function} userCallback 
   */
  constructor(container, userCallback) {
    this.container = container;
    this.userCallback = userCallback;
    this.firstInvocation = true;
    this.clen = 0;
    this.callback = regAddCallback(container.element, () => this.#swap());
    this.callback.description = `ReactiveChild(${userCallback})`;
  }

  #insertionPoint() {
    let node = this.container.element.firstChild;
    if (node === null) return null;

    let skip = this.container.initialChildCount;

    while (skip--) {
      if (node === null) throw new Error("child expected");
      node = node.nextSibling;
    }

    skip = 0;

    for (const c of this.container.childs) {
      if (c === this) {
        while (skip--) {
          if (node === null) throw new Error("child expected");
          node = node.nextSibling;
        }
        return node;
      }
      skip += (c instanceof ReactiveChild) ? c.clen : 1;
    }

    throw new Error("function not found");
  }

  #swap() {
    assert(this instanceof ReactiveChild);

    if (!this.firstInvocation)
      this.container.check();

    //if (!firstInvocation && !self.element.isConnected)

    let removeCnt = this.clen;

    const fnChilds = [this.userCallback(/* ??? */)].flat(Infinity);
    this.clen = fnChilds.length;

    for (let i = 0; i < fnChilds.length; i++) {
      if (fnChilds[i] && fnChilds[i].container instanceof ReactiveContainer)
        fnChilds[i] = fnChilds[i].container.element;
    }

    if (this.firstInvocation) {
      this.firstInvocation = false;
      if (fnChilds.length > 0) {
        this.container.element.append(...fnChilds);
      }
    } else {
      let node = this.#insertionPoint();

      if (node === null) {
        this.container.element.append(...fnChilds);
      } else {
        while (removeCnt--) {
          if (node === null) 
            throw new Error("child expected");

          const tmp = node;

          node = node.nextSibling;

          if (tmp.parentNode === null) 
            throw new Error("parentNode is null");

          tmp.parentNode.removeChild(tmp);
          regDetach(tmp);
        }

        if (fnChilds.length > 0) {
          if (node === null) {
            this.container.element.append(...fnChilds);
          } else {
            if (node.parentNode === null) 
              throw new Error("parentNode is null");

            for (const c of fnChilds) {
              if (c instanceof Node) 
                node.parentNode.insertBefore(c, node);
              else
                node.parentNode.insertBefore(document.createTextNode(c), node);
            }
          }
        }
      }
    }
  }
}
