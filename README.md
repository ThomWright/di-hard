# DI-hard

[![npm](https://img.shields.io/npm/v/di-hard.svg?maxAge=1000)](https://www.npmjs.com/package/di-hard)
[![dependency Status](https://img.shields.io/david/ThomWright/di-hard.svg?maxAge=1000)](https://david-dm.org/ThomWright/di-hard)
[![devDependency Status](https://img.shields.io/david/dev/ThomWright/di-hard.svg?maxAge=1000)](https://david-dm.org/ThomWright/di-hard)
[![license](https://img.shields.io/github/license/ThomWright/di-hard.svg)](https://github.com/ThomWright/di-hard)

Simple, predictable dependency injection

Features:

- clear separation between wiring and application
- minimal lock-in
- control over component lifetimes
- module hierarchy with private and public components

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

const container = require("di-hard").createContainer("application")
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

Below is an example of a component with two dependencies. Here, we have a factory function, which takes an object with named dependencies, and returns an instance of the component (in this case, an object).

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
const di = require("di-hard")

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

- `Transient`
  - no reference cached
  - one instance per resolution
- `Registration`
  - reference cached in container in which the factory was registered
  - one instance per registration container

`Transient` is the default lifetime.

To explicitly set a lifetime, use the `registerFactory` function like so:

```js
container.registerFactory("id", factory, {lifetime: di.Lifetime.Registration})
```

### Child containers

Sometimes you don't want a component to live for the entire life of your application, but also don't want to create a new instance every time it's resolved. For example, in an HTTP server, you might want to create some components which hold some data associated with a request.

For this, we can use child containers. Create one like so:

```js
const di = require("di-hard")
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

### Modules

It's possible namespace groups of components by creating a hierarchy of modules.

```js
const factory = ({
  // use nested object deconstruction to inject components from modules
  my_module: {
    dependency,
  },
}) => {
  // ...
}

const dependencyDefinition = () => "dependencyInstance"

const container = createContainer("root")
container
  .registerSubmodule("my_module", Visibility.Public)
    .registerFactory("component", factory, {
      visibility: Visibility.PUBLIC,
    })
    .registerFactory("dependency", dependencyDefinition)

// use shorthand dot-notation to externally resolve components inside modules
const instance = container.resolve("my_module.component")
```

### Visibility

You can control which components are visible to other components by using visiblity modifiers. Anything registered with the container (a component or a module) can be either `Public` or `Private`. `Private` components are only visible to other components in the same module.

Visibility defaults to `Private`.

In the example below, it would be possible to inject `my_module.public_api` into `my_component`, and `my_module.internal` into `my_module.public_api`, but trying to inject `my_module.internal` into `my_component` would throw an error.

```js
const container = createContainer("root")
container
  .registerFactory("my_component", myComponentFactory)
  .registerSubmodule("my_module", {visibility: Visibility.Public})
    .registerFactory("public_api", publicComponent, {
      visibility: Visibility.Public,
    })
    .registerFactory("internal", privateComponent, {
      visibility: Visibility.Private,
    })
```

## API

`const di = require("di-hard")`

### DI

- `di.createContainer(containerName: string) -> container`
- `di.Lifetime.Transient`
- `di.Lifetime.Registration`
- `di.Visibility.Public`
- `di.Visibility.Private`

### Container

Services and values can be registered with a container. It is responsible for resolving an ID to an instance.

- `container.registerFactory(id: string, factory: function, options: {lifetime, visibility}) -> registrationApi`
- `container.registerValue(id: string, value: any, options: {visibility}) -> registrationApi`
- `container.registerSubmodule(id: string, options: {visibility}) -> registrationApi`
- `container.resolve(id: string) -> componentInstance`
- `container.child(containerName: string) -> container`

The `registerX` functions are chainable, for example:

```js
container
  .registerFactory(...)
  .registerValue(...)
  .registerSubmodule(...)
    .registerValue(...)
```

### Factory functions

Factory functions are used to create the component instances.

- `factory(resolver) -> componentInstance`

### Resolver

The resolver gets injected into each factory function. It is a [Proxy](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy) which resolves component instances on property lookup.

- `resolver[id] -> componentInstance`

## Further reading

[Inversion of Control Containers and the Dependency Injection pattern - Martin Fowler](https://martinfowler.com/articles/injection.html)

[Dependency Injection in Node.js - 2016 edition](https://medium.com/@Jeffijoe/dependency-injection-in-node-js-2016-edition-f2a88efdd427)
