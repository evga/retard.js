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
  enableStats: false,
  enableLog: true
};

let NEXT_ID$1 = 1;

const StopSymbol = Symbol("stop");

///** @type {ReactiveCallback[]} */
//export const callbacks = [];

class ReactiveCallback {
  #id = NEXT_ID$1++;
  desc;

  /**
   * @param {Function} fn 
   */
  constructor(fn) {
    assert(fn instanceof Function);

    this.fn = fn;

    if (config.enableStats) {
      this.executeStats = new Aggregate();
      //callbacks.push(this);
    }

    if (config.enableLog)
      console.debug(`NEW RC#${this.#id} = ${fn}`);
  }

  execute(...args) {
    if (typeof this.fn !== 'function')
      return StopSymbol;

    const t0 = performance.now();

    if (config.enableLog)
      console.debug(`EXECUTE ${this}`);

    stack.push(this);
    try {
      return this.fn(...args);
    } finally {
      stack.pop();
      if (this.executeStats)
        this.executeStats.update(performance.now() - t0);
    }
  }

  toString() {
    return `CB#${this.#id} ${this.desc ?? this.fn}`;
  }
}

function newCallback(callback) {
  return new ReactiveCallback(callback);
}

let NEXT_ID = 1;

/** @type {ReactiveValue[]} */
const values = [];

class ReactiveValue {
  #id = NEXT_ID++;

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

    if (config.enableLog)
      console.debug(`NEW RV#${this.#id} = ${this.value}`);
  }

  capture() {
    if (stack.current) {
      this.callbacks.add(stack.current);

      if (config.enableLog)
        console.debug(`CAPTURE RV#${this.#id} <<< ${stack.current}`);
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
    if (config.enableLog)
      console.debug(`CHANGED ${this.value}`);

    const t0 = performance.now();
    const toRemove = [];

    for (const cb of this.callbacks) {
      if (cb.execute() === StopSymbol) {
        toRemove.push(cb);

      }
    }

    for (const cb of toRemove) {
      this.callbacks.delete(cb);
      if (config.enableLog)
        console.debug(`LETGO ${cb}`);
      //console.log("removed callback", cb);
    }

    if (this.changedStats) {
      this.changedStats.update(performance.now() - t0);
    }
  }

  map(cb) {
    this.capture();
    if (Array.isArray(this.value)) {
      return this.value.map(cb);
    } else {
      throw new Error("no array");
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

// Global registry


// [obj, name listener, options]
let events = [];

// [obj, ReactiveCallback]
let callbacks = [];

function regEvents() {
  return events;
}

function regCallbacks() {
  return callbacks;
}

/**
 * 
 * @param {EventTarget} obj 
 * @param {*} name 
 * @param {*} listener 
 * @param {*} [options]
 */
function regAddEvent(obj, name, listener, options) {
  obj.addEventListener(name, listener, options);
  events.push([obj, name, listener, options]);
}

/**
 * 
 * @param {*} obj 
 * @param {Function} fn 
 * @returns 
 */
function regAddCallback(obj, fn) {
  assert(fn instanceof Function);

  const cb = new ReactiveCallback(fn);
  callbacks.push([obj, cb]);
  return cb;
}


function regDetach(obj) {
  for (const item of events) {
    if (item[0] === obj) {
      if (config.enableLog)
        console.debug(`DETACH ${item}`);
      item[0].removeEventListener(item[1], item[2], item[3]);
    }
  }

  for (const item of callbacks) {
    if (item[0] === obj) {
      if (config.enableLog)
        console.debug(`DETACH ${item}`);
      item[1].callback = null;
      item[1].description = null;
    }
  }

  events = events.filter(v => v[0] !== obj);
  callbacks = callbacks.filter(v => v[0] !== obj);
}

/**
 * @param {HTMLInputElement} el
 * @param {ReactiveValue} rv
 */
function bindInputElement(el, rv) {
  const desc = `${el.tagName}[type=${el.type}].bind(${rv.value})`;

  if (el.matches('[type="checkbox"]')) {
    const setRV = () => rv.write(el.checked);
    const setEL = () => (el.checked = rv.read());
    regAddEvent(el, "change", setRV);
    const cb = regAddCallback(el, setEL);
    cb.desc = desc;
    cb.execute();
  } else {
    const setRV = () => rv.write(el.value);
    const setEL = () => (el.value = rv.read());
    regAddEvent(el, "input", setRV);
    const cb = regAddCallback(el, setEL);
    cb.desc = desc;
    cb.execute();
  }
}

/**
 * @param {HTMLSelectElement} el
 * @param {ReactiveValue} rv
 */
function bindSelectElement(el, rv) {
  const desc = `${el.tagName}.bind(${rv.value})`;

  if (el.multiple) {
    // TODO
  } else {
    // single
    const setRV = () => rv.write(el.value);
    const setEL = () => (el.value = rv.read());
    regAddEvent(el, "change", setRV);
    
    const cb = regAddCallback(el, setEL);
    cb.desc = desc;
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
    this.callback = regAddCallback(container.element, () => this.#swap());
    this.callback.desc = `ReactiveChild(${userCallback})`;
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
    //assert(this instanceof ReactiveChild);

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

// <key>
const eventKeyRegex = new RegExp("^<(\\w+)>$");

// name[attr=value]
const eventFilterRegex = new RegExp("^(\\w+)\\[(\\w+)=(\\w+)]$");

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
      const value = obj[key];

      if (value instanceof ReactiveValue) {
        const self = this;
        const cb = regAddCallback(this.element, () => 
          self.element.setAttribute(key, value.read()));
        cb.desc = `Reactive attribute ${this.element.tagName}.${key} = ${value}`;
        cb.execute();
      } else {
        this.element.setAttribute(key, value);
      }
    }

    return this;
  }

  prop(obj) {
    assert(typeof obj === "object");

    for (const key in obj) {
      const value = obj[key];

      if (value instanceof ReactiveValue) {
        const self = this;
        const cb = regAddCallback(this.element, () => 
          self.element[key] = value.read());
        cb.desc = `Reactive prop ${this.element.tagName}.${key} = ${value}`;
        cb.execute();
      } else {
        this.element[key] = value;
      }
    }

    return this;
  }

  bind(value) {
    bindElement(this.element, value);
    return this;
  }

  on(eventName, listener, options) {

    // addEventListener
    // [type] - A case-sensitive string
    // [listener] - null | object with handleEvent() | function

    if (typeof eventName === 'string' && typeof listener === 'function') {
      
      const eventKey = eventKeyRegex.exec(eventName);
      if (eventKey) eventName = `keydown[key=${eventKey[1]}]`;

      const eventFilter = eventFilterRegex.exec(eventName);

      if (eventFilter) {
        const name = eventFilter[1];
        const attrName = eventFilter[2];
        const attrValue = eventFilter[3];

        regAddEvent(this.element, name, function (e) {
          if (e[attrName] && e[attrName] == attrValue) // NO strict equality
            listener.call(this, e); // keep this = Element
        }, options);

      } else {
        regAddEvent(this.element, eventName, listener, options);
      }
    } else {
      regAddEvent(this.element, eventName, listener, options);
    }

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

function tag(tagName, attr) {
  const el = document.createElement(tagName);
  if (typeof attr === "object") {
    for (const a in attr) el.setAttribute(a, attr[a]);
  }

  return function (...args) {
    el.append(...args.flat(Infinity));
    return el;
  };
}

function tsection(desc) {
  return tag("tr")(
    tag("td", { colspan: "6", style: "background-color: #000; color: #fff" })(
      desc ?? ""
    )
  );
}

function tspan(desc) {
  return tag("tr", { style: "border-bottom: 1px solid #666" })(
    tag("td", { colspan: "6", style: "background-color: #ccc" })(desc ?? "")
  );
}

function tline(desc, cnt, sum, min, max, avg) {
  if (cnt instanceof Aggregate) {
    const a = cnt;
    cnt = a.cnt;
    sum = a.sum;
    min = a.vmin;
    max = a.vmax;
    avg = a.avg.toFixed(1);
  }
  const style1 = "background-color: #999999; color: #000";
  const style2 = "text-align: center; background-color: #cccc66";
  const style3 = "text-align: center; background-color: #6666cc";
  return tag("tr")(
    tag("td", { style: style1 })(desc ?? ""),
    tag("td", { style: style2 })(cnt ?? ""),
    tag("td", { style: style3 })(sum ?? ""),
    tag("td", { style: style3 })(min ?? ""),
    tag("td", { style: style3 })(max ?? ""),
    tag("td", { style: style3 })(avg ?? "")
  );
}

function report({ tags = true, details = false } = {}) {
  return tag("table", {
    style: "border-collapse: collapse; font-family: monospace; font-size: 12px; width: 100%"
  })(
    tline("metric", "cnt", "sum", "min", "max", "avg"),
    tsection(`Registry:Events`),
    ...regEvents().map(c => [
      tspan(`${c[0].tagName}.on${c[1]} --- ${c[2]}`)
    ]),
    tsection(`Registry:Callbacks`),
    ...regCallbacks().map(c => [
      tspan(`${c[0].tagName} >>> ${c[1]}`),
      tline('execute', c.executeStats)
    ]),
    //tags ? tsection(`Tags`) : "",
    //...Object.entries(stats.tags).map(([k, v]) => [tags ? tline(k, v) : ""]),
    tsection(`Values: ${values.length}`),
    ...values.map((c) => [

      tspan(`[${typeof c.value}] ${c.value}`), // careful here
      details ? tline("callbacks", c.callbacks.size) : "",
      details ? tline("reads", c.readStats) : "",
      details ? tline("writes", c.writeStats) : "",
      details ? tline("changes", c.changedStats) : ""
    ]),
    //tsection(`Callbacks: ${callbacks.length}`),
    //...callbacks.map((c) => [
      //tspan(`${c}`),
      //details ? tline(`stopped=${c.stopped}`) : "",
      //details ? tline("execute", c.executeStats) : ""
    //])
  );
}

// Public API

export { newCallback, newTag, newValue, report };
