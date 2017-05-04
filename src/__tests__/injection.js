const test = require("ava")
const sinon = require("sinon")
const createStreamMock = require("../__mocks__/stream")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer, define} = createContainerModule({stdio: NOOP_STREAM})

test("single dependency", t => {
  const componentDefinition = define({
    name: "test-component",
    inject: ["dependency"],
    factory: ({dependency}) => {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    },
  })

  const dependencyDefinition = define({
    name: "dependency",
    factory: () => "dependency-instance",
  })

  const container = createContainer()
  container.register(componentDefinition)
  container.register(dependencyDefinition)

  const component = container.get("test-component")
  const dep = component.getInjectedDependency()
  t.is(dep, "dependency-instance", "should inject an instance of the requested dependency")
})

test("resolving unknown dependencies", t => {
  const componentDefinition = define({
    name: "test-component",
    inject: ["dependency"],
    factory: ({dependency}) => {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    },
  })

  const container = createContainer()
  container.register(componentDefinition)

  const component = container.get("test-component")
  const dep = component.getInjectedDependency()
  t.is(dep, undefined, "should inject 'undefined' for unknown keys")
})

test("warning about unknown dependencies", t => {
  const {
    streamMock,
    writeSpy: stdioSpy,
  } = createStreamMock(sinon)
  const {createContainer, define} = createContainerModule({stdio: streamMock})

  const componentDefinition = define({
    name: "test-component",
    inject: ["dependency"],
    factory: ({dependency}) => {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    },
  })

  const container = createContainer()
  container.register(componentDefinition)
  container.get("test-component")

  t.true(stdioSpy.called, "should emit a warning log")
  const output = stdioSpy.firstCall.args[0]
  t.true(output.includes("dependency"), "should output a warning about the missing dependency")
})
