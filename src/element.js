import { bindElement } from "./databind.js";
import { assert } from "./util.js";
import { ReactiveContainer } from "./container.js";

// <key>
const eventKeyRegex = new RegExp("^<(\\w+)>$");

// name[attr=value]
const eventFilterRegex = new RegExp("^(\\w+)\\[(\\w+)=(\\w+)]$");

export class ReactiveElement {
  /**
   * @param {Element} element
   * @param {Array} childArray
   */
  constructor(element, childArray) {
    assert(element instanceof Element);
    assert(Array.isArray(childArray));

    this.container = new ReactiveContainer(element, childArray);
  }

  get element() {
    return this.container.element;
  }

  attr(obj) {
    assert(typeof obj === "object");

    for (const key in obj) {
      this.element.setAttribute(key, obj[key]);
    }

    return this;
  }

  bind(value) {
    bindElement(this.element, value);
    return this;
  }

  on(eventName, listener, options) {

    // addEventListener
    // [type] - A case-sensitive string
    // [listener] - null | object with handleEvent() | function

    if (typeof eventName === 'string' && typeof listener === 'function') {
      
      const eventKey = eventKeyRegex.exec(eventName);
      if (eventKey) eventName = `keydown[key=${eventKey[1]}]`;

      const eventFilter = eventFilterRegex.exec(eventName);

      if (eventFilter) {
        const name = eventFilter[1];
        const attrName = eventFilter[2];
        const attrValue = eventFilter[3];

        this.element.addEventListener(name, function (e) {
          if (e[attrName] && e[attrName] == attrValue) // NO strict equality
            listener.call(this, e); // keep this = Element
        }, options);

      } else {
        this.element.addEventListener(eventName, listener, options);
      }
    } else {
      this.element.addEventListener(eventName, listener, options);
    }

    return this;
  }
}

/**
 * @param {string} tagName
 * @param {object} [attributes]
 */
export function newElement(tagName, attributes) {
  assert(typeof tagName === "string");
  assert(tagName.length > 0);

  return function (...childs) {
    const el = document.createElement(tagName);
    const result = new ReactiveElement(el, childs);
    if (attributes) result.attr(attributes);
    return result;
  };
}

/**
 * @param {Element} existingElement
 */
export function wrapElement(existingElement) {
  return (...childs) => new ReactiveElement(existingElement, childs);
}
