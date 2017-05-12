# DI

Dependency injection

Docs will be written. For now the tests are the only docs.

## The rules

- instances are cached by default
- instances are resolved and cached in the scope in which they are registered
- a scope can only resolve instances from itself or a parent scope
  - which means nothing can depend on something with a shorter lifetime

## Example

```js
function theRealThingFactory() {
  return {
    doTheThing() {
      return "done"
    }
  }
}
function myThingFactory({theRealThing}) {
  return {
    doAThing() {
      return theRealThing.doTheThing()
    },
  }
}

const container = require("@mft/di").createContainer("global")
container.registerFactory("myThing", myThingFactory)
container.registerFactory("theRealThing", theRealThingFactory)

const myThing = container.resolve("myThing")
myThing.doAThing() // "done"
```
