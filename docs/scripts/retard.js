function assert(condition, message) {
  if (condition) return;
  throw new Error(message ?? "assert fail");
}

class Aggregate {
  constructor() {
    this.cnt = 0;
    this.sum = 0;
    this.vmin = null;
    this.vmax = null;
    this.avg = 0;
  }

  counter() {
    this.cnt++;
  }

  update(v) {
    this.cnt++;
    this.sum += v;
    this.vmin = this.vmin === null ? v : Math.min(v, this.vmin);
    this.vmax = this.vmax === null ? v : Math.max(v, this.vmax);
    this.avg = this.cnt > 0 ? this.sum / this.cnt : 0;
  }
}

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

const stack = new Stack();

var config = {
  enableStats: true
};

const StopSymbol = Symbol("stop");

/** @type {ReactiveCallback[]} */
const callbacks = [];

class ReactiveCallback {
  #stopped = false;
  description;
  userCallback;

  /**
   * 
   * @param {Function} callback 
   */
  constructor(callback) {
    assert(callback instanceof Function);

    this.callback = callback;

    if (config.enableStats) {
      this.executeStats = new Aggregate();
      callbacks.push(this);
    }
  }

  stop() {
    this.#stopped = true;
  }

  execute(...args) {
    const t0 = performance.now();

    if (this.#stopped)
      return StopSymbol;

    stack.push(this);
    try {
      return this.callback(...args);
    } finally {
      stack.pop();
      if (this.executeStats)
        this.executeStats.update(performance.now() - t0);
    }
  }
}

function newCallback(callback) {
  return new ReactiveCallback(callback);
}

/** @type {ReactiveValue[]} */
const values = [];

class ReactiveValue {
  /**
   *
   * @param {*} initialValue
   */
  constructor(initialValue) {
    this.initialValue = initialValue;
    this.value = initialValue;
    this.callbacks = new Set();
    this.resetBound = this.reset.bind(this);

    if (config.enableStats) {
      this.readStats = new Aggregate();
      this.writeStats = new Aggregate();
      this.changedStats = new Aggregate();
      // @ts-ignore
      values.push(this);
    }
  }

  capture() {
    if (stack.current) {
      this.callbacks.add(stack.current);
    }
  }

  reset() {
    this.value = this.initialValue;
    this.changed();
  }

  read() {
    if (this.readStats) {
      this.readStats.counter();
    }

    this.capture();
    return this.value;
  }

  write(newValue, { force = false } = {}) {
    if (stack.length > 0)
      throw new Error("write used inside a reactive callback");

    if (this.writeStats) {
      this.writeStats.counter();
    }

    if (this.value !== newValue || force) {
      this.value = newValue;
      this.changed();
    }

    return this.value;
  }

  changed() {
    const t0 = performance.now();
    const toRemove = [];

    for (const cb of this.callbacks) {
      if (cb.execute() === StopSymbol) 
        toRemove.push(cb);
    }

    for (const cb of toRemove) {
      this.callbacks.delete(cb);
      //console.log("removed callback", cb);
    }

    if (this.changedStats) {
      this.changedStats.update(performance.now() - t0);
    }
  }

  toString() {
    this.capture();
    return String(this.value);
  }
}

function newValue(initialValue) {
  return new ReactiveValue(initialValue);
}

/**
 * @param {HTMLInputElement} el
 * @param {ReactiveValue} rv
 */
function bindInputElement(el, rv) {
  const desc = () => `${el.tagName}[type=${el.type}].bind(${rv})`;

  if (el.matches('[type="checkbox"]')) {
    const setRV = () => rv.write(el.checked);
    const setEL = () => (el.checked = rv.read());
    el.addEventListener("change", setRV);
    const cb = new ReactiveCallback(setEL);
    cb.description = desc;
    cb.execute();
  } else {
    const setRV = () => rv.write(el.value);
    const setEL = () => (el.value = rv.read());
    el.addEventListener("input", setRV);
    const cb = new ReactiveCallback(setEL);
    cb.description = desc;
    cb.execute();
  }
}

/**
 * @param {HTMLSelectElement} el
 * @param {ReactiveValue} rv
 */
function bindSelectElement(el, rv) {
  const desc = () => `${el.tagName}.bind(${rv})`;

  if (el.multiple) {
    // TODO
  } else {
    // single
    const setRV = () => rv.write(el.value);
    const setEL = () => (el.value = rv.read());
    el.addEventListener("change", setRV);
    const cb = new ReactiveCallback(setEL);
    cb.description = desc;
    cb.execute();
  }
}

/**
 * @param {Element} el
 * @param {ReactiveValue} rv
 */
function bindElement(el, rv) {
  assert(el instanceof Element);
  assert(rv instanceof ReactiveValue);

  if (el instanceof HTMLInputElement) bindInputElement(el, rv);
  else if (el instanceof HTMLSelectElement) bindSelectElement(el, rv);
}

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

class ReactiveContainer {
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
    this.callback = new ReactiveCallback(() => this.#swap());
    this.callback.userCallback = userCallback;
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
      skip += (typeof c === "function") ? c.clen : 1;
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
          if (node === null) throw new Error("child expected");

          const tmp = node;

          node = node.nextSibling;

          if (tmp.parentNode === null) throw new Error("parentNode is null");

          tmp.parentNode.removeChild(tmp);
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

class ReactiveElement {
  /**
   * @param {Element} element
   * @param {Array} childArray
   */
  constructor(element, childArray) {
    assert(element instanceof Element);
    assert(Array.isArray(childArray));
    
    this.container = new ReactiveContainer(element, childArray);
  }

  get element() {
    return this.container.element;
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

/**
 * @param {string} tagName
 * @param {object} [attributes]
 */
function newElement(tagName, attributes) {
  assert(typeof tagName === "string");
  assert(tagName.length > 0);

  return function (...childs) {
    const el = document.createElement(tagName);
    const result = new ReactiveElement(el, childs);
    if (attributes) result.attr(attributes);
    return result;
  };
}

/**
 * @param {Element} existingElement
 */
function wrapElement(existingElement) {
  return (...childs) => new ReactiveElement(existingElement, childs);
}

/**
 * @param {string | Element} arg0
 * @returns {(...childs) => ReactiveElement}
 */
function newTag(arg0) {
  if (typeof arg0 === "string") {
    if (arg0.startsWith("#")) {
      const el = document.getElementById(arg0.slice(1));
      if (el === null) throw new Error("element not found");
      return wrapElement(el);
    } else {
      return newElement(arg0);
    }
  } else if (arg0 instanceof Element) {
    return wrapElement(arg0);
  } else {
    throw new Error("invalid argument");
  }
};

//
// HTML5 tags
// taken from https://html.spec.whatwg.org/multipage/indices.html#elements-3
//

// [A]
newTag.a = newElement("a");
newTag.abbr = newElement("abbr");
newTag.address = newElement("address");
newTag.area = newElement("area");
newTag.article = newElement("article");
newTag.aside = newElement("aside");
newTag.audio = newElement("audio");
// [B]
newTag.b = newElement("b");
newTag.base = newElement("base");
newTag.bdi = newElement("bdi");
newTag.bdo = newElement("bdo");
newTag.blockquote = newElement("blockquote");
newTag.body = newElement("body");
newTag.br = newElement("br");
newTag.button = newElement("button");
// [C]
newTag.canvas = newElement("canvas");
newTag.caption = newElement("caption");
newTag.cite = newElement("cite");
newTag.code = newElement("code");
newTag.col = newElement("col");
newTag.colgroup = newElement("colgroup");
// [D]
newTag.data = newElement("data");
newTag.datalist = newElement("datalist");
newTag.dd = newElement("dd");
newTag.del = newElement("del");
newTag.details = newElement("details");
newTag.dfn = newElement("dfn");
newTag.dialog = newElement("dialog");
newTag.div = newElement("div");
newTag.dl = newElement("dl");
newTag.dt = newElement("dt");
// [E]
newTag.em = newElement("em");
newTag.embed = newElement("embed");
// [F]
newTag.fieldset = newElement("fieldset");
newTag.figcaption = newElement("figcaption");
newTag.figure = newElement("figure");
newTag.footer = newElement("footer");
newTag.form = newElement("form");
// [H]
newTag.h1 = newElement("h1");
newTag.h2 = newElement("h2");
newTag.h3 = newElement("h3");
newTag.h4 = newElement("h4");
newTag.h5 = newElement("h5");
newTag.h6 = newElement("h6");
newTag.head = newElement("head");
newTag.header = newElement("header");
newTag.hgroup = newElement("hgroup");
newTag.hr = newElement("hr");
newTag.html = newElement("html");
// [I]
newTag.i = newElement("i");
newTag.iframe = newElement("iframe");
newTag.img = newElement("img");
newTag.input = newElement("input");
newTag.ins = newElement("ins");
// [K]
newTag.kbd = newElement("kbd");
// [L]
newTag.label = newElement("label");
newTag.legend = newElement("legend");
newTag.li = newElement("li");
newTag.link = newElement("link");
// [M]
newTag.main = newElement("main");
newTag.map = newElement("map");
newTag.mark = newElement("mark");
newTag.math = newElement("math");
newTag.menu = newElement("menu");
newTag.meta = newElement("meta");
newTag.meter = newElement("meter");
// [N]
newTag.nav = newElement("nav");
newTag.noscript = newElement("noscript");
// [O]
newTag.object = newElement("object");
newTag.ol = newElement("ol");
newTag.optgroup = newElement("optgroup");
newTag.option = newElement("option");
newTag.output = newElement("output");
// [P]
newTag.p = newElement("p");
newTag.picture = newElement("picture");
newTag.pre = newElement("pre");
newTag.progress = newElement("progress");
// [Q]
newTag.q = newElement("q");
// [R]
newTag.rp = newElement("rp");
newTag.rt = newElement("rt");
newTag.ruby = newElement("ruby");
// [S]
newTag.s = newElement("s");
newTag.samp = newElement("samp");
newTag.script = newElement("script");
newTag.search = newElement("search");
newTag.section = newElement("section");
newTag.select = newElement("select");
newTag.slot = newElement("slot");
newTag.small = newElement("small");
newTag.source = newElement("source");
newTag.span = newElement("span");
newTag.strong = newElement("strong");
newTag.style = newElement("style");
newTag.sub = newElement("sub");
newTag.summary = newElement("summary");
newTag.sup = newElement("sup");
newTag.svg = newElement("svg");
// [T]
newTag.table = newElement("table");
newTag.tbody = newElement("tbody");
newTag.td = newElement("td");
newTag.template = newElement("template");
newTag.textarea = newElement("textarea");
newTag.tfoot = newElement("tfoot");
newTag.th = newElement("th");
newTag.thead = newElement("thead");
newTag.time = newElement("time");
newTag.title = newElement("title");
newTag.tr = newElement("tr");
newTag.track = newElement("track");
// [U]
newTag.u = newElement("u");
newTag.ul = newElement("ul");
// [V]
newTag.var = newElement("var");
newTag.video = newElement("video");
// [W]
newTag.wbr = newElement("wbr");

//
// Shortcuts
//
newTag.input_hidden = newElement("input", { type: "hidden" });
newTag.input_text = newElement("input", { type: "text" });
newTag.input_search = newElement("input", { type: "search" });
newTag.input_tel = newElement("input", { type: "tel" });
newTag.input_url = newElement("input", { type: "url" });
newTag.input_email = newElement("input", { type: "email" });
newTag.input_password = newElement("input", { type: "password" });
newTag.input_date = newElement("input", { type: "date" });
newTag.input_month = newElement("input", { type: "month" });
newTag.input_week = newElement("input", { type: "week" });
newTag.input_time = newElement("input", { type: "time" });
newTag.input_datetime_local = newElement("input", { type: "datetime-local" });
newTag.input_number = newElement("input", { type: "number" });
newTag.input_range = newElement("input", { type: "range" });
newTag.input_color = newElement("input", { type: "color" });
newTag.input_checkbox = newElement("input", { type: "checkbox" });
newTag.input_radio = newElement("input", { type: "radio" });
newTag.input_file = newElement("input", { type: "file" });
newTag.input_submit = newElement("input", { type: "submit" });
newTag.input_image = newElement("input", { type: "image" });
newTag.input_reset = newElement("input", { type: "reset" });
newTag.input_button = newElement("input", { type: "button" });

//
// Helper functions
//

/**
 *
 * @param {ReactiveValue | boolean} arg0
 */
newTag.IF = function (arg0) {
  if (arg0 instanceof ReactiveValue) {
    return (...childs) => (() => arg0.read() ? childs : []);
  } else {
    return (...childs) => (arg0 ? childs : []);
  }
};

// Public API

export { newCallback, newTag, newValue };
