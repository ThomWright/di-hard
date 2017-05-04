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

  const container = createContainer()
  container.register(instanceCounterDef)

  container.get("instance-counter")
  container.get("instance-counter")
  const instanceCount = container.get("instance-counter")
  t.is(instanceCount, 1, "should only create one instance for multiple calls to 'get'")
})
