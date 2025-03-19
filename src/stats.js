import { ReactiveCallback } from "./callback";
import { ReactiveValue } from "./value";

export const stats = {
  _enabled: true,
  /** @type {ReactiveCallback[]} */ callbacks: [],
  /** @type {ReactiveValue[]} */ values: [],
  tags: {},
  addTag: function (tagName) {
    if (stats.tags[tagName] === undefined) {
      stats.tags[tagName] = new Aggregate();
    }
    stats.tags[tagName].counter();
  }
  //elements: []
};

export class Aggregate {
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

function callbackDesc(c) {
  if (c.description) {
    if (typeof c.description === "function") return c.description();
    else return c.description;
  } else if (c.userCallback) {
    return String(c.userCallback);
  } else {
    return String(c.callback);
  }
}

export function report({ tags = true, details = false } = {}) {
  return tag("table", {
    style: "border-collapse: collapse; font-size: 12px; width: 100%"
  })(
    tline("metric", "cnt", "sum", "min", "max", "avg"),
    tags ? tsection(`Tags`) : "",
    ...Object.entries(stats.tags).map(([k, v]) => [tags ? tline(k, v) : ""]),
    tsection(`Values: ${stats.values.length}`),
    ...stats.values.map((c) => [

      tspan(`[${typeof c.value}] ${c.value}`), // careful here
      details ? tline("callbacks", c.callbacks.size) : "",
      details ? tline("reads", c.stats_reads) : "",
      details ? tline("writes", c.stats_writes) : "",
      details ? tline("changes", c.stats_changes) : ""
    ]),
    tsection(`Callbacks: ${stats.callbacks.length}`),
    ...stats.callbacks.map((c) => [
      tspan(callbackDesc(c)),
      details ? tline(`stopped=${c.stopped}`) : "",
      details ? tline("execute", c.stats_execute) : ""
    ])
  );
}
