const test = require("ava")
const bluebird = require("bluebird")
const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("multiple calls to get", async t => {
  let instances = 0
  const instanceCounterDef = {
    id: "instanceCounter",
    factory: () => ++instances,
  }

  const container = createContainer("root")
  container.register(instanceCounterDef)

  await container.get("instanceCounter")
  await container.get("instanceCounter")
  const instanceCount = await container.get("instanceCounter")
  t.is(instanceCount, 1, "should only create one instance for multiple calls to 'get'")
})

test("return value for cached instance", async t => {
  let instances = 0
  const instanceCounterDef = {
    id: "instanceCounter",
    factory: () => ++instances,
  }

  const container = createContainer("root")
  container.register(instanceCounterDef)

  await container.get("instanceCounter")
  const promise = container.get("instanceCounter")
  t.is(typeof promise.then, "function", "should be a promise")
})

test("multiple async calls to get", async t => {
  let instances = 0
  const instanceCounterDef = {
    id: "instanceCounter",
    factory: () => bluebird.delay(instances * 100).then(() => ++instances),
  }

  const container = createContainer("root")
  container.register(instanceCounterDef)

  container.get("instanceCounter")
  container.get("instanceCounter")

  const instanceCount = await container.get("instanceCounter")
  t.is(instanceCount, 1, "should only create one instance for multiple calls to 'get'")
})
