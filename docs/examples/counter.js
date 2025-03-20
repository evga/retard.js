import { newTag as $, newValue } from "../scripts/retard.js";

function Counter({ start = 1 }) {
  const counter = newValue(start);

  const increment = function () {
    counter.value++;
    counter.changed(); // <-- force update
  };

  return $
    .button(() => `count=${counter}`) // <-- reactive callback
    .on("click", increment);
}

export default [
  Counter({}),
  Counter({ start: 55 })
];
