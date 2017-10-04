const test = require("ava")

const createContainerModule = require("../container")
const {visibilities} = require("../visibility")

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

test("public value from inside a public submodule", t => {
  const container = createContainer("container-with-submodule")

  container
    .registerSubmodule("submodule", visibilities.PUBLIC)
    .registerValue("value", "some-value", visibilities.PUBLIC)

  const value = container.resolve("submodule.value")

  t.is(value, "some-value")
})

test("public value from inside a private submodule", t => {
  const container = createContainer("container-with-submodule")

  container
    .registerSubmodule("submodule")
    .registerValue("value", "some-value")

  const error = t.throws(
    () => container.resolve("submodule.value"),
    Error,
    "should not be able to resolve a value in a private submodule"
  )

  t.regex(error.message, /not visible/, "should state the problem")
})
