import { ReactiveCallback } from "./callback.js";
import { ReactiveElement } from "./element.js";
import { assert } from "./util.js";

export class ReactiveChild {
  /**
   *
   * @param {ReactiveElement} re
   * @param {Function} fn
   */
  constructor(re, fn) {
    assert(re instanceof ReactiveElement);
    assert(typeof fn === "function");

    this.re = re;
    this.fn = fn;
    this.initialChildCount = re.element.childNodes.length;
    this.firstInvocation = true;
    this.clen = 0;
    this.callback = new ReactiveCallback(() => this.#swap());
    this.callback.userCallback = fn;
    //this.callback.execute();
  }

  #check() {
    const el_clen = this.re.element.childNodes.length;
    const tpl_clen = this.re.childs.reduce(
      (sum, item) => sum + (item instanceof ReactiveChild ? item.clen : 1),
      this.initialChildCount
    );

    if (el_clen !== tpl_clen)
      throw new Error(`desync ${el_clen} vs ${tpl_clen}`);
  }

  #insertionPoint() {
    let node = this.re.element.firstChild;
    if (node === null) return null;

    let skip = this.initialChildCount;

    while (skip--) {
      if (node === null) throw new Error("child expected");

      node = node.nextSibling;
    }

    skip = 0;

    for (const c of this.re.childs) {
      if (c === this) {
        while (skip--) {
          if (node === null) throw new Error("child expected");

          node = node.nextSibling;
        }
        return node;
      }
      skip += typeof c === "function" ? c.clen : 1;
    }

    throw new Error("function not found");
  }

  #swap() {
    assert(this instanceof ReactiveChild);

    if (!this.firstInvocation) this.#check();

    //if (!firstInvocation && !self.element.isConnected)

    let removeCnt = this.clen;

    const fnChilds = [this.fn(/* pass something useful here???*/)].flat(
      Infinity
    );
    this.clen = fnChilds.length;

    for (let i = 0; i < fnChilds.length; i++) {
      if (fnChilds[i] instanceof ReactiveElement)
        fnChilds[i] = fnChilds[i].element;
    }

    if (this.firstInvocation) {
      this.firstInvocation = false;

      // the tag is being built for the first time
      // so just append the childs in a simple way
      // without doing anything special
      if (fnChilds.length > 0) {
        this.re.element.append(...fnChilds);
      }
    } else {
      let node = this.#insertionPoint();

      if (node === null) {
        this.re.element.append(...fnChilds);
      } else {
        // TODO
        // improve replacement...
        // instead of replace+append
        // do something like... if newlen >= oldlen
        // replace node up to oldlen
        // ...... think bout it !!!

        while (removeCnt--) {
          if (node === null) throw new Error("child expected");

          const tmp = node;

          node = node.nextSibling;

          if (tmp.parentNode === null) throw new Error("parentNode is null");

          tmp.parentNode.removeChild(tmp);
        }

        if (fnChilds.length > 0) {
          if (node === null) {
            this.re.element.append(...fnChilds);
          } else {
            if (node.parentNode === null) throw new Error("parentNode is null");

            for (const c of fnChilds) {
              if (c instanceof Node) node.parentNode.insertBefore(c, node);
              else
                node.parentNode.insertBefore(document.createTextNode(c), node);
            }
          }
        }
      }
    }
  }
}
