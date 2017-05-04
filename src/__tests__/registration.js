const test = require("ava")
const sinon = require("sinon")
const createStreamMock = require("../__mocks__/stream")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("valid definition", t => {
  const componentDefinition = {
    identifier: "test-component",
    factory: () => "test-component-instance",
  }

  const container = createContainer()
  t.notThrows(() => {
    container.register(componentDefinition)
  }, "should accept a registration")
})


test("definition with no identifier", t => {
  const componentDefinition = {
    factory: () => "test-component-instance",
  }

  const container = createContainer()
  const error = t.throws(() => {
    container.register(componentDefinition)
  }, Error)

  t.regex(error.message, /identifier/, "should throw an error when definition contains no identifier")
})

test("same name twice", t => {
  const {
    streamMock,
    writeSpy: stdioSpy,
  } = createStreamMock(sinon)
  const {createContainer} = createContainerModule({stdio: streamMock})

  const componentDefinition = {
    identifier: "unique-component-name",
    factory: () => "test-component-instance",
  }

  const container = createContainer()
  container.register(componentDefinition)
  container.register(componentDefinition)

  t.true(stdioSpy.called, "should emit a warning log")
  const output = stdioSpy.firstCall.args[0]
  t.regex(output, /unique-component-name/, "should warn about repeated registration")
})
