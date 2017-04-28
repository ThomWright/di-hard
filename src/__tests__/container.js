const test = require("ava")
const sinon = require("sinon")
const createStreamMock = require("../__mocks__/stream")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer, inject} = createContainerModule({stdio: NOOP_STREAM})

test("create", t => {
  const container = createContainer()
  t.is(typeof container, "object", "should create an object")
})

test("registering a component factory", t => {
  const container = createContainer()
  t.notThrows(() => {
    container.register("test-component", () => "test-component-instance")
  }, "should accept a registration")
})

test("registering a single key twice", t => {
  const {
    streamMock,
    writeSpy: stdioSpy,
  } = createStreamMock(sinon)
  const {createContainer} = createContainerModule({stdio: streamMock})

  const container = createContainer()

  container.register("unique-component-name", () => 1)
  container.register("unique-component-name", () => 2)

  t.true(stdioSpy.called, "should emit a warning log")
  const output = stdioSpy.firstCall.args[0]
  t.true(output.includes("unique-component-name"), "should output a warning repeated registration")
})

test("getting a component instance", t => {
  const container = createContainer()
  container.register("test-component", () => "test-component-instance")
  const instance = container.get("test-component")
  t.is(instance, "test-component-instance", "should return the instance created by the factory")
})

test("injecting a dependency", t => {
  const container = createContainer()

  const testComponent = inject(["dependency"])(
    function({dependency}) {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    })

  container.register("dependency", () => "dependency-instance")
  container.register("test-component", testComponent)

  const component = container.get("test-component")
  const dep = component.getInjectedDependency()
  t.is(dep, "dependency-instance", "should inject an instance of the requested dependency")
})

test("instance caching", t => {
  const container = createContainer()

  let instances = 0
  container.register("instance-counter", () => ++instances)

  container.get("instance-counter")
  const instanceCount = container.get("instance-counter")
  t.is(instanceCount, 1, "should only create one instance for multiple calls to 'get'")
})

test("resolving unknown dependencies", t => {
  const container = createContainer()

  const testComponent = inject(["dependency"])(
    function({dependency}) {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    })

  container.register("test-component", testComponent)

  const component = container.get("test-component")
  const dep = component.getInjectedDependency()
  t.is(dep, undefined, "should inject 'undefined' for unknown keys")
})

test("warning about unknown dependencies", t => {
  const {
    streamMock,
    writeSpy: stdioSpy,
  } = createStreamMock(sinon)
  const {createContainer, inject} = createContainerModule({stdio: streamMock})

  const container = createContainer()

  const testComponent = inject(["dependency"])(
    function({dependency}) {
      return {
        getInjectedDependency() {
          return dependency
        },
      }
    })

  container.register("test-component", testComponent)
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
  const parent = createContainer()
  parent.register("test-component", () => "test-component-instance")

  const child = parent.child("child")
  const instance = child.get("test-component")

  t.is(instance, "test-component-instance", "children should be able to access components registered with the parent")
})

test("registering factories with a child component", t => {
  const parent = createContainer()

  const child = parent.child("child")
  child.register("test-component", () => "test-component-instance")
  const instance = parent.get("test-component")

  t.is(instance, undefined, "parent should not be able to access components registered with a child")
})
