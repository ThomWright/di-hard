import test from "ava"

import createContainerModule from "../container"
import {Factory} from "../modules"

const {createContainer} = createContainerModule()

test("simple circular dependency graph", t => {
  const A: Factory = ({B}) => B
  const B: Factory = ({A}) => A

  const container = createContainer("root")
  container.registerFactory("A", A)
  container.registerFactory("B", B)

  const error = t.throws(
    () => container.resolve("A"),
    Error,
    "should throw when there are circular dependencies",
  )
  t.regex(error.message, /circular/i)
  t.regex(error.message, /A \(root\) -> B \(root\) -> A \(root\)/)
})

test("deeper circular dependency graph", t => {
  const A: Factory = ({B, C}) => [B, C]
  const B: Factory = ({D}) => D
  const C: Factory = ({D}) => D
  const D: Factory = ({C}) => C

  const container = createContainer("root")
  container.registerFactory("A", A)
  container.registerFactory("B", B)
  container.registerFactory("C", C)
  container.registerFactory("D", D)

  const error = t.throws(
    () => container.resolve("A"),
    Error,
    "should throw when there are circular dependencies",
  )
  t.regex(error.message, /circular/i)
  t.regex(
    error.message,
    /[A \(root\) -> B \(root\) -> D \(root\) -> C \(root\) -> D \(root\)|A \(root\) -> C \(root\) -> D \(root\) -> C \(root\)]/,
    "ACDC is a circular dependency",
  )
})

test("across container boundaries", t => {
  const A: Factory = ({B, C}) => [B, C]
  const B: Factory = ({D}) => D
  const C: Factory = ({D}) => D
  const D: Factory = ({C}) => C

  const parent = createContainer("root")
  parent.registerFactory("B", B)
  parent.registerFactory("C", C)
  parent.registerFactory("D", D)

  const child = parent.child("child")
  child.registerFactory("A", A)

  const error = t.throws(
    () => child.resolve("A"),
    Error,
    "should throw when there are circular dependencies",
  )
  t.regex(error.message, /circular/i)
  t.regex(
    error.message,
    /[A -> B -> D -> C -> D|A -> C -> D -> C]/,
    "ACDC is a circular dependency",
  )
})
