import test from "ava"

import createContainerModule from "../container"

const {createContainer} = createContainerModule()

test("creation", t => {
  const container = createContainer("root")
  const child = container.child("child")
  t.is(typeof child, "object", "should create a child container")
})

test("container visibility (child -> parent)", t => {
  const parent = createContainer("root")
  parent.registerFactory("testComponent", () => "testComponentInstance")
  const child = parent.child("child")

  const instance = child.resolve("testComponent")
  t.is(
    instance,
    "testComponentInstance",
    "children containers should be able to access components registered with the parent container",
  )
})

test("container visibility (parent -> child)", t => {
  const grandparent = createContainer("grandparentContainer")
  const parent = grandparent.child("parentContainer")
  parent.registerFactory("thingID", ({depID}) => depID)

  const child = parent.child("childContainer")
  child.registerFactory("depID", () => "childInstance")

  const error = t.throws(
    () => child.resolve("thingID"),
    Error,
    "should throw when requesting a dependency that's only registered in a child's container",
  )
  t.regex(
    error.message,
    /thingID \(parentContainer\) -> depID \(grandparentContainer\)/,
    "should specify dependency path",
  )
  t.regex(
    error.message,
    /parentContainer -> grandparentContainer/,
    "should specify container search path",
  )
})

test("registering definitions", t => {
  const parent = createContainer("root")
  const child = parent.child("child")
  child.registerFactory("testComponent", () => "testComponentInstance")

  const error = t.throws(
    () => parent.resolve("testComponent"),
    Error,
    "parent should not be able to access components registered with a child",
  )
  t.regex(error.message, /testComponent \(root\)/)
})

test("with same name as parent", t => {
  const parent = createContainer("parentContainer")
  const child = parent.child("childContainer")
  const error = t.throws(
    () => child.child("parentContainer"),
    Error,
    "should throw when creating a child container with the same name as any visible container",
  )
  t.regex(
    error.message,
    /childContainer -> parentContainer/,
    "should show hierarchy in error message",
  )
})

test("unknown id", t => {
  const container = createContainer("high")
    .child("mid")
    .child("low")

  const error = t.throws(
    () => container.resolve("notThere"),
    Error,
    "should throw when requesting an unknown id",
  )
  t.regex(error.message, /notThere \(high\)/, "should specify unknown id")
  t.regex(error.message, /low -> mid -> high/, "should specify search path")
})

test("unknown dependency id", t => {
  const factory = ({dependencyName}: {dependencyName: string}) => {
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
    "should throw when requesting to inject unknown id",
  )
  t.regex(
    error.message,
    /testComponent \(low\) -> dependencyName \(high\)/,
    "should specify unknown id",
  )
  t.regex(error.message, /low -> mid -> high/, "should specify search path")
})

test("shadowing parent registrations", t => {
  const parent = createContainer("root")
  parent.registerFactory("uniqueId", () => "parent instance")

  const child = parent.child("child")

  t.notThrows(
    () => child.registerFactory("uniqueId", () => "child instance"),
    "should be able to register same name in parent and child containers",
  )

  const parentInstance = parent.resolve("uniqueId")
  t.is(
    parentInstance,
    "parent instance",
    "parent should resolve to the parent instance",
  )

  const childInstance = child.resolve("uniqueId")
  t.is(
    childInstance,
    "child instance",
    "child should resolve to the child instance",
  )
})
