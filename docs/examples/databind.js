import { newTag as $, newValue } from "../scripts/retard.js";

function Component() {
  const text = newValue('123');
  const chk = newValue(false);

  return $.div(
    $.input().bind(text).prop({ disabled: chk }),
    $.div(() => `${text}`),
    $.hr(),
    $.label(
      $.input_checkbox().bind(chk),
      'Disabled'
    ),
    $.hr(),
    $.select(
      $.option('a'),
      $.option('b'),
      $.option('c'),
    ).bind(text)
  );
}

export default [
  Component()
];
