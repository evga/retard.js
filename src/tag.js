import { ReactiveElement, newElement, wrapElement } from "./element.js";
import { ReactiveValue } from "./value.js";

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

export { newTag };
