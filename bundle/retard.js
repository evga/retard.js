function assert(condition, message) {
  if (condition) return;
  throw new Error(message ?? "assert fail");
}

class ReactiveStack {
  #stack = [];
  #balance = 0;

  constructor() { }

  /**
   *
   * @param {ReactiveCallback} callback
   */
  push(callback) {
    assert(callback instanceof ReactiveCallback);
    this.#balance++;
    this.#stack.push(callback);
  }

  /**
   *
   * @returns {ReactiveCallback}
   */
  pop() {
    assert(this.#balance - 1 >= 0, "unbalanced stack");

    this.#balance--;
    return this.#stack.pop();
  }

  get length() {
    return this.#stack.length;
  }

  /**
   * @returns {ReactiveCallback}
   */
  get current() {
    return this.#stack[this.#stack.length - 1];
  }
}

const stack = new ReactiveStack();

const stats = {
  _enabled: true,
  callbacks: [],
  values: [],
  tags: {},
  addTag: function (tagName) {
    if (stats.tags[tagName] === undefined) {
      stats.tags[tagName] = new Aggregate();
    }
    stats.tags[tagName].counter();
  }
  //elements: []
};

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

  toString() {
    return `cnt=${this.cnt} sum=${this.sum} min=${this.vmin} max=${this.vmax} avg=${this.avg}`;
  }
}

const StopSymbol = Symbol("stop");

class ReactiveCallback {
  /**
   *
   * @param {Function} callback
   */
  constructor(callback) {
    assert(callback instanceof Function);

    this.callback = callback;
    this.description = null;
    this.userCallback = null;
    this.stopped = false;

    {
      this.stats_execute = new Aggregate();
      // @ts-ignore
      stats.callbacks.push(this);
    }
  }

  stop() {
    this.stopped = true;
  }

  execute(...args) {
    const t0 = performance.now();

    if (this.stopped) return StopSymbol;

    stack.push(this);
    try {
      return this.callback(...args);
    } finally {
      stack.pop();
      if (this.stats_execute) this.stats_execute.update(performance.now() - t0);
    }
  }
}

class ReactiveChild {
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

    {
      this.stats_reads = new Aggregate();
      this.stats_writes = new Aggregate();
      this.stats_changes = new Aggregate();
      // @ts-ignore
      stats.values.push(this);
    }
  }

  #capture() {
    const callback = stack.current;

    if (callback && !this.callbacks.has(callback)) {
      this.callbacks.add(callback);
    }
  }

  reset() {
    this.value = this.initialValue;
    this.changed();
  }

  read() {
    if (this.stats_reads) {
      this.stats_reads.counter();
    }

    this.#capture();
    return this.value;
  }

  write(newValue, { force = false } = {}) {
    if (stack.length > 0)
      throw new Error("infinite loop");

    if (this.stats_writes) {
      this.stats_writes.counter();
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
      if (cb.execute() === StopSymbol) toRemove.push(cb);
    }

    for (const cb of toRemove) {
      this.callbacks.delete(cb);
      console.log("removed callback", cb);
    }

    if (this.stats_changes) {
      this.stats_changes.update(performance.now() - t0);
    }
  }

  toString() {
    this.#capture();
    return String(this.value);
  }
}

/**
 *
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
 *
 * @param {HTMLSelectElement} el
 * @param {ReactiveValue} rv
 */
function bindSelectElement(el, rv) {
  const desc = () => `${el.tagName}.bind(${rv})`;

  if (el.multiple) ; else {
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
 * 2way databind
 *
 * @param {Element} el
 * @param {ReactiveValue} rv
 */
function bindElement(el, rv) {
  assert(el instanceof Element);
  assert(rv instanceof ReactiveValue);

  if (el instanceof HTMLInputElement) {
    bindInputElement(el, rv);
  } else if (el instanceof HTMLSelectElement) {
    bindSelectElement(el, rv);
  }
}

class ReactiveElement {
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

    {
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

/**
 *
 * @param {*} initialValue
 * @returns
 */
function newValue(initialValue) {
  return new ReactiveValue(initialValue);
}

/**
 *
 * @param {Function} callback
 * @returns
 */
function newCallback(callback) {
  return new ReactiveCallback(callback);
}

/**
 *
 * @param {string} tagName
 * @param {object} [attributes]
 * @returns
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
 *
 * @param {Element} existingElement
 * @returns
 */
function wrapElement(existingElement) {
  return (...childs) => new ReactiveElement(existingElement, childs);
}

/**
 * To create a new element:
 *      TAG('div')
 *
 * To wrap an existing element:
 *      TAG(document.body)
 *      TAG('#app') [uses getElementById]
 * @param {string | Element} arg0
 * @returns {(...childs) => ReactiveElement}
 */
const TAG = function (arg0) {
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
TAG.a = newElement("a");
TAG.abbr = newElement("abbr");
TAG.address = newElement("address");
TAG.area = newElement("area");
TAG.article = newElement("article");
TAG.aside = newElement("aside");
TAG.audio = newElement("audio");
// [B]
TAG.b = newElement("b");
TAG.base = newElement("base");
TAG.bdi = newElement("bdi");
TAG.bdo = newElement("bdo");
TAG.blockquote = newElement("blockquote");
TAG.body = newElement("body");
TAG.br = newElement("br");
TAG.button = newElement("button");
// [C]
TAG.canvas = newElement("canvas");
TAG.caption = newElement("caption");
TAG.cite = newElement("cite");
TAG.code = newElement("code");
TAG.col = newElement("col");
TAG.colgroup = newElement("colgroup");
// [D]
TAG.data = newElement("data");
TAG.datalist = newElement("datalist");
TAG.dd = newElement("dd");
TAG.del = newElement("del");
TAG.details = newElement("details");
TAG.dfn = newElement("dfn");
TAG.dialog = newElement("dialog");
TAG.div = newElement("div");
TAG.dl = newElement("dl");
TAG.dt = newElement("dt");
// [E]
TAG.em = newElement("em");
TAG.embed = newElement("embed");
// [F]
TAG.fieldset = newElement("fieldset");
TAG.figcaption = newElement("figcaption");
TAG.figure = newElement("figure");
TAG.footer = newElement("footer");
TAG.form = newElement("form");
// [H]
TAG.h1 = newElement("h1");
TAG.h2 = newElement("h2");
TAG.h3 = newElement("h3");
TAG.h4 = newElement("h4");
TAG.h5 = newElement("h5");
TAG.h6 = newElement("h6");
TAG.head = newElement("head");
TAG.header = newElement("header");
TAG.hgroup = newElement("hgroup");
TAG.hr = newElement("hr");
TAG.html = newElement("html");
// [I]
TAG.i = newElement("i");
TAG.iframe = newElement("iframe");
TAG.img = newElement("img");
TAG.input = newElement("input");
TAG.ins = newElement("ins");
// [K]
TAG.kbd = newElement("kbd");
// [L]
TAG.label = newElement("label");
TAG.legend = newElement("legend");
TAG.li = newElement("li");
TAG.link = newElement("link");
// [M]
TAG.main = newElement("main");
TAG.map = newElement("map");
TAG.mark = newElement("mark");
TAG.math = newElement("math");
TAG.menu = newElement("menu");
TAG.meta = newElement("meta");
TAG.meter = newElement("meter");
// [N]
TAG.nav = newElement("nav");
TAG.noscript = newElement("noscript");
// [O]
TAG.object = newElement("object");
TAG.ol = newElement("ol");
TAG.optgroup = newElement("optgroup");
TAG.option = newElement("option");
TAG.output = newElement("output");
// [P]
TAG.p = newElement("p");
TAG.picture = newElement("picture");
TAG.pre = newElement("pre");
TAG.progress = newElement("progress");
// [Q]
TAG.q = newElement("q");
// [R]
TAG.rp = newElement("rp");
TAG.rt = newElement("rt");
TAG.ruby = newElement("ruby");
// [S]
TAG.s = newElement("s");
TAG.samp = newElement("samp");
TAG.script = newElement("script");
TAG.search = newElement("search");
TAG.section = newElement("section");
TAG.select = newElement("select");
TAG.slot = newElement("slot");
TAG.small = newElement("small");
TAG.source = newElement("source");
TAG.span = newElement("span");
TAG.strong = newElement("strong");
TAG.style = newElement("style");
TAG.sub = newElement("sub");
TAG.summary = newElement("summary");
TAG.sup = newElement("sup");
TAG.svg = newElement("svg");
// [T]
TAG.table = newElement("table");
TAG.tbody = newElement("tbody");
TAG.td = newElement("td");
TAG.template = newElement("template");
TAG.textarea = newElement("textarea");
TAG.tfoot = newElement("tfoot");
TAG.th = newElement("th");
TAG.thead = newElement("thead");
TAG.time = newElement("time");
TAG.title = newElement("title");
TAG.tr = newElement("tr");
TAG.track = newElement("track");
// [U]
TAG.u = newElement("u");
TAG.ul = newElement("ul");
// [V]
TAG.var = newElement("var");
TAG.video = newElement("video");
// [W]
TAG.wbr = newElement("wbr");

//
// Shortcuts
//
TAG.input_hidden = newElement("input", { type: "hidden" });
TAG.input_text = newElement("input", { type: "text" });
TAG.input_search = newElement("input", { type: "search" });
TAG.input_tel = newElement("input", { type: "tel" });
TAG.input_url = newElement("input", { type: "url" });
TAG.input_email = newElement("input", { type: "email" });
TAG.input_password = newElement("input", { type: "password" });
TAG.input_date = newElement("input", { type: "date" });
TAG.input_month = newElement("input", { type: "month" });
TAG.input_week = newElement("input", { type: "week" });
TAG.input_time = newElement("input", { type: "time" });
TAG.input_datetime_local = newElement("input", { type: "datetime-local" });
TAG.input_number = newElement("input", { type: "number" });
TAG.input_range = newElement("input", { type: "range" });
TAG.input_color = newElement("input", { type: "color" });
TAG.input_checkbox = newElement("input", { type: "checkbox" });
TAG.input_radio = newElement("input", { type: "radio" });
TAG.input_file = newElement("input", { type: "file" });
TAG.input_submit = newElement("input", { type: "submit" });
TAG.input_image = newElement("input", { type: "image" });
TAG.input_reset = newElement("input", { type: "reset" });
TAG.input_button = newElement("input", { type: "button" });

//
// Helper functions
//

/**
 *
 * @param {ReactiveValue} rv
 */
TAG.IF = function (rv) {
  assert(rv instanceof ReactiveValue);

  return function (...childs) {
    return () => (rv.read() ? childs : []);
  };
};

TAG.IF_static = function (condition) {
  return (...args) => (condition ? args : []);
};

export { TAG, newCallback, newValue };
