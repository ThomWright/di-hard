const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("multiple calls to get", t => {
  let instances = 0
  const instanceCounterDef = {
    identifier: "instance-counter",
    factory: () => ++instances,
  }

  const container = createContainer("root")
  container.register(instanceCounterDef)

  return container.get("instance-counter")
    .then(() => container.get("instance-counter"))
    .then(() => container.get("instance-counter"))
    .then((instanceCount) => {
      t.is(instanceCount, 1, "should only create one instance for multiple calls to 'get'")
    })
})

test("return value for cached instance", t => {
  let instances = 0
  const instanceCounterDef = {
    identifier: "instance-counter",
    factory: () => ++instances,
  }

  const container = createContainer("root")
  container.register(instanceCounterDef)

  return container.get("instance-counter")
    .then(() => {
      const promise = container.get("test-component")

      t.is(typeof promise.then, "function", "should be a promise")
    })
})
