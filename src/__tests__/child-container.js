const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("creation", t => {
  const container = createContainer("root")
  const child = container.child("child")
  t.is(typeof child, "object", "should create a child container")
})

test("resolving instances from parent", t => {
  const componentDefinition = {
    identifier: "test-component",
    factory: () => "test-component-instance",
  }

  const parent = createContainer("root")
  parent.register(componentDefinition)
  const child = parent.child("child")
  return child.get("test-component")
    .then((instance) => {
      t.is(instance, "test-component-instance", "children should be able to access components registered with the parent")
    })
})

test("registering definitions", t => {
  const componentDefinition = {
    identifier: "test-component",
    factory: () => "test-component-instance",
  }

  const parent = createContainer("root")
  const child = parent.child("child")
  child.register(componentDefinition)
  return parent.get("test-component")
    .then((instance) => {
      t.is(instance, undefined, "parent should not be able to access components registered with a child")
    })
})

test("with same name as parent", t => {
  const parent = createContainer("root")
  const child = parent.child("second")
  const error = t.throws(() => child.child("root"), Error)
  t.regex(error.message, /second->root/, "should show hierarchy in error message")
})
