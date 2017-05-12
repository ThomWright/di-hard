const test = require("ava")
const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("multiple calls to resolve", t => {
  let instances = 0

  const container = createContainer("root")
  container.register("instanceCounter", () => ++instances)

  container.resolve("instanceCounter")
  container.resolve("instanceCounter")
  const instanceCount = container.resolve("instanceCounter")
  t.is(instanceCount, 1, "should only create one instance for multiple calls to 'resolve'")
})
