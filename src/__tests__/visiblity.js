const test = require("ava")
const {
  createModule,
  createRegistrationApi,
} = require("../modules")
const {
  forRootModule,
  makePublic,
  makePrivate,
} = require("../visibility")

test("public component in same module", t => {
  const componentDef = makePublic({})
  const dependencyDef = makePublic({})
  const rootModule = createModule()

  const reg = createRegistrationApi(rootModule)
  reg.registerFactory("id", componentDef)
  reg.registerFactory("dep", dependencyDef)

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["id"])
  const visible = isVisible(["dep"])
  t.is(visible, true, "components should be visible to other components in the same module")
})

test("private component in same module", t => {
  const componentDef = makePrivate({})
  const dependencyDef = makePrivate({})
  const rootModule = createModule()

  const reg = createRegistrationApi(rootModule)
  reg.registerModule("mod", makePublic(createModule()))
  const modReg = reg.forSubModule("mod")
  modReg.registerFactory("id", componentDef)
  modReg.registerFactory("dep", dependencyDef)

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["mod", "id"])
  const visible = isVisible(["mod", "dep"])
  t.is(visible, true, "private components should be visible to other components in the same module")
})

test("public component in private submodule", t => {
  const componentDef = makePublic({})
  const dependencyDef = makePublic({})
  const rootModule = createModule()

  const reg = createRegistrationApi(rootModule)
  reg.registerFactory("id", componentDef)
  reg.registerModule("mod", makePrivate(createModule()))

  const modReg = reg.forSubModule("mod")
  modReg.registerFactory("dep", dependencyDef)

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["id"])
  const visible = isVisible(["mod", "dep"])
  t.is(visible, true, "public components should be visible to components in the parent module")
})

test("public component nested in private submodule", t => {
  const componentDef = makePublic({})
  const dependencyDef = makePublic({})
  const rootModule = createModule()

  const reg = createRegistrationApi(rootModule)
  reg.registerFactory("id", componentDef)
  reg.registerModule("mod", makePrivate(createModule()))

  const modReg = reg.forSubModule("mod")
  modReg.registerModule("nested", makePublic(createModule()))

  const nestedReg = modReg.forSubModule("nested")
  nestedReg.registerFactory("dep", dependencyDef)

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["id"])
  const visible = isVisible(["mod", "nested", "dep"])
  t.is(visible, true, "public components nested inside a private module should be visible to components in the owner module")
})

test("private component in public submodule", t => {
  const componentDef = makePublic({})
  const dependencyDef = makePrivate({})
  const rootModule = createModule()

  const reg = createRegistrationApi(rootModule)
  reg.registerFactory("id", componentDef)
  reg.registerModule("mod", makePublic(createModule()))

  const modReg = reg.forSubModule("mod")
  modReg.registerFactory("dep", dependencyDef)

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["id"])
  const visible = isVisible(["mod", "dep"])
  t.is(visible, false, "private components should not be visible to components in the parent module")
})

test("private component in public parent module", t => {
  const componentDef = makePublic({})
  const dependencyDef = makePrivate({})
  const rootModule = createModule()

  const reg = createRegistrationApi(rootModule)
  reg.registerFactory("dep", dependencyDef)
  reg.registerModule("mod", makePublic(createModule()))

  const modReg = reg.forSubModule("mod")
  modReg.registerFactory("id", componentDef)

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["mod", "id"])
  const visible = isVisible(["dep"])
  t.is(visible, false, "private components should not be visible to components in the parent module")
})

test("public component in private submodule", t => {
  const componentDef = makePublic({})
  const dependencyDef = makePublic({})
  const rootModule = createModule()

  const reg = createRegistrationApi(rootModule)
  reg.registerFactory("dep", dependencyDef)
  reg.registerModule("mod", makePrivate(createModule()))

  const modReg = reg.forSubModule("mod")
  modReg.registerFactory("id", componentDef)

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["mod", "id"])
  const visible = isVisible(["dep"])
  t.is(visible, true, "private components should not be visible to components in the parent module")
})

test("public component with private common ancestor", t => {
  const componentDef = makePublic({})
  const dependencyDef = makePublic({})
  const rootModule = createModule()

  const reg = createRegistrationApi(rootModule)
  reg.registerModule("modA", makePrivate(createModule()))

  const modAReg = reg.forSubModule("modA")
  modAReg.registerFactory("dep", dependencyDef)
  modAReg.registerModule("modB", makePrivate(createModule()))

  const modBReg = modAReg.forSubModule("modB")
  modBReg.registerFactory("id", componentDef)

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["modA", "modB", "id"])
  const visible = isVisible(["modA", "dep"])
  t.is(visible, true, "public components should be visible to components with common ancestors")
})

test("public component with private common ancestor", t => {
  const componentDef = makePublic({})
  const dependencyDef = makePrivate({})
  const rootModule = createModule()

  const reg = createRegistrationApi(rootModule)
  reg.registerModule("modA", makePrivate(createModule()))

  const modAReg = reg.forSubModule("modA")
  modAReg.registerFactory("dep", dependencyDef)
  modAReg.registerModule("modB", makePrivate(createModule()))

  const modBReg = modAReg.forSubModule("modB")
  modBReg.registerFactory("id", componentDef)

  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(["modA", "modB", "id"])
  const visible = isVisible(["modA", "dep"])
  t.is(visible, false, "private components should not be visible to components with common ancestors")
})
