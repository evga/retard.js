- [About](#about)
- [Examples](#examples)
- [Quickstart](#quickstart)
- [Concepts](#concepts)
  - [Reactivity](#reactivity)
  - [Reactive Values](#reactive-values)
  - [Reactive Elements](#reactive-elements)
  - [Reactive Childs](#reactive-childs)
  - [Reactive Attributes](#reactive-attributes)
  - [Components](#components)
- [ReactiveElement](#reactiveelement)
  - [Method: attr(obj)](#method-attrobj)
  - [Method: prop(obj)](#method-propobj)
  - [Method: bind(value)](#method-bindvalue)
  - [Method: on(eventName, listener, \[options\])](#method-oneventname-listener-options)
- [ReactiveValue](#reactivevalue)
- [ReactiveCallback](#reactivecallback)
- [Performance](#performance)


## About

RETARD.js is a small framework that:

- Just works (no JSX/React/Node.js bullshit)
- Is meant for personal / quick projects
- Uses vanilla javascript for:
  - components: a simple javascript function
  - structure: html tags are created using code
- Requires a modern browser
- Supports data binding
- ...

## Examples

There is a page with live examples and source code:

- [RETARD.js - Examples](https://evga.github.io/retard.js/)

You can also check the `/docs/examples` folder.

## Quickstart

RETARD.js is an ES6 Module:

- you HAVE to use a script with `type="module"`
- you NEED a web server

> [!CAUTION]
> Trying to load a module without a web server will result in a cors-whatever-bullshit error!

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
import { newTag, newValue } from './retard.js'

newTag('#app')(
  'Hello from RETARD.js'
)
```

If everything works you should see the hello message.

> [!IMPORTANT]
> Your editor might try to import from `./retard` instead of `./retard.js` - the `.js` extension is needed to make it work.

## Concepts

These are the important functions you have to remember:

- `newTag` - Used to create a `ReactiveElement`
- `newValue` - Used to create a `ReactiveValue`
- `newCallback` - Used to create a `ReactiveCallback`

To make it easier to build the UI with the `newTag` function it will be renamed to the `$` symbol like this:

```js
import { newTag as $, newValue } from './retard.js'
```

### Reactivity

Reactivity is implemented in the following way:

- A `ReactiveValue` can capture the current function
  - this happens only if the function uses `v.read()` and ...
  - if the function is wrapped in a `ReactiveCallback`
- The function will be called again if/when the value is updated
  - this happens when you do `value.write()` or ...
  - when you do `value.changed()`
- A `ReactiveElement` allows:
  - functions to be defined as childs:
    - these functions are wrapped in a `ReactiveCallback`
    - reactive childs are automatically re-created when needed
  - 1-way data-bind of attributes
  - 2-way data-bind with specific elements
  - ...

### Reactive Values

A reactive value is any value that is wrapped inside a `ReactiveValue` object.

Use the `newValue` function to create them:

```js
const name = newValue('Timmy');
const age = newValue(12);
```

Use `.value` to access the wrapped value directly:

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

```js
age.value++
age.changed()
```

> [!IMPORTANT]
> Using `v.value` directly DOES NOT trigger reactivity

> [!NOTE]
> Other frameworks provide ways to read the value without triggering reactivity. This is not needed here, just access `v.value` directly.

> [!NOTE]
> Using `v.read()` makes sense only if you are inside a reactive function. Using it from a normal function is the same as using `v.value` directly.

> [!CAUTION]
> Using `v.write()` inside a reactive callback will create a massive black hole (also known as infinite loop). To avoid this, the library throws an exception if you try to do it.

### Reactive Elements

A `ReactiveElement` object is a wrapper for the result of `document.createElement()`.

Use the `$` function to create a `ReactiveElement`:

```js
// Create new elements

$('div')  // function call syntax
$.div     // property syntax

// Attach to existing elements

$(document.body) // using the element directly
$('#app')        // using the element ID
```

The basic syntax for the `$` function is:

```js
$('tagName')(...childs) // or
$.tagName(...childs)
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
$.div(
  $.input(),
  $.button('Click me!')
)

// function syntax
$('div')(
  $('input')(),
  $('button')('Click me!')
)
```

> [!NOTE]
> Most javascript libraries that allow the creation of elements with pure code use many parameters inside a single function call, like `newTag('div', {attr: value}, [child1, child2, ...])` - this quickly becomes a nightmare to maintain since there are too many nested parenthesis eventually.

Once you have a `ReactiveElement` you can enhance it with additional attributes and events:

- use `.on()` to attach event handlers
- use `.attr()` to change the element's attributes
- etc...

For example if you have this html:
```html
<form class="myForm" onsubmit="submitForm(event)">
  <input type="text" name="name">
  <button type="submit">Submit</button>
</form>

<script>
  function submitForm(e) {
    if (!confirm('Are you sure?'))
      e.preventDefault();
  }
</script>
```

This is the equivalent code in RETARD.js:

```js
$.form(
  $.input().attr({ type: 'text', name: 'name' }),
  $.button('Submit').attr({ type: 'submit' }),
)
.attr({ class: 'myForm' })
.on('click', function(e) {
  if (!confirm('Are you sure?'))
    e.preventDefault();
})
```

If you have a `ReactiveElement` and you need to append it inside another DOM node you will have to get a reference to the wrapped object first using the  `.element` property.

This operation is automatic for childs of `ReactiveElement`.

```js
const myDiv = $.div() // a ReactiveElement

document.body.append(myDiv) // WRONG
document.body.append(myDiv.element) // OK

$(document.body)(myDiv) // OK
$(document.body)(myDiv.element) // OK
```

### Reactive Childs

So far we've created a bunch of html elements using javascript but there is nothing special about it. Let's introduce the concept of reactive childs.

Look at this piece of code:

```js
let name = 'Timmy'

$('#app')(
  `Hello from ${name}`
)

name = 'Jimmy'
```
This will obviously print `Hello from Timmy` since the child element is created and appended to the `#app` before we execute the last line.

Now look at this:

```js
const name = newValue('Timmy')

$('#app')(
  () => `Hello from ${name.read()}`
)

name.write('Jimmy')
```

This will print `Hello from Jimmy` - this is a reactive child:
- we use `newValue` to make a `ReactiveValue`
- we convert the child into a function adding the [arrow function expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- we use `.read()` to print the value because...
  - we are now inside a `ReactiveCallback`
- we use the `.write()` method to update the value

> [!TIP]
> It is possible to omit the `.read()` call when you are creating strings with the template syntax - since `ReactiveValue.toString()` is also capable of capturing the current function you can just write `Hello from ${name}`

Reactive childs can be nested and you can have many of them, mixed with normal text childs or non-reactive childs:

```js
$('#app')(
  'a text node',
  $.div('hello'), // non reactive child
  $.div(() => `${greeting}`), // reactive version
  () => [ // a reactive child returning two elements
    `${greeting}`,
    $.div(() => `${name}`) // nested function
  ]
)
```
In this example:
- changing `greeting` will:
  - change the content of the second div
  - execute the first function, creating a new array
- changing `name` will:
  - change the content of the last div

### Reactive Attributes

TODO

### Components

TODO


## ReactiveElement

All methods of this class return the current element to allow chaining.

### Method: attr(obj)

Set element attributes.

**Parameters**:
- obj - Must be an object

**Example**:
```js
$.div().attr({
  id: 'myDiv',
  class: 'myCssClass'
})
```

**Example (reactive)**:
```js
const dynamicStyle = newValue('color: red')

$.div('content').attr({
  id: 'myDiv',
  style: dynamicStyle
})

// later ...

dynamicStyle.write('color: green')
```

### Method: prop(obj)

Set element properties.

**Parameters**:
- obj - Must be an object

**Example**:
```js
$.div().prop({ innerHTML: '<b>xxx</b>' })
```

**Example (reactive)**:
```js
const html = newValue('<b>aaa</b>')

$.div().prop({ innerHTML: html })

// later ...
html.write('<b>xxx</b>')
```

### Method: bind(value)

Perform 2-way data binding specific to each type of element.

**Parameters**:
- value - Must be a `ReactiveValue`

**Supported controls and value types**:
- HTMLInputElement
  - text (string)
  - checkbox (boolean)
- HTMLSelectElement
  - single selection (string)

**Example**:
```js
const value = newValue('Timmy')

$.input().bind(value)
```

### Method: on(eventName, listener, [options])

Wrapper for [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) with some additions.

**Parameters**:
- see [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)


**Normal usage**:
```js
$.button().on('click', ...)
```

**Extension: specific attribute**
```js
$.input().on('keydown[key=Enter]', ...)
```

**Extension: specific keydown**
```js
$.input().on('<Enter>', ...)
```

## ReactiveValue

## ReactiveCallback

## Performance

TODO: talk about the stats module

TODO: talk about breaking trees into smaller functions

