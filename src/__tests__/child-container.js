const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("creation", t => {
  const container = createContainer()
  const child = container.child("child")
  t.is(typeof child, "object", "should create a child container")
})

test("resolving instances from parent", t => {
  const componentDefinition = {
    identifier: "test-component",
    factory: () => "test-component-instance",
  }

  const parent = createContainer()
  parent.register(componentDefinition)
  const child = parent.child("child")
  const instance = child.get("test-component")

  t.is(instance, "test-component-instance", "children should be able to access components registered with the parent")
})

test("registering definitions", t => {
  const componentDefinition = {
    identifier: "test-component",
    factory: () => "test-component-instance",
  }

  const parent = createContainer()
  const child = parent.child("child")
  child.register(componentDefinition)
  const instance = parent.get("test-component")

  t.is(instance, undefined, "parent should not be able to access components registered with a child")
})
