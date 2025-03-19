import { TAG } from "./retard.js";
import Counter from "./counter.js";

const CounterTags = () =>
  TAG.div(
    Counter({}),
    Counter({ start: 77 })
  );

TAG("#app")(
  TAG.h2("Counter"),
  TAG.p("A simple button that increments a counter."),
  CounterTags(),
  TAG.pre(
    TAG.code(
      String(Counter),
      "\r\n\r\n",
      String(CounterTags).slice(6).trim())
  )
);
