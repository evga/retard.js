import { TAG, newValue } from "./retard.js";

export default function Counter({ start = 1 }) {
  const counter = newValue(start);

  const increment = function () {
    counter.value++;
    counter.changed();
  };

  return TAG
    .button(() => `count=${counter}`)
    .on("click", increment);
}
