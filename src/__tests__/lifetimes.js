const test = require("ava")
const createContainerModule = require("../container")
const lifetimes = require("../lifetimes")
const {TRANSIENT, REGISTRATION} = lifetimes

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("accessing an invalid lifetime", t => {
  const lifetimes = require("../lifetimes")
  const error = t.throws(
    () => lifetimes.notARealLifetime,
    Error,
    "should not be able to access non-existant lifetimes"
  )
  t.regex(error.message, /notARealLifetime/, "should specify the problem lifetime")
})

test("default", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances) // eslint-disable-line no-plusplus

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 2, "should have TRANSIENT lifetime")
})

test("non-existant lifetime access", t => {
  let instances = 0
  const container = createContainer("root")
  const error = t.throws(
    () => container.registerFactory("ididid", () => ++instances, lifetimes.NAHMATE), // eslint-disable-line no-plusplus
    Error
  )
  t.regex(error.message, /NAHMATE/, "should specify the incorrect lifetime name")
})

test("random string", t => {
  let instances = 0
  const container = createContainer("root")
  const error = t.throws(
    () => container.registerFactory("ididid", () => ++instances, "notalifetime"), // eslint-disable-line no-plusplus
    Error
  )
  t.regex(error.message, /notalifetime/, "should specify the incorrect lifetime name")
  t.regex(error.message, /ididid/, "should specify the registration ID")
})

test("TRANSIENT", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, TRANSIENT) // eslint-disable-line no-plusplus

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 2, "should return a new instance each time")
})

test("REGISTRATION", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, REGISTRATION) // eslint-disable-line no-plusplus

  const i = container.resolve("id")
  const j = container.resolve("id")

  t.is(i, 1)
  t.is(j, 1, "should cache the instance")
})

test("REGISTRATION with child containers", t => {
  let instances = 0
  const container = createContainer("root")
  container.registerFactory("id", () => ++instances, REGISTRATION) // eslint-disable-line no-plusplus

  const i = container.child("name1").resolve("id")
  const j = container.child("name2").resolve("id")

  t.is(i, 1)
  t.is(j, 1, "should cache the instance for the lifetime of the registration container")
})
