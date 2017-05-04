const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("create", t => {
  const container = createContainer()
  t.is(typeof container, "object", "should create an object")
})

test("getting a component instance", t => {
  const componentDefinition = {
    identifier: "test-component",
    factory: () => "test-component-instance",
  }

  const container = createContainer()
  container.register(componentDefinition)
  const instance = container.get("test-component")
  t.is(instance, "test-component-instance", "should return the instance created by the factory")
})
