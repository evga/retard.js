import { newTag as $ } from "./retard.js";
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
    $.div(obj.title)
      .attr({ class: 'title' })
      .on('click', e => e.target.nextSibling.classList.toggle('hidden')),
    $.div(
      $.div(obj.els).attr({ class: 'live' }),
      $.pre($.code(js))
    ).attr({ class: `example ${obj.els === devmode ? '' : 'hidden'}` })
  ];

}

async function buildPage() {
  $("#app")(await Promise.all(examples.map(buildExample)));
}

await buildPage();

// @ts-ignore
hljs.highlightAll();

