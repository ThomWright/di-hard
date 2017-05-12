const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("valid definition", t => {
  const componentDefinition = () => "testComponentInstance"

  const container = createContainer("root")
  t.notThrows(() => {
    container.register("testComponent", componentDefinition)
  }, "should accept a registration")
})

test("same name twice", t => {
  const componentDefinition = () => "testComponentInstance"

  const container = createContainer("root")
  container.register("uniqueId", componentDefinition)

  const error = t.throws(() => container.register("uniqueId", componentDefinition), Error)

  t.regex(error.message, /uniqueId/, "should error with warning about repeated registration")
})
