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
  const parent = createContainer("root")
  parent.registerFactory("testComponent", () => "testComponentInstance")
  const child = parent.child("child")

  const instance = child.resolve("testComponent")
  t.is(instance, "testComponentInstance", "children should be able to access components registered with the parent")
})

test("registering definitions", t => {
  const parent = createContainer("root")
  const child = parent.child("child")
  child.registerFactory("testComponent", () => "testComponentInstance")

  const error = t.throws(
    () => parent.resolve("testComponent"),
    Error,
    "parent should not be able to access components registered with a child"
  )
  t.regex(error.message, /testComponent/)
})

test("with same name as parent", t => {
  const parent = createContainer("root")
  const child = parent.child("second")
  const error = t.throws(() => child.child("root"), Error)
  t.regex(error.message, /second -> root/, "should show hierarchy in error message")
})

test("unknown id", t => {
  const container = createContainer("high")
    .child("mid")
    .child("low")

  const error = t.throws(
    () => container.resolve("notThere"),
    Error,
    "should throw when requesting an unknown id"
  )
  t.regex(error.message, /notThere/, "should specify unknown id")
  t.regex(error.searchPath, /low -> mid -> high \(root\)/, "should specify search path")
})

test("unknown dependency id", t => {
  const factory = ({dependencyName}) => {
    return {
      getInjectedDependency() {
        return dependencyName
      },
    }
  }

  const container = createContainer("high")
    .child("mid")
    .child("low")
  container.registerFactory("testComponent", factory)

  const error = t.throws(
    () => container.resolve("testComponent"),
    Error,
    "should throw when requesting to inject unknown id"
  )
  t.regex(error.message, /dependencyName/, "should specify unknown id")
  t.regex(error.searchPath, /low -> mid -> high \(root\)/, "should specify search path")
})

test("shadowing parent registrations", t => {
  const parent = createContainer("root")
  parent.registerFactory("uniqueId", () => "parent instance")

  const child = parent.child("child")

  t.notThrows(
    () => child.registerFactory("uniqueId", () => "child instance"),
    "should be able to register same name in parent and child containers"
  )

  const parentInstance = parent.resolve("uniqueId")
  t.is(parentInstance, "parent instance", "parent should resolve to the parent instance")

  const childInstance = child.resolve("uniqueId")
  t.is(childInstance, "child instance", "child should resolve to the child instance")
})
