const test = require("ava")
const sinon = require("sinon")
const createStreamMock = require("../__mocks__/stream")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer, define} = createContainerModule({stdio: NOOP_STREAM})

test("create", t => {
  const container = createContainer()
  t.is(typeof container, "object", "should create an object")
})

test("registering a component factory", t => {
  const componentDefinition = define({
    name: "test-component",
    factory: () => "test-component-instance",
  })

  const container = createContainer()
  t.notThrows(() => {
    container.register(componentDefinition)
  }, "should accept a registration")
})

test("registering a component name twice", t => {
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

test("getting a component instance", t => {
  const componentDefinition = define({
    name: "test-component",
    factory: () => "test-component-instance",
  })

  const container = createContainer()
  container.register(componentDefinition)
  const instance = container.get("test-component")
  t.is(instance, "test-component-instance", "should return the instance created by the factory")
})

test("injecting a dependency", t => {
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

test("instance caching", t => {
  let instances = 0
  const instanceCounterDef = define({
    name: "instance-counter",
    factory: () => ++instances,
  })

  const container = createContainer()
  container.register(instanceCounterDef)

  container.get("instance-counter")
  container.get("instance-counter")
  const instanceCount = container.get("instance-counter")
  t.is(instanceCount, 1, "should only create one instance for multiple calls to 'get'")
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

test("creating a child container", t => {
  const container = createContainer()
  const child = container.child("child")
  t.is(typeof child, "object", "should create a child container")
})

test("resolving instances from parent container", t => {
  const componentDefinition = define({
    name: "test-component",
    factory: () => "test-component-instance",
  })

  const parent = createContainer()
  parent.register(componentDefinition)
  const child = parent.child("child")
  const instance = child.get("test-component")

  t.is(instance, "test-component-instance", "children should be able to access components registered with the parent")
})

test("registering factories with a child component", t => {
  const componentDefinition = define({
    name: "test-component",
    factory: () => "test-component-instance",
  })

  const parent = createContainer()
  const child = parent.child("child")
  child.register(componentDefinition)
  const instance = parent.get("test-component")

  t.is(instance, undefined, "parent should not be able to access components registered with a child")
})
