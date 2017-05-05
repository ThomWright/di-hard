const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("valid definition", t => {
  const componentDefinition = {
    id: "testComponent",
    factory: () => "testComponentInstance",
  }

  const container = createContainer("root")
  t.notThrows(() => {
    container.register(componentDefinition)
  }, "should accept a registration")
})


test("definition with no id", t => {
  const componentDefinition = {
    factory: () => "testComponentInstance",
  }

  const container = createContainer("root")
  const error = t.throws(() => {
    container.register(componentDefinition)
  }, Error)

  t.regex(error.message, /id/, "should throw an error when definition contains no id")
})

test("same name twice", t => {
  const componentDefinition = {
    id: "uniqueId",
    factory: () => "testComponentInstance",
  }

  const container = createContainer("root")
  container.register(componentDefinition)

  const error = t.throws(() => container.register(componentDefinition), Error)

  t.regex(error.message, /uniqueId/, "should error with warning about repeated registration")
})
