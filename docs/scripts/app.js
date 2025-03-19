import { TAG } from "./retard.js";
import counter from "../examples/counter.js";
import todolist from "../examples/todolist.js";

const devmode = todolist;

const examples = [
  {
    els: counter,
    url: 'examples/counter.js',
    title: 'Counter'
  },
  {
    els: todolist,
    url: 'examples/todolist.js',
    title: 'Todo list',
  },
];

async function getSource(url) {
  const res = await fetch(url);
  const txt = await res.text();
  return txt;
}

async function buildExample(obj) {
  const js = await getSource(obj.url);
  return [
    TAG
      .div(obj.title)
      .attr({ class: 'title' })
      .onclick(e => e.target.nextSibling.classList.toggle('hidden')),
    TAG.div(
      TAG.div(obj.els).attr({ class: 'live' }),
      TAG.pre(TAG.code(js))
    ).attr({ class: `example ${obj.els === devmode ? '' : 'hidden'}` })
  ];

}

async function buildPage() {
  TAG("#app")(await Promise.all(examples.map(buildExample)));
}

await buildPage();

// @ts-ignore
hljs.highlightAll();

