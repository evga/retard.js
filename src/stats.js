import { Aggregate } from "./util.js";
//import { callbacks } from "./callback.js";
import { values } from "./value.js";
import { regCallbacks, regEvents } from "./registry.js";

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

export function report({ tags = true, details = false } = {}) {
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
