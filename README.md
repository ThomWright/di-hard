# DI

Dependency injection

## Requirements

### MVP

- register component factories with container
  - `container.register("logger", createLogger)`
- get component instances from container
  - `container.get("logger")`
- annotate factories with required dependencies
  - `@inject(["logger"])`
- instances have their dependencies injected
- helpful error messages when required dependency not found
- factories of the form:
  - `({dependencyName}) => {}`

### More

- child containers
  - `container.child("request")`
- annotate factories with contexts
  - `@context("global")`, `@context("request")`

## Example

```js
// di.js
const {createContainer} = require("@mft/di")

const container = createContainer()
container.register("transport", require("./transport"))
container.register("hello", require("./hello"))
container.register("dbPool", require("./db-pool"))

module.exports = container

// di-middleware.js
const container = require("./di")

module.exports = (req, res, next) {
  req.container = container.child("request")

  req.container.register("correlationId", req.correlationId)

  next()
}

// transport.js
module.exports =
  context("request")
  inject(["correlationId"])
  (transportFactory)

function transportFactory({correlationId}) {
  return {
    request() {
      sendReqWith(correlationId)
    },
  }
}

// db-pool.js
const createPool = require("postgres")
module.exports = dbPoolFactory

function dbPoolFactory({correlationId}) {
  const pool = createPool()
  return {
    get() {
      return pool.get()
    },
  }
}

// hello-world-service.js
module.exports =
  context("request")
  inject(["transport", "dbPool"])
  (helloServiceFactory)

function helloServiceFactory({transport, dbPool}) {
  return {
    getHello() {
      transport.request()
      return dbPool.get()
    },
  }
}

// hello-world-handler.js
module.exports = (req, res) {
  const container = req.container

  const service = container.get("hello")

  service.get()
}
```
