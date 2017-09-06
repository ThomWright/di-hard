
const lifetimes = [
  "TRANSIENT",
  "REGISTRATION",
]

module.exports = new Proxy(
  {},
  {
    get(target, name) {
      if (!lifetimes.includes(name)) {
        throw new Error(`'${name}' is not a valid lifetime. Valid keys: ${lifetimes.join(", ")}`)
      }
      return name
    },
  }
)
