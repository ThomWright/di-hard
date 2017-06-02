const test = require("ava")
const createContainerModule = require("../container")
const {TRANSIENT, REGISTRATION} = require("../lifetimes")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("default", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances)

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 2, "should have TRANSIENT lifetime")
})

test("undefined", t => {
  let instances = 0
  const container = createContainer("root")
  const error = t.throws(
    () => container.registerFactory("ididid", () => ++instances, undefined),
    Error
  )
  t.regex(error.message, /ididid/)
})

test("TRANSIENT", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, TRANSIENT)

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 2, "should return a new instance each time")
})

test("REGISTRATION", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, REGISTRATION)

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 1, "should cache the instance")
})

test("REGISTRATION with child containers", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, REGISTRATION)

  const i = container.child("name1").resolve("id")
  const j = container.child("name2").resolve("id")

  t.is(i, 1)
  t.is(j, 1, "should cache the instance for the lifetime of the registration container")
})
