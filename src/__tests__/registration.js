const test = require("ava")
const sinon = require("sinon")
const createStreamMock = require("../__mocks__/stream")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer, define} = createContainerModule({stdio: NOOP_STREAM})

test("registering a definition", t => {
  const componentDefinition = define({
    name: "test-component",
    factory: () => "test-component-instance",
  })

  const container = createContainer()
  t.notThrows(() => {
    container.register(componentDefinition)
  }, "should accept a registration")
})

test("registering a name twice", t => {
  const {
    streamMock,
    writeSpy: stdioSpy,
  } = createStreamMock(sinon)
  const {createContainer} = createContainerModule({stdio: streamMock})

  const componentDefinition = define({
    name: "unique-component-name",
    factory: () => "test-component-instance",
  })

  const container = createContainer()
  container.register(componentDefinition)
  container.register(componentDefinition)

  t.true(stdioSpy.called, "should emit a warning log")
  const output = stdioSpy.firstCall.args[0]
  t.true(output.includes("unique-component-name"), "should warn about repeated registration")
})
