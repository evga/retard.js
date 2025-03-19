import { assert } from "./util.js";
import { ReactiveCallback } from "./callback.js";
import { ReactiveElement } from "./element.js";
import { ReactiveValue } from "./value.js";

/**
 *
 * @param {*} initialValue
 * @returns
 */
export function newValue(initialValue) {
  return new ReactiveValue(initialValue);
}

/**
 *
 * @param {Function} callback
 * @returns
 */
export function newCallback(callback) {
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
export const TAG = function (arg0) {
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
