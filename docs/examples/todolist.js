import { newTag as $, newValue } from "../scripts/retard.js";

function TodoList() {
  const todos = newValue([
    { text: 'dance all night', done: newValue(false) },
    { text: 'dream about the future', done: newValue(false) },
    { text: 'add button to delete todos :D', done: newValue(false) },
  ]);

  function newTodo(e) {
    if (this.value) {
      todos.value.push({ text: this.value, done: newValue(false) });
      todos.changed(); // <-- force update
      this.value = '';
    }
  }

  function renderItemText(item) {
    const done = item.done.read(); // <-- capture the function
    const style = done ? 'text-decoration: line-through' : '';
    return $.span(item.text).attr({ style: style });
  }

  function renderItem(item) {
    return $.li(
      $.label(
        $.input_checkbox().bind(item.done), // <-- data binding
        () => renderItemText(item) // <-- reactive callback
      )
    );
  }

  function renderList() {
    const list = todos.read(); // <-- capture the function
    return list.length > 0
      ? list.map(renderItem)
      : 'The list is empty';
  }

  return [
    $.input()
      .attr({ placeholder: 'Todo ...' })
      .on('<Enter>', newTodo), // key press shortcut
    $.p('My todo list'),
    $.ul(renderList) // <-- reactive callback
  ];
}

export default [
  TodoList()
];
