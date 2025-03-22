# RETARD.js

Reactive Javascript framework:

## Examples

- [RETARD.js - Examples](https://evga.github.io/retard.js/)

## Quickstart

Download links:

- [retard.js](https://raw.githubusercontent.com/evga/retard.js/refs/heads/main/bundle/retard.js)
- [retard.min.js](https://raw.githubusercontent.com/evga/retard.js/refs/heads/main/bundle/retard.min.js)

Put this inside `index.html`

```html
<!DOCTYPE html>
<html>
<body>
  <div id="app"></div>
  <script type="module" src="app.js"></script>
</body>
</html>
```

Put this inside `app.js`

```js
import { newTag as $, newValue } from './retard.js'

$('#app')(
  'Hello from RETARD.js'
)
```

If everything works you should see the hello message.
