const test = require("ava")
const sinon = require("sinon")
const createStreamMock = require("../__mocks__/stream")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("single dependency", t => {
  const componentDefinition = {
    identifier: "test-component",
    inject: ["dependency"],
    factory: ({dependency}) => {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    },
  }

  const dependencyDefinition = {
    identifier: "dependency",
    factory: () => "dependency-instance",
  }

  const container = createContainer("root")
  container.register(componentDefinition)
  container.register(dependencyDefinition)

  return container.get("test-component")
    .then((instance) => {
      const dep = instance.getInjectedDependency()
      t.is(dep, "dependency-instance", "should inject an instance of the requested dependency")
    })
})

test("promise-resolved dependency", t => {
  const componentDefinition = {
    identifier: "test-component",
    inject: ["dependency"],
    factory: ({dependency}) => {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    },
  }

  const dependencyDefinition = {
    identifier: "dependency",
    factory: () => Promise.resolve("dependency-instance"),
  }

  const container = createContainer("root")
  container.register(componentDefinition)
  container.register(dependencyDefinition)

  return container.get("test-component")
    .then((instance) => {
      const dep = instance.getInjectedDependency()
      t.is(dep, "dependency-instance", "should inject an instance of the requested dependency")
    })
})

test("resolving unknown dependencies", t => {
  const componentDefinition = {
    identifier: "test-component",
    inject: ["dependency"],
    factory: ({dependency}) => {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    },
  }

  const container = createContainer("root")
  container.register(componentDefinition)

  return container.get("test-component")
    .then((instance) => {
      const dep = instance.getInjectedDependency()
      t.is(dep, undefined, "should inject 'undefined' for unknown keys")
    })
})

test("warning about unknown dependencies", t => {
  const {
    streamMock,
    writeSpy: stdioSpy,
  } = createStreamMock(sinon)
  const {createContainer} = createContainerModule({stdio: streamMock})

  const componentDefinition = {
    identifier: "test-component",
    inject: ["dependency"],
    factory: ({dependency}) => {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    },
  }

  const container = createContainer("root")
  container.register(componentDefinition)

  return container.get("test-component")
    .then(() => {
      t.true(stdioSpy.called, "should emit a warning log")
      const output = stdioSpy.firstCall.args[0]
      t.true(output.includes("dependency"), "should output a warning about the missing dependency")
    })
})
