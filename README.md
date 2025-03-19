# RETARD.js - Reactivity for Dummies

<!-- vscode-markdown-toc -->
* [About](#About)
* [Examples](#Examples)
* [Quickstart](#Quickstart)
* [Basic usage](#Basicusage)
	* [Reactive Values](#ReactiveValues)
	* [Reactive Elements](#ReactiveElements)
	* [Reactive Callbacks](#ReactiveCallbacks)
	* [Components](#Components)
* [Reference](#Reference)
	* [ReactiveElement](#ReactiveElement)
	* [ReactiveValue](#ReactiveValue)
	* [ReactiveCallback](#ReactiveCallback)

<!-- vscode-markdown-toc-config
	numbering=false
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->

## <a name='About'></a>About

RETARD.js is a small framework that:

- Just works (no JSX/React/Node.js bullshit)
- Is meant for personal / quick projects
- Uses vanilla javascript for:
  - components: a simple javascript function
  - structure: html tags are created using code
- Requires a modern browser
- Supports data binding
- ...

## <a name='Examples'></a>Examples

There is a page with live examples and source code:

- [RETARD.js - Examples](https://evga.github.io/retard.js/)

## <a name='Quickstart'></a>Quickstart

RETARD.js is an ES6 Module:

- you NEED to use a script with `type="module"`
- you NEED a web server

> [!CAUTION]
> Trying to load a module without a web server will result in an cors-whatever-bullshit error!

Download the latest version:

- [retard.js](https://raw.githubusercontent.com/evga/retard.js/refs/heads/main/bundle/retard.js)
- [retard.min.js](https://raw.githubusercontent.com/evga/retard.js/refs/heads/main/bundle/retard.min.js)

Given the most basic folder structure:

- [my-project]
  - index.html
  - app.js
  - retard.js

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
import { TAG } from './retard.js'

TAG('#app')(
  'Hello from RETARD.js'
)
```

If everything works you should see the hello message.

> [!IMPORTANT]
> Your editor might try to import from `./retard` instead of `./retard.js` - the `.js` extension is needed to make it work.

## <a name='Basicusage'></a>Basic usage

Everything you can do is hidden behind a bunch of public objects that you have to remember:

- `TAG` - Create and configure reactive elements
- `newValue` - Create reactive values
- `newCallback` - Create reactive functions (advanced)

### <a name='ReactiveValues'></a>Reactive Values

A reactive value is just a plain javascript value or object that is wrapped using the `newValue` function:

```js
const name = newValue('Timmy');
const age = newValue(12);
```

Use `.value` to access the wrapped value:

```js
name.value // => 'Timmy'
age.value  // => 12
```

Use `.read()` and `.write()` to make it reactive:

```js
name.read() // => 'Timmy'
name.write('Jimmy')
```

To force an update use the `.changed()` function:

```
age.value++
age.changed()
```


### <a name='ReactiveElements'></a>Reactive Elements

The `TAG` object can be used to:

```js
// Create new elements

TAG('div')  // function call syntax
TAG.div     // property syntax

// Attach to exisiting elements

TAG(document.body) // using the element directly
TAG('#app')        // using the element ID
```

The basic syntax for the tag object is:

```js
TAG(tagName)(...childs) // or
TAG.tagName(...childs)
```

For example, to create the following html structure:

```html
<div>
  <input>
  <button>Click me!</button>
</div>
```

You have to write the following code:

```js
// property syntax
TAG.div(
  TAG.input(),
  TAG.button('Click me!')
)

// function syntax
TAG('div')(
  TAG('input')(),
  TAG('button')('Click me!')
)
```
I think the first way (property syntax) is cooler so I'm gonna use it for the rest of this document.

> [!NOTE]
> Most javascript libraries that allow the creation of elements with pure code use many parameters inside a single function call, like `newTag('div', {attr: value}, [child1, child2, ...])` - this quicky becomes a nightmare to mantain since there are too many nested parenthesis eventually. This library takes a different approach.

> [!TIP]
> You can rename the `TAG` object when you import it!
```js
import { TAG as $ } from './retard.js'

$.div(
  $.input(),
  $.button('Click me!')
)
```
Elements created this way are wrapped inside a class called `ReactiveElement` that allows further modifications:

- use `.on()` to attach normal event handlers
- use `.attr()` to change the element's attributes
- use `.bind()` to perform databinding for common controls
- use `.ref()` to save a reference to the element
- and many more ...

> [!NOTE]
> Since elements are wrapped they are not usable directly but needs to be un-wrapped first. This operation happens automatically for elements defined as childs of `TAG` objects.

### <a name='ReactiveCallbacks'></a>Reactive Callbacks
### <a name='Components'></a>Components

## <a name='Reference'></a>Reference

### <a name='ReactiveElement'></a>ReactiveElement

### <a name='ReactiveValue'></a>ReactiveValue

### <a name='ReactiveCallback'></a>ReactiveCallback

## Performance
