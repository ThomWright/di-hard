# DI

[![npm](https://img.shields.io/npm/v/@mft/di.svg)](https://www.npmjs.com/package/@mft/di)
[![dependency Status](https://img.shields.io/david/momentumft/di.svg?maxAge=1000)](https://david-dm.org/momentumft/di)
[![devDependency Status](https://img.shields.io/david/dev/momentumft/di.svg?maxAge=1000)](https://david-dm.org/momentumft/di)
[![license](https://img.shields.io/github/license/momentumft/di.svg)](https://github.com/momentumft/di)
[![node](https://img.shields.io/node/v/@mft/di.svg?maxAge=1000)](https://www.npmjs.com/package/@mft/di)

Simple, predictable dependency injection

## Example

```js
function myDependencyFactory() {
  return {
    doTheThing() {
      return "done"
    }
  }
}
function myServiceFactory({myDependency}) {
  return {
    doAThing() {
      return myDependency.doTheThing()
    },
  }
}

const container = require("@mft/di").createContainer("application")
container.registerFactory("myService", myServiceFactory)
container.registerFactory("myDependency", myDependencyFactory)

const myService = container.resolve("myService")
myService.doAThing() // "done"
```

## Terminology

- **component** - a reusable piece of your application
- **factory** - a function which creates a component
- **registration** - the process of mapping an ID to a component factory
- **resolution** - the process of mapping an ID to component instance
- **resolver** - object which performs resolution
- **container** - object which contains component registrations and instances, performs resolution
- **lifetime** - how long a component instance is expected to live
- **scope** - which components, and instances, are available to inject into a component instance

## Concepts

The purpose of this library is to enable easy creation of your application's components, without having to worry about those components' dependencies.

### Components

Components are the individual pieces of your application. They can be functions, objects, classes, strings... whatever you want.

An example of a component with two dependencies. Here, we have a factory function, which takes an object with named dependencies, and returns an instance of the component (in this case, an object).

Notice that there is no direct dependency on the DI library here. The only requirement is that factory functions take their dependencies as named arguments (an object). This makes the code portable, easy to test, and possible to wire together manually.

```js
// my-component.js
const factory = ({dep1, dep2}) => {
  const instance = {
    get() {
      return dep1.getSomething() + dep2.getSomethingElse()
    },
  }
  return instance
}
```

### Registration and resolution

When we have enough components in our application, and the dependency tree starts to get deeper (e.g. `A` depends on `B` which depends on `C` etc.), wiring these components together can become tedious.

What we can do instead is register all our component factories with a 'container', and let it be responsible for creating our components (and their dependencies) for us.

Here is how we would register the component factories for the above example, and manually resolve (create) an instance of the component, with its dependencies injected.

```js
const di = require("@mft/di")

const container = di.createContainer("application")

// register all component factories
container.register("myComponent", require("./my-component"))
container.register("dep1", require("./dep1"))
container.register("dep1", require("./dep2"))

// resolve an instance of the component
const myInstance = container.resolve("myComponent")
myInstance.get()
```

Here we've called `container.resolve()` directly to manually resolve an instance of `myComponent`. But how do `dep1` and `dep2` get resolved? Let's have a look at `myComponent` again, but slightly re-write it to illustrate what's happening.

```js
// my-component.js
const factory = (resolver) => {
  const dep1 = resolver.dep1 // resolved when this property is accessed
  const instance = {
    get() {
      const dep2 = resolver.dep2 // lazily resolve dep2
      return dep1.getSomething() + dep2.getSomethingElse()
    },
  }
  return instance
}
```

Here we can see that what actually gets injected is a 'resolver' object. Accessing properties on the resolver is what triggers resolution of dependencies.

### Lifetimes

A lifetime is a statement about how long a container caches a reference to a component instance.

There are two lifetimes currently supported:

- `TRANSIENT`
    - no reference cached
    - one instance per resolution
- `REGISTRATION`
    - reference cached in container in which the factory was registered
    - one instance per registration container

`TRANSIENT` is the default lifetime.

To explicitly set a lifetime, use the `registerFactory` function like so:

```js
container.registerFactory("id", factory, di.lifetimes.REGISTRATION)
```

### Child containers

Sometimes you don't want a component to live for the entire life of your application, but also don't want to create a new instance every time it's resolved. For example, in an HTTP server, you might want to create some components which hold some data associated with a request.

For this, we can use child containers. Create one like so:

```js
const di = require("@mft/di")
const express = require('express')
const app = express()

const container = di.createContainer("application")

app.get("/", (req, res) => {
  req.container = container.child("request")
  // register some components
  // resolve and use a component
})
```

Now, each request can register its own components and have its own instances.

It is expected that a child container will have a shorter lifetime that its parent. Here, for example, `request` container will live only as long as the request, but the `application` container will live for the lifetime of the application.

With that in mind, there are two simple rules which dictate how instances get resolved when using child containers:

- *instances get resolved in the container they were registered in*
- *a container can only resolve dependencies from itself or a parent container*

This means nothing can depend on something with a shorter lifetime. For example, no components in the `application` container could depend on a component in the `request` container. However, components in the `request` container can depend on instances from the `application` container.

## API

`const di = require("@mft/di")`

### DI

- `di.createContainer(scopeName: string) -> container`
- `di.lifetimes.TRANSIENT`
- `di.lifetimes.REGISTRATION`

### Container

Services and values can be registered with a container. It is responsible for resolving an ID to an instance.

- `container.registerFactory(id: string, factory: function [, lifetime]) -> container`
- `container.registerValue(id: string, value: any) -> container`
- `container.registerValues(values: {string: any}) -> container`
- `container.resolve(id: string) -> componentInstance`
- `container.child(scopeName: string) -> container`

### Factory functions

Factory functions are used to create the component instances.

- `factory(resolver) -> componentInstance`

### Resolver

The resolver gets injected into each factory function. It is a [Proxy](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy) which resolves component instances on property lookup.

- `resolver[id] -> componentInstance`

## Further reading

[Inversion of Control Containers and the Dependency Injection pattern - Martin Fowler](https://martinfowler.com/articles/injection.html)

[Dependency Injection in Node.js - 2016 edition](https://medium.com/@Jeffijoe/dependency-injection-in-node-js-2016-edition-f2a88efdd427)
