const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("create", t => {
  const container = createContainer("root")
  t.is(typeof container, "object", "should create an object")
})

test("getting a component instance", async t => {
  const componentDefinition = {
    id: "testComponent",
    factory: () => "testComponentInstance",
  }

  const container = createContainer("root")
  container.register(componentDefinition)

  const instance = await container.get("testComponent")
  t.is(instance, "testComponentInstance", "should return the instance created by the factory")
})

test("return value", t => {
  const componentDefinition = {
    id: "testComponent",
    factory: () => "testComponentInstance",
  }

  const container = createContainer("root")
  container.register(componentDefinition)
  const promise = container.get("testComponent")

  t.is(typeof promise.then, "function", "should be a promise")
})
