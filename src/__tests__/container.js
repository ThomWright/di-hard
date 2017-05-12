const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("create", t => {
  const container = createContainer("root")
  t.is(typeof container, "object", "should create an object")
})

test("resolving a component instance", t => {
  const componentDefinition = () => "testComponentInstance"

  const container = createContainer("root")
  container.register("testComponent", componentDefinition)

  const instance = container.resolve("testComponent")
  t.is(instance, "testComponentInstance", "should return the instance created by the factory")
})
