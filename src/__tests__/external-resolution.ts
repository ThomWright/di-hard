import test from "ava"

import createContainerModule from "../container"
import Visiblity from "../visibility"

const {createContainer} = createContainerModule()

test("component instance", t => {
  const componentDefinition = () => "testComponentInstance"

  const container = createContainer("root")
  container.registerFactory("testComponent", componentDefinition)

  const instance = container.resolve("testComponent")
  t.is(
    instance,
    "testComponentInstance",
    "should return the instance created by the factory",
  )
})

test("non-existant component instance", t => {
  const container = createContainer("root")

  const error = t.throws(
    () => container.resolve("nopenopenope"),
    Error,
    "should not be able to resolve something that has not been registered",
  )

  t.regex(error.message, /Nothing registered/, "should state the problem")
  t.regex(error.message, /nopenopenope/, "should specify the problem ID")
})

test("non-existant component instance when similarly named components exist", t => {
  const container = createContainer("root")
  container.registerValue("thom", "")

  const error = t.throws(
    () => container.resolve("tom"),
    Error,
    "should not be able to resolve something that has not been registered",
  )

  t.regex(error.message, /thom/, "should suggest the similarly named component")
})

test("non-existant component instance when similarly named components exist only in child container", t => {
  const container = createContainer("root")
  container.registerValue("thom", "")
  const child = container.child("child")
  child.registerValue("tin", "")

  const error = t.throws(
    () => child.resolve("tom"),
    Error,
    "should not be able to resolve something that has not been registered",
  )

  t.regex(
    error.message,
    /thom/,
    "should suggest the similarly named components",
  )
  t.regex(error.message, /tin/, "should suggest the similarly named components")
})

test("non-existant component instance when similarly named components exist only in submodule", t => {
  const container = createContainer("root")
  container.registerValue("tim", "")
  container.registerSubmodule("moduleId").registerValue("thom", "")

  const error = t.throws(
    () => container.resolve("moduleId.tom"),
    Error,
    "should not be able to resolve something that has not been registered",
  )

  t.regex(
    error.message,
    /thom/,
    "should suggest the similarly named component in the same module",
  )
  t.notRegex(
    error.message,
    /tim/,
    "should not suggest the similarly named components from another module",
  )
})

test("falsy instance", t => {
  const container = createContainer("root")
  container.registerValue("id", undefined)
  const value = container.resolve("id")
  t.is(value, undefined)
})

test("public value from inside a public submodule", t => {
  const container = createContainer("container-with-submodule")

  container
    .registerSubmodule("submodule", {visibility: Visiblity.Public})
    .registerValue("value", "some-value", {visibility: Visiblity.Public})

  const value = container.resolve("submodule.value")

  t.is(value, "some-value")
})

test("public value from inside a private submodule", t => {
  const container = createContainer("container-with-submodule")

  container.registerSubmodule("submodule").registerValue("value", "some-value")

  const error = t.throws(
    () => container.resolve("submodule.value"),
    Error,
    "should not be able to resolve a value in a private submodule",
  )

  t.regex(error.message, /not visible/, "should state the problem")
})
