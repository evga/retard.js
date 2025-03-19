import { TAG, newValue } from "../scripts/retard.js";

function Counter({ start = 1 }) {
  const counter = newValue(start);

  const increment = function () {
    counter.value++;
    counter.changed();
  };

  return TAG
    .button(() => `count=${counter}`)
    .on("click", increment);
}

export default [
  Counter({}),
  Counter({ start: 55 })
]
