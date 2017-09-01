const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("component instance", t => {
  const componentDefinition = () => "testComponentInstance"

  const container = createContainer("root")
  container.registerFactory("testComponent", componentDefinition)

  const instance = container.resolve("testComponent")
  t.is(instance, "testComponentInstance", "should return the instance created by the factory")
})

test("non-existant component instance", t => {
  const container = createContainer("root")

  const error = t.throws(
    () => container.resolve("nopenopenope"),
    Error,
    "should not be able to resolve something that has not been registered"
  )

  t.regex(error.message, /Nothing registered/, "should state the problem")
  t.regex(error.message, /nopenopenope/, "should specify the problem ID")
})

test("falsy instance", t => {
  const container = createContainer("root")
  container.registerValue("id", undefined)
  const value = container.resolve("id")
  t.is(value, undefined)
})

test("value from inside a submodule", t => {
  const container = createContainer("container-with-submodule")

  container
    .registerSubmodule("submodule")
    .registerValue("value", "some-value")

  const value = container.resolve("submodule.value")

  t.is(value, "some-value")
})
