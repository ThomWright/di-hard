const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("create", t => {
  const container = createContainer("root")
  t.is(typeof container, "object", "should create an object")
})

test("creating without a name", t => {
  const error = t.throws(
    () => createContainer(),
    Error,
    "should throw when creating a container without a name"
  )
  t.regex(error.message, /name/)
})

test("resolving a component instance", t => {
  const componentDefinition = () => "testComponentInstance"

  const container = createContainer("root")
  container.registerFactory("testComponent", componentDefinition)

  const instance = container.resolve("testComponent")
  t.is(instance, "testComponentInstance", "should return the instance created by the factory")
})

test("resolving a falsy instance", t => {
  const container = createContainer("root")
  container.registerValue("id", undefined)
  const value = container.resolve("id")
  t.is(value, undefined)
})
