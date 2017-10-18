import test from "ava"
import createContainerModule from "../container"
import Lifetime from "../lifetimes"
const {Transient, Registration} = Lifetime

const {createContainer} = createContainerModule()

test("default", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances) // eslint-disable-line no-plusplus

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 2, "should have TRANSIENT lifetime")
})

test("Transient", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, {lifetime: Transient}) // eslint-disable-line no-plusplus

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 2, "should return a new instance each time")
})

test("Registration", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, {lifetime: Registration}) // eslint-disable-line no-plusplus

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 1, "should cache the instance")
})

test("Registration with child containers", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, {lifetime: Registration}) // eslint-disable-line no-plusplus

  const i = container.child("name1").resolve("id")
  const j = container.child("name2").resolve("id")

  t.is(i, 1)
  t.is(
    j,
    1,
    "should cache the instance for the lifetime of the registration container",
  )
})
