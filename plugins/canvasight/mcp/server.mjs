#!/usr/bin/env node
// Generated from mcp/server.source.mjs by npm run build:mcp. Do not edit directly.
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x2)(function(x2) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x2 + '" is not supported');
});
var __esm = (fn, res, err2) => function __init() {
  if (err2) throw err2[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err2 = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/zod/v4/core/core.js
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer3, params) {
  function init(inst, def) {
    if (!inst._zod) {
      Object.defineProperty(inst, "_zod", {
        value: {
          def,
          constr: _2,
          traits: /* @__PURE__ */ new Set()
        },
        enumerable: false
      });
    }
    if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer3(inst, def);
    const proto = _2.prototype;
    const keys = Object.keys(proto);
    for (let i2 = 0; i2 < keys.length; i2++) {
      const k2 = keys[i2];
      if (!(k2 in inst)) {
        inst[k2] = proto[k2].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _2(def) {
    var _a4;
    const inst = params?.Parent ? new Definition() : this;
    init(inst, def);
    (_a4 = inst._zod).deferred ?? (_a4.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_2, "init", { value: init });
  Object.defineProperty(_2, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_2, "name", { value: name });
  return _2;
}
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}
var _a, NEVER, $brand, $ZodAsyncError, $ZodEncodeError, globalConfig;
var init_core = __esm({
  "node_modules/zod/v4/core/core.js"() {
    NEVER = /* @__PURE__ */ Object.freeze({
      status: "aborted"
    });
    $brand = /* @__PURE__ */ Symbol("zod_brand");
    $ZodAsyncError = class extends Error {
      constructor() {
        super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
      }
    };
    $ZodEncodeError = class extends Error {
      constructor(name) {
        super("Encountered unidirectional transform during encode: ".concat(name));
        this.name = "ZodEncodeError";
      }
    };
    (_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
    globalConfig = globalThis.__zod_globalConfig;
  }
});

// node_modules/zod/v4/core/util.js
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  base64ToUint8Array: () => base64ToUint8Array,
  base64urlToUint8Array: () => base64urlToUint8Array,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  cloneDef: () => cloneDef,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  explicitlyAborted: () => explicitlyAborted,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  hexToUint8Array: () => hexToUint8Array,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  merge: () => merge,
  mergeDefs: () => mergeDefs,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  objectClone: () => objectClone,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  parsedType: () => parsedType,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  required: () => required,
  safeExtend: () => safeExtend,
  shallowClone: () => shallowClone,
  slugify: () => slugify,
  stringifyPrimitive: () => stringifyPrimitive,
  uint8ArrayToBase64: () => uint8ArrayToBase64,
  uint8ArrayToBase64url: () => uint8ArrayToBase64url,
  uint8ArrayToHex: () => uint8ArrayToHex,
  unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
  return val;
}
function assertNotEqual(val) {
  return val;
}
function assertIs(_arg) {
}
function assertNever(_x) {
  throw new Error("Unexpected value in exhaustive check");
}
function assert(_2) {
}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v2) => typeof v2 === "number");
  const values = Object.entries(entries).filter(([k2, _2]) => numericValues.indexOf(+k2) === -1).map(([_2, v2]) => v2);
  return values;
}
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_2, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  const set2 = false;
  return {
    get value() {
      if (!set2) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    }
  };
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
function defineLazy(object2, key, getter) {
  let value = void 0;
  Object.defineProperty(object2, key, {
    get() {
      if (value === EVALUATING) {
        return void 0;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v2) {
      Object.defineProperty(object2, key, {
        value: v2
        // configurable: true,
      });
    },
    configurable: true
  });
}
function objectClone(obj) {
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function cloneDef(schema) {
  return mergeDefs(schema._zod.def);
}
function getElementAtPath(obj, path2) {
  if (!path2)
    return obj;
  return path2.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i2 = 0; i2 < keys.length; i2++) {
      resolvedObj[keys[i2]] = results[i2];
    }
    return resolvedObj;
  });
}
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i2 = 0; i2 < length; i2++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
function numKeys(data) {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_2, prop, receiver) {
      target ?? (target = getter());
      return Reflect.get(target, prop, receiver);
    },
    set(_2, prop, value, receiver) {
      target ?? (target = getter());
      return Reflect.set(target, prop, value, receiver);
    },
    has(_2, prop) {
      target ?? (target = getter());
      return Reflect.has(target, prop);
    },
    deleteProperty(_2, prop) {
      target ?? (target = getter());
      return Reflect.deleteProperty(target, prop);
    },
    ownKeys(_2) {
      target ?? (target = getter());
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_2, prop) {
      target ?? (target = getter());
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_2, prop, descriptor) {
      target ?? (target = getter());
      return Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return '"'.concat(value, '"');
  return "".concat(value);
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k2) => {
    return shape[k2]._zod.optin === "optional" && shape[k2]._zod.optout === "optional";
  });
}
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = {};
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error('Unrecognized key: "'.concat(key, '"'));
        }
        if (!mask[key])
          continue;
        newShape[key] = currDef.shape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = { ...schema._zod.def.shape };
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error('Unrecognized key: "'.concat(key, '"'));
        }
        if (!mask[key])
          continue;
        delete newShape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = schema._zod.def.shape;
    for (const key in shape) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema, def);
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema, def);
}
function merge(a, b) {
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const def = mergeDefs(a._zod.def, {
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class2, schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".partial() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in oldShape)) {
            throw new Error('Unrecognized key: "'.concat(key, '"'));
          }
          if (!mask[key])
            continue;
          shape[key] = Class2 ? new Class2({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      } else {
        for (const key in oldShape) {
          shape[key] = Class2 ? new Class2({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
    checks: []
  });
  return clone(schema, def);
}
function required(Class2, schema, mask) {
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in shape)) {
            throw new Error('Unrecognized key: "'.concat(key, '"'));
          }
          if (!mask[key])
            continue;
          shape[key] = new Class2({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      } else {
        for (const key in oldShape) {
          shape[key] = new Class2({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    }
  });
  return clone(schema, def);
}
function aborted(x2, startIndex = 0) {
  if (x2.aborted === true)
    return true;
  for (let i2 = startIndex; i2 < x2.issues.length; i2++) {
    if (x2.issues[i2]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x2, startIndex = 0) {
  if (x2.aborted === true)
    return true;
  for (let i2 = startIndex; i2 < x2.issues.length; i2++) {
    if (x2.issues[i2]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path2, issues) {
  return issues.map((iss) => {
    var _a4;
    (_a4 = iss).path ?? (_a4.path = []);
    iss.path.unshift(path2);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config2) {
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
  rest.path ?? (rest.path = []);
  rest.message = message;
  if (ctx?.reportInput) {
    rest.input = _input;
  }
  return rest;
}
function getSizableOrigin(input) {
  if (input instanceof Set)
    return "set";
  if (input instanceof Map)
    return "map";
  if (input instanceof File)
    return "file";
  return "unknown";
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function parsedType(data) {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }
      const obj = data;
      if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
        return obj.constructor.name;
      }
    }
  }
  return t;
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k2, _2]) => {
    return Number.isNaN(Number.parseInt(k2, 10));
  }).map((el) => el[1]);
}
function base64ToUint8Array(base643) {
  const binaryString = atob(base643);
  const bytes = new Uint8Array(binaryString.length);
  for (let i2 = 0; i2 < binaryString.length; i2++) {
    bytes[i2] = binaryString.charCodeAt(i2);
  }
  return bytes;
}
function uint8ArrayToBase64(bytes) {
  let binaryString = "";
  for (let i2 = 0; i2 < bytes.length; i2++) {
    binaryString += String.fromCharCode(bytes[i2]);
  }
  return btoa(binaryString);
}
function base64urlToUint8Array(base64url3) {
  const base643 = base64url3.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - base643.length % 4) % 4);
  return base64ToUint8Array(base643 + padding);
}
function uint8ArrayToBase64url(bytes) {
  return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hexToUint8Array(hex3) {
  const cleanHex = hex3.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i2 = 0; i2 < cleanHex.length; i2 += 2) {
    bytes[i2 / 2] = Number.parseInt(cleanHex.slice(i2, i2 + 2), 16);
  }
  return bytes;
}
function uint8ArrayToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var EVALUATING, captureStackTrace, allowsEval, getParsedType, propertyKeyTypes, primitiveTypes, NUMBER_FORMAT_RANGES, BIGINT_FORMAT_RANGES, Class;
var init_util = __esm({
  "node_modules/zod/v4/core/util.js"() {
    init_core();
    EVALUATING = /* @__PURE__ */ Symbol("evaluating");
    captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
    };
    allowsEval = /* @__PURE__ */ cached(() => {
      if (globalConfig.jitless) {
        return false;
      }
      if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
        return false;
      }
      try {
        const F = Function;
        new F("");
        return true;
      } catch (_2) {
        return false;
      }
    });
    getParsedType = (data) => {
      const t = typeof data;
      switch (t) {
        case "undefined":
          return "undefined";
        case "string":
          return "string";
        case "number":
          return Number.isNaN(data) ? "nan" : "number";
        case "boolean":
          return "boolean";
        case "function":
          return "function";
        case "bigint":
          return "bigint";
        case "symbol":
          return "symbol";
        case "object":
          if (Array.isArray(data)) {
            return "array";
          }
          if (data === null) {
            return "null";
          }
          if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return "promise";
          }
          if (typeof Map !== "undefined" && data instanceof Map) {
            return "map";
          }
          if (typeof Set !== "undefined" && data instanceof Set) {
            return "set";
          }
          if (typeof Date !== "undefined" && data instanceof Date) {
            return "date";
          }
          if (typeof File !== "undefined" && data instanceof File) {
            return "file";
          }
          return "object";
        default:
          throw new Error("Unknown data type: ".concat(t));
      }
    };
    propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
    primitiveTypes = /* @__PURE__ */ new Set([
      "string",
      "number",
      "bigint",
      "boolean",
      "symbol",
      "undefined"
    ]);
    NUMBER_FORMAT_RANGES = {
      safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
      int32: [-2147483648, 2147483647],
      uint32: [0, 4294967295],
      float32: [-34028234663852886e22, 34028234663852886e22],
      float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
    };
    BIGINT_FORMAT_RANGES = {
      int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
      uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
    };
    Class = class {
      constructor(..._args) {
      }
    };
  }
});

// node_modules/zod/v4/core/errors.js
function flattenError(error51, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error51.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error51, mapper = (issue2) => issue2.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error52, path2 = []) => {
    for (const issue2 of error52.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path2, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path2, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path2, ...issue2.path]);
      } else {
        const fullpath = [...path2, ...issue2.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i2 = 0;
          while (i2 < fullpath.length) {
            const el = fullpath[i2];
            const terminal = i2 === fullpath.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue2));
            }
            curr = curr[el];
            i2++;
          }
        }
      }
    }
  };
  processError(error51);
  return fieldErrors;
}
function treeifyError(error51, mapper = (issue2) => issue2.message) {
  const result = { errors: [] };
  const processError = (error52, path2 = []) => {
    var _a4, _b2;
    for (const issue2 of error52.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path2, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path2, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path2, ...issue2.path]);
      } else {
        const fullpath = [...path2, ...issue2.path];
        if (fullpath.length === 0) {
          result.errors.push(mapper(issue2));
          continue;
        }
        let curr = result;
        let i2 = 0;
        while (i2 < fullpath.length) {
          const el = fullpath[i2];
          const terminal = i2 === fullpath.length - 1;
          if (typeof el === "string") {
            curr.properties ?? (curr.properties = {});
            (_a4 = curr.properties)[el] ?? (_a4[el] = { errors: [] });
            curr = curr.properties[el];
          } else {
            curr.items ?? (curr.items = []);
            (_b2 = curr.items)[el] ?? (_b2[el] = { errors: [] });
            curr = curr.items[el];
          }
          if (terminal) {
            curr.errors.push(mapper(issue2));
          }
          i2++;
        }
      }
    }
  };
  processError(error51);
  return result;
}
function toDotPath(_path) {
  const segs = [];
  const path2 = _path.map((seg) => typeof seg === "object" ? seg.key : seg);
  for (const seg of path2) {
    if (typeof seg === "number")
      segs.push("[".concat(seg, "]"));
    else if (typeof seg === "symbol")
      segs.push("[".concat(JSON.stringify(String(seg)), "]"));
    else if (/[^\w$]/.test(seg))
      segs.push("[".concat(JSON.stringify(seg), "]"));
    else {
      if (segs.length)
        segs.push(".");
      segs.push(seg);
    }
  }
  return segs.join("");
}
function prettifyError(error51) {
  const lines = [];
  const issues = [...error51.issues].sort((a, b) => (a.path ?? []).length - (b.path ?? []).length);
  for (const issue2 of issues) {
    lines.push("✖ ".concat(issue2.message));
    if (issue2.path?.length)
      lines.push("  → at ".concat(toDotPath(issue2.path)));
  }
  return lines.join("\n");
}
var initializer, $ZodError, $ZodRealError;
var init_errors = __esm({
  "node_modules/zod/v4/core/errors.js"() {
    init_core();
    init_util();
    initializer = (inst, def) => {
      inst.name = "$ZodError";
      Object.defineProperty(inst, "_zod", {
        value: inst._zod,
        enumerable: false
      });
      Object.defineProperty(inst, "issues", {
        value: def,
        enumerable: false
      });
      inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
      Object.defineProperty(inst, "toString", {
        value: () => inst.message,
        enumerable: false
      });
    };
    $ZodError = $constructor("$ZodError", initializer);
    $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
  }
});

// node_modules/zod/v4/core/parse.js
var _parse, parse, _parseAsync, parseAsync, _safeParse, safeParse, _safeParseAsync, safeParseAsync, _encode, encode, _decode, decode, _encodeAsync, encodeAsync, _decodeAsync, decodeAsync, _safeEncode, safeEncode, _safeDecode, safeDecode, _safeEncodeAsync, safeEncodeAsync, _safeDecodeAsync, safeDecodeAsync;
var init_parse = __esm({
  "node_modules/zod/v4/core/parse.js"() {
    init_core();
    init_errors();
    init_util();
    _parse = (_Err) => (schema, value, _ctx, _params) => {
      const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
      const result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise) {
        throw new $ZodAsyncError();
      }
      if (result.issues.length) {
        const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
        captureStackTrace(e, _params?.callee);
        throw e;
      }
      return result.value;
    };
    parse = /* @__PURE__ */ _parse($ZodRealError);
    _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
      const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
      let result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise)
        result = await result;
      if (result.issues.length) {
        const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
        captureStackTrace(e, params?.callee);
        throw e;
      }
      return result.value;
    };
    parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError);
    _safeParse = (_Err) => (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
      const result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise) {
        throw new $ZodAsyncError();
      }
      return result.issues.length ? {
        success: false,
        error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
      } : { success: true, data: result.value };
    };
    safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
    _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
      let result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise)
        result = await result;
      return result.issues.length ? {
        success: false,
        error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
      } : { success: true, data: result.value };
    };
    safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);
    _encode = (_Err) => (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
      return _parse(_Err)(schema, value, ctx);
    };
    encode = /* @__PURE__ */ _encode($ZodRealError);
    _decode = (_Err) => (schema, value, _ctx) => {
      return _parse(_Err)(schema, value, _ctx);
    };
    decode = /* @__PURE__ */ _decode($ZodRealError);
    _encodeAsync = (_Err) => async (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
      return _parseAsync(_Err)(schema, value, ctx);
    };
    encodeAsync = /* @__PURE__ */ _encodeAsync($ZodRealError);
    _decodeAsync = (_Err) => async (schema, value, _ctx) => {
      return _parseAsync(_Err)(schema, value, _ctx);
    };
    decodeAsync = /* @__PURE__ */ _decodeAsync($ZodRealError);
    _safeEncode = (_Err) => (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
      return _safeParse(_Err)(schema, value, ctx);
    };
    safeEncode = /* @__PURE__ */ _safeEncode($ZodRealError);
    _safeDecode = (_Err) => (schema, value, _ctx) => {
      return _safeParse(_Err)(schema, value, _ctx);
    };
    safeDecode = /* @__PURE__ */ _safeDecode($ZodRealError);
    _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
      return _safeParseAsync(_Err)(schema, value, ctx);
    };
    safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync($ZodRealError);
    _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
      return _safeParseAsync(_Err)(schema, value, _ctx);
    };
    safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync($ZodRealError);
  }
});

// node_modules/zod/v4/core/regexes.js
var regexes_exports = {};
__export(regexes_exports, {
  base64: () => base64,
  base64url: () => base64url,
  bigint: () => bigint,
  boolean: () => boolean,
  browserEmail: () => browserEmail,
  cidrv4: () => cidrv4,
  cidrv6: () => cidrv6,
  cuid: () => cuid,
  cuid2: () => cuid2,
  date: () => date,
  datetime: () => datetime,
  domain: () => domain,
  duration: () => duration,
  e164: () => e164,
  email: () => email,
  emoji: () => emoji,
  extendedDuration: () => extendedDuration,
  guid: () => guid,
  hex: () => hex,
  hostname: () => hostname,
  html5Email: () => html5Email,
  httpProtocol: () => httpProtocol,
  idnEmail: () => idnEmail,
  integer: () => integer,
  ipv4: () => ipv4,
  ipv6: () => ipv6,
  ksuid: () => ksuid,
  lowercase: () => lowercase,
  mac: () => mac,
  md5_base64: () => md5_base64,
  md5_base64url: () => md5_base64url,
  md5_hex: () => md5_hex,
  nanoid: () => nanoid,
  null: () => _null,
  number: () => number,
  rfc5322Email: () => rfc5322Email,
  sha1_base64: () => sha1_base64,
  sha1_base64url: () => sha1_base64url,
  sha1_hex: () => sha1_hex,
  sha256_base64: () => sha256_base64,
  sha256_base64url: () => sha256_base64url,
  sha256_hex: () => sha256_hex,
  sha384_base64: () => sha384_base64,
  sha384_base64url: () => sha384_base64url,
  sha384_hex: () => sha384_hex,
  sha512_base64: () => sha512_base64,
  sha512_base64url: () => sha512_base64url,
  sha512_hex: () => sha512_hex,
  string: () => string,
  time: () => time,
  ulid: () => ulid,
  undefined: () => _undefined,
  unicodeEmail: () => unicodeEmail,
  uppercase: () => uppercase,
  uuid: () => uuid,
  uuid4: () => uuid4,
  uuid6: () => uuid6,
  uuid7: () => uuid7,
  xid: () => xid
});
function emoji() {
  return new RegExp(_emoji, "u");
}
function timeSource(args) {
  const hhmm = "(?:[01]\\d|2[0-3]):[0-5]\\d";
  const regex = typeof args.precision === "number" ? args.precision === -1 ? "".concat(hhmm) : args.precision === 0 ? "".concat(hhmm, ":[0-5]\\d") : "".concat(hhmm, ":[0-5]\\d\\.\\d{").concat(args.precision, "}") : "".concat(hhmm, "(?::[0-5]\\d(?:\\.\\d+)?)?");
  return regex;
}
function time(args) {
  return new RegExp("^".concat(timeSource(args), "$"));
}
function datetime(args) {
  const time3 = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
  const timeRegex = "".concat(time3, "(?:").concat(opts.join("|"), ")");
  return new RegExp("^".concat(dateSource, "T(?:").concat(timeRegex, ")$"));
}
function fixedBase64(bodyLength, padding) {
  return new RegExp("^[A-Za-z0-9+/]{".concat(bodyLength, "}").concat(padding, "$"));
}
function fixedBase64url(length) {
  return new RegExp("^[A-Za-z0-9_-]{".concat(length, "}$"));
}
var cuid, cuid2, ulid, xid, ksuid, nanoid, duration, extendedDuration, guid, uuid, uuid4, uuid6, uuid7, email, html5Email, rfc5322Email, unicodeEmail, idnEmail, browserEmail, _emoji, ipv4, ipv6, mac, cidrv4, cidrv6, base64, base64url, hostname, domain, httpProtocol, e164, dateSource, date, string, bigint, integer, number, boolean, _null, _undefined, lowercase, uppercase, hex, md5_hex, md5_base64, md5_base64url, sha1_hex, sha1_base64, sha1_base64url, sha256_hex, sha256_base64, sha256_base64url, sha384_hex, sha384_base64, sha384_base64url, sha512_hex, sha512_base64, sha512_base64url;
var init_regexes = __esm({
  "node_modules/zod/v4/core/regexes.js"() {
    init_util();
    cuid = /^[cC][0-9a-z]{6,}$/;
    cuid2 = /^[0-9a-z]+$/;
    ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
    xid = /^[0-9a-vA-V]{20}$/;
    ksuid = /^[A-Za-z0-9]{27}$/;
    nanoid = /^[a-zA-Z0-9_-]{21}$/;
    duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
    extendedDuration = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
    guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
    uuid = (version2) => {
      if (!version2)
        return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
      return new RegExp("^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-".concat(version2, "[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$"));
    };
    uuid4 = /* @__PURE__ */ uuid(4);
    uuid6 = /* @__PURE__ */ uuid(6);
    uuid7 = /* @__PURE__ */ uuid(7);
    email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
    html5Email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    rfc5322Email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    unicodeEmail = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
    idnEmail = unicodeEmail;
    browserEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    _emoji = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
    ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
    mac = (delimiter) => {
      const escapedDelim = escapeRegex(delimiter ?? ":");
      return new RegExp("^(?:[0-9A-F]{2}".concat(escapedDelim, "){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}").concat(escapedDelim, "){5}[0-9a-f]{2}$"));
    };
    cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
    cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
    base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
    base64url = /^[A-Za-z0-9_-]*$/;
    hostname = /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
    domain = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    httpProtocol = /^https?$/;
    e164 = /^\+[1-9]\d{6,14}$/;
    dateSource = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))";
    date = /* @__PURE__ */ new RegExp("^".concat(dateSource, "$"));
    string = (params) => {
      const regex = params ? "[\\s\\S]{".concat(params?.minimum ?? 0, ",").concat(params?.maximum ?? "", "}") : "[\\s\\S]*";
      return new RegExp("^".concat(regex, "$"));
    };
    bigint = /^-?\d+n?$/;
    integer = /^-?\d+$/;
    number = /^-?\d+(?:\.\d+)?$/;
    boolean = /^(?:true|false)$/i;
    _null = /^null$/i;
    _undefined = /^undefined$/i;
    lowercase = /^[^A-Z]*$/;
    uppercase = /^[^a-z]*$/;
    hex = /^[0-9a-fA-F]*$/;
    md5_hex = /^[0-9a-fA-F]{32}$/;
    md5_base64 = /* @__PURE__ */ fixedBase64(22, "==");
    md5_base64url = /* @__PURE__ */ fixedBase64url(22);
    sha1_hex = /^[0-9a-fA-F]{40}$/;
    sha1_base64 = /* @__PURE__ */ fixedBase64(27, "=");
    sha1_base64url = /* @__PURE__ */ fixedBase64url(27);
    sha256_hex = /^[0-9a-fA-F]{64}$/;
    sha256_base64 = /* @__PURE__ */ fixedBase64(43, "=");
    sha256_base64url = /* @__PURE__ */ fixedBase64url(43);
    sha384_hex = /^[0-9a-fA-F]{96}$/;
    sha384_base64 = /* @__PURE__ */ fixedBase64(64, "");
    sha384_base64url = /* @__PURE__ */ fixedBase64url(64);
    sha512_hex = /^[0-9a-fA-F]{128}$/;
    sha512_base64 = /* @__PURE__ */ fixedBase64(86, "==");
    sha512_base64url = /* @__PURE__ */ fixedBase64url(86);
  }
});

// node_modules/zod/v4/core/checks.js
function handleCheckPropertyResult(result, payload, property) {
  if (result.issues.length) {
    payload.issues.push(...prefixIssues(property, result.issues));
  }
}
var $ZodCheck, numericOriginMap, $ZodCheckLessThan, $ZodCheckGreaterThan, $ZodCheckMultipleOf, $ZodCheckNumberFormat, $ZodCheckBigIntFormat, $ZodCheckMaxSize, $ZodCheckMinSize, $ZodCheckSizeEquals, $ZodCheckMaxLength, $ZodCheckMinLength, $ZodCheckLengthEquals, $ZodCheckStringFormat, $ZodCheckRegex, $ZodCheckLowerCase, $ZodCheckUpperCase, $ZodCheckIncludes, $ZodCheckStartsWith, $ZodCheckEndsWith, $ZodCheckProperty, $ZodCheckMimeType, $ZodCheckOverwrite;
var init_checks = __esm({
  "node_modules/zod/v4/core/checks.js"() {
    init_core();
    init_regexes();
    init_util();
    $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
      var _a4;
      inst._zod ?? (inst._zod = {});
      inst._zod.def = def;
      (_a4 = inst._zod).onattach ?? (_a4.onattach = []);
    });
    numericOriginMap = {
      number: "number",
      bigint: "bigint",
      object: "date"
    };
    $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
      $ZodCheck.init(inst, def);
      const origin = numericOriginMap[typeof def.value];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
        if (def.value < curr) {
          if (def.inclusive)
            bag.maximum = def.value;
          else
            bag.exclusiveMaximum = def.value;
        }
      });
      inst._zod.check = (payload) => {
        if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
          return;
        }
        payload.issues.push({
          origin,
          code: "too_big",
          maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
          input: payload.value,
          inclusive: def.inclusive,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
      $ZodCheck.init(inst, def);
      const origin = numericOriginMap[typeof def.value];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
        if (def.value > curr) {
          if (def.inclusive)
            bag.minimum = def.value;
          else
            bag.exclusiveMinimum = def.value;
        }
      });
      inst._zod.check = (payload) => {
        if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
          return;
        }
        payload.issues.push({
          origin,
          code: "too_small",
          minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
          input: payload.value,
          inclusive: def.inclusive,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
      $ZodCheck.init(inst, def);
      inst._zod.onattach.push((inst2) => {
        var _a4;
        (_a4 = inst2._zod.bag).multipleOf ?? (_a4.multipleOf = def.value);
      });
      inst._zod.check = (payload) => {
        if (typeof payload.value !== typeof def.value)
          throw new Error("Cannot mix number and bigint in multiple_of check.");
        const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
        if (isMultiple)
          return;
        payload.issues.push({
          origin: typeof payload.value,
          code: "not_multiple_of",
          divisor: def.value,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
      $ZodCheck.init(inst, def);
      def.format = def.format || "float64";
      const isInt = def.format?.includes("int");
      const origin = isInt ? "int" : "number";
      const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.format = def.format;
        bag.minimum = minimum;
        bag.maximum = maximum;
        if (isInt)
          bag.pattern = integer;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        if (isInt) {
          if (!Number.isInteger(input)) {
            payload.issues.push({
              expected: origin,
              format: def.format,
              code: "invalid_type",
              continue: false,
              input,
              inst
            });
            return;
          }
          if (!Number.isSafeInteger(input)) {
            if (input > 0) {
              payload.issues.push({
                input,
                code: "too_big",
                maximum: Number.MAX_SAFE_INTEGER,
                note: "Integers must be within the safe integer range.",
                inst,
                origin,
                inclusive: true,
                continue: !def.abort
              });
            } else {
              payload.issues.push({
                input,
                code: "too_small",
                minimum: Number.MIN_SAFE_INTEGER,
                note: "Integers must be within the safe integer range.",
                inst,
                origin,
                inclusive: true,
                continue: !def.abort
              });
            }
            return;
          }
        }
        if (input < minimum) {
          payload.issues.push({
            origin: "number",
            input,
            code: "too_small",
            minimum,
            inclusive: true,
            inst,
            continue: !def.abort
          });
        }
        if (input > maximum) {
          payload.issues.push({
            origin: "number",
            input,
            code: "too_big",
            maximum,
            inclusive: true,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    $ZodCheckBigIntFormat = /* @__PURE__ */ $constructor("$ZodCheckBigIntFormat", (inst, def) => {
      $ZodCheck.init(inst, def);
      const [minimum, maximum] = BIGINT_FORMAT_RANGES[def.format];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.format = def.format;
        bag.minimum = minimum;
        bag.maximum = maximum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        if (input < minimum) {
          payload.issues.push({
            origin: "bigint",
            input,
            code: "too_small",
            minimum,
            inclusive: true,
            inst,
            continue: !def.abort
          });
        }
        if (input > maximum) {
          payload.issues.push({
            origin: "bigint",
            input,
            code: "too_big",
            maximum,
            inclusive: true,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    $ZodCheckMaxSize = /* @__PURE__ */ $constructor("$ZodCheckMaxSize", (inst, def) => {
      var _a4;
      $ZodCheck.init(inst, def);
      (_a4 = inst._zod.def).when ?? (_a4.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.size !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
        if (def.maximum < curr)
          inst2._zod.bag.maximum = def.maximum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size <= def.maximum)
          return;
        payload.issues.push({
          origin: getSizableOrigin(input),
          code: "too_big",
          maximum: def.maximum,
          inclusive: true,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckMinSize = /* @__PURE__ */ $constructor("$ZodCheckMinSize", (inst, def) => {
      var _a4;
      $ZodCheck.init(inst, def);
      (_a4 = inst._zod.def).when ?? (_a4.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.size !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
        if (def.minimum > curr)
          inst2._zod.bag.minimum = def.minimum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size >= def.minimum)
          return;
        payload.issues.push({
          origin: getSizableOrigin(input),
          code: "too_small",
          minimum: def.minimum,
          inclusive: true,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckSizeEquals = /* @__PURE__ */ $constructor("$ZodCheckSizeEquals", (inst, def) => {
      var _a4;
      $ZodCheck.init(inst, def);
      (_a4 = inst._zod.def).when ?? (_a4.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.size !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.minimum = def.size;
        bag.maximum = def.size;
        bag.size = def.size;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size === def.size)
          return;
        const tooBig = size > def.size;
        payload.issues.push({
          origin: getSizableOrigin(input),
          ...tooBig ? { code: "too_big", maximum: def.size } : { code: "too_small", minimum: def.size },
          inclusive: true,
          exact: true,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
      var _a4;
      $ZodCheck.init(inst, def);
      (_a4 = inst._zod.def).when ?? (_a4.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
        if (def.maximum < curr)
          inst2._zod.bag.maximum = def.maximum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length <= def.maximum)
          return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
          origin,
          code: "too_big",
          maximum: def.maximum,
          inclusive: true,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
      var _a4;
      $ZodCheck.init(inst, def);
      (_a4 = inst._zod.def).when ?? (_a4.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
        if (def.minimum > curr)
          inst2._zod.bag.minimum = def.minimum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length >= def.minimum)
          return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
          origin,
          code: "too_small",
          minimum: def.minimum,
          inclusive: true,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
      var _a4;
      $ZodCheck.init(inst, def);
      (_a4 = inst._zod.def).when ?? (_a4.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.minimum = def.length;
        bag.maximum = def.length;
        bag.length = def.length;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length === def.length)
          return;
        const origin = getLengthableOrigin(input);
        const tooBig = length > def.length;
        payload.issues.push({
          origin,
          ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
          inclusive: true,
          exact: true,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
      var _a4, _b2;
      $ZodCheck.init(inst, def);
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.format = def.format;
        if (def.pattern) {
          bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
          bag.patterns.add(def.pattern);
        }
      });
      if (def.pattern)
        (_a4 = inst._zod).check ?? (_a4.check = (payload) => {
          def.pattern.lastIndex = 0;
          if (def.pattern.test(payload.value))
            return;
          payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: def.format,
            input: payload.value,
            ...def.pattern ? { pattern: def.pattern.toString() } : {},
            inst,
            continue: !def.abort
          });
        });
      else
        (_b2 = inst._zod).check ?? (_b2.check = () => {
        });
    });
    $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
      $ZodCheckStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        def.pattern.lastIndex = 0;
        if (def.pattern.test(payload.value))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "regex",
          input: payload.value,
          pattern: def.pattern.toString(),
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
      def.pattern ?? (def.pattern = lowercase);
      $ZodCheckStringFormat.init(inst, def);
    });
    $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
      def.pattern ?? (def.pattern = uppercase);
      $ZodCheckStringFormat.init(inst, def);
    });
    $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
      $ZodCheck.init(inst, def);
      const escapedRegex = escapeRegex(def.includes);
      const pattern = new RegExp(typeof def.position === "number" ? "^.{".concat(def.position, "}").concat(escapedRegex) : escapedRegex);
      def.pattern = pattern;
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
        bag.patterns.add(pattern);
      });
      inst._zod.check = (payload) => {
        if (payload.value.includes(def.includes, def.position))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "includes",
          includes: def.includes,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
      $ZodCheck.init(inst, def);
      const pattern = new RegExp("^".concat(escapeRegex(def.prefix), ".*"));
      def.pattern ?? (def.pattern = pattern);
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
        bag.patterns.add(pattern);
      });
      inst._zod.check = (payload) => {
        if (payload.value.startsWith(def.prefix))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "starts_with",
          prefix: def.prefix,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
      $ZodCheck.init(inst, def);
      const pattern = new RegExp(".*".concat(escapeRegex(def.suffix), "$"));
      def.pattern ?? (def.pattern = pattern);
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
        bag.patterns.add(pattern);
      });
      inst._zod.check = (payload) => {
        if (payload.value.endsWith(def.suffix))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "ends_with",
          suffix: def.suffix,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckProperty = /* @__PURE__ */ $constructor("$ZodCheckProperty", (inst, def) => {
      $ZodCheck.init(inst, def);
      inst._zod.check = (payload) => {
        const result = def.schema._zod.run({
          value: payload.value[def.property],
          issues: []
        }, {});
        if (result instanceof Promise) {
          return result.then((result2) => handleCheckPropertyResult(result2, payload, def.property));
        }
        handleCheckPropertyResult(result, payload, def.property);
        return;
      };
    });
    $ZodCheckMimeType = /* @__PURE__ */ $constructor("$ZodCheckMimeType", (inst, def) => {
      $ZodCheck.init(inst, def);
      const mimeSet = new Set(def.mime);
      inst._zod.onattach.push((inst2) => {
        inst2._zod.bag.mime = def.mime;
      });
      inst._zod.check = (payload) => {
        if (mimeSet.has(payload.value.type))
          return;
        payload.issues.push({
          code: "invalid_value",
          values: def.mime,
          input: payload.value.type,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
      $ZodCheck.init(inst, def);
      inst._zod.check = (payload) => {
        payload.value = def.tx(payload.value);
      };
    });
  }
});

// node_modules/zod/v4/core/doc.js
var Doc;
var init_doc = __esm({
  "node_modules/zod/v4/core/doc.js"() {
    Doc = class {
      constructor(args = []) {
        this.content = [];
        this.indent = 0;
        if (this)
          this.args = args;
      }
      indented(fn) {
        this.indent += 1;
        fn(this);
        this.indent -= 1;
      }
      write(arg) {
        if (typeof arg === "function") {
          arg(this, { execution: "sync" });
          arg(this, { execution: "async" });
          return;
        }
        const content = arg;
        const lines = content.split("\n").filter((x2) => x2);
        const minIndent = Math.min(...lines.map((x2) => x2.length - x2.trimStart().length));
        const dedented = lines.map((x2) => x2.slice(minIndent)).map((x2) => " ".repeat(this.indent * 2) + x2);
        for (const line of dedented) {
          this.content.push(line);
        }
      }
      compile() {
        const F = Function;
        const args = this?.args;
        const content = this?.content ?? [""];
        const lines = [...content.map((x2) => "  ".concat(x2))];
        return new F(...args, lines.join("\n"));
      }
    };
  }
});

// node_modules/zod/v4/core/versions.js
var version;
var init_versions = __esm({
  "node_modules/zod/v4/core/versions.js"() {
    version = {
      major: 4,
      minor: 4,
      patch: 3
    };
  }
});

// node_modules/zod/v4/core/schemas.js
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base643 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base643.padEnd(Math.ceil(base643.length / 4) * 4, "=");
  return isValidBase64(padded);
}
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
  const isPresent = key in input;
  if (result.issues.length) {
    if (isOptionalIn && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && !isOptionalIn) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  for (const k2 of keys) {
    if (!def.shape?.[k2]?._zod?.traits?.has("$ZodType")) {
      throw new Error('Invalid element at key "'.concat(k2, '": expected a Zod schema'));
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    keys,
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const isOptionalIn = _catchall.optin === "optional";
  const isOptionalOut = _catchall.optout === "optional";
  for (const key in input) {
    if (key === "__proto__")
      continue;
    if (keySet.has(key))
      continue;
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r2 = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r2 instanceof Promise) {
      proms.push(r2.then((r3) => handlePropertyResult(r3, payload, key, input, isOptionalIn, isOptionalOut)));
    } else {
      handlePropertyResult(r2, payload, key, input, isOptionalIn, isOptionalOut);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r2) => !aborted(r2));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
function handleExclusiveUnionResults(results, final, inst, ctx) {
  const successes = results.filter((r2) => r2.issues.length === 0);
  if (successes.length === 1) {
    final.value = successes[0].value;
    return final;
  }
  if (successes.length === 0) {
    final.issues.push({
      code: "invalid_union",
      input: final.value,
      inst,
      errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
    });
  } else {
    final.issues.push({
      code: "invalid_union",
      input: final.value,
      inst,
      errors: [],
      inclusive: false
    });
  }
  return final;
}
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = /* @__PURE__ */ new Map();
  let unrecIssue;
  for (const iss of left.issues) {
    if (iss.code === "unrecognized_keys") {
      unrecIssue ?? (unrecIssue = iss);
      for (const k2 of iss.keys) {
        if (!unrecKeys.has(k2))
          unrecKeys.set(k2, {});
        unrecKeys.get(k2).l = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  for (const iss of right.issues) {
    if (iss.code === "unrecognized_keys") {
      for (const k2 of iss.keys) {
        if (!unrecKeys.has(k2))
          unrecKeys.set(k2, {});
        unrecKeys.get(k2).r = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  const bothKeys = [...unrecKeys].filter(([, f2]) => f2.l && f2.r).map(([k2]) => k2);
  if (bothKeys.length && unrecIssue) {
    result.issues.push({ ...unrecIssue, keys: bothKeys });
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error("Unmergable intersection. Error path: " + "".concat(JSON.stringify(merged.mergeErrorPath)));
  }
  result.value = merged.data;
  return result;
}
function getTupleOptStart(items, key) {
  for (let i2 = items.length - 1; i2 >= 0; i2--) {
    if (items[i2]._zod[key] !== "optional")
      return i2 + 1;
  }
  return 0;
}
function handleTupleResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
function handleTupleResults(itemResults, final, items, input, optoutStart) {
  for (let i2 = 0; i2 < items.length; i2++) {
    const r2 = itemResults[i2];
    const isPresent = i2 < input.length;
    if (r2.issues.length) {
      if (!isPresent && i2 >= optoutStart) {
        final.value.length = i2;
        break;
      }
      final.issues.push(...prefixIssues(i2, r2.issues));
    }
    final.value[i2] = r2.value;
  }
  for (let i2 = final.value.length - 1; i2 >= input.length; i2--) {
    if (items[i2]._zod.optout === "optional" && final.value[i2] === void 0) {
      final.value.length = i2;
    } else {
      break;
    }
  }
  return final;
}
function handleMapResult(keyResult, valueResult, final, key, input, inst, ctx) {
  if (keyResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, keyResult.issues));
    } else {
      final.issues.push({
        code: "invalid_key",
        origin: "map",
        input,
        inst,
        issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  if (valueResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, valueResult.issues));
    } else {
      final.issues.push({
        origin: "map",
        code: "invalid_element",
        input,
        inst,
        key,
        issues: valueResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  final.value.set(keyResult.value, valueResult.value);
}
function handleSetResult(result, final) {
  if (result.issues.length) {
    final.issues.push(...result.issues);
  }
  final.value.add(result.value);
}
function handleOptionalResult(result, input) {
  if (input === void 0 && (result.issues.length || result.fallback)) {
    return { issues: [], value: void 0 };
  }
  return result;
}
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
function handlePipeResult(left, next, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues, fallback: left.fallback }, ctx);
}
function handleCodecAResult(result, def, ctx) {
  if (result.issues.length) {
    result.aborted = true;
    return result;
  }
  const direction = ctx.direction || "forward";
  if (direction === "forward") {
    const transformed = def.transform(result.value, result);
    if (transformed instanceof Promise) {
      return transformed.then((value) => handleCodecTxResult(result, value, def.out, ctx));
    }
    return handleCodecTxResult(result, transformed, def.out, ctx);
  } else {
    const transformed = def.reverseTransform(result.value, result);
    if (transformed instanceof Promise) {
      return transformed.then((value) => handleCodecTxResult(result, value, def.in, ctx));
    }
    return handleCodecTxResult(result, transformed, def.in, ctx);
  }
}
function handleCodecTxResult(left, value, nextSchema, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return nextSchema._zod.run({ value, issues: left.issues }, ctx);
}
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
var $ZodType, $ZodString, $ZodStringFormat, $ZodGUID, $ZodUUID, $ZodEmail, $ZodURL, $ZodEmoji, $ZodNanoID, $ZodCUID, $ZodCUID2, $ZodULID, $ZodXID, $ZodKSUID, $ZodISODateTime, $ZodISODate, $ZodISOTime, $ZodISODuration, $ZodIPv4, $ZodIPv6, $ZodMAC, $ZodCIDRv4, $ZodCIDRv6, $ZodBase64, $ZodBase64URL, $ZodE164, $ZodJWT, $ZodCustomStringFormat, $ZodNumber, $ZodNumberFormat, $ZodBoolean, $ZodBigInt, $ZodBigIntFormat, $ZodSymbol, $ZodUndefined, $ZodNull, $ZodAny, $ZodUnknown, $ZodNever, $ZodVoid, $ZodDate, $ZodArray, $ZodObject, $ZodObjectJIT, $ZodUnion, $ZodXor, $ZodDiscriminatedUnion, $ZodIntersection, $ZodTuple, $ZodRecord, $ZodMap, $ZodSet, $ZodEnum, $ZodLiteral, $ZodFile, $ZodTransform, $ZodOptional, $ZodExactOptional, $ZodNullable, $ZodDefault, $ZodPrefault, $ZodNonOptional, $ZodSuccess, $ZodCatch, $ZodNaN, $ZodPipe, $ZodCodec, $ZodPreprocess, $ZodReadonly, $ZodTemplateLiteral, $ZodFunction, $ZodPromise, $ZodLazy, $ZodCustom;
var init_schemas = __esm({
  "node_modules/zod/v4/core/schemas.js"() {
    init_checks();
    init_core();
    init_doc();
    init_parse();
    init_regexes();
    init_util();
    init_versions();
    init_util();
    $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
      var _a4;
      inst ?? (inst = {});
      inst._zod.def = def;
      inst._zod.bag = inst._zod.bag || {};
      inst._zod.version = version;
      const checks = [...inst._zod.def.checks ?? []];
      if (inst._zod.traits.has("$ZodCheck")) {
        checks.unshift(inst);
      }
      for (const ch of checks) {
        for (const fn of ch._zod.onattach) {
          fn(inst);
        }
      }
      if (checks.length === 0) {
        (_a4 = inst._zod).deferred ?? (_a4.deferred = []);
        inst._zod.deferred?.push(() => {
          inst._zod.run = inst._zod.parse;
        });
      } else {
        const runChecks = (payload, checks2, ctx) => {
          let isAborted = aborted(payload);
          let asyncResult;
          for (const ch of checks2) {
            if (ch._zod.def.when) {
              if (explicitlyAborted(payload))
                continue;
              const shouldRun = ch._zod.def.when(payload);
              if (!shouldRun)
                continue;
            } else if (isAborted) {
              continue;
            }
            const currLen = payload.issues.length;
            const _2 = ch._zod.check(payload);
            if (_2 instanceof Promise && ctx?.async === false) {
              throw new $ZodAsyncError();
            }
            if (asyncResult || _2 instanceof Promise) {
              asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
                await _2;
                const nextLen = payload.issues.length;
                if (nextLen === currLen)
                  return;
                if (!isAborted)
                  isAborted = aborted(payload, currLen);
              });
            } else {
              const nextLen = payload.issues.length;
              if (nextLen === currLen)
                continue;
              if (!isAborted)
                isAborted = aborted(payload, currLen);
            }
          }
          if (asyncResult) {
            return asyncResult.then(() => {
              return payload;
            });
          }
          return payload;
        };
        const handleCanaryResult = (canary, payload, ctx) => {
          if (aborted(canary)) {
            canary.aborted = true;
            return canary;
          }
          const checkResult = runChecks(payload, checks, ctx);
          if (checkResult instanceof Promise) {
            if (ctx.async === false)
              throw new $ZodAsyncError();
            return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
          }
          return inst._zod.parse(checkResult, ctx);
        };
        inst._zod.run = (payload, ctx) => {
          if (ctx.skipChecks) {
            return inst._zod.parse(payload, ctx);
          }
          if (ctx.direction === "backward") {
            const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
            if (canary instanceof Promise) {
              return canary.then((canary2) => {
                return handleCanaryResult(canary2, payload, ctx);
              });
            }
            return handleCanaryResult(canary, payload, ctx);
          }
          const result = inst._zod.parse(payload, ctx);
          if (result instanceof Promise) {
            if (ctx.async === false)
              throw new $ZodAsyncError();
            return result.then((result2) => runChecks(result2, checks, ctx));
          }
          return runChecks(result, checks, ctx);
        };
      }
      defineLazy(inst, "~standard", () => ({
        validate: (value) => {
          try {
            const r2 = safeParse(inst, value);
            return r2.success ? { value: r2.data } : { issues: r2.error?.issues };
          } catch (_2) {
            return safeParseAsync(inst, value).then((r2) => r2.success ? { value: r2.data } : { issues: r2.error?.issues });
          }
        },
        vendor: "zod",
        version: 1
      }));
    });
    $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string(inst._zod.bag);
      inst._zod.parse = (payload, _2) => {
        if (def.coerce)
          try {
            payload.value = String(payload.value);
          } catch (_3) {
          }
        if (typeof payload.value === "string")
          return payload;
        payload.issues.push({
          expected: "string",
          code: "invalid_type",
          input: payload.value,
          inst
        });
        return payload;
      };
    });
    $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
      $ZodCheckStringFormat.init(inst, def);
      $ZodString.init(inst, def);
    });
    $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
      def.pattern ?? (def.pattern = guid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
      if (def.version) {
        const versionMap = {
          v1: 1,
          v2: 2,
          v3: 3,
          v4: 4,
          v5: 5,
          v6: 6,
          v7: 7,
          v8: 8
        };
        const v2 = versionMap[def.version];
        if (v2 === void 0)
          throw new Error('Invalid UUID version: "'.concat(def.version, '"'));
        def.pattern ?? (def.pattern = uuid(v2));
      } else
        def.pattern ?? (def.pattern = uuid());
      $ZodStringFormat.init(inst, def);
    });
    $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
      def.pattern ?? (def.pattern = email);
      $ZodStringFormat.init(inst, def);
    });
    $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
      $ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        try {
          const trimmed = payload.value.trim();
          if (!def.normalize && def.protocol?.source === httpProtocol.source) {
            if (!/^https?:\/\//i.test(trimmed)) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid URL format",
                input: payload.value,
                inst,
                continue: !def.abort
              });
              return;
            }
          }
          const url2 = new URL(trimmed);
          if (def.hostname) {
            def.hostname.lastIndex = 0;
            if (!def.hostname.test(url2.hostname)) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid hostname",
                pattern: def.hostname.source,
                input: payload.value,
                inst,
                continue: !def.abort
              });
            }
          }
          if (def.protocol) {
            def.protocol.lastIndex = 0;
            if (!def.protocol.test(url2.protocol.endsWith(":") ? url2.protocol.slice(0, -1) : url2.protocol)) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid protocol",
                pattern: def.protocol.source,
                input: payload.value,
                inst,
                continue: !def.abort
              });
            }
          }
          if (def.normalize) {
            payload.value = url2.href;
          } else {
            payload.value = trimmed;
          }
          return;
        } catch (_2) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
      def.pattern ?? (def.pattern = emoji());
      $ZodStringFormat.init(inst, def);
    });
    $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
      def.pattern ?? (def.pattern = nanoid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
      def.pattern ?? (def.pattern = cuid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
      def.pattern ?? (def.pattern = cuid2);
      $ZodStringFormat.init(inst, def);
    });
    $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
      def.pattern ?? (def.pattern = ulid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
      def.pattern ?? (def.pattern = xid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
      def.pattern ?? (def.pattern = ksuid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
      def.pattern ?? (def.pattern = datetime(def));
      $ZodStringFormat.init(inst, def);
    });
    $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
      def.pattern ?? (def.pattern = date);
      $ZodStringFormat.init(inst, def);
    });
    $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
      def.pattern ?? (def.pattern = time(def));
      $ZodStringFormat.init(inst, def);
    });
    $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
      def.pattern ?? (def.pattern = duration);
      $ZodStringFormat.init(inst, def);
    });
    $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
      def.pattern ?? (def.pattern = ipv4);
      $ZodStringFormat.init(inst, def);
      inst._zod.bag.format = "ipv4";
    });
    $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
      def.pattern ?? (def.pattern = ipv6);
      $ZodStringFormat.init(inst, def);
      inst._zod.bag.format = "ipv6";
      inst._zod.check = (payload) => {
        try {
          new URL("http://[".concat(payload.value, "]"));
        } catch {
          payload.issues.push({
            code: "invalid_format",
            format: "ipv6",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    $ZodMAC = /* @__PURE__ */ $constructor("$ZodMAC", (inst, def) => {
      def.pattern ?? (def.pattern = mac(def.delimiter));
      $ZodStringFormat.init(inst, def);
      inst._zod.bag.format = "mac";
    });
    $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
      def.pattern ?? (def.pattern = cidrv4);
      $ZodStringFormat.init(inst, def);
    });
    $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
      def.pattern ?? (def.pattern = cidrv6);
      $ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        const parts = payload.value.split("/");
        try {
          if (parts.length !== 2)
            throw new Error();
          const [address, prefix] = parts;
          if (!prefix)
            throw new Error();
          const prefixNum = Number(prefix);
          if ("".concat(prefixNum) !== prefix)
            throw new Error();
          if (prefixNum < 0 || prefixNum > 128)
            throw new Error();
          new URL("http://[".concat(address, "]"));
        } catch {
          payload.issues.push({
            code: "invalid_format",
            format: "cidrv6",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
      def.pattern ?? (def.pattern = base64);
      $ZodStringFormat.init(inst, def);
      inst._zod.bag.contentEncoding = "base64";
      inst._zod.check = (payload) => {
        if (isValidBase64(payload.value))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: "base64",
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
      def.pattern ?? (def.pattern = base64url);
      $ZodStringFormat.init(inst, def);
      inst._zod.bag.contentEncoding = "base64url";
      inst._zod.check = (payload) => {
        if (isValidBase64URL(payload.value))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: "base64url",
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
      def.pattern ?? (def.pattern = e164);
      $ZodStringFormat.init(inst, def);
    });
    $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
      $ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        if (isValidJWT(payload.value, def.alg))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: "jwt",
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCustomStringFormat = /* @__PURE__ */ $constructor("$ZodCustomStringFormat", (inst, def) => {
      $ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        if (def.fn(payload.value))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: def.format,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = inst._zod.bag.pattern ?? number;
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
          try {
            payload.value = Number(payload.value);
          } catch (_2) {
          }
        const input = payload.value;
        if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
          return payload;
        }
        const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
        payload.issues.push({
          expected: "number",
          code: "invalid_type",
          input,
          inst,
          ...received ? { received } : {}
        });
        return payload;
      };
    });
    $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
      $ZodCheckNumberFormat.init(inst, def);
      $ZodNumber.init(inst, def);
    });
    $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = boolean;
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
          try {
            payload.value = Boolean(payload.value);
          } catch (_2) {
          }
        const input = payload.value;
        if (typeof input === "boolean")
          return payload;
        payload.issues.push({
          expected: "boolean",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodBigInt = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = bigint;
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
          try {
            payload.value = BigInt(payload.value);
          } catch (_2) {
          }
        if (typeof payload.value === "bigint")
          return payload;
        payload.issues.push({
          expected: "bigint",
          code: "invalid_type",
          input: payload.value,
          inst
        });
        return payload;
      };
    });
    $ZodBigIntFormat = /* @__PURE__ */ $constructor("$ZodBigIntFormat", (inst, def) => {
      $ZodCheckBigIntFormat.init(inst, def);
      $ZodBigInt.init(inst, def);
    });
    $ZodSymbol = /* @__PURE__ */ $constructor("$ZodSymbol", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "symbol")
          return payload;
        payload.issues.push({
          expected: "symbol",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodUndefined = /* @__PURE__ */ $constructor("$ZodUndefined", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = _undefined;
      inst._zod.values = /* @__PURE__ */ new Set([void 0]);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "undefined")
          return payload;
        payload.issues.push({
          expected: "undefined",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = _null;
      inst._zod.values = /* @__PURE__ */ new Set([null]);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (input === null)
          return payload;
        payload.issues.push({
          expected: "null",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload) => payload;
    });
    $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload) => payload;
    });
    $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        payload.issues.push({
          expected: "never",
          code: "invalid_type",
          input: payload.value,
          inst
        });
        return payload;
      };
    });
    $ZodVoid = /* @__PURE__ */ $constructor("$ZodVoid", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "undefined")
          return payload;
        payload.issues.push({
          expected: "void",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce) {
          try {
            payload.value = new Date(payload.value);
          } catch (_err) {
          }
        }
        const input = payload.value;
        const isDate = input instanceof Date;
        const isValidDate = isDate && !Number.isNaN(input.getTime());
        if (isValidDate)
          return payload;
        payload.issues.push({
          expected: "date",
          code: "invalid_type",
          input,
          ...isDate ? { received: "Invalid Date" } : {},
          inst
        });
        return payload;
      };
    });
    $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
          payload.issues.push({
            expected: "array",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        payload.value = Array(input.length);
        const proms = [];
        for (let i2 = 0; i2 < input.length; i2++) {
          const item = input[i2];
          const result = def.element._zod.run({
            value: item,
            issues: []
          }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => handleArrayResult(result2, payload, i2)));
          } else {
            handleArrayResult(result, payload, i2);
          }
        }
        if (proms.length) {
          return Promise.all(proms).then(() => payload);
        }
        return payload;
      };
    });
    $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
      $ZodType.init(inst, def);
      const desc = Object.getOwnPropertyDescriptor(def, "shape");
      if (!desc?.get) {
        const sh = def.shape;
        Object.defineProperty(def, "shape", {
          get: () => {
            const newSh = { ...sh };
            Object.defineProperty(def, "shape", {
              value: newSh
            });
            return newSh;
          }
        });
      }
      const _normalized = cached(() => normalizeDef(def));
      defineLazy(inst._zod, "propValues", () => {
        const shape = def.shape;
        const propValues = {};
        for (const key in shape) {
          const field = shape[key]._zod;
          if (field.values) {
            propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
            for (const v2 of field.values)
              propValues[key].add(v2);
          }
        }
        return propValues;
      });
      const isObject3 = isObject;
      const catchall = def.catchall;
      let value;
      inst._zod.parse = (payload, ctx) => {
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject3(input)) {
          payload.issues.push({
            expected: "object",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        payload.value = {};
        const proms = [];
        const shape = value.shape;
        for (const key of value.keys) {
          const el = shape[key];
          const isOptionalIn = el._zod.optin === "optional";
          const isOptionalOut = el._zod.optout === "optional";
          const r2 = el._zod.run({ value: input[key], issues: [] }, ctx);
          if (r2 instanceof Promise) {
            proms.push(r2.then((r3) => handlePropertyResult(r3, payload, key, input, isOptionalIn, isOptionalOut)));
          } else {
            handlePropertyResult(r2, payload, key, input, isOptionalIn, isOptionalOut);
          }
        }
        if (!catchall) {
          return proms.length ? Promise.all(proms).then(() => payload) : payload;
        }
        return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
      };
    });
    $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
      $ZodObject.init(inst, def);
      const superParse = inst._zod.parse;
      const _normalized = cached(() => normalizeDef(def));
      const generateFastpass = (shape) => {
        const doc = new Doc(["shape", "payload", "ctx"]);
        const normalized = _normalized.value;
        const parseStr = (key) => {
          const k2 = esc(key);
          return "shape[".concat(k2, "]._zod.run({ value: input[").concat(k2, "], issues: [] }, ctx)");
        };
        doc.write("const input = payload.value;");
        const ids = /* @__PURE__ */ Object.create(null);
        let counter = 0;
        for (const key of normalized.keys) {
          ids[key] = "key_".concat(counter++);
        }
        doc.write("const newResult = {};");
        for (const key of normalized.keys) {
          const id = ids[key];
          const k2 = esc(key);
          const schema = shape[key];
          const isOptionalIn = schema?._zod?.optin === "optional";
          const isOptionalOut = schema?._zod?.optout === "optional";
          doc.write("const ".concat(id, " = ").concat(parseStr(key), ";"));
          if (isOptionalIn && isOptionalOut) {
            doc.write("\n        if (".concat(id, ".issues.length) {\n          if (").concat(k2, " in input) {\n            payload.issues = payload.issues.concat(").concat(id, ".issues.map(iss => ({\n              ...iss,\n              path: iss.path ? [").concat(k2, ", ...iss.path] : [").concat(k2, "]\n            })));\n          }\n        }\n        \n        if (").concat(id, ".value === undefined) {\n          if (").concat(k2, " in input) {\n            newResult[").concat(k2, "] = undefined;\n          }\n        } else {\n          newResult[").concat(k2, "] = ").concat(id, ".value;\n        }\n        \n      "));
          } else if (!isOptionalIn) {
            doc.write("\n        const ".concat(id, "_present = ").concat(k2, " in input;\n        if (").concat(id, ".issues.length) {\n          payload.issues = payload.issues.concat(").concat(id, ".issues.map(iss => ({\n            ...iss,\n            path: iss.path ? [").concat(k2, ", ...iss.path] : [").concat(k2, "]\n          })));\n        }\n        if (!").concat(id, "_present && !").concat(id, '.issues.length) {\n          payload.issues.push({\n            code: "invalid_type",\n            expected: "nonoptional",\n            input: undefined,\n            path: [').concat(k2, "]\n          });\n        }\n\n        if (").concat(id, "_present) {\n          if (").concat(id, ".value === undefined) {\n            newResult[").concat(k2, "] = undefined;\n          } else {\n            newResult[").concat(k2, "] = ").concat(id, ".value;\n          }\n        }\n\n      "));
          } else {
            doc.write("\n        if (".concat(id, ".issues.length) {\n          payload.issues = payload.issues.concat(").concat(id, ".issues.map(iss => ({\n            ...iss,\n            path: iss.path ? [").concat(k2, ", ...iss.path] : [").concat(k2, "]\n          })));\n        }\n        \n        if (").concat(id, ".value === undefined) {\n          if (").concat(k2, " in input) {\n            newResult[").concat(k2, "] = undefined;\n          }\n        } else {\n          newResult[").concat(k2, "] = ").concat(id, ".value;\n        }\n        \n      "));
          }
        }
        doc.write("payload.value = newResult;");
        doc.write("return payload;");
        const fn = doc.compile();
        return (payload, ctx) => fn(shape, payload, ctx);
      };
      let fastpass;
      const isObject3 = isObject;
      const jit = !globalConfig.jitless;
      const allowsEval2 = allowsEval;
      const fastEnabled = jit && allowsEval2.value;
      const catchall = def.catchall;
      let value;
      inst._zod.parse = (payload, ctx) => {
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject3(input)) {
          payload.issues.push({
            expected: "object",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
          if (!fastpass)
            fastpass = generateFastpass(def.shape);
          payload = fastpass(payload, ctx);
          if (!catchall)
            return payload;
          return handleCatchall([], input, payload, ctx, value, inst);
        }
        return superParse(payload, ctx);
      };
    });
    $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
      defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
      defineLazy(inst._zod, "values", () => {
        if (def.options.every((o) => o._zod.values)) {
          return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
        }
        return void 0;
      });
      defineLazy(inst._zod, "pattern", () => {
        if (def.options.every((o) => o._zod.pattern)) {
          const patterns = def.options.map((o) => o._zod.pattern);
          return new RegExp("^(".concat(patterns.map((p2) => cleanRegex(p2.source)).join("|"), ")$"));
        }
        return void 0;
      });
      const first = def.options.length === 1 ? def.options[0]._zod.run : null;
      inst._zod.parse = (payload, ctx) => {
        if (first) {
          return first(payload, ctx);
        }
        let async = false;
        const results = [];
        for (const option of def.options) {
          const result = option._zod.run({
            value: payload.value,
            issues: []
          }, ctx);
          if (result instanceof Promise) {
            results.push(result);
            async = true;
          } else {
            if (result.issues.length === 0)
              return result;
            results.push(result);
          }
        }
        if (!async)
          return handleUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results2) => {
          return handleUnionResults(results2, payload, inst, ctx);
        });
      };
    });
    $ZodXor = /* @__PURE__ */ $constructor("$ZodXor", (inst, def) => {
      $ZodUnion.init(inst, def);
      def.inclusive = false;
      const first = def.options.length === 1 ? def.options[0]._zod.run : null;
      inst._zod.parse = (payload, ctx) => {
        if (first) {
          return first(payload, ctx);
        }
        let async = false;
        const results = [];
        for (const option of def.options) {
          const result = option._zod.run({
            value: payload.value,
            issues: []
          }, ctx);
          if (result instanceof Promise) {
            results.push(result);
            async = true;
          } else {
            results.push(result);
          }
        }
        if (!async)
          return handleExclusiveUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results2) => {
          return handleExclusiveUnionResults(results2, payload, inst, ctx);
        });
      };
    });
    $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
      def.inclusive = false;
      $ZodUnion.init(inst, def);
      const _super = inst._zod.parse;
      defineLazy(inst._zod, "propValues", () => {
        const propValues = {};
        for (const option of def.options) {
          const pv = option._zod.propValues;
          if (!pv || Object.keys(pv).length === 0)
            throw new Error('Invalid discriminated union option at index "'.concat(def.options.indexOf(option), '"'));
          for (const [k2, v2] of Object.entries(pv)) {
            if (!propValues[k2])
              propValues[k2] = /* @__PURE__ */ new Set();
            for (const val of v2) {
              propValues[k2].add(val);
            }
          }
        }
        return propValues;
      });
      const disc = cached(() => {
        const opts = def.options;
        const map2 = /* @__PURE__ */ new Map();
        for (const o of opts) {
          const values = o._zod.propValues?.[def.discriminator];
          if (!values || values.size === 0)
            throw new Error('Invalid discriminated union option at index "'.concat(def.options.indexOf(o), '"'));
          for (const v2 of values) {
            if (map2.has(v2)) {
              throw new Error('Duplicate discriminator value "'.concat(String(v2), '"'));
            }
            map2.set(v2, o);
          }
        }
        return map2;
      });
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!isObject(input)) {
          payload.issues.push({
            code: "invalid_type",
            expected: "object",
            input,
            inst
          });
          return payload;
        }
        const opt = disc.value.get(input?.[def.discriminator]);
        if (opt) {
          return opt._zod.run(payload, ctx);
        }
        if (def.unionFallback || ctx.direction === "backward") {
          return _super(payload, ctx);
        }
        payload.issues.push({
          code: "invalid_union",
          errors: [],
          note: "No matching discriminator",
          discriminator: def.discriminator,
          options: Array.from(disc.value.keys()),
          input,
          path: [def.discriminator],
          inst
        });
        return payload;
      };
    });
    $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        const left = def.left._zod.run({ value: input, issues: [] }, ctx);
        const right = def.right._zod.run({ value: input, issues: [] }, ctx);
        const async = left instanceof Promise || right instanceof Promise;
        if (async) {
          return Promise.all([left, right]).then(([left2, right2]) => {
            return handleIntersectionResults(payload, left2, right2);
          });
        }
        return handleIntersectionResults(payload, left, right);
      };
    });
    $ZodTuple = /* @__PURE__ */ $constructor("$ZodTuple", (inst, def) => {
      $ZodType.init(inst, def);
      const items = def.items;
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
          payload.issues.push({
            input,
            inst,
            expected: "tuple",
            code: "invalid_type"
          });
          return payload;
        }
        payload.value = [];
        const proms = [];
        const optinStart = getTupleOptStart(items, "optin");
        const optoutStart = getTupleOptStart(items, "optout");
        if (!def.rest) {
          if (input.length < optinStart) {
            payload.issues.push({
              code: "too_small",
              minimum: optinStart,
              inclusive: true,
              input,
              inst,
              origin: "array"
            });
            return payload;
          }
          if (input.length > items.length) {
            payload.issues.push({
              code: "too_big",
              maximum: items.length,
              inclusive: true,
              input,
              inst,
              origin: "array"
            });
          }
        }
        const itemResults = new Array(items.length);
        for (let i2 = 0; i2 < items.length; i2++) {
          const r2 = items[i2]._zod.run({ value: input[i2], issues: [] }, ctx);
          if (r2 instanceof Promise) {
            proms.push(r2.then((rr) => {
              itemResults[i2] = rr;
            }));
          } else {
            itemResults[i2] = r2;
          }
        }
        if (def.rest) {
          let i2 = items.length - 1;
          const rest = input.slice(items.length);
          for (const el of rest) {
            i2++;
            const result = def.rest._zod.run({ value: el, issues: [] }, ctx);
            if (result instanceof Promise) {
              proms.push(result.then((r2) => handleTupleResult(r2, payload, i2)));
            } else {
              handleTupleResult(result, payload, i2);
            }
          }
        }
        if (proms.length) {
          return Promise.all(proms).then(() => handleTupleResults(itemResults, payload, items, input, optoutStart));
        }
        return handleTupleResults(itemResults, payload, items, input, optoutStart);
      };
    });
    $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!isPlainObject(input)) {
          payload.issues.push({
            expected: "record",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        const proms = [];
        const values = def.keyType._zod.values;
        if (values) {
          payload.value = {};
          const recordKeys = /* @__PURE__ */ new Set();
          for (const key of values) {
            if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
              recordKeys.add(typeof key === "number" ? key.toString() : key);
              const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
              if (keyResult instanceof Promise) {
                throw new Error("Async schemas not supported in object keys currently");
              }
              if (keyResult.issues.length) {
                payload.issues.push({
                  code: "invalid_key",
                  origin: "record",
                  issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
                  input: key,
                  path: [key],
                  inst
                });
                continue;
              }
              const outKey = keyResult.value;
              const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
              if (result instanceof Promise) {
                proms.push(result.then((result2) => {
                  if (result2.issues.length) {
                    payload.issues.push(...prefixIssues(key, result2.issues));
                  }
                  payload.value[outKey] = result2.value;
                }));
              } else {
                if (result.issues.length) {
                  payload.issues.push(...prefixIssues(key, result.issues));
                }
                payload.value[outKey] = result.value;
              }
            }
          }
          let unrecognized;
          for (const key in input) {
            if (!recordKeys.has(key)) {
              unrecognized = unrecognized ?? [];
              unrecognized.push(key);
            }
          }
          if (unrecognized && unrecognized.length > 0) {
            payload.issues.push({
              code: "unrecognized_keys",
              input,
              inst,
              keys: unrecognized
            });
          }
        } else {
          payload.value = {};
          for (const key of Reflect.ownKeys(input)) {
            if (key === "__proto__")
              continue;
            if (!Object.prototype.propertyIsEnumerable.call(input, key))
              continue;
            let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
            if (keyResult instanceof Promise) {
              throw new Error("Async schemas not supported in object keys currently");
            }
            const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
            if (checkNumericKey) {
              const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
              if (retryResult instanceof Promise) {
                throw new Error("Async schemas not supported in object keys currently");
              }
              if (retryResult.issues.length === 0) {
                keyResult = retryResult;
              }
            }
            if (keyResult.issues.length) {
              if (def.mode === "loose") {
                payload.value[key] = input[key];
              } else {
                payload.issues.push({
                  code: "invalid_key",
                  origin: "record",
                  issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
                  input: key,
                  path: [key],
                  inst
                });
              }
              continue;
            }
            const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
            if (result instanceof Promise) {
              proms.push(result.then((result2) => {
                if (result2.issues.length) {
                  payload.issues.push(...prefixIssues(key, result2.issues));
                }
                payload.value[keyResult.value] = result2.value;
              }));
            } else {
              if (result.issues.length) {
                payload.issues.push(...prefixIssues(key, result.issues));
              }
              payload.value[keyResult.value] = result.value;
            }
          }
        }
        if (proms.length) {
          return Promise.all(proms).then(() => payload);
        }
        return payload;
      };
    });
    $ZodMap = /* @__PURE__ */ $constructor("$ZodMap", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!(input instanceof Map)) {
          payload.issues.push({
            expected: "map",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        const proms = [];
        payload.value = /* @__PURE__ */ new Map();
        for (const [key, value] of input) {
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          const valueResult = def.valueType._zod.run({ value, issues: [] }, ctx);
          if (keyResult instanceof Promise || valueResult instanceof Promise) {
            proms.push(Promise.all([keyResult, valueResult]).then(([keyResult2, valueResult2]) => {
              handleMapResult(keyResult2, valueResult2, payload, key, input, inst, ctx);
            }));
          } else {
            handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
          }
        }
        if (proms.length)
          return Promise.all(proms).then(() => payload);
        return payload;
      };
    });
    $ZodSet = /* @__PURE__ */ $constructor("$ZodSet", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!(input instanceof Set)) {
          payload.issues.push({
            input,
            inst,
            expected: "set",
            code: "invalid_type"
          });
          return payload;
        }
        const proms = [];
        payload.value = /* @__PURE__ */ new Set();
        for (const item of input) {
          const result = def.valueType._zod.run({ value: item, issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => handleSetResult(result2, payload)));
          } else
            handleSetResult(result, payload);
        }
        if (proms.length)
          return Promise.all(proms).then(() => payload);
        return payload;
      };
    });
    $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
      $ZodType.init(inst, def);
      const values = getEnumValues(def.entries);
      const valuesSet = new Set(values);
      inst._zod.values = valuesSet;
      inst._zod.pattern = new RegExp("^(".concat(values.filter((k2) => propertyKeyTypes.has(typeof k2)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|"), ")$"));
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (valuesSet.has(input)) {
          return payload;
        }
        payload.issues.push({
          code: "invalid_value",
          values,
          input,
          inst
        });
        return payload;
      };
    });
    $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
      $ZodType.init(inst, def);
      if (def.values.length === 0) {
        throw new Error("Cannot create literal schema with no valid values");
      }
      const values = new Set(def.values);
      inst._zod.values = values;
      inst._zod.pattern = new RegExp("^(".concat(def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|"), ")$"));
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (values.has(input)) {
          return payload;
        }
        payload.issues.push({
          code: "invalid_value",
          values: def.values,
          input,
          inst
        });
        return payload;
      };
    });
    $ZodFile = /* @__PURE__ */ $constructor("$ZodFile", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (input instanceof File)
          return payload;
        payload.issues.push({
          expected: "file",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.optin = "optional";
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          throw new $ZodEncodeError(inst.constructor.name);
        }
        const _out = def.transform(payload.value, payload);
        if (ctx.async) {
          const output = _out instanceof Promise ? _out : Promise.resolve(_out);
          return output.then((output2) => {
            payload.value = output2;
            payload.fallback = true;
            return payload;
          });
        }
        if (_out instanceof Promise) {
          throw new $ZodAsyncError();
        }
        payload.value = _out;
        payload.fallback = true;
        return payload;
      };
    });
    $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.optin = "optional";
      inst._zod.optout = "optional";
      defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
      });
      defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp("^(".concat(cleanRegex(pattern.source), ")?$")) : void 0;
      });
      inst._zod.parse = (payload, ctx) => {
        if (def.innerType._zod.optin === "optional") {
          const input = payload.value;
          const result = def.innerType._zod.run(payload, ctx);
          if (result instanceof Promise)
            return result.then((r2) => handleOptionalResult(r2, input));
          return handleOptionalResult(result, input);
        }
        if (payload.value === void 0) {
          return payload;
        }
        return def.innerType._zod.run(payload, ctx);
      };
    });
    $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
      $ZodOptional.init(inst, def);
      defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
      inst._zod.parse = (payload, ctx) => {
        return def.innerType._zod.run(payload, ctx);
      };
    });
    $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
      defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
      defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp("^(".concat(cleanRegex(pattern.source), "|null)$")) : void 0;
      });
      defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
      });
      inst._zod.parse = (payload, ctx) => {
        if (payload.value === null)
          return payload;
        return def.innerType._zod.run(payload, ctx);
      };
    });
    $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.optin = "optional";
      defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          return def.innerType._zod.run(payload, ctx);
        }
        if (payload.value === void 0) {
          payload.value = def.defaultValue;
          return payload;
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => handleDefaultResult(result2, def));
        }
        return handleDefaultResult(result, def);
      };
    });
    $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.optin = "optional";
      defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          return def.innerType._zod.run(payload, ctx);
        }
        if (payload.value === void 0) {
          payload.value = def.defaultValue;
        }
        return def.innerType._zod.run(payload, ctx);
      };
    });
    $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "values", () => {
        const v2 = def.innerType._zod.values;
        return v2 ? new Set([...v2].filter((x2) => x2 !== void 0)) : void 0;
      });
      inst._zod.parse = (payload, ctx) => {
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => handleNonOptionalResult(result2, inst));
        }
        return handleNonOptionalResult(result, inst);
      };
    });
    $ZodSuccess = /* @__PURE__ */ $constructor("$ZodSuccess", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          throw new $ZodEncodeError("ZodSuccess");
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => {
            payload.value = result2.issues.length === 0;
            return payload;
          });
        }
        payload.value = result.issues.length === 0;
        return payload;
      };
    });
    $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.optin = "optional";
      defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
      defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          return def.innerType._zod.run(payload, ctx);
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => {
            payload.value = result2.value;
            if (result2.issues.length) {
              payload.value = def.catchValue({
                ...payload,
                error: {
                  issues: result2.issues.map((iss) => finalizeIssue(iss, ctx, config()))
                },
                input: payload.value
              });
              payload.issues = [];
              payload.fallback = true;
            }
            return payload;
          });
        }
        payload.value = result.value;
        if (result.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
          payload.fallback = true;
        }
        return payload;
      };
    });
    $ZodNaN = /* @__PURE__ */ $constructor("$ZodNaN", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
          payload.issues.push({
            input: payload.value,
            inst,
            expected: "nan",
            code: "invalid_type"
          });
          return payload;
        }
        return payload;
      };
    });
    $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "values", () => def.in._zod.values);
      defineLazy(inst._zod, "optin", () => def.in._zod.optin);
      defineLazy(inst._zod, "optout", () => def.out._zod.optout);
      defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          const right = def.out._zod.run(payload, ctx);
          if (right instanceof Promise) {
            return right.then((right2) => handlePipeResult(right2, def.in, ctx));
          }
          return handlePipeResult(right, def.in, ctx);
        }
        const left = def.in._zod.run(payload, ctx);
        if (left instanceof Promise) {
          return left.then((left2) => handlePipeResult(left2, def.out, ctx));
        }
        return handlePipeResult(left, def.out, ctx);
      };
    });
    $ZodCodec = /* @__PURE__ */ $constructor("$ZodCodec", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "values", () => def.in._zod.values);
      defineLazy(inst._zod, "optin", () => def.in._zod.optin);
      defineLazy(inst._zod, "optout", () => def.out._zod.optout);
      defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
      inst._zod.parse = (payload, ctx) => {
        const direction = ctx.direction || "forward";
        if (direction === "forward") {
          const left = def.in._zod.run(payload, ctx);
          if (left instanceof Promise) {
            return left.then((left2) => handleCodecAResult(left2, def, ctx));
          }
          return handleCodecAResult(left, def, ctx);
        } else {
          const right = def.out._zod.run(payload, ctx);
          if (right instanceof Promise) {
            return right.then((right2) => handleCodecAResult(right2, def, ctx));
          }
          return handleCodecAResult(right, def, ctx);
        }
      };
    });
    $ZodPreprocess = /* @__PURE__ */ $constructor("$ZodPreprocess", (inst, def) => {
      $ZodPipe.init(inst, def);
    });
    $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
      defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
      defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          return def.innerType._zod.run(payload, ctx);
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then(handleReadonlyResult);
        }
        return handleReadonlyResult(result);
      };
    });
    $ZodTemplateLiteral = /* @__PURE__ */ $constructor("$ZodTemplateLiteral", (inst, def) => {
      $ZodType.init(inst, def);
      const regexParts = [];
      for (const part of def.parts) {
        if (typeof part === "object" && part !== null) {
          if (!part._zod.pattern) {
            throw new Error("Invalid template literal part, no pattern found: ".concat([...part._zod.traits].shift()));
          }
          const source = part._zod.pattern instanceof RegExp ? part._zod.pattern.source : part._zod.pattern;
          if (!source)
            throw new Error("Invalid template literal part: ".concat(part._zod.traits));
          const start = source.startsWith("^") ? 1 : 0;
          const end = source.endsWith("$") ? source.length - 1 : source.length;
          regexParts.push(source.slice(start, end));
        } else if (part === null || primitiveTypes.has(typeof part)) {
          regexParts.push(escapeRegex("".concat(part)));
        } else {
          throw new Error("Invalid template literal part: ".concat(part));
        }
      }
      inst._zod.pattern = new RegExp("^".concat(regexParts.join(""), "$"));
      inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "string") {
          payload.issues.push({
            input: payload.value,
            inst,
            expected: "string",
            code: "invalid_type"
          });
          return payload;
        }
        inst._zod.pattern.lastIndex = 0;
        if (!inst._zod.pattern.test(payload.value)) {
          payload.issues.push({
            input: payload.value,
            inst,
            code: "invalid_format",
            format: def.format ?? "template_literal",
            pattern: inst._zod.pattern.source
          });
          return payload;
        }
        return payload;
      };
    });
    $ZodFunction = /* @__PURE__ */ $constructor("$ZodFunction", (inst, def) => {
      $ZodType.init(inst, def);
      inst._def = def;
      inst._zod.def = def;
      inst.implement = (func) => {
        if (typeof func !== "function") {
          throw new Error("implement() must be called with a function");
        }
        return function(...args) {
          const parsedArgs = inst._def.input ? parse(inst._def.input, args) : args;
          const result = Reflect.apply(func, this, parsedArgs);
          if (inst._def.output) {
            return parse(inst._def.output, result);
          }
          return result;
        };
      };
      inst.implementAsync = (func) => {
        if (typeof func !== "function") {
          throw new Error("implementAsync() must be called with a function");
        }
        return async function(...args) {
          const parsedArgs = inst._def.input ? await parseAsync(inst._def.input, args) : args;
          const result = await Reflect.apply(func, this, parsedArgs);
          if (inst._def.output) {
            return await parseAsync(inst._def.output, result);
          }
          return result;
        };
      };
      inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "function") {
          payload.issues.push({
            code: "invalid_type",
            expected: "function",
            input: payload.value,
            inst
          });
          return payload;
        }
        const hasPromiseOutput = inst._def.output && inst._def.output._zod.def.type === "promise";
        if (hasPromiseOutput) {
          payload.value = inst.implementAsync(payload.value);
        } else {
          payload.value = inst.implement(payload.value);
        }
        return payload;
      };
      inst.input = (...args) => {
        const F = inst.constructor;
        if (Array.isArray(args[0])) {
          return new F({
            type: "function",
            input: new $ZodTuple({
              type: "tuple",
              items: args[0],
              rest: args[1]
            }),
            output: inst._def.output
          });
        }
        return new F({
          type: "function",
          input: args[0],
          output: inst._def.output
        });
      };
      inst.output = (output) => {
        const F = inst.constructor;
        return new F({
          type: "function",
          input: inst._def.input,
          output
        });
      };
      return inst;
    });
    $ZodPromise = /* @__PURE__ */ $constructor("$ZodPromise", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        return Promise.resolve(payload.value).then((inner) => def.innerType._zod.run({ value: inner, issues: [] }, ctx));
      };
    });
    $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "innerType", () => {
        const d2 = def;
        if (!d2._cachedInner)
          d2._cachedInner = def.getter();
        return d2._cachedInner;
      });
      defineLazy(inst._zod, "pattern", () => inst._zod.innerType?._zod?.pattern);
      defineLazy(inst._zod, "propValues", () => inst._zod.innerType?._zod?.propValues);
      defineLazy(inst._zod, "optin", () => inst._zod.innerType?._zod?.optin ?? void 0);
      defineLazy(inst._zod, "optout", () => inst._zod.innerType?._zod?.optout ?? void 0);
      inst._zod.parse = (payload, ctx) => {
        const inner = inst._zod.innerType;
        return inner._zod.run(payload, ctx);
      };
    });
    $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
      $ZodCheck.init(inst, def);
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _2) => {
        return payload;
      };
      inst._zod.check = (payload) => {
        const input = payload.value;
        const r2 = def.fn(input);
        if (r2 instanceof Promise) {
          return r2.then((r3) => handleRefineResult(r3, payload, input, inst));
        }
        handleRefineResult(r2, payload, input, inst);
        return;
      };
    });
  }
});

// node_modules/zod/v4/locales/ar.js
function ar_default() {
  return {
    localeError: error()
  };
}
var error;
var init_ar = __esm({
  "node_modules/zod/v4/locales/ar.js"() {
    init_util();
    error = () => {
      const Sizable = {
        string: { unit: "حرف", verb: "أن يحوي" },
        file: { unit: "بايت", verb: "أن يحوي" },
        array: { unit: "عنصر", verb: "أن يحوي" },
        set: { unit: "عنصر", verb: "أن يحوي" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "مدخل",
        email: "بريد إلكتروني",
        url: "رابط",
        emoji: "إيموجي",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "تاريخ ووقت بمعيار ISO",
        date: "تاريخ بمعيار ISO",
        time: "وقت بمعيار ISO",
        duration: "مدة بمعيار ISO",
        ipv4: "عنوان IPv4",
        ipv6: "عنوان IPv6",
        cidrv4: "مدى عناوين بصيغة IPv4",
        cidrv6: "مدى عناوين بصيغة IPv6",
        base64: "نَص بترميز base64-encoded",
        base64url: "نَص بترميز base64url-encoded",
        json_string: "نَص على هيئة JSON",
        e164: "رقم هاتف بمعيار E.164",
        jwt: "JWT",
        template_literal: "مدخل"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "مدخلات غير مقبولة: يفترض إدخال instanceof ".concat(issue2.expected, "، ولكن تم إدخال ").concat(received);
            }
            return "مدخلات غير مقبولة: يفترض إدخال ".concat(expected, "، ولكن تم إدخال ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "مدخلات غير مقبولة: يفترض إدخال ".concat(stringifyPrimitive(issue2.values[0]));
            return "اختيار غير مقبول: يتوقع انتقاء أحد هذه الخيارات: ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return " أكبر من اللازم: يفترض أن تكون ".concat(issue2.origin ?? "القيمة", " ").concat(adj, " ").concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "عنصر");
            return "أكبر من اللازم: يفترض أن تكون ".concat(issue2.origin ?? "القيمة", " ").concat(adj, " ").concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "أصغر من اللازم: يفترض لـ ".concat(issue2.origin, " أن يكون ").concat(adj, " ").concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "أصغر من اللازم: يفترض لـ ".concat(issue2.origin, " أن يكون ").concat(adj, " ").concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'نَص غير مقبول: يجب أن يبدأ بـ "'.concat(issue2.prefix, '"');
            if (_issue.format === "ends_with")
              return 'نَص غير مقبول: يجب أن ينتهي بـ "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'نَص غير مقبول: يجب أن يتضمَّن "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "نَص غير مقبول: يجب أن يطابق النمط ".concat(_issue.pattern);
            return "".concat(FormatDictionary[_issue.format] ?? issue2.format, " غير مقبول");
          }
          case "not_multiple_of":
            return "رقم غير مقبول: يجب أن يكون من مضاعفات ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "معرف".concat(issue2.keys.length > 1 ? "ات" : "", " غريب").concat(issue2.keys.length > 1 ? "ة" : "", ": ").concat(joinValues(issue2.keys, "، "));
          case "invalid_key":
            return "معرف غير مقبول في ".concat(issue2.origin);
          case "invalid_union":
            return "مدخل غير مقبول";
          case "invalid_element":
            return "مدخل غير مقبول في ".concat(issue2.origin);
          default:
            return "مدخل غير مقبول";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/az.js
function az_default() {
  return {
    localeError: error2()
  };
}
var error2;
var init_az = __esm({
  "node_modules/zod/v4/locales/az.js"() {
    init_util();
    error2 = () => {
      const Sizable = {
        string: { unit: "simvol", verb: "olmalıdır" },
        file: { unit: "bayt", verb: "olmalıdır" },
        array: { unit: "element", verb: "olmalıdır" },
        set: { unit: "element", verb: "olmalıdır" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "email address",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datetime",
        date: "ISO date",
        time: "ISO time",
        duration: "ISO duration",
        ipv4: "IPv4 address",
        ipv6: "IPv6 address",
        cidrv4: "IPv4 range",
        cidrv6: "IPv6 range",
        base64: "base64-encoded string",
        base64url: "base64url-encoded string",
        json_string: "JSON string",
        e164: "E.164 number",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Yanlış dəyər: gözlənilən instanceof ".concat(issue2.expected, ", daxil olan ").concat(received);
            }
            return "Yanlış dəyər: gözlənilən ".concat(expected, ", daxil olan ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Yanlış dəyər: gözlənilən ".concat(stringifyPrimitive(issue2.values[0]));
            return "Yanlış seçim: aşağıdakılardan biri olmalıdır: ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Çox böyük: gözlənilən ".concat(issue2.origin ?? "dəyər", " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "element");
            return "Çox böyük: gözlənilən ".concat(issue2.origin ?? "dəyər", " ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Çox kiçik: gözlənilən ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            return "Çox kiçik: gözlənilən ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Yanlış mətn: "'.concat(_issue.prefix, '" ilə başlamalıdır');
            if (_issue.format === "ends_with")
              return 'Yanlış mətn: "'.concat(_issue.suffix, '" ilə bitməlidir');
            if (_issue.format === "includes")
              return 'Yanlış mətn: "'.concat(_issue.includes, '" daxil olmalıdır');
            if (_issue.format === "regex")
              return "Yanlış mətn: ".concat(_issue.pattern, " şablonuna uyğun olmalıdır");
            return "Yanlış ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Yanlış ədəd: ".concat(issue2.divisor, " ilə bölünə bilən olmalıdır");
          case "unrecognized_keys":
            return "Tanınmayan açar".concat(issue2.keys.length > 1 ? "lar" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "".concat(issue2.origin, " daxilində yanlış açar");
          case "invalid_union":
            return "Yanlış dəyər";
          case "invalid_element":
            return "".concat(issue2.origin, " daxilində yanlış dəyər");
          default:
            return "Yanlış dəyər";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/be.js
function getBelarusianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
function be_default() {
  return {
    localeError: error3()
  };
}
var error3;
var init_be = __esm({
  "node_modules/zod/v4/locales/be.js"() {
    init_util();
    error3 = () => {
      const Sizable = {
        string: {
          unit: {
            one: "сімвал",
            few: "сімвалы",
            many: "сімвалаў"
          },
          verb: "мець"
        },
        array: {
          unit: {
            one: "элемент",
            few: "элементы",
            many: "элементаў"
          },
          verb: "мець"
        },
        set: {
          unit: {
            one: "элемент",
            few: "элементы",
            many: "элементаў"
          },
          verb: "мець"
        },
        file: {
          unit: {
            one: "байт",
            few: "байты",
            many: "байтаў"
          },
          verb: "мець"
        }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "увод",
        email: "email адрас",
        url: "URL",
        emoji: "эмодзі",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO дата і час",
        date: "ISO дата",
        time: "ISO час",
        duration: "ISO працягласць",
        ipv4: "IPv4 адрас",
        ipv6: "IPv6 адрас",
        cidrv4: "IPv4 дыяпазон",
        cidrv6: "IPv6 дыяпазон",
        base64: "радок у фармаце base64",
        base64url: "радок у фармаце base64url",
        json_string: "JSON радок",
        e164: "нумар E.164",
        jwt: "JWT",
        template_literal: "увод"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "лік",
        array: "масіў"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Няправільны ўвод: чакаўся instanceof ".concat(issue2.expected, ", атрымана ").concat(received);
            }
            return "Няправільны ўвод: чакаўся ".concat(expected, ", атрымана ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Няправільны ўвод: чакалася ".concat(stringifyPrimitive(issue2.values[0]));
            return "Няправільны варыянт: чакаўся адзін з ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              const maxValue = Number(issue2.maximum);
              const unit = getBelarusianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return "Занадта вялікі: чакалася, што ".concat(issue2.origin ?? "значэнне", " павінна ").concat(sizing.verb, " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(unit);
            }
            return "Занадта вялікі: чакалася, што ".concat(issue2.origin ?? "значэнне", " павінна быць ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              const minValue = Number(issue2.minimum);
              const unit = getBelarusianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return "Занадта малы: чакалася, што ".concat(issue2.origin, " павінна ").concat(sizing.verb, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(unit);
            }
            return "Занадта малы: чакалася, што ".concat(issue2.origin, " павінна быць ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Няправільны радок: павінен пачынацца з "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Няправільны радок: павінен заканчвацца на "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Няправільны радок: павінен змяшчаць "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Няправільны радок: павінен адпавядаць шаблону ".concat(_issue.pattern);
            return "Няправільны ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Няправільны лік: павінен быць кратным ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Нераспазнаны ".concat(issue2.keys.length > 1 ? "ключы" : "ключ", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Няправільны ключ у ".concat(issue2.origin);
          case "invalid_union":
            return "Няправільны ўвод";
          case "invalid_element":
            return "Няправільнае значэнне ў ".concat(issue2.origin);
          default:
            return "Няправільны ўвод";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/bg.js
function bg_default() {
  return {
    localeError: error4()
  };
}
var error4;
var init_bg = __esm({
  "node_modules/zod/v4/locales/bg.js"() {
    init_util();
    error4 = () => {
      const Sizable = {
        string: { unit: "символа", verb: "да съдържа" },
        file: { unit: "байта", verb: "да съдържа" },
        array: { unit: "елемента", verb: "да съдържа" },
        set: { unit: "елемента", verb: "да съдържа" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "вход",
        email: "имейл адрес",
        url: "URL",
        emoji: "емоджи",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO време",
        date: "ISO дата",
        time: "ISO време",
        duration: "ISO продължителност",
        ipv4: "IPv4 адрес",
        ipv6: "IPv6 адрес",
        cidrv4: "IPv4 диапазон",
        cidrv6: "IPv6 диапазон",
        base64: "base64-кодиран низ",
        base64url: "base64url-кодиран низ",
        json_string: "JSON низ",
        e164: "E.164 номер",
        jwt: "JWT",
        template_literal: "вход"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "число",
        array: "масив"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Невалиден вход: очакван instanceof ".concat(issue2.expected, ", получен ").concat(received);
            }
            return "Невалиден вход: очакван ".concat(expected, ", получен ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Невалиден вход: очакван ".concat(stringifyPrimitive(issue2.values[0]));
            return "Невалидна опция: очаквано едно от ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Твърде голямо: очаква се ".concat(issue2.origin ?? "стойност", " да съдържа ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "елемента");
            return "Твърде голямо: очаква се ".concat(issue2.origin ?? "стойност", " да бъде ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Твърде малко: очаква се ".concat(issue2.origin, " да съдържа ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Твърде малко: очаква се ".concat(issue2.origin, " да бъде ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Невалиден низ: трябва да започва с "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'Невалиден низ: трябва да завършва с "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Невалиден низ: трябва да включва "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Невалиден низ: трябва да съвпада с ".concat(_issue.pattern);
            let invalid_adj = "Невалиден";
            if (_issue.format === "emoji")
              invalid_adj = "Невалидно";
            if (_issue.format === "datetime")
              invalid_adj = "Невалидно";
            if (_issue.format === "date")
              invalid_adj = "Невалидна";
            if (_issue.format === "time")
              invalid_adj = "Невалидно";
            if (_issue.format === "duration")
              invalid_adj = "Невалидна";
            return "".concat(invalid_adj, " ").concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Невалидно число: трябва да бъде кратно на ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Неразпознат".concat(issue2.keys.length > 1 ? "и" : "", " ключ").concat(issue2.keys.length > 1 ? "ове" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Невалиден ключ в ".concat(issue2.origin);
          case "invalid_union":
            return "Невалиден вход";
          case "invalid_element":
            return "Невалидна стойност в ".concat(issue2.origin);
          default:
            return "Невалиден вход";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/ca.js
function ca_default() {
  return {
    localeError: error5()
  };
}
var error5;
var init_ca = __esm({
  "node_modules/zod/v4/locales/ca.js"() {
    init_util();
    error5 = () => {
      const Sizable = {
        string: { unit: "caràcters", verb: "contenir" },
        file: { unit: "bytes", verb: "contenir" },
        array: { unit: "elements", verb: "contenir" },
        set: { unit: "elements", verb: "contenir" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "entrada",
        email: "adreça electrònica",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data i hora ISO",
        date: "data ISO",
        time: "hora ISO",
        duration: "durada ISO",
        ipv4: "adreça IPv4",
        ipv6: "adreça IPv6",
        cidrv4: "rang IPv4",
        cidrv6: "rang IPv6",
        base64: "cadena codificada en base64",
        base64url: "cadena codificada en base64url",
        json_string: "cadena JSON",
        e164: "número E.164",
        jwt: "JWT",
        template_literal: "entrada"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Tipus invàlid: s'esperava instanceof ".concat(issue2.expected, ", s'ha rebut ").concat(received);
            }
            return "Tipus invàlid: s'esperava ".concat(expected, ", s'ha rebut ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Valor invàlid: s'esperava ".concat(stringifyPrimitive(issue2.values[0]));
            return "Opció invàlida: s'esperava una de ".concat(joinValues(issue2.values, " o "));
          case "too_big": {
            const adj = issue2.inclusive ? "com a màxim" : "menys de";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Massa gran: s'esperava que ".concat(issue2.origin ?? "el valor", " contingués ").concat(adj, " ").concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elements");
            return "Massa gran: s'esperava que ".concat(issue2.origin ?? "el valor", " fos ").concat(adj, " ").concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? "com a mínim" : "més de";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Massa petit: s'esperava que ".concat(issue2.origin, " contingués ").concat(adj, " ").concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Massa petit: s'esperava que ".concat(issue2.origin, " fos ").concat(adj, " ").concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Format invàlid: ha de començar amb "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return "Format invàlid: ha d'acabar amb \"".concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return "Format invàlid: ha d'incloure \"".concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Format invàlid: ha de coincidir amb el patró ".concat(_issue.pattern);
            return "Format invàlid per a ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Número invàlid: ha de ser múltiple de ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Clau".concat(issue2.keys.length > 1 ? "s" : "", " no reconeguda").concat(issue2.keys.length > 1 ? "s" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Clau invàlida a ".concat(issue2.origin);
          case "invalid_union":
            return "Entrada invàlida";
          // Could also be "Tipus d'unió invàlid" but "Entrada invàlida" is more general
          case "invalid_element":
            return "Element invàlid a ".concat(issue2.origin);
          default:
            return "Entrada invàlida";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/cs.js
function cs_default() {
  return {
    localeError: error6()
  };
}
var error6;
var init_cs = __esm({
  "node_modules/zod/v4/locales/cs.js"() {
    init_util();
    error6 = () => {
      const Sizable = {
        string: { unit: "znaků", verb: "mít" },
        file: { unit: "bajtů", verb: "mít" },
        array: { unit: "prvků", verb: "mít" },
        set: { unit: "prvků", verb: "mít" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "regulární výraz",
        email: "e-mailová adresa",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "datum a čas ve formátu ISO",
        date: "datum ve formátu ISO",
        time: "čas ve formátu ISO",
        duration: "doba trvání ISO",
        ipv4: "IPv4 adresa",
        ipv6: "IPv6 adresa",
        cidrv4: "rozsah IPv4",
        cidrv6: "rozsah IPv6",
        base64: "řetězec zakódovaný ve formátu base64",
        base64url: "řetězec zakódovaný ve formátu base64url",
        json_string: "řetězec ve formátu JSON",
        e164: "číslo E.164",
        jwt: "JWT",
        template_literal: "vstup"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "číslo",
        string: "řetězec",
        function: "funkce",
        array: "pole"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Neplatný vstup: očekáváno instanceof ".concat(issue2.expected, ", obdrženo ").concat(received);
            }
            return "Neplatný vstup: očekáváno ".concat(expected, ", obdrženo ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Neplatný vstup: očekáváno ".concat(stringifyPrimitive(issue2.values[0]));
            return "Neplatná možnost: očekávána jedna z hodnot ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Hodnota je příliš velká: ".concat(issue2.origin ?? "hodnota", " musí mít ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "prvků");
            }
            return "Hodnota je příliš velká: ".concat(issue2.origin ?? "hodnota", " musí být ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Hodnota je příliš malá: ".concat(issue2.origin ?? "hodnota", " musí mít ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit ?? "prvků");
            }
            return "Hodnota je příliš malá: ".concat(issue2.origin ?? "hodnota", " musí být ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Neplatný řetězec: musí začínat na "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Neplatný řetězec: musí končit na "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Neplatný řetězec: musí obsahovat "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Neplatný řetězec: musí odpovídat vzoru ".concat(_issue.pattern);
            return "Neplatný formát ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Neplatné číslo: musí být násobkem ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Neznámé klíče: ".concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Neplatný klíč v ".concat(issue2.origin);
          case "invalid_union":
            return "Neplatný vstup";
          case "invalid_element":
            return "Neplatná hodnota v ".concat(issue2.origin);
          default:
            return "Neplatný vstup";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/da.js
function da_default() {
  return {
    localeError: error7()
  };
}
var error7;
var init_da = __esm({
  "node_modules/zod/v4/locales/da.js"() {
    init_util();
    error7 = () => {
      const Sizable = {
        string: { unit: "tegn", verb: "havde" },
        file: { unit: "bytes", verb: "havde" },
        array: { unit: "elementer", verb: "indeholdt" },
        set: { unit: "elementer", verb: "indeholdt" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "e-mailadresse",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO dato- og klokkeslæt",
        date: "ISO-dato",
        time: "ISO-klokkeslæt",
        duration: "ISO-varighed",
        ipv4: "IPv4-område",
        ipv6: "IPv6-område",
        cidrv4: "IPv4-spektrum",
        cidrv6: "IPv6-spektrum",
        base64: "base64-kodet streng",
        base64url: "base64url-kodet streng",
        json_string: "JSON-streng",
        e164: "E.164-nummer",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN",
        string: "streng",
        number: "tal",
        boolean: "boolean",
        array: "liste",
        object: "objekt",
        set: "sæt",
        file: "fil"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Ugyldigt input: forventede instanceof ".concat(issue2.expected, ", fik ").concat(received);
            }
            return "Ugyldigt input: forventede ".concat(expected, ", fik ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Ugyldig værdi: forventede ".concat(stringifyPrimitive(issue2.values[0]));
            return "Ugyldigt valg: forventede en af følgende ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
            if (sizing)
              return "For stor: forventede ".concat(origin ?? "value", " ").concat(sizing.verb, " ").concat(adj, " ").concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elementer");
            return "For stor: forventede ".concat(origin ?? "value", " havde ").concat(adj, " ").concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
            if (sizing) {
              return "For lille: forventede ".concat(origin, " ").concat(sizing.verb, " ").concat(adj, " ").concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "For lille: forventede ".concat(origin, " havde ").concat(adj, " ").concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Ugyldig streng: skal starte med "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Ugyldig streng: skal ende med "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Ugyldig streng: skal indeholde "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Ugyldig streng: skal matche mønsteret ".concat(_issue.pattern);
            return "Ugyldig ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Ugyldigt tal: skal være deleligt med ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "".concat(issue2.keys.length > 1 ? "Ukendte nøgler" : "Ukendt nøgle", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Ugyldig nøgle i ".concat(issue2.origin);
          case "invalid_union":
            return "Ugyldigt input: matcher ingen af de tilladte typer";
          case "invalid_element":
            return "Ugyldig værdi i ".concat(issue2.origin);
          default:
            return "Ugyldigt input";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/de.js
function de_default() {
  return {
    localeError: error8()
  };
}
var error8;
var init_de = __esm({
  "node_modules/zod/v4/locales/de.js"() {
    init_util();
    error8 = () => {
      const Sizable = {
        string: { unit: "Zeichen", verb: "zu haben" },
        file: { unit: "Bytes", verb: "zu haben" },
        array: { unit: "Elemente", verb: "zu haben" },
        set: { unit: "Elemente", verb: "zu haben" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "Eingabe",
        email: "E-Mail-Adresse",
        url: "URL",
        emoji: "Emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-Datum und -Uhrzeit",
        date: "ISO-Datum",
        time: "ISO-Uhrzeit",
        duration: "ISO-Dauer",
        ipv4: "IPv4-Adresse",
        ipv6: "IPv6-Adresse",
        cidrv4: "IPv4-Bereich",
        cidrv6: "IPv6-Bereich",
        base64: "Base64-codierter String",
        base64url: "Base64-URL-codierter String",
        json_string: "JSON-String",
        e164: "E.164-Nummer",
        jwt: "JWT",
        template_literal: "Eingabe"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "Zahl",
        array: "Array"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Ungültige Eingabe: erwartet instanceof ".concat(issue2.expected, ", erhalten ").concat(received);
            }
            return "Ungültige Eingabe: erwartet ".concat(expected, ", erhalten ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Ungültige Eingabe: erwartet ".concat(stringifyPrimitive(issue2.values[0]));
            return "Ungültige Option: erwartet eine von ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Zu groß: erwartet, dass ".concat(issue2.origin ?? "Wert", " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "Elemente", " hat");
            return "Zu groß: erwartet, dass ".concat(issue2.origin ?? "Wert", " ").concat(adj).concat(issue2.maximum.toString(), " ist");
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Zu klein: erwartet, dass ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit, " hat");
            }
            return "Zu klein: erwartet, dass ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString(), " ist");
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Ungültiger String: muss mit "'.concat(_issue.prefix, '" beginnen');
            if (_issue.format === "ends_with")
              return 'Ungültiger String: muss mit "'.concat(_issue.suffix, '" enden');
            if (_issue.format === "includes")
              return 'Ungültiger String: muss "'.concat(_issue.includes, '" enthalten');
            if (_issue.format === "regex")
              return "Ungültiger String: muss dem Muster ".concat(_issue.pattern, " entsprechen");
            return "Ungültig: ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Ungültige Zahl: muss ein Vielfaches von ".concat(issue2.divisor, " sein");
          case "unrecognized_keys":
            return "".concat(issue2.keys.length > 1 ? "Unbekannte Schlüssel" : "Unbekannter Schlüssel", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Ungültiger Schlüssel in ".concat(issue2.origin);
          case "invalid_union":
            return "Ungültige Eingabe";
          case "invalid_element":
            return "Ungültiger Wert in ".concat(issue2.origin);
          default:
            return "Ungültige Eingabe";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/el.js
function el_default() {
  return {
    localeError: error9()
  };
}
var error9;
var init_el = __esm({
  "node_modules/zod/v4/locales/el.js"() {
    init_util();
    error9 = () => {
      const Sizable = {
        string: { unit: "χαρακτήρες", verb: "να έχει" },
        file: { unit: "bytes", verb: "να έχει" },
        array: { unit: "στοιχεία", verb: "να έχει" },
        set: { unit: "στοιχεία", verb: "να έχει" },
        map: { unit: "καταχωρήσεις", verb: "να έχει" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "είσοδος",
        email: "διεύθυνση email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO ημερομηνία και ώρα",
        date: "ISO ημερομηνία",
        time: "ISO ώρα",
        duration: "ISO διάρκεια",
        ipv4: "διεύθυνση IPv4",
        ipv6: "διεύθυνση IPv6",
        mac: "διεύθυνση MAC",
        cidrv4: "εύρος IPv4",
        cidrv6: "εύρος IPv6",
        base64: "συμβολοσειρά κωδικοποιημένη σε base64",
        base64url: "συμβολοσειρά κωδικοποιημένη σε base64url",
        json_string: "συμβολοσειρά JSON",
        e164: "αριθμός E.164",
        jwt: "JWT",
        template_literal: "είσοδος"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (typeof issue2.expected === "string" && /^[A-Z]/.test(issue2.expected)) {
              return "Μη έγκυρη είσοδος: αναμενόταν instanceof ".concat(issue2.expected, ", λήφθηκε ").concat(received);
            }
            return "Μη έγκυρη είσοδος: αναμενόταν ".concat(expected, ", λήφθηκε ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Μη έγκυρη είσοδος: αναμενόταν ".concat(stringifyPrimitive(issue2.values[0]));
            return "Μη έγκυρη επιλογή: αναμενόταν ένα από ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Πολύ μεγάλο: αναμενόταν ".concat(issue2.origin ?? "τιμή", " να έχει ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "στοιχεία");
            return "Πολύ μεγάλο: αναμενόταν ".concat(issue2.origin ?? "τιμή", " να είναι ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Πολύ μικρό: αναμενόταν ".concat(issue2.origin, " να έχει ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Πολύ μικρό: αναμενόταν ".concat(issue2.origin, " να είναι ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Μη έγκυρη συμβολοσειρά: πρέπει να ξεκινά με "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'Μη έγκυρη συμβολοσειρά: πρέπει να τελειώνει με "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Μη έγκυρη συμβολοσειρά: πρέπει να περιέχει "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Μη έγκυρη συμβολοσειρά: πρέπει να ταιριάζει με το μοτίβο ".concat(_issue.pattern);
            return "Μη έγκυρο: ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Μη έγκυρος αριθμός: πρέπει να είναι πολλαπλάσιο του ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Άγνωστ".concat(issue2.keys.length > 1 ? "α" : "ο", " κλειδ").concat(issue2.keys.length > 1 ? "ιά" : "ί", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Μη έγκυρο κλειδί στο ".concat(issue2.origin);
          case "invalid_union":
            return "Μη έγκυρη είσοδος";
          case "invalid_element":
            return "Μη έγκυρη τιμή στο ".concat(issue2.origin);
          default:
            return "Μη έγκυρη είσοδος";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/en.js
function en_default() {
  return {
    localeError: error10()
  };
}
var error10;
var init_en = __esm({
  "node_modules/zod/v4/locales/en.js"() {
    init_util();
    error10 = () => {
      const Sizable = {
        string: { unit: "characters", verb: "to have" },
        file: { unit: "bytes", verb: "to have" },
        array: { unit: "items", verb: "to have" },
        set: { unit: "items", verb: "to have" },
        map: { unit: "entries", verb: "to have" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "email address",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datetime",
        date: "ISO date",
        time: "ISO time",
        duration: "ISO duration",
        ipv4: "IPv4 address",
        ipv6: "IPv6 address",
        mac: "MAC address",
        cidrv4: "IPv4 range",
        cidrv6: "IPv6 range",
        base64: "base64-encoded string",
        base64url: "base64url-encoded string",
        json_string: "JSON string",
        e164: "E.164 number",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        // Compatibility: "nan" -> "NaN" for display
        nan: "NaN"
        // All other type names omitted - they fall back to raw values via ?? operator
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            return "Invalid input: expected ".concat(expected, ", received ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Invalid input: expected ".concat(stringifyPrimitive(issue2.values[0]));
            return "Invalid option: expected one of ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Too big: expected ".concat(issue2.origin ?? "value", " to have ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elements");
            return "Too big: expected ".concat(issue2.origin ?? "value", " to be ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Too small: expected ".concat(issue2.origin, " to have ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Too small: expected ".concat(issue2.origin, " to be ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Invalid string: must start with "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'Invalid string: must end with "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Invalid string: must include "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Invalid string: must match pattern ".concat(_issue.pattern);
            return "Invalid ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Invalid number: must be a multiple of ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Unrecognized key".concat(issue2.keys.length > 1 ? "s" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Invalid key in ".concat(issue2.origin);
          case "invalid_union":
            if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
              const opts = issue2.options.map((o) => "'".concat(o, "'")).join(" | ");
              return "Invalid discriminator value. Expected ".concat(opts);
            }
            return "Invalid input";
          case "invalid_element":
            return "Invalid value in ".concat(issue2.origin);
          default:
            return "Invalid input";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/eo.js
function eo_default() {
  return {
    localeError: error11()
  };
}
var error11;
var init_eo = __esm({
  "node_modules/zod/v4/locales/eo.js"() {
    init_util();
    error11 = () => {
      const Sizable = {
        string: { unit: "karaktrojn", verb: "havi" },
        file: { unit: "bajtojn", verb: "havi" },
        array: { unit: "elementojn", verb: "havi" },
        set: { unit: "elementojn", verb: "havi" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "enigo",
        email: "retadreso",
        url: "URL",
        emoji: "emoĝio",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-datotempo",
        date: "ISO-dato",
        time: "ISO-tempo",
        duration: "ISO-daŭro",
        ipv4: "IPv4-adreso",
        ipv6: "IPv6-adreso",
        cidrv4: "IPv4-rango",
        cidrv6: "IPv6-rango",
        base64: "64-ume kodita karaktraro",
        base64url: "URL-64-ume kodita karaktraro",
        json_string: "JSON-karaktraro",
        e164: "E.164-nombro",
        jwt: "JWT",
        template_literal: "enigo"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "nombro",
        array: "tabelo",
        null: "senvalora"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Nevalida enigo: atendiĝis instanceof ".concat(issue2.expected, ", riceviĝis ").concat(received);
            }
            return "Nevalida enigo: atendiĝis ".concat(expected, ", riceviĝis ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Nevalida enigo: atendiĝis ".concat(stringifyPrimitive(issue2.values[0]));
            return "Nevalida opcio: atendiĝis unu el ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Tro granda: atendiĝis ke ".concat(issue2.origin ?? "valoro", " havu ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elementojn");
            return "Tro granda: atendiĝis ke ".concat(issue2.origin ?? "valoro", " havu ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Tro malgranda: atendiĝis ke ".concat(issue2.origin, " havu ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Tro malgranda: atendiĝis ke ".concat(issue2.origin, " estu ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Nevalida karaktraro: devas komenciĝi per "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Nevalida karaktraro: devas finiĝi per "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Nevalida karaktraro: devas inkluzivi "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Nevalida karaktraro: devas kongrui kun la modelo ".concat(_issue.pattern);
            return "Nevalida ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Nevalida nombro: devas esti oblo de ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Nekonata".concat(issue2.keys.length > 1 ? "j" : "", " ŝlosilo").concat(issue2.keys.length > 1 ? "j" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Nevalida ŝlosilo en ".concat(issue2.origin);
          case "invalid_union":
            return "Nevalida enigo";
          case "invalid_element":
            return "Nevalida valoro en ".concat(issue2.origin);
          default:
            return "Nevalida enigo";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/es.js
function es_default() {
  return {
    localeError: error12()
  };
}
var error12;
var init_es = __esm({
  "node_modules/zod/v4/locales/es.js"() {
    init_util();
    error12 = () => {
      const Sizable = {
        string: { unit: "caracteres", verb: "tener" },
        file: { unit: "bytes", verb: "tener" },
        array: { unit: "elementos", verb: "tener" },
        set: { unit: "elementos", verb: "tener" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "entrada",
        email: "dirección de correo electrónico",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "fecha y hora ISO",
        date: "fecha ISO",
        time: "hora ISO",
        duration: "duración ISO",
        ipv4: "dirección IPv4",
        ipv6: "dirección IPv6",
        cidrv4: "rango IPv4",
        cidrv6: "rango IPv6",
        base64: "cadena codificada en base64",
        base64url: "URL codificada en base64",
        json_string: "cadena JSON",
        e164: "número E.164",
        jwt: "JWT",
        template_literal: "entrada"
      };
      const TypeDictionary = {
        nan: "NaN",
        string: "texto",
        number: "número",
        boolean: "booleano",
        array: "arreglo",
        object: "objeto",
        set: "conjunto",
        file: "archivo",
        date: "fecha",
        bigint: "número grande",
        symbol: "símbolo",
        undefined: "indefinido",
        null: "nulo",
        function: "función",
        map: "mapa",
        record: "registro",
        tuple: "tupla",
        enum: "enumeración",
        union: "unión",
        literal: "literal",
        promise: "promesa",
        void: "vacío",
        never: "nunca",
        unknown: "desconocido",
        any: "cualquiera"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Entrada inválida: se esperaba instanceof ".concat(issue2.expected, ", recibido ").concat(received);
            }
            return "Entrada inválida: se esperaba ".concat(expected, ", recibido ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Entrada inválida: se esperaba ".concat(stringifyPrimitive(issue2.values[0]));
            return "Opción inválida: se esperaba una de ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
            if (sizing)
              return "Demasiado grande: se esperaba que ".concat(origin ?? "valor", " tuviera ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elementos");
            return "Demasiado grande: se esperaba que ".concat(origin ?? "valor", " fuera ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
            if (sizing) {
              return "Demasiado pequeño: se esperaba que ".concat(origin, " tuviera ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Demasiado pequeño: se esperaba que ".concat(origin, " fuera ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Cadena inválida: debe comenzar con "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Cadena inválida: debe terminar en "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Cadena inválida: debe incluir "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Cadena inválida: debe coincidir con el patrón ".concat(_issue.pattern);
            return "Inválido ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Número inválido: debe ser múltiplo de ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Llave".concat(issue2.keys.length > 1 ? "s" : "", " desconocida").concat(issue2.keys.length > 1 ? "s" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Llave inválida en ".concat(TypeDictionary[issue2.origin] ?? issue2.origin);
          case "invalid_union":
            return "Entrada inválida";
          case "invalid_element":
            return "Valor inválido en ".concat(TypeDictionary[issue2.origin] ?? issue2.origin);
          default:
            return "Entrada inválida";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/fa.js
function fa_default() {
  return {
    localeError: error13()
  };
}
var error13;
var init_fa = __esm({
  "node_modules/zod/v4/locales/fa.js"() {
    init_util();
    error13 = () => {
      const Sizable = {
        string: { unit: "کاراکتر", verb: "داشته باشد" },
        file: { unit: "بایت", verb: "داشته باشد" },
        array: { unit: "آیتم", verb: "داشته باشد" },
        set: { unit: "آیتم", verb: "داشته باشد" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "ورودی",
        email: "آدرس ایمیل",
        url: "URL",
        emoji: "ایموجی",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "تاریخ و زمان ایزو",
        date: "تاریخ ایزو",
        time: "زمان ایزو",
        duration: "مدت زمان ایزو",
        ipv4: "IPv4 آدرس",
        ipv6: "IPv6 آدرس",
        cidrv4: "IPv4 دامنه",
        cidrv6: "IPv6 دامنه",
        base64: "base64-encoded رشته",
        base64url: "base64url-encoded رشته",
        json_string: "JSON رشته",
        e164: "E.164 عدد",
        jwt: "JWT",
        template_literal: "ورودی"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "عدد",
        array: "آرایه"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "ورودی نامعتبر: می‌بایست instanceof ".concat(issue2.expected, " می‌بود، ").concat(received, " دریافت شد");
            }
            return "ورودی نامعتبر: می‌بایست ".concat(expected, " می‌بود، ").concat(received, " دریافت شد");
          }
          case "invalid_value":
            if (issue2.values.length === 1) {
              return "ورودی نامعتبر: می‌بایست ".concat(stringifyPrimitive(issue2.values[0]), " می‌بود");
            }
            return "گزینه نامعتبر: می‌بایست یکی از ".concat(joinValues(issue2.values, "|"), " می‌بود");
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "خیلی بزرگ: ".concat(issue2.origin ?? "مقدار", " باید ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "عنصر", " باشد");
            }
            return "خیلی بزرگ: ".concat(issue2.origin ?? "مقدار", " باید ").concat(adj).concat(issue2.maximum.toString(), " باشد");
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "خیلی کوچک: ".concat(issue2.origin, " باید ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit, " باشد");
            }
            return "خیلی کوچک: ".concat(issue2.origin, " باید ").concat(adj).concat(issue2.minimum.toString(), " باشد");
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'رشته نامعتبر: باید با "'.concat(_issue.prefix, '" شروع شود');
            }
            if (_issue.format === "ends_with") {
              return 'رشته نامعتبر: باید با "'.concat(_issue.suffix, '" تمام شود');
            }
            if (_issue.format === "includes") {
              return 'رشته نامعتبر: باید شامل "'.concat(_issue.includes, '" باشد');
            }
            if (_issue.format === "regex") {
              return "رشته نامعتبر: باید با الگوی ".concat(_issue.pattern, " مطابقت داشته باشد");
            }
            return "".concat(FormatDictionary[_issue.format] ?? issue2.format, " نامعتبر");
          }
          case "not_multiple_of":
            return "عدد نامعتبر: باید مضرب ".concat(issue2.divisor, " باشد");
          case "unrecognized_keys":
            return "کلید".concat(issue2.keys.length > 1 ? "های" : "", " ناشناس: ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "کلید ناشناس در ".concat(issue2.origin);
          case "invalid_union":
            return "ورودی نامعتبر";
          case "invalid_element":
            return "مقدار نامعتبر در ".concat(issue2.origin);
          default:
            return "ورودی نامعتبر";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/fi.js
function fi_default() {
  return {
    localeError: error14()
  };
}
var error14;
var init_fi = __esm({
  "node_modules/zod/v4/locales/fi.js"() {
    init_util();
    error14 = () => {
      const Sizable = {
        string: { unit: "merkkiä", subject: "merkkijonon" },
        file: { unit: "tavua", subject: "tiedoston" },
        array: { unit: "alkiota", subject: "listan" },
        set: { unit: "alkiota", subject: "joukon" },
        number: { unit: "", subject: "luvun" },
        bigint: { unit: "", subject: "suuren kokonaisluvun" },
        int: { unit: "", subject: "kokonaisluvun" },
        date: { unit: "", subject: "päivämäärän" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "säännöllinen lauseke",
        email: "sähköpostiosoite",
        url: "URL-osoite",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-aikaleima",
        date: "ISO-päivämäärä",
        time: "ISO-aika",
        duration: "ISO-kesto",
        ipv4: "IPv4-osoite",
        ipv6: "IPv6-osoite",
        cidrv4: "IPv4-alue",
        cidrv6: "IPv6-alue",
        base64: "base64-koodattu merkkijono",
        base64url: "base64url-koodattu merkkijono",
        json_string: "JSON-merkkijono",
        e164: "E.164-luku",
        jwt: "JWT",
        template_literal: "templaattimerkkijono"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Virheellinen tyyppi: odotettiin instanceof ".concat(issue2.expected, ", oli ").concat(received);
            }
            return "Virheellinen tyyppi: odotettiin ".concat(expected, ", oli ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Virheellinen syöte: täytyy olla ".concat(stringifyPrimitive(issue2.values[0]));
            return "Virheellinen valinta: täytyy olla yksi seuraavista: ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Liian suuri: ".concat(sizing.subject, " täytyy olla ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit).trim();
            }
            return "Liian suuri: arvon täytyy olla ".concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Liian pieni: ".concat(sizing.subject, " täytyy olla ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit).trim();
            }
            return "Liian pieni: arvon täytyy olla ".concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Virheellinen syöte: täytyy alkaa "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Virheellinen syöte: täytyy loppua "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Virheellinen syöte: täytyy sisältää "'.concat(_issue.includes, '"');
            if (_issue.format === "regex") {
              return "Virheellinen syöte: täytyy vastata säännöllistä lauseketta ".concat(_issue.pattern);
            }
            return "Virheellinen ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Virheellinen luku: täytyy olla luvun ".concat(issue2.divisor, " monikerta");
          case "unrecognized_keys":
            return "".concat(issue2.keys.length > 1 ? "Tuntemattomat avaimet" : "Tuntematon avain", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Virheellinen avain tietueessa";
          case "invalid_union":
            return "Virheellinen unioni";
          case "invalid_element":
            return "Virheellinen arvo joukossa";
          default:
            return "Virheellinen syöte";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/fr.js
function fr_default() {
  return {
    localeError: error15()
  };
}
var error15;
var init_fr = __esm({
  "node_modules/zod/v4/locales/fr.js"() {
    init_util();
    error15 = () => {
      const Sizable = {
        string: { unit: "caractères", verb: "avoir" },
        file: { unit: "octets", verb: "avoir" },
        array: { unit: "éléments", verb: "avoir" },
        set: { unit: "éléments", verb: "avoir" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "entrée",
        email: "adresse e-mail",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "date et heure ISO",
        date: "date ISO",
        time: "heure ISO",
        duration: "durée ISO",
        ipv4: "adresse IPv4",
        ipv6: "adresse IPv6",
        cidrv4: "plage IPv4",
        cidrv6: "plage IPv6",
        base64: "chaîne encodée en base64",
        base64url: "chaîne encodée en base64url",
        json_string: "chaîne JSON",
        e164: "numéro E.164",
        jwt: "JWT",
        template_literal: "entrée"
      };
      const TypeDictionary = {
        string: "chaîne",
        number: "nombre",
        int: "entier",
        boolean: "booléen",
        bigint: "grand entier",
        symbol: "symbole",
        undefined: "indéfini",
        null: "null",
        never: "jamais",
        void: "vide",
        date: "date",
        array: "tableau",
        object: "objet",
        tuple: "tuple",
        record: "enregistrement",
        map: "carte",
        set: "ensemble",
        file: "fichier",
        nonoptional: "non-optionnel",
        nan: "NaN",
        function: "fonction"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Entrée invalide : instanceof ".concat(issue2.expected, " attendu, ").concat(received, " reçu");
            }
            return "Entrée invalide : ".concat(expected, " attendu, ").concat(received, " reçu");
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Entrée invalide : ".concat(stringifyPrimitive(issue2.values[0]), " attendu");
            return "Option invalide : une valeur parmi ".concat(joinValues(issue2.values, "|"), " attendue");
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Trop grand : ".concat(TypeDictionary[issue2.origin] ?? "valeur", " doit ").concat(sizing.verb, " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "élément(s)");
            return "Trop grand : ".concat(TypeDictionary[issue2.origin] ?? "valeur", " doit être ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Trop petit : ".concat(TypeDictionary[issue2.origin] ?? "valeur", " doit ").concat(sizing.verb, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            return "Trop petit : ".concat(TypeDictionary[issue2.origin] ?? "valeur", " doit être ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Chaîne invalide : doit commencer par "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Chaîne invalide : doit se terminer par "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Chaîne invalide : doit inclure "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Chaîne invalide : doit correspondre au modèle ".concat(_issue.pattern);
            return "".concat(FormatDictionary[_issue.format] ?? issue2.format, " invalide");
          }
          case "not_multiple_of":
            return "Nombre invalide : doit être un multiple de ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Clé".concat(issue2.keys.length > 1 ? "s" : "", " non reconnue").concat(issue2.keys.length > 1 ? "s" : "", " : ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Clé invalide dans ".concat(issue2.origin);
          case "invalid_union":
            return "Entrée invalide";
          case "invalid_element":
            return "Valeur invalide dans ".concat(issue2.origin);
          default:
            return "Entrée invalide";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/fr-CA.js
function fr_CA_default() {
  return {
    localeError: error16()
  };
}
var error16;
var init_fr_CA = __esm({
  "node_modules/zod/v4/locales/fr-CA.js"() {
    init_util();
    error16 = () => {
      const Sizable = {
        string: { unit: "caractères", verb: "avoir" },
        file: { unit: "octets", verb: "avoir" },
        array: { unit: "éléments", verb: "avoir" },
        set: { unit: "éléments", verb: "avoir" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "entrée",
        email: "adresse courriel",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "date-heure ISO",
        date: "date ISO",
        time: "heure ISO",
        duration: "durée ISO",
        ipv4: "adresse IPv4",
        ipv6: "adresse IPv6",
        cidrv4: "plage IPv4",
        cidrv6: "plage IPv6",
        base64: "chaîne encodée en base64",
        base64url: "chaîne encodée en base64url",
        json_string: "chaîne JSON",
        e164: "numéro E.164",
        jwt: "JWT",
        template_literal: "entrée"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Entrée invalide : attendu instanceof ".concat(issue2.expected, ", reçu ").concat(received);
            }
            return "Entrée invalide : attendu ".concat(expected, ", reçu ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Entrée invalide : attendu ".concat(stringifyPrimitive(issue2.values[0]));
            return "Option invalide : attendu l'une des valeurs suivantes ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "≤" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Trop grand : attendu que ".concat(issue2.origin ?? "la valeur", " ait ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit);
            return "Trop grand : attendu que ".concat(issue2.origin ?? "la valeur", " soit ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? "≥" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Trop petit : attendu que ".concat(issue2.origin, " ait ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Trop petit : attendu que ".concat(issue2.origin, " soit ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Chaîne invalide : doit commencer par "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'Chaîne invalide : doit se terminer par "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Chaîne invalide : doit inclure "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Chaîne invalide : doit correspondre au motif ".concat(_issue.pattern);
            return "".concat(FormatDictionary[_issue.format] ?? issue2.format, " invalide");
          }
          case "not_multiple_of":
            return "Nombre invalide : doit être un multiple de ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Clé".concat(issue2.keys.length > 1 ? "s" : "", " non reconnue").concat(issue2.keys.length > 1 ? "s" : "", " : ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Clé invalide dans ".concat(issue2.origin);
          case "invalid_union":
            return "Entrée invalide";
          case "invalid_element":
            return "Valeur invalide dans ".concat(issue2.origin);
          default:
            return "Entrée invalide";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/he.js
function he_default() {
  return {
    localeError: error17()
  };
}
var error17;
var init_he = __esm({
  "node_modules/zod/v4/locales/he.js"() {
    init_util();
    error17 = () => {
      const TypeNames = {
        string: { label: "מחרוזת", gender: "f" },
        number: { label: "מספר", gender: "m" },
        boolean: { label: "ערך בוליאני", gender: "m" },
        bigint: { label: "BigInt", gender: "m" },
        date: { label: "תאריך", gender: "m" },
        array: { label: "מערך", gender: "m" },
        object: { label: "אובייקט", gender: "m" },
        null: { label: "ערך ריק (null)", gender: "m" },
        undefined: { label: "ערך לא מוגדר (undefined)", gender: "m" },
        symbol: { label: "סימבול (Symbol)", gender: "m" },
        function: { label: "פונקציה", gender: "f" },
        map: { label: "מפה (Map)", gender: "f" },
        set: { label: "קבוצה (Set)", gender: "f" },
        file: { label: "קובץ", gender: "m" },
        promise: { label: "Promise", gender: "m" },
        NaN: { label: "NaN", gender: "m" },
        unknown: { label: "ערך לא ידוע", gender: "m" },
        value: { label: "ערך", gender: "m" }
      };
      const Sizable = {
        string: { unit: "תווים", shortLabel: "קצר", longLabel: "ארוך" },
        file: { unit: "בייטים", shortLabel: "קטן", longLabel: "גדול" },
        array: { unit: "פריטים", shortLabel: "קטן", longLabel: "גדול" },
        set: { unit: "פריטים", shortLabel: "קטן", longLabel: "גדול" },
        number: { unit: "", shortLabel: "קטן", longLabel: "גדול" }
        // no unit
      };
      const typeEntry = (t) => t ? TypeNames[t] : void 0;
      const typeLabel = (t) => {
        const e = typeEntry(t);
        if (e)
          return e.label;
        return t ?? TypeNames.unknown.label;
      };
      const withDefinite = (t) => "ה".concat(typeLabel(t));
      const verbFor = (t) => {
        const e = typeEntry(t);
        const gender = e?.gender ?? "m";
        return gender === "f" ? "צריכה להיות" : "צריך להיות";
      };
      const getSizing = (origin) => {
        if (!origin)
          return null;
        return Sizable[origin] ?? null;
      };
      const FormatDictionary = {
        regex: { label: "קלט", gender: "m" },
        email: { label: "כתובת אימייל", gender: "f" },
        url: { label: "כתובת רשת", gender: "f" },
        emoji: { label: "אימוג'י", gender: "m" },
        uuid: { label: "UUID", gender: "m" },
        nanoid: { label: "nanoid", gender: "m" },
        guid: { label: "GUID", gender: "m" },
        cuid: { label: "cuid", gender: "m" },
        cuid2: { label: "cuid2", gender: "m" },
        ulid: { label: "ULID", gender: "m" },
        xid: { label: "XID", gender: "m" },
        ksuid: { label: "KSUID", gender: "m" },
        datetime: { label: "תאריך וזמן ISO", gender: "m" },
        date: { label: "תאריך ISO", gender: "m" },
        time: { label: "זמן ISO", gender: "m" },
        duration: { label: "משך זמן ISO", gender: "m" },
        ipv4: { label: "כתובת IPv4", gender: "f" },
        ipv6: { label: "כתובת IPv6", gender: "f" },
        cidrv4: { label: "טווח IPv4", gender: "m" },
        cidrv6: { label: "טווח IPv6", gender: "m" },
        base64: { label: "מחרוזת בבסיס 64", gender: "f" },
        base64url: { label: "מחרוזת בבסיס 64 לכתובות רשת", gender: "f" },
        json_string: { label: "מחרוזת JSON", gender: "f" },
        e164: { label: "מספר E.164", gender: "m" },
        jwt: { label: "JWT", gender: "m" },
        ends_with: { label: "קלט", gender: "m" },
        includes: { label: "קלט", gender: "m" },
        lowercase: { label: "קלט", gender: "m" },
        starts_with: { label: "קלט", gender: "m" },
        uppercase: { label: "קלט", gender: "m" }
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expectedKey = issue2.expected;
            const expected = TypeDictionary[expectedKey ?? ""] ?? typeLabel(expectedKey);
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? TypeNames[receivedType]?.label ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "קלט לא תקין: צריך להיות instanceof ".concat(issue2.expected, ", התקבל ").concat(received);
            }
            return "קלט לא תקין: צריך להיות ".concat(expected, ", התקבל ").concat(received);
          }
          case "invalid_value": {
            if (issue2.values.length === 1) {
              return "ערך לא תקין: הערך חייב להיות ".concat(stringifyPrimitive(issue2.values[0]));
            }
            const stringified = issue2.values.map((v2) => stringifyPrimitive(v2));
            if (issue2.values.length === 2) {
              return "ערך לא תקין: האפשרויות המתאימות הן ".concat(stringified[0], " או ").concat(stringified[1]);
            }
            const lastValue = stringified[stringified.length - 1];
            const restValues = stringified.slice(0, -1).join(", ");
            return "ערך לא תקין: האפשרויות המתאימות הן ".concat(restValues, " או ").concat(lastValue);
          }
          case "too_big": {
            const sizing = getSizing(issue2.origin);
            const subject = withDefinite(issue2.origin ?? "value");
            if (issue2.origin === "string") {
              return "".concat(sizing?.longLabel ?? "ארוך", " מדי: ").concat(subject, " צריכה להכיל ").concat(issue2.maximum.toString(), " ").concat(sizing?.unit ?? "", " ").concat(issue2.inclusive ? "או פחות" : "לכל היותר").trim();
            }
            if (issue2.origin === "number") {
              const comparison = issue2.inclusive ? "קטן או שווה ל-".concat(issue2.maximum) : "קטן מ-".concat(issue2.maximum);
              return "גדול מדי: ".concat(subject, " צריך להיות ").concat(comparison);
            }
            if (issue2.origin === "array" || issue2.origin === "set") {
              const verb = issue2.origin === "set" ? "צריכה" : "צריך";
              const comparison = issue2.inclusive ? "".concat(issue2.maximum, " ").concat(sizing?.unit ?? "", " או פחות") : "פחות מ-".concat(issue2.maximum, " ").concat(sizing?.unit ?? "");
              return "גדול מדי: ".concat(subject, " ").concat(verb, " להכיל ").concat(comparison).trim();
            }
            const adj = issue2.inclusive ? "<=" : "<";
            const be = verbFor(issue2.origin ?? "value");
            if (sizing?.unit) {
              return "".concat(sizing.longLabel, " מדי: ").concat(subject, " ").concat(be, " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit);
            }
            return "".concat(sizing?.longLabel ?? "גדול", " מדי: ").concat(subject, " ").concat(be, " ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const sizing = getSizing(issue2.origin);
            const subject = withDefinite(issue2.origin ?? "value");
            if (issue2.origin === "string") {
              return "".concat(sizing?.shortLabel ?? "קצר", " מדי: ").concat(subject, " צריכה להכיל ").concat(issue2.minimum.toString(), " ").concat(sizing?.unit ?? "", " ").concat(issue2.inclusive ? "או יותר" : "לפחות").trim();
            }
            if (issue2.origin === "number") {
              const comparison = issue2.inclusive ? "גדול או שווה ל-".concat(issue2.minimum) : "גדול מ-".concat(issue2.minimum);
              return "קטן מדי: ".concat(subject, " צריך להיות ").concat(comparison);
            }
            if (issue2.origin === "array" || issue2.origin === "set") {
              const verb = issue2.origin === "set" ? "צריכה" : "צריך";
              if (issue2.minimum === 1 && issue2.inclusive) {
                const singularPhrase = issue2.origin === "set" ? "לפחות פריט אחד" : "לפחות פריט אחד";
                return "קטן מדי: ".concat(subject, " ").concat(verb, " להכיל ").concat(singularPhrase);
              }
              const comparison = issue2.inclusive ? "".concat(issue2.minimum, " ").concat(sizing?.unit ?? "", " או יותר") : "יותר מ-".concat(issue2.minimum, " ").concat(sizing?.unit ?? "");
              return "קטן מדי: ".concat(subject, " ").concat(verb, " להכיל ").concat(comparison).trim();
            }
            const adj = issue2.inclusive ? ">=" : ">";
            const be = verbFor(issue2.origin ?? "value");
            if (sizing?.unit) {
              return "".concat(sizing.shortLabel, " מדי: ").concat(subject, " ").concat(be, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "".concat(sizing?.shortLabel ?? "קטן", " מדי: ").concat(subject, " ").concat(be, " ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'המחרוזת חייבת להתחיל ב "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'המחרוזת חייבת להסתיים ב "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'המחרוזת חייבת לכלול "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "המחרוזת חייבת להתאים לתבנית ".concat(_issue.pattern);
            const nounEntry = FormatDictionary[_issue.format];
            const noun = nounEntry?.label ?? _issue.format;
            const gender = nounEntry?.gender ?? "m";
            const adjective = gender === "f" ? "תקינה" : "תקין";
            return "".concat(noun, " לא ").concat(adjective);
          }
          case "not_multiple_of":
            return "מספר לא תקין: חייב להיות מכפלה של ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "מפתח".concat(issue2.keys.length > 1 ? "ות" : "", " לא מזוה").concat(issue2.keys.length > 1 ? "ים" : "ה", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key": {
            return "שדה לא תקין באובייקט";
          }
          case "invalid_union":
            return "קלט לא תקין";
          case "invalid_element": {
            const place = withDefinite(issue2.origin ?? "array");
            return "ערך לא תקין ב".concat(place);
          }
          default:
            return "קלט לא תקין";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/hr.js
function hr_default() {
  return {
    localeError: error18()
  };
}
var error18;
var init_hr = __esm({
  "node_modules/zod/v4/locales/hr.js"() {
    init_util();
    error18 = () => {
      const Sizable = {
        string: { unit: "znakova", verb: "imati" },
        file: { unit: "bajtova", verb: "imati" },
        array: { unit: "stavki", verb: "imati" },
        set: { unit: "stavki", verb: "imati" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "unos",
        email: "email adresa",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datum i vrijeme",
        date: "ISO datum",
        time: "ISO vrijeme",
        duration: "ISO trajanje",
        ipv4: "IPv4 adresa",
        ipv6: "IPv6 adresa",
        cidrv4: "IPv4 raspon",
        cidrv6: "IPv6 raspon",
        base64: "base64 kodirani tekst",
        base64url: "base64url kodirani tekst",
        json_string: "JSON tekst",
        e164: "E.164 broj",
        jwt: "JWT",
        template_literal: "unos"
      };
      const TypeDictionary = {
        nan: "NaN",
        string: "tekst",
        number: "broj",
        boolean: "boolean",
        array: "niz",
        object: "objekt",
        set: "skup",
        file: "datoteka",
        date: "datum",
        bigint: "bigint",
        symbol: "simbol",
        undefined: "undefined",
        null: "null",
        function: "funkcija",
        map: "mapa"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Neispravan unos: očekuje se instanceof ".concat(issue2.expected, ", a primljeno je ").concat(received);
            }
            return "Neispravan unos: očekuje se ".concat(expected, ", a primljeno je ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Neispravna vrijednost: očekivano ".concat(stringifyPrimitive(issue2.values[0]));
            return "Neispravna opcija: očekivano jedno od ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
            if (sizing)
              return "Preveliko: očekivano da ".concat(origin ?? "vrijednost", " ima ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elemenata");
            return "Preveliko: očekivano da ".concat(origin ?? "vrijednost", " bude ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
            if (sizing) {
              return "Premalo: očekivano da ".concat(origin, " ima ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Premalo: očekivano da ".concat(origin, " bude ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Neispravan tekst: mora započinjati s "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Neispravan tekst: mora završavati s "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Neispravan tekst: mora sadržavati "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Neispravan tekst: mora odgovarati uzorku ".concat(_issue.pattern);
            return "Neispravna ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Neispravan broj: mora biti višekratnik od ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Neprepoznat".concat(issue2.keys.length > 1 ? "i ključevi" : " ključ", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Neispravan ključ u ".concat(TypeDictionary[issue2.origin] ?? issue2.origin);
          case "invalid_union":
            return "Neispravan unos";
          case "invalid_element":
            return "Neispravna vrijednost u ".concat(TypeDictionary[issue2.origin] ?? issue2.origin);
          default:
            return "Neispravan unos";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/hu.js
function hu_default() {
  return {
    localeError: error19()
  };
}
var error19;
var init_hu = __esm({
  "node_modules/zod/v4/locales/hu.js"() {
    init_util();
    error19 = () => {
      const Sizable = {
        string: { unit: "karakter", verb: "legyen" },
        file: { unit: "byte", verb: "legyen" },
        array: { unit: "elem", verb: "legyen" },
        set: { unit: "elem", verb: "legyen" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "bemenet",
        email: "email cím",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO időbélyeg",
        date: "ISO dátum",
        time: "ISO idő",
        duration: "ISO időintervallum",
        ipv4: "IPv4 cím",
        ipv6: "IPv6 cím",
        cidrv4: "IPv4 tartomány",
        cidrv6: "IPv6 tartomány",
        base64: "base64-kódolt string",
        base64url: "base64url-kódolt string",
        json_string: "JSON string",
        e164: "E.164 szám",
        jwt: "JWT",
        template_literal: "bemenet"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "szám",
        array: "tömb"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Érvénytelen bemenet: a várt érték instanceof ".concat(issue2.expected, ", a kapott érték ").concat(received);
            }
            return "Érvénytelen bemenet: a várt érték ".concat(expected, ", a kapott érték ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Érvénytelen bemenet: a várt érték ".concat(stringifyPrimitive(issue2.values[0]));
            return "Érvénytelen opció: valamelyik érték várt ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Túl nagy: ".concat(issue2.origin ?? "érték", " mérete túl nagy ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elem");
            return "Túl nagy: a bemeneti érték ".concat(issue2.origin ?? "érték", " túl nagy: ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Túl kicsi: a bemeneti érték ".concat(issue2.origin, " mérete túl kicsi ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Túl kicsi: a bemeneti érték ".concat(issue2.origin, " túl kicsi ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Érvénytelen string: "'.concat(_issue.prefix, '" értékkel kell kezdődnie');
            if (_issue.format === "ends_with")
              return 'Érvénytelen string: "'.concat(_issue.suffix, '" értékkel kell végződnie');
            if (_issue.format === "includes")
              return 'Érvénytelen string: "'.concat(_issue.includes, '" értéket kell tartalmaznia');
            if (_issue.format === "regex")
              return "Érvénytelen string: ".concat(_issue.pattern, " mintának kell megfelelnie");
            return "Érvénytelen ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Érvénytelen szám: ".concat(issue2.divisor, " többszörösének kell lennie");
          case "unrecognized_keys":
            return "Ismeretlen kulcs".concat(issue2.keys.length > 1 ? "s" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Érvénytelen kulcs ".concat(issue2.origin);
          case "invalid_union":
            return "Érvénytelen bemenet";
          case "invalid_element":
            return "Érvénytelen érték: ".concat(issue2.origin);
          default:
            return "Érvénytelen bemenet";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/hy.js
function getArmenianPlural(count, one, many) {
  return Math.abs(count) === 1 ? one : many;
}
function withDefiniteArticle(word) {
  if (!word)
    return "";
  const vowels = ["ա", "ե", "ը", "ի", "ո", "ու", "օ"];
  const lastChar = word[word.length - 1];
  return word + (vowels.includes(lastChar) ? "ն" : "ը");
}
function hy_default() {
  return {
    localeError: error20()
  };
}
var error20;
var init_hy = __esm({
  "node_modules/zod/v4/locales/hy.js"() {
    init_util();
    error20 = () => {
      const Sizable = {
        string: {
          unit: {
            one: "նշան",
            many: "նշաններ"
          },
          verb: "ունենալ"
        },
        file: {
          unit: {
            one: "բայթ",
            many: "բայթեր"
          },
          verb: "ունենալ"
        },
        array: {
          unit: {
            one: "տարր",
            many: "տարրեր"
          },
          verb: "ունենալ"
        },
        set: {
          unit: {
            one: "տարր",
            many: "տարրեր"
          },
          verb: "ունենալ"
        }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "մուտք",
        email: "էլ. հասցե",
        url: "URL",
        emoji: "էմոջի",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO ամսաթիվ և ժամ",
        date: "ISO ամսաթիվ",
        time: "ISO ժամ",
        duration: "ISO տևողություն",
        ipv4: "IPv4 հասցե",
        ipv6: "IPv6 հասցե",
        cidrv4: "IPv4 միջակայք",
        cidrv6: "IPv6 միջակայք",
        base64: "base64 ձևաչափով տող",
        base64url: "base64url ձևաչափով տող",
        json_string: "JSON տող",
        e164: "E.164 համար",
        jwt: "JWT",
        template_literal: "մուտք"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "թիվ",
        array: "զանգված"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Սխալ մուտքագրում․ սպասվում էր instanceof ".concat(issue2.expected, ", ստացվել է ").concat(received);
            }
            return "Սխալ մուտքագրում․ սպասվում էր ".concat(expected, ", ստացվել է ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Սխալ մուտքագրում․ սպասվում էր ".concat(stringifyPrimitive(issue2.values[1]));
            return "Սխալ տարբերակ․ սպասվում էր հետևյալներից մեկը՝ ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              const maxValue = Number(issue2.maximum);
              const unit = getArmenianPlural(maxValue, sizing.unit.one, sizing.unit.many);
              return "Չափազանց մեծ արժեք․ սպասվում է, որ ".concat(withDefiniteArticle(issue2.origin ?? "արժեք"), " կունենա ").concat(adj).concat(issue2.maximum.toString(), " ").concat(unit);
            }
            return "Չափազանց մեծ արժեք․ սպասվում է, որ ".concat(withDefiniteArticle(issue2.origin ?? "արժեք"), " լինի ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              const minValue = Number(issue2.minimum);
              const unit = getArmenianPlural(minValue, sizing.unit.one, sizing.unit.many);
              return "Չափազանց փոքր արժեք․ սպասվում է, որ ".concat(withDefiniteArticle(issue2.origin), " կունենա ").concat(adj).concat(issue2.minimum.toString(), " ").concat(unit);
            }
            return "Չափազանց փոքր արժեք․ սպասվում է, որ ".concat(withDefiniteArticle(issue2.origin), " լինի ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Սխալ տող․ պետք է սկսվի "'.concat(_issue.prefix, '"-ով');
            if (_issue.format === "ends_with")
              return 'Սխալ տող․ պետք է ավարտվի "'.concat(_issue.suffix, '"-ով');
            if (_issue.format === "includes")
              return 'Սխալ տող․ պետք է պարունակի "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Սխալ տող․ պետք է համապատասխանի ".concat(_issue.pattern, " ձևաչափին");
            return "Սխալ ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Սխալ թիվ․ պետք է բազմապատիկ լինի ".concat(issue2.divisor, "-ի");
          case "unrecognized_keys":
            return "Չճանաչված բանալի".concat(issue2.keys.length > 1 ? "ներ" : "", ". ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Սխալ բանալի ".concat(withDefiniteArticle(issue2.origin), "-ում");
          case "invalid_union":
            return "Սխալ մուտքագրում";
          case "invalid_element":
            return "Սխալ արժեք ".concat(withDefiniteArticle(issue2.origin), "-ում");
          default:
            return "Սխալ մուտքագրում";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/id.js
function id_default() {
  return {
    localeError: error21()
  };
}
var error21;
var init_id = __esm({
  "node_modules/zod/v4/locales/id.js"() {
    init_util();
    error21 = () => {
      const Sizable = {
        string: { unit: "karakter", verb: "memiliki" },
        file: { unit: "byte", verb: "memiliki" },
        array: { unit: "item", verb: "memiliki" },
        set: { unit: "item", verb: "memiliki" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "alamat email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "tanggal dan waktu format ISO",
        date: "tanggal format ISO",
        time: "jam format ISO",
        duration: "durasi format ISO",
        ipv4: "alamat IPv4",
        ipv6: "alamat IPv6",
        cidrv4: "rentang alamat IPv4",
        cidrv6: "rentang alamat IPv6",
        base64: "string dengan enkode base64",
        base64url: "string dengan enkode base64url",
        json_string: "string JSON",
        e164: "angka E.164",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Input tidak valid: diharapkan instanceof ".concat(issue2.expected, ", diterima ").concat(received);
            }
            return "Input tidak valid: diharapkan ".concat(expected, ", diterima ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Input tidak valid: diharapkan ".concat(stringifyPrimitive(issue2.values[0]));
            return "Pilihan tidak valid: diharapkan salah satu dari ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Terlalu besar: diharapkan ".concat(issue2.origin ?? "value", " memiliki ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elemen");
            return "Terlalu besar: diharapkan ".concat(issue2.origin ?? "value", " menjadi ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Terlalu kecil: diharapkan ".concat(issue2.origin, " memiliki ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Terlalu kecil: diharapkan ".concat(issue2.origin, " menjadi ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'String tidak valid: harus dimulai dengan "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'String tidak valid: harus berakhir dengan "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'String tidak valid: harus menyertakan "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "String tidak valid: harus sesuai pola ".concat(_issue.pattern);
            return "".concat(FormatDictionary[_issue.format] ?? issue2.format, " tidak valid");
          }
          case "not_multiple_of":
            return "Angka tidak valid: harus kelipatan dari ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Kunci tidak dikenali ".concat(issue2.keys.length > 1 ? "s" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Kunci tidak valid di ".concat(issue2.origin);
          case "invalid_union":
            return "Input tidak valid";
          case "invalid_element":
            return "Nilai tidak valid di ".concat(issue2.origin);
          default:
            return "Input tidak valid";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/is.js
function is_default() {
  return {
    localeError: error22()
  };
}
var error22;
var init_is = __esm({
  "node_modules/zod/v4/locales/is.js"() {
    init_util();
    error22 = () => {
      const Sizable = {
        string: { unit: "stafi", verb: "að hafa" },
        file: { unit: "bæti", verb: "að hafa" },
        array: { unit: "hluti", verb: "að hafa" },
        set: { unit: "hluti", verb: "að hafa" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "gildi",
        email: "netfang",
        url: "vefslóð",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO dagsetning og tími",
        date: "ISO dagsetning",
        time: "ISO tími",
        duration: "ISO tímalengd",
        ipv4: "IPv4 address",
        ipv6: "IPv6 address",
        cidrv4: "IPv4 range",
        cidrv6: "IPv6 range",
        base64: "base64-encoded strengur",
        base64url: "base64url-encoded strengur",
        json_string: "JSON strengur",
        e164: "E.164 tölugildi",
        jwt: "JWT",
        template_literal: "gildi"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "númer",
        array: "fylki"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Rangt gildi: Þú slóst inn ".concat(received, " þar sem á að vera instanceof ").concat(issue2.expected);
            }
            return "Rangt gildi: Þú slóst inn ".concat(received, " þar sem á að vera ").concat(expected);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Rangt gildi: gert ráð fyrir ".concat(stringifyPrimitive(issue2.values[0]));
            return "Ógilt val: má vera eitt af eftirfarandi ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Of stórt: gert er ráð fyrir að ".concat(issue2.origin ?? "gildi", " hafi ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "hluti");
            return "Of stórt: gert er ráð fyrir að ".concat(issue2.origin ?? "gildi", " sé ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Of lítið: gert er ráð fyrir að ".concat(issue2.origin, " hafi ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Of lítið: gert er ráð fyrir að ".concat(issue2.origin, " sé ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Ógildur strengur: verður að byrja á "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'Ógildur strengur: verður að enda á "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Ógildur strengur: verður að innihalda "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Ógildur strengur: verður að fylgja mynstri ".concat(_issue.pattern);
            return "Rangt ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Röng tala: verður að vera margfeldi af ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Óþekkt ".concat(issue2.keys.length > 1 ? "ir lyklar" : "ur lykill", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Rangur lykill í ".concat(issue2.origin);
          case "invalid_union":
            return "Rangt gildi";
          case "invalid_element":
            return "Rangt gildi í ".concat(issue2.origin);
          default:
            return "Rangt gildi";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/it.js
function it_default() {
  return {
    localeError: error23()
  };
}
var error23;
var init_it = __esm({
  "node_modules/zod/v4/locales/it.js"() {
    init_util();
    error23 = () => {
      const Sizable = {
        string: { unit: "caratteri", verb: "avere" },
        file: { unit: "byte", verb: "avere" },
        array: { unit: "elementi", verb: "avere" },
        set: { unit: "elementi", verb: "avere" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "indirizzo email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data e ora ISO",
        date: "data ISO",
        time: "ora ISO",
        duration: "durata ISO",
        ipv4: "indirizzo IPv4",
        ipv6: "indirizzo IPv6",
        cidrv4: "intervallo IPv4",
        cidrv6: "intervallo IPv6",
        base64: "stringa codificata in base64",
        base64url: "URL codificata in base64",
        json_string: "stringa JSON",
        e164: "numero E.164",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "numero",
        array: "vettore"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Input non valido: atteso instanceof ".concat(issue2.expected, ", ricevuto ").concat(received);
            }
            return "Input non valido: atteso ".concat(expected, ", ricevuto ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Input non valido: atteso ".concat(stringifyPrimitive(issue2.values[0]));
            return "Opzione non valida: atteso uno tra ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Troppo grande: ".concat(issue2.origin ?? "valore", " deve avere ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elementi");
            return "Troppo grande: ".concat(issue2.origin ?? "valore", " deve essere ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Troppo piccolo: ".concat(issue2.origin, " deve avere ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Troppo piccolo: ".concat(issue2.origin, " deve essere ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Stringa non valida: deve iniziare con "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Stringa non valida: deve terminare con "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Stringa non valida: deve includere "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Stringa non valida: deve corrispondere al pattern ".concat(_issue.pattern);
            return "Input non valido: ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Numero non valido: deve essere un multiplo di ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Chiav".concat(issue2.keys.length > 1 ? "i" : "e", " non riconosciut").concat(issue2.keys.length > 1 ? "e" : "a", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Chiave non valida in ".concat(issue2.origin);
          case "invalid_union":
            return "Input non valido";
          case "invalid_element":
            return "Valore non valido in ".concat(issue2.origin);
          default:
            return "Input non valido";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/ja.js
function ja_default() {
  return {
    localeError: error24()
  };
}
var error24;
var init_ja = __esm({
  "node_modules/zod/v4/locales/ja.js"() {
    init_util();
    error24 = () => {
      const Sizable = {
        string: { unit: "文字", verb: "である" },
        file: { unit: "バイト", verb: "である" },
        array: { unit: "要素", verb: "である" },
        set: { unit: "要素", verb: "である" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "入力値",
        email: "メールアドレス",
        url: "URL",
        emoji: "絵文字",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO日時",
        date: "ISO日付",
        time: "ISO時刻",
        duration: "ISO期間",
        ipv4: "IPv4アドレス",
        ipv6: "IPv6アドレス",
        cidrv4: "IPv4範囲",
        cidrv6: "IPv6範囲",
        base64: "base64エンコード文字列",
        base64url: "base64urlエンコード文字列",
        json_string: "JSON文字列",
        e164: "E.164番号",
        jwt: "JWT",
        template_literal: "入力値"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "数値",
        array: "配列"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "無効な入力: instanceof ".concat(issue2.expected, "が期待されましたが、").concat(received, "が入力されました");
            }
            return "無効な入力: ".concat(expected, "が期待されましたが、").concat(received, "が入力されました");
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "無効な入力: ".concat(stringifyPrimitive(issue2.values[0]), "が期待されました");
            return "無効な選択: ".concat(joinValues(issue2.values, "、"), "のいずれかである必要があります");
          case "too_big": {
            const adj = issue2.inclusive ? "以下である" : "より小さい";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "大きすぎる値: ".concat(issue2.origin ?? "値", "は").concat(issue2.maximum.toString()).concat(sizing.unit ?? "要素").concat(adj, "必要があります");
            return "大きすぎる値: ".concat(issue2.origin ?? "値", "は").concat(issue2.maximum.toString()).concat(adj, "必要があります");
          }
          case "too_small": {
            const adj = issue2.inclusive ? "以上である" : "より大きい";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "小さすぎる値: ".concat(issue2.origin, "は").concat(issue2.minimum.toString()).concat(sizing.unit).concat(adj, "必要があります");
            return "小さすぎる値: ".concat(issue2.origin, "は").concat(issue2.minimum.toString()).concat(adj, "必要があります");
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return '無効な文字列: "'.concat(_issue.prefix, '"で始まる必要があります');
            if (_issue.format === "ends_with")
              return '無効な文字列: "'.concat(_issue.suffix, '"で終わる必要があります');
            if (_issue.format === "includes")
              return '無効な文字列: "'.concat(_issue.includes, '"を含む必要があります');
            if (_issue.format === "regex")
              return "無効な文字列: パターン".concat(_issue.pattern, "に一致する必要があります");
            return "無効な".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "無効な数値: ".concat(issue2.divisor, "の倍数である必要があります");
          case "unrecognized_keys":
            return "認識されていないキー".concat(issue2.keys.length > 1 ? "群" : "", ": ").concat(joinValues(issue2.keys, "、"));
          case "invalid_key":
            return "".concat(issue2.origin, "内の無効なキー");
          case "invalid_union":
            return "無効な入力";
          case "invalid_element":
            return "".concat(issue2.origin, "内の無効な値");
          default:
            return "無効な入力";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/ka.js
function ka_default() {
  return {
    localeError: error25()
  };
}
var error25;
var init_ka = __esm({
  "node_modules/zod/v4/locales/ka.js"() {
    init_util();
    error25 = () => {
      const Sizable = {
        string: { unit: "სიმბოლო", verb: "უნდა შეიცავდეს" },
        file: { unit: "ბაიტი", verb: "უნდა შეიცავდეს" },
        array: { unit: "ელემენტი", verb: "უნდა შეიცავდეს" },
        set: { unit: "ელემენტი", verb: "უნდა შეიცავდეს" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "შეყვანა",
        email: "ელ-ფოსტის მისამართი",
        url: "URL",
        emoji: "ემოჯი",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "თარიღი-დრო",
        date: "თარიღი",
        time: "დრო",
        duration: "ხანგრძლივობა",
        ipv4: "IPv4 მისამართი",
        ipv6: "IPv6 მისამართი",
        cidrv4: "IPv4 დიაპაზონი",
        cidrv6: "IPv6 დიაპაზონი",
        base64: "base64-კოდირებული ველი",
        base64url: "base64url-კოდირებული ველი",
        json_string: "JSON ველი",
        e164: "E.164 ნომერი",
        jwt: "JWT",
        template_literal: "შეყვანა"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "რიცხვი",
        string: "ველი",
        boolean: "ბულეანი",
        function: "ფუნქცია",
        array: "მასივი"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "არასწორი შეყვანა: მოსალოდნელი instanceof ".concat(issue2.expected, ", მიღებული ").concat(received);
            }
            return "არასწორი შეყვანა: მოსალოდნელი ".concat(expected, ", მიღებული ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "არასწორი შეყვანა: მოსალოდნელი ".concat(stringifyPrimitive(issue2.values[0]));
            return "არასწორი ვარიანტი: მოსალოდნელია ერთ-ერთი ".concat(joinValues(issue2.values, "|"), "-დან");
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "ზედმეტად დიდი: მოსალოდნელი ".concat(issue2.origin ?? "მნიშვნელობა", " ").concat(sizing.verb, " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit);
            return "ზედმეტად დიდი: მოსალოდნელი ".concat(issue2.origin ?? "მნიშვნელობა", " იყოს ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "ზედმეტად პატარა: მოსალოდნელი ".concat(issue2.origin, " ").concat(sizing.verb, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "ზედმეტად პატარა: მოსალოდნელი ".concat(issue2.origin, " იყოს ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'არასწორი ველი: უნდა იწყებოდეს "'.concat(_issue.prefix, '"-ით');
            }
            if (_issue.format === "ends_with")
              return 'არასწორი ველი: უნდა მთავრდებოდეს "'.concat(_issue.suffix, '"-ით');
            if (_issue.format === "includes")
              return 'არასწორი ველი: უნდა შეიცავდეს "'.concat(_issue.includes, '"-ს');
            if (_issue.format === "regex")
              return "არასწორი ველი: უნდა შეესაბამებოდეს შაბლონს ".concat(_issue.pattern);
            return "არასწორი ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "არასწორი რიცხვი: უნდა იყოს ".concat(issue2.divisor, "-ის ჯერადი");
          case "unrecognized_keys":
            return "უცნობი გასაღებ".concat(issue2.keys.length > 1 ? "ები" : "ი", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "არასწორი გასაღები ".concat(issue2.origin, "-ში");
          case "invalid_union":
            return "არასწორი შეყვანა";
          case "invalid_element":
            return "არასწორი მნიშვნელობა ".concat(issue2.origin, "-ში");
          default:
            return "არასწორი შეყვანა";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/km.js
function km_default() {
  return {
    localeError: error26()
  };
}
var error26;
var init_km = __esm({
  "node_modules/zod/v4/locales/km.js"() {
    init_util();
    error26 = () => {
      const Sizable = {
        string: { unit: "តួអក្សរ", verb: "គួរមាន" },
        file: { unit: "បៃ", verb: "គួរមាន" },
        array: { unit: "ធាតុ", verb: "គួរមាន" },
        set: { unit: "ធាតុ", verb: "គួរមាន" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "ទិន្នន័យបញ្ចូល",
        email: "អាសយដ្ឋានអ៊ីមែល",
        url: "URL",
        emoji: "សញ្ញាអារម្មណ៍",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "កាលបរិច្ឆេទ និងម៉ោង ISO",
        date: "កាលបរិច្ឆេទ ISO",
        time: "ម៉ោង ISO",
        duration: "រយៈពេល ISO",
        ipv4: "អាសយដ្ឋាន IPv4",
        ipv6: "អាសយដ្ឋាន IPv6",
        cidrv4: "ដែនអាសយដ្ឋាន IPv4",
        cidrv6: "ដែនអាសយដ្ឋាន IPv6",
        base64: "ខ្សែអក្សរអ៊ិកូដ base64",
        base64url: "ខ្សែអក្សរអ៊ិកូដ base64url",
        json_string: "ខ្សែអក្សរ JSON",
        e164: "លេខ E.164",
        jwt: "JWT",
        template_literal: "ទិន្នន័យបញ្ចូល"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "លេខ",
        array: "អារេ (Array)",
        null: "គ្មានតម្លៃ (null)"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "ទិន្នន័យបញ្ចូលមិនត្រឹមត្រូវ៖ ត្រូវការ instanceof ".concat(issue2.expected, " ប៉ុន្តែទទួលបាន ").concat(received);
            }
            return "ទិន្នន័យបញ្ចូលមិនត្រឹមត្រូវ៖ ត្រូវការ ".concat(expected, " ប៉ុន្តែទទួលបាន ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "ទិន្នន័យបញ្ចូលមិនត្រឹមត្រូវ៖ ត្រូវការ ".concat(stringifyPrimitive(issue2.values[0]));
            return "ជម្រើសមិនត្រឹមត្រូវ៖ ត្រូវជាមួយក្នុងចំណោម ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "ធំពេក៖ ត្រូវការ ".concat(issue2.origin ?? "តម្លៃ", " ").concat(adj, " ").concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "ធាតុ");
            return "ធំពេក៖ ត្រូវការ ".concat(issue2.origin ?? "តម្លៃ", " ").concat(adj, " ").concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "តូចពេក៖ ត្រូវការ ".concat(issue2.origin, " ").concat(adj, " ").concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "តូចពេក៖ ត្រូវការ ".concat(issue2.origin, " ").concat(adj, " ").concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'ខ្សែអក្សរមិនត្រឹមត្រូវ៖ ត្រូវចាប់ផ្តើមដោយ "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'ខ្សែអក្សរមិនត្រឹមត្រូវ៖ ត្រូវបញ្ចប់ដោយ "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'ខ្សែអក្សរមិនត្រឹមត្រូវ៖ ត្រូវមាន "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "ខ្សែអក្សរមិនត្រឹមត្រូវ៖ ត្រូវតែផ្គូផ្គងនឹងទម្រង់ដែលបានកំណត់ ".concat(_issue.pattern);
            return "មិនត្រឹមត្រូវ៖ ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "លេខមិនត្រឹមត្រូវ៖ ត្រូវតែជាពហុគុណនៃ ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "រកឃើញសោមិនស្គាល់៖ ".concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "សោមិនត្រឹមត្រូវនៅក្នុង ".concat(issue2.origin);
          case "invalid_union":
            return "ទិន្នន័យមិនត្រឹមត្រូវ";
          case "invalid_element":
            return "ទិន្នន័យមិនត្រឹមត្រូវនៅក្នុង ".concat(issue2.origin);
          default:
            return "ទិន្នន័យមិនត្រឹមត្រូវ";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/kh.js
function kh_default() {
  return km_default();
}
var init_kh = __esm({
  "node_modules/zod/v4/locales/kh.js"() {
    init_km();
  }
});

// node_modules/zod/v4/locales/ko.js
function ko_default() {
  return {
    localeError: error27()
  };
}
var error27;
var init_ko = __esm({
  "node_modules/zod/v4/locales/ko.js"() {
    init_util();
    error27 = () => {
      const Sizable = {
        string: { unit: "문자", verb: "to have" },
        file: { unit: "바이트", verb: "to have" },
        array: { unit: "개", verb: "to have" },
        set: { unit: "개", verb: "to have" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "입력",
        email: "이메일 주소",
        url: "URL",
        emoji: "이모지",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO 날짜시간",
        date: "ISO 날짜",
        time: "ISO 시간",
        duration: "ISO 기간",
        ipv4: "IPv4 주소",
        ipv6: "IPv6 주소",
        cidrv4: "IPv4 범위",
        cidrv6: "IPv6 범위",
        base64: "base64 인코딩 문자열",
        base64url: "base64url 인코딩 문자열",
        json_string: "JSON 문자열",
        e164: "E.164 번호",
        jwt: "JWT",
        template_literal: "입력"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "잘못된 입력: 예상 타입은 instanceof ".concat(issue2.expected, ", 받은 타입은 ").concat(received, "입니다");
            }
            return "잘못된 입력: 예상 타입은 ".concat(expected, ", 받은 타입은 ").concat(received, "입니다");
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "잘못된 입력: 값은 ".concat(stringifyPrimitive(issue2.values[0]), " 이어야 합니다");
            return "잘못된 옵션: ".concat(joinValues(issue2.values, "또는 "), " 중 하나여야 합니다");
          case "too_big": {
            const adj = issue2.inclusive ? "이하" : "미만";
            const suffix = adj === "미만" ? "이어야 합니다" : "여야 합니다";
            const sizing = getSizing(issue2.origin);
            const unit = sizing?.unit ?? "요소";
            if (sizing)
              return "".concat(issue2.origin ?? "값", "이 너무 큽니다: ").concat(issue2.maximum.toString()).concat(unit, " ").concat(adj).concat(suffix);
            return "".concat(issue2.origin ?? "값", "이 너무 큽니다: ").concat(issue2.maximum.toString(), " ").concat(adj).concat(suffix);
          }
          case "too_small": {
            const adj = issue2.inclusive ? "이상" : "초과";
            const suffix = adj === "이상" ? "이어야 합니다" : "여야 합니다";
            const sizing = getSizing(issue2.origin);
            const unit = sizing?.unit ?? "요소";
            if (sizing) {
              return "".concat(issue2.origin ?? "값", "이 너무 작습니다: ").concat(issue2.minimum.toString()).concat(unit, " ").concat(adj).concat(suffix);
            }
            return "".concat(issue2.origin ?? "값", "이 너무 작습니다: ").concat(issue2.minimum.toString(), " ").concat(adj).concat(suffix);
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return '잘못된 문자열: "'.concat(_issue.prefix, '"(으)로 시작해야 합니다');
            }
            if (_issue.format === "ends_with")
              return '잘못된 문자열: "'.concat(_issue.suffix, '"(으)로 끝나야 합니다');
            if (_issue.format === "includes")
              return '잘못된 문자열: "'.concat(_issue.includes, '"을(를) 포함해야 합니다');
            if (_issue.format === "regex")
              return "잘못된 문자열: 정규식 ".concat(_issue.pattern, " 패턴과 일치해야 합니다");
            return "잘못된 ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "잘못된 숫자: ".concat(issue2.divisor, "의 배수여야 합니다");
          case "unrecognized_keys":
            return "인식할 수 없는 키: ".concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "잘못된 키: ".concat(issue2.origin);
          case "invalid_union":
            return "잘못된 입력";
          case "invalid_element":
            return "잘못된 값: ".concat(issue2.origin);
          default:
            return "잘못된 입력";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/lt.js
function getUnitTypeFromNumber(number4) {
  const abs = Math.abs(number4);
  const last = abs % 10;
  const last2 = abs % 100;
  if (last2 >= 11 && last2 <= 19 || last === 0)
    return "many";
  if (last === 1)
    return "one";
  return "few";
}
function lt_default() {
  return {
    localeError: error28()
  };
}
var capitalizeFirstCharacter, error28;
var init_lt = __esm({
  "node_modules/zod/v4/locales/lt.js"() {
    init_util();
    capitalizeFirstCharacter = (text) => {
      return text.charAt(0).toUpperCase() + text.slice(1);
    };
    error28 = () => {
      const Sizable = {
        string: {
          unit: {
            one: "simbolis",
            few: "simboliai",
            many: "simbolių"
          },
          verb: {
            smaller: {
              inclusive: "turi būti ne ilgesnė kaip",
              notInclusive: "turi būti trumpesnė kaip"
            },
            bigger: {
              inclusive: "turi būti ne trumpesnė kaip",
              notInclusive: "turi būti ilgesnė kaip"
            }
          }
        },
        file: {
          unit: {
            one: "baitas",
            few: "baitai",
            many: "baitų"
          },
          verb: {
            smaller: {
              inclusive: "turi būti ne didesnis kaip",
              notInclusive: "turi būti mažesnis kaip"
            },
            bigger: {
              inclusive: "turi būti ne mažesnis kaip",
              notInclusive: "turi būti didesnis kaip"
            }
          }
        },
        array: {
          unit: {
            one: "elementą",
            few: "elementus",
            many: "elementų"
          },
          verb: {
            smaller: {
              inclusive: "turi turėti ne daugiau kaip",
              notInclusive: "turi turėti mažiau kaip"
            },
            bigger: {
              inclusive: "turi turėti ne mažiau kaip",
              notInclusive: "turi turėti daugiau kaip"
            }
          }
        },
        set: {
          unit: {
            one: "elementą",
            few: "elementus",
            many: "elementų"
          },
          verb: {
            smaller: {
              inclusive: "turi turėti ne daugiau kaip",
              notInclusive: "turi turėti mažiau kaip"
            },
            bigger: {
              inclusive: "turi turėti ne mažiau kaip",
              notInclusive: "turi turėti daugiau kaip"
            }
          }
        }
      };
      function getSizing(origin, unitType, inclusive, targetShouldBe) {
        const result = Sizable[origin] ?? null;
        if (result === null)
          return result;
        return {
          unit: result.unit[unitType],
          verb: result.verb[targetShouldBe][inclusive ? "inclusive" : "notInclusive"]
        };
      }
      const FormatDictionary = {
        regex: "įvestis",
        email: "el. pašto adresas",
        url: "URL",
        emoji: "jaustukas",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO data ir laikas",
        date: "ISO data",
        time: "ISO laikas",
        duration: "ISO trukmė",
        ipv4: "IPv4 adresas",
        ipv6: "IPv6 adresas",
        cidrv4: "IPv4 tinklo prefiksas (CIDR)",
        cidrv6: "IPv6 tinklo prefiksas (CIDR)",
        base64: "base64 užkoduota eilutė",
        base64url: "base64url užkoduota eilutė",
        json_string: "JSON eilutė",
        e164: "E.164 numeris",
        jwt: "JWT",
        template_literal: "įvestis"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "skaičius",
        bigint: "sveikasis skaičius",
        string: "eilutė",
        boolean: "loginė reikšmė",
        undefined: "neapibrėžta reikšmė",
        function: "funkcija",
        symbol: "simbolis",
        array: "masyvas",
        object: "objektas",
        null: "nulinė reikšmė"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Gautas tipas ".concat(received, ", o tikėtasi - instanceof ").concat(issue2.expected);
            }
            return "Gautas tipas ".concat(received, ", o tikėtasi - ").concat(expected);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Privalo būti ".concat(stringifyPrimitive(issue2.values[0]));
            return "Privalo būti vienas iš ".concat(joinValues(issue2.values, "|"), " pasirinkimų");
          case "too_big": {
            const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
            const sizing = getSizing(issue2.origin, getUnitTypeFromNumber(Number(issue2.maximum)), issue2.inclusive ?? false, "smaller");
            if (sizing?.verb)
              return "".concat(capitalizeFirstCharacter(origin ?? issue2.origin ?? "reikšmė"), " ").concat(sizing.verb, " ").concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elementų");
            const adj = issue2.inclusive ? "ne didesnis kaip" : "mažesnis kaip";
            return "".concat(capitalizeFirstCharacter(origin ?? issue2.origin ?? "reikšmė"), " turi būti ").concat(adj, " ").concat(issue2.maximum.toString(), " ").concat(sizing?.unit);
          }
          case "too_small": {
            const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
            const sizing = getSizing(issue2.origin, getUnitTypeFromNumber(Number(issue2.minimum)), issue2.inclusive ?? false, "bigger");
            if (sizing?.verb)
              return "".concat(capitalizeFirstCharacter(origin ?? issue2.origin ?? "reikšmė"), " ").concat(sizing.verb, " ").concat(issue2.minimum.toString(), " ").concat(sizing.unit ?? "elementų");
            const adj = issue2.inclusive ? "ne mažesnis kaip" : "didesnis kaip";
            return "".concat(capitalizeFirstCharacter(origin ?? issue2.origin ?? "reikšmė"), " turi būti ").concat(adj, " ").concat(issue2.minimum.toString(), " ").concat(sizing?.unit);
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Eilutė privalo prasidėti "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'Eilutė privalo pasibaigti "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Eilutė privalo įtraukti "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Eilutė privalo atitikti ".concat(_issue.pattern);
            return "Neteisingas ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Skaičius privalo būti ".concat(issue2.divisor, " kartotinis.");
          case "unrecognized_keys":
            return "Neatpažint".concat(issue2.keys.length > 1 ? "i" : "as", " rakt").concat(issue2.keys.length > 1 ? "ai" : "as", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Rastas klaidingas raktas";
          case "invalid_union":
            return "Klaidinga įvestis";
          case "invalid_element": {
            const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
            return "".concat(capitalizeFirstCharacter(origin ?? issue2.origin ?? "reikšmė"), " turi klaidingą įvestį");
          }
          default:
            return "Klaidinga įvestis";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/mk.js
function mk_default() {
  return {
    localeError: error29()
  };
}
var error29;
var init_mk = __esm({
  "node_modules/zod/v4/locales/mk.js"() {
    init_util();
    error29 = () => {
      const Sizable = {
        string: { unit: "знаци", verb: "да имаат" },
        file: { unit: "бајти", verb: "да имаат" },
        array: { unit: "ставки", verb: "да имаат" },
        set: { unit: "ставки", verb: "да имаат" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "внес",
        email: "адреса на е-пошта",
        url: "URL",
        emoji: "емоџи",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO датум и време",
        date: "ISO датум",
        time: "ISO време",
        duration: "ISO времетраење",
        ipv4: "IPv4 адреса",
        ipv6: "IPv6 адреса",
        cidrv4: "IPv4 опсег",
        cidrv6: "IPv6 опсег",
        base64: "base64-енкодирана низа",
        base64url: "base64url-енкодирана низа",
        json_string: "JSON низа",
        e164: "E.164 број",
        jwt: "JWT",
        template_literal: "внес"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "број",
        array: "низа"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Грешен внес: се очекува instanceof ".concat(issue2.expected, ", примено ").concat(received);
            }
            return "Грешен внес: се очекува ".concat(expected, ", примено ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Invalid input: expected ".concat(stringifyPrimitive(issue2.values[0]));
            return "Грешана опција: се очекува една ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Премногу голем: се очекува ".concat(issue2.origin ?? "вредноста", " да има ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "елементи");
            return "Премногу голем: се очекува ".concat(issue2.origin ?? "вредноста", " да биде ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Премногу мал: се очекува ".concat(issue2.origin, " да има ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Премногу мал: се очекува ".concat(issue2.origin, " да биде ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Неважечка низа: мора да започнува со "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'Неважечка низа: мора да завршува со "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Неважечка низа: мора да вклучува "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Неважечка низа: мора да одгоара на патернот ".concat(_issue.pattern);
            return "Invalid ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Грешен број: мора да биде делив со ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "".concat(issue2.keys.length > 1 ? "Непрепознаени клучеви" : "Непрепознаен клуч", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Грешен клуч во ".concat(issue2.origin);
          case "invalid_union":
            return "Грешен внес";
          case "invalid_element":
            return "Грешна вредност во ".concat(issue2.origin);
          default:
            return "Грешен внес";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/ms.js
function ms_default() {
  return {
    localeError: error30()
  };
}
var error30;
var init_ms = __esm({
  "node_modules/zod/v4/locales/ms.js"() {
    init_util();
    error30 = () => {
      const Sizable = {
        string: { unit: "aksara", verb: "mempunyai" },
        file: { unit: "bait", verb: "mempunyai" },
        array: { unit: "elemen", verb: "mempunyai" },
        set: { unit: "elemen", verb: "mempunyai" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "alamat e-mel",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "tarikh masa ISO",
        date: "tarikh ISO",
        time: "masa ISO",
        duration: "tempoh ISO",
        ipv4: "alamat IPv4",
        ipv6: "alamat IPv6",
        cidrv4: "julat IPv4",
        cidrv6: "julat IPv6",
        base64: "string dikodkan base64",
        base64url: "string dikodkan base64url",
        json_string: "string JSON",
        e164: "nombor E.164",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "nombor"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Input tidak sah: dijangka instanceof ".concat(issue2.expected, ", diterima ").concat(received);
            }
            return "Input tidak sah: dijangka ".concat(expected, ", diterima ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Input tidak sah: dijangka ".concat(stringifyPrimitive(issue2.values[0]));
            return "Pilihan tidak sah: dijangka salah satu daripada ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Terlalu besar: dijangka ".concat(issue2.origin ?? "nilai", " ").concat(sizing.verb, " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elemen");
            return "Terlalu besar: dijangka ".concat(issue2.origin ?? "nilai", " adalah ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Terlalu kecil: dijangka ".concat(issue2.origin, " ").concat(sizing.verb, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Terlalu kecil: dijangka ".concat(issue2.origin, " adalah ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'String tidak sah: mesti bermula dengan "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'String tidak sah: mesti berakhir dengan "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'String tidak sah: mesti mengandungi "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "String tidak sah: mesti sepadan dengan corak ".concat(_issue.pattern);
            return "".concat(FormatDictionary[_issue.format] ?? issue2.format, " tidak sah");
          }
          case "not_multiple_of":
            return "Nombor tidak sah: perlu gandaan ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Kunci tidak dikenali: ".concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Kunci tidak sah dalam ".concat(issue2.origin);
          case "invalid_union":
            return "Input tidak sah";
          case "invalid_element":
            return "Nilai tidak sah dalam ".concat(issue2.origin);
          default:
            return "Input tidak sah";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/nl.js
function nl_default() {
  return {
    localeError: error31()
  };
}
var error31;
var init_nl = __esm({
  "node_modules/zod/v4/locales/nl.js"() {
    init_util();
    error31 = () => {
      const Sizable = {
        string: { unit: "tekens", verb: "heeft" },
        file: { unit: "bytes", verb: "heeft" },
        array: { unit: "elementen", verb: "heeft" },
        set: { unit: "elementen", verb: "heeft" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "invoer",
        email: "emailadres",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datum en tijd",
        date: "ISO datum",
        time: "ISO tijd",
        duration: "ISO duur",
        ipv4: "IPv4-adres",
        ipv6: "IPv6-adres",
        cidrv4: "IPv4-bereik",
        cidrv6: "IPv6-bereik",
        base64: "base64-gecodeerde tekst",
        base64url: "base64 URL-gecodeerde tekst",
        json_string: "JSON string",
        e164: "E.164-nummer",
        jwt: "JWT",
        template_literal: "invoer"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "getal"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Ongeldige invoer: verwacht instanceof ".concat(issue2.expected, ", ontving ").concat(received);
            }
            return "Ongeldige invoer: verwacht ".concat(expected, ", ontving ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Ongeldige invoer: verwacht ".concat(stringifyPrimitive(issue2.values[0]));
            return "Ongeldige optie: verwacht één van ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            const longName = issue2.origin === "date" ? "laat" : issue2.origin === "string" ? "lang" : "groot";
            if (sizing)
              return "Te ".concat(longName, ": verwacht dat ").concat(issue2.origin ?? "waarde", " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elementen", " ").concat(sizing.verb);
            return "Te ".concat(longName, ": verwacht dat ").concat(issue2.origin ?? "waarde", " ").concat(adj).concat(issue2.maximum.toString(), " is");
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            const shortName = issue2.origin === "date" ? "vroeg" : issue2.origin === "string" ? "kort" : "klein";
            if (sizing) {
              return "Te ".concat(shortName, ": verwacht dat ").concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit, " ").concat(sizing.verb);
            }
            return "Te ".concat(shortName, ": verwacht dat ").concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString(), " is");
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Ongeldige tekst: moet met "'.concat(_issue.prefix, '" beginnen');
            }
            if (_issue.format === "ends_with")
              return 'Ongeldige tekst: moet op "'.concat(_issue.suffix, '" eindigen');
            if (_issue.format === "includes")
              return 'Ongeldige tekst: moet "'.concat(_issue.includes, '" bevatten');
            if (_issue.format === "regex")
              return "Ongeldige tekst: moet overeenkomen met patroon ".concat(_issue.pattern);
            return "Ongeldig: ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Ongeldig getal: moet een veelvoud van ".concat(issue2.divisor, " zijn");
          case "unrecognized_keys":
            return "Onbekende key".concat(issue2.keys.length > 1 ? "s" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Ongeldige key in ".concat(issue2.origin);
          case "invalid_union":
            return "Ongeldige invoer";
          case "invalid_element":
            return "Ongeldige waarde in ".concat(issue2.origin);
          default:
            return "Ongeldige invoer";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/no.js
function no_default() {
  return {
    localeError: error32()
  };
}
var error32;
var init_no = __esm({
  "node_modules/zod/v4/locales/no.js"() {
    init_util();
    error32 = () => {
      const Sizable = {
        string: { unit: "tegn", verb: "å ha" },
        file: { unit: "bytes", verb: "å ha" },
        array: { unit: "elementer", verb: "å inneholde" },
        set: { unit: "elementer", verb: "å inneholde" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "e-postadresse",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO dato- og klokkeslett",
        date: "ISO-dato",
        time: "ISO-klokkeslett",
        duration: "ISO-varighet",
        ipv4: "IPv4-område",
        ipv6: "IPv6-område",
        cidrv4: "IPv4-spekter",
        cidrv6: "IPv6-spekter",
        base64: "base64-enkodet streng",
        base64url: "base64url-enkodet streng",
        json_string: "JSON-streng",
        e164: "E.164-nummer",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "tall",
        array: "liste"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Ugyldig input: forventet instanceof ".concat(issue2.expected, ", fikk ").concat(received);
            }
            return "Ugyldig input: forventet ".concat(expected, ", fikk ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Ugyldig verdi: forventet ".concat(stringifyPrimitive(issue2.values[0]));
            return "Ugyldig valg: forventet en av ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "For stor(t): forventet ".concat(issue2.origin ?? "value", " til å ha ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elementer");
            return "For stor(t): forventet ".concat(issue2.origin ?? "value", " til å ha ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "For lite(n): forventet ".concat(issue2.origin, " til å ha ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "For lite(n): forventet ".concat(issue2.origin, " til å ha ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Ugyldig streng: må starte med "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Ugyldig streng: må ende med "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Ugyldig streng: må inneholde "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Ugyldig streng: må matche mønsteret ".concat(_issue.pattern);
            return "Ugyldig ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Ugyldig tall: må være et multiplum av ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "".concat(issue2.keys.length > 1 ? "Ukjente nøkler" : "Ukjent nøkkel", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Ugyldig nøkkel i ".concat(issue2.origin);
          case "invalid_union":
            return "Ugyldig input";
          case "invalid_element":
            return "Ugyldig verdi i ".concat(issue2.origin);
          default:
            return "Ugyldig input";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/ota.js
function ota_default() {
  return {
    localeError: error33()
  };
}
var error33;
var init_ota = __esm({
  "node_modules/zod/v4/locales/ota.js"() {
    init_util();
    error33 = () => {
      const Sizable = {
        string: { unit: "harf", verb: "olmalıdır" },
        file: { unit: "bayt", verb: "olmalıdır" },
        array: { unit: "unsur", verb: "olmalıdır" },
        set: { unit: "unsur", verb: "olmalıdır" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "giren",
        email: "epostagâh",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO hengâmı",
        date: "ISO tarihi",
        time: "ISO zamanı",
        duration: "ISO müddeti",
        ipv4: "IPv4 nişânı",
        ipv6: "IPv6 nişânı",
        cidrv4: "IPv4 menzili",
        cidrv6: "IPv6 menzili",
        base64: "base64-şifreli metin",
        base64url: "base64url-şifreli metin",
        json_string: "JSON metin",
        e164: "E.164 sayısı",
        jwt: "JWT",
        template_literal: "giren"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "numara",
        array: "saf",
        null: "gayb"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Fâsit giren: umulan instanceof ".concat(issue2.expected, ", alınan ").concat(received);
            }
            return "Fâsit giren: umulan ".concat(expected, ", alınan ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Fâsit giren: umulan ".concat(stringifyPrimitive(issue2.values[0]));
            return "Fâsit tercih: mûteberler ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Fazla büyük: ".concat(issue2.origin ?? "value", ", ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elements", " sahip olmalıydı.");
            return "Fazla büyük: ".concat(issue2.origin ?? "value", ", ").concat(adj).concat(issue2.maximum.toString(), " olmalıydı.");
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Fazla küçük: ".concat(issue2.origin, ", ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit, " sahip olmalıydı.");
            }
            return "Fazla küçük: ".concat(issue2.origin, ", ").concat(adj).concat(issue2.minimum.toString(), " olmalıydı.");
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Fâsit metin: "'.concat(_issue.prefix, '" ile başlamalı.');
            if (_issue.format === "ends_with")
              return 'Fâsit metin: "'.concat(_issue.suffix, '" ile bitmeli.');
            if (_issue.format === "includes")
              return 'Fâsit metin: "'.concat(_issue.includes, '" ihtivâ etmeli.');
            if (_issue.format === "regex")
              return "Fâsit metin: ".concat(_issue.pattern, " nakşına uymalı.");
            return "Fâsit ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Fâsit sayı: ".concat(issue2.divisor, " katı olmalıydı.");
          case "unrecognized_keys":
            return "Tanınmayan anahtar ".concat(issue2.keys.length > 1 ? "s" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "".concat(issue2.origin, " için tanınmayan anahtar var.");
          case "invalid_union":
            return "Giren tanınamadı.";
          case "invalid_element":
            return "".concat(issue2.origin, " için tanınmayan kıymet var.");
          default:
            return "Kıymet tanınamadı.";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/ps.js
function ps_default() {
  return {
    localeError: error34()
  };
}
var error34;
var init_ps = __esm({
  "node_modules/zod/v4/locales/ps.js"() {
    init_util();
    error34 = () => {
      const Sizable = {
        string: { unit: "توکي", verb: "ولري" },
        file: { unit: "بایټس", verb: "ولري" },
        array: { unit: "توکي", verb: "ولري" },
        set: { unit: "توکي", verb: "ولري" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "ورودي",
        email: "بریښنالیک",
        url: "یو آر ال",
        emoji: "ایموجي",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "نیټه او وخت",
        date: "نېټه",
        time: "وخت",
        duration: "موده",
        ipv4: "د IPv4 پته",
        ipv6: "د IPv6 پته",
        cidrv4: "د IPv4 ساحه",
        cidrv6: "د IPv6 ساحه",
        base64: "base64-encoded متن",
        base64url: "base64url-encoded متن",
        json_string: "JSON متن",
        e164: "د E.164 شمېره",
        jwt: "JWT",
        template_literal: "ورودي"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "عدد",
        array: "ارې"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "ناسم ورودي: باید instanceof ".concat(issue2.expected, " وای, مګر ").concat(received, " ترلاسه شو");
            }
            return "ناسم ورودي: باید ".concat(expected, " وای, مګر ").concat(received, " ترلاسه شو");
          }
          case "invalid_value":
            if (issue2.values.length === 1) {
              return "ناسم ورودي: باید ".concat(stringifyPrimitive(issue2.values[0]), " وای");
            }
            return "ناسم انتخاب: باید یو له ".concat(joinValues(issue2.values, "|"), " څخه وای");
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "ډیر لوی: ".concat(issue2.origin ?? "ارزښت", " باید ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "عنصرونه", " ولري");
            }
            return "ډیر لوی: ".concat(issue2.origin ?? "ارزښت", " باید ").concat(adj).concat(issue2.maximum.toString(), " وي");
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "ډیر کوچنی: ".concat(issue2.origin, " باید ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit, " ولري");
            }
            return "ډیر کوچنی: ".concat(issue2.origin, " باید ").concat(adj).concat(issue2.minimum.toString(), " وي");
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'ناسم متن: باید د "'.concat(_issue.prefix, '" سره پیل شي');
            }
            if (_issue.format === "ends_with") {
              return 'ناسم متن: باید د "'.concat(_issue.suffix, '" سره پای ته ورسيږي');
            }
            if (_issue.format === "includes") {
              return 'ناسم متن: باید "'.concat(_issue.includes, '" ولري');
            }
            if (_issue.format === "regex") {
              return "ناسم متن: باید د ".concat(_issue.pattern, " سره مطابقت ولري");
            }
            return "".concat(FormatDictionary[_issue.format] ?? issue2.format, " ناسم دی");
          }
          case "not_multiple_of":
            return "ناسم عدد: باید د ".concat(issue2.divisor, " مضرب وي");
          case "unrecognized_keys":
            return "ناسم ".concat(issue2.keys.length > 1 ? "کلیډونه" : "کلیډ", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "ناسم کلیډ په ".concat(issue2.origin, " کې");
          case "invalid_union":
            return "ناسمه ورودي";
          case "invalid_element":
            return "ناسم عنصر په ".concat(issue2.origin, " کې");
          default:
            return "ناسمه ورودي";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/pl.js
function pl_default() {
  return {
    localeError: error35()
  };
}
var error35;
var init_pl = __esm({
  "node_modules/zod/v4/locales/pl.js"() {
    init_util();
    error35 = () => {
      const Sizable = {
        string: { unit: "znaków", verb: "mieć" },
        file: { unit: "bajtów", verb: "mieć" },
        array: { unit: "elementów", verb: "mieć" },
        set: { unit: "elementów", verb: "mieć" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "wyrażenie",
        email: "adres email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data i godzina w formacie ISO",
        date: "data w formacie ISO",
        time: "godzina w formacie ISO",
        duration: "czas trwania ISO",
        ipv4: "adres IPv4",
        ipv6: "adres IPv6",
        cidrv4: "zakres IPv4",
        cidrv6: "zakres IPv6",
        base64: "ciąg znaków zakodowany w formacie base64",
        base64url: "ciąg znaków zakodowany w formacie base64url",
        json_string: "ciąg znaków w formacie JSON",
        e164: "liczba E.164",
        jwt: "JWT",
        template_literal: "wejście"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "liczba",
        array: "tablica"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Nieprawidłowe dane wejściowe: oczekiwano instanceof ".concat(issue2.expected, ", otrzymano ").concat(received);
            }
            return "Nieprawidłowe dane wejściowe: oczekiwano ".concat(expected, ", otrzymano ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Nieprawidłowe dane wejściowe: oczekiwano ".concat(stringifyPrimitive(issue2.values[0]));
            return "Nieprawidłowa opcja: oczekiwano jednej z wartości ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Za duża wartość: oczekiwano, że ".concat(issue2.origin ?? "wartość", " będzie mieć ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elementów");
            }
            return "Zbyt duż(y/a/e): oczekiwano, że ".concat(issue2.origin ?? "wartość", " będzie wynosić ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Za mała wartość: oczekiwano, że ".concat(issue2.origin ?? "wartość", " będzie mieć ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit ?? "elementów");
            }
            return "Zbyt mał(y/a/e): oczekiwano, że ".concat(issue2.origin ?? "wartość", " będzie wynosić ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Nieprawidłowy ciąg znaków: musi zaczynać się od "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Nieprawidłowy ciąg znaków: musi kończyć się na "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Nieprawidłowy ciąg znaków: musi zawierać "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Nieprawidłowy ciąg znaków: musi odpowiadać wzorcowi ".concat(_issue.pattern);
            return "Nieprawidłow(y/a/e) ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Nieprawidłowa liczba: musi być wielokrotnością ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Nierozpoznane klucze".concat(issue2.keys.length > 1 ? "s" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Nieprawidłowy klucz w ".concat(issue2.origin);
          case "invalid_union":
            return "Nieprawidłowe dane wejściowe";
          case "invalid_element":
            return "Nieprawidłowa wartość w ".concat(issue2.origin);
          default:
            return "Nieprawidłowe dane wejściowe";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/pt.js
function pt_default() {
  return {
    localeError: error36()
  };
}
var error36;
var init_pt = __esm({
  "node_modules/zod/v4/locales/pt.js"() {
    init_util();
    error36 = () => {
      const Sizable = {
        string: { unit: "caracteres", verb: "ter" },
        file: { unit: "bytes", verb: "ter" },
        array: { unit: "itens", verb: "ter" },
        set: { unit: "itens", verb: "ter" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "padrão",
        email: "endereço de e-mail",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data e hora ISO",
        date: "data ISO",
        time: "hora ISO",
        duration: "duração ISO",
        ipv4: "endereço IPv4",
        ipv6: "endereço IPv6",
        cidrv4: "faixa de IPv4",
        cidrv6: "faixa de IPv6",
        base64: "texto codificado em base64",
        base64url: "URL codificada em base64",
        json_string: "texto JSON",
        e164: "número E.164",
        jwt: "JWT",
        template_literal: "entrada"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "número",
        null: "nulo"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Tipo inválido: esperado instanceof ".concat(issue2.expected, ", recebido ").concat(received);
            }
            return "Tipo inválido: esperado ".concat(expected, ", recebido ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Entrada inválida: esperado ".concat(stringifyPrimitive(issue2.values[0]));
            return "Opção inválida: esperada uma das ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Muito grande: esperado que ".concat(issue2.origin ?? "valor", " tivesse ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elementos");
            return "Muito grande: esperado que ".concat(issue2.origin ?? "valor", " fosse ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Muito pequeno: esperado que ".concat(issue2.origin, " tivesse ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Muito pequeno: esperado que ".concat(issue2.origin, " fosse ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Texto inválido: deve começar com "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Texto inválido: deve terminar com "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Texto inválido: deve incluir "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Texto inválido: deve corresponder ao padrão ".concat(_issue.pattern);
            return "".concat(FormatDictionary[_issue.format] ?? issue2.format, " inválido");
          }
          case "not_multiple_of":
            return "Número inválido: deve ser múltiplo de ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Chave".concat(issue2.keys.length > 1 ? "s" : "", " desconhecida").concat(issue2.keys.length > 1 ? "s" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Chave inválida em ".concat(issue2.origin);
          case "invalid_union":
            return "Entrada inválida";
          case "invalid_element":
            return "Valor inválido em ".concat(issue2.origin);
          default:
            return "Campo inválido";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/ro.js
function ro_default() {
  return {
    localeError: error37()
  };
}
var error37;
var init_ro = __esm({
  "node_modules/zod/v4/locales/ro.js"() {
    init_util();
    error37 = () => {
      const Sizable = {
        string: { unit: "caractere", verb: "să aibă" },
        file: { unit: "octeți", verb: "să aibă" },
        array: { unit: "elemente", verb: "să aibă" },
        set: { unit: "elemente", verb: "să aibă" },
        map: { unit: "intrări", verb: "să aibă" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "intrare",
        email: "adresă de email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "dată și oră ISO",
        date: "dată ISO",
        time: "oră ISO",
        duration: "durată ISO",
        ipv4: "adresă IPv4",
        ipv6: "adresă IPv6",
        mac: "adresă MAC",
        cidrv4: "interval IPv4",
        cidrv6: "interval IPv6",
        base64: "șir codat base64",
        base64url: "șir codat base64url",
        json_string: "șir JSON",
        e164: "număr E.164",
        jwt: "JWT",
        template_literal: "intrare"
      };
      const TypeDictionary = {
        nan: "NaN",
        string: "șir",
        number: "număr",
        boolean: "boolean",
        function: "funcție",
        array: "matrice",
        object: "obiect",
        undefined: "nedefinit",
        symbol: "simbol",
        bigint: "număr mare",
        void: "void",
        never: "never",
        map: "hartă",
        set: "set"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            return "Intrare invalidă: așteptat ".concat(expected, ", primit ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Intrare invalidă: așteptat ".concat(stringifyPrimitive(issue2.values[0]));
            return "Opțiune invalidă: așteptat una dintre ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Prea mare: așteptat ca ".concat(issue2.origin ?? "valoarea", " ").concat(sizing.verb, " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elemente");
            return "Prea mare: așteptat ca ".concat(issue2.origin ?? "valoarea", " să fie ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Prea mic: așteptat ca ".concat(issue2.origin, " ").concat(sizing.verb, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Prea mic: așteptat ca ".concat(issue2.origin, " să fie ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Șir invalid: trebuie să înceapă cu "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'Șir invalid: trebuie să se termine cu "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Șir invalid: trebuie să includă "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Șir invalid: trebuie să se potrivească cu modelul ".concat(_issue.pattern);
            return "Format invalid: ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Număr invalid: trebuie să fie multiplu de ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Chei nerecunoscute: ".concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Cheie invalidă în ".concat(issue2.origin);
          case "invalid_union":
            return "Intrare invalidă";
          case "invalid_element":
            return "Valoare invalidă în ".concat(issue2.origin);
          default:
            return "Intrare invalidă";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/ru.js
function getRussianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
function ru_default() {
  return {
    localeError: error38()
  };
}
var error38;
var init_ru = __esm({
  "node_modules/zod/v4/locales/ru.js"() {
    init_util();
    error38 = () => {
      const Sizable = {
        string: {
          unit: {
            one: "символ",
            few: "символа",
            many: "символов"
          },
          verb: "иметь"
        },
        file: {
          unit: {
            one: "байт",
            few: "байта",
            many: "байт"
          },
          verb: "иметь"
        },
        array: {
          unit: {
            one: "элемент",
            few: "элемента",
            many: "элементов"
          },
          verb: "иметь"
        },
        set: {
          unit: {
            one: "элемент",
            few: "элемента",
            many: "элементов"
          },
          verb: "иметь"
        }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "ввод",
        email: "email адрес",
        url: "URL",
        emoji: "эмодзи",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO дата и время",
        date: "ISO дата",
        time: "ISO время",
        duration: "ISO длительность",
        ipv4: "IPv4 адрес",
        ipv6: "IPv6 адрес",
        cidrv4: "IPv4 диапазон",
        cidrv6: "IPv6 диапазон",
        base64: "строка в формате base64",
        base64url: "строка в формате base64url",
        json_string: "JSON строка",
        e164: "номер E.164",
        jwt: "JWT",
        template_literal: "ввод"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "число",
        array: "массив"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Неверный ввод: ожидалось instanceof ".concat(issue2.expected, ", получено ").concat(received);
            }
            return "Неверный ввод: ожидалось ".concat(expected, ", получено ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Неверный ввод: ожидалось ".concat(stringifyPrimitive(issue2.values[0]));
            return "Неверный вариант: ожидалось одно из ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              const maxValue = Number(issue2.maximum);
              const unit = getRussianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return "Слишком большое значение: ожидалось, что ".concat(issue2.origin ?? "значение", " будет иметь ").concat(adj).concat(issue2.maximum.toString(), " ").concat(unit);
            }
            return "Слишком большое значение: ожидалось, что ".concat(issue2.origin ?? "значение", " будет ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              const minValue = Number(issue2.minimum);
              const unit = getRussianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return "Слишком маленькое значение: ожидалось, что ".concat(issue2.origin, " будет иметь ").concat(adj).concat(issue2.minimum.toString(), " ").concat(unit);
            }
            return "Слишком маленькое значение: ожидалось, что ".concat(issue2.origin, " будет ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Неверная строка: должна начинаться с "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Неверная строка: должна заканчиваться на "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Неверная строка: должна содержать "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Неверная строка: должна соответствовать шаблону ".concat(_issue.pattern);
            return "Неверный ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Неверное число: должно быть кратным ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Нераспознанн".concat(issue2.keys.length > 1 ? "ые" : "ый", " ключ").concat(issue2.keys.length > 1 ? "и" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Неверный ключ в ".concat(issue2.origin);
          case "invalid_union":
            return "Неверные входные данные";
          case "invalid_element":
            return "Неверное значение в ".concat(issue2.origin);
          default:
            return "Неверные входные данные";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/sl.js
function sl_default() {
  return {
    localeError: error39()
  };
}
var error39;
var init_sl = __esm({
  "node_modules/zod/v4/locales/sl.js"() {
    init_util();
    error39 = () => {
      const Sizable = {
        string: { unit: "znakov", verb: "imeti" },
        file: { unit: "bajtov", verb: "imeti" },
        array: { unit: "elementov", verb: "imeti" },
        set: { unit: "elementov", verb: "imeti" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "vnos",
        email: "e-poštni naslov",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datum in čas",
        date: "ISO datum",
        time: "ISO čas",
        duration: "ISO trajanje",
        ipv4: "IPv4 naslov",
        ipv6: "IPv6 naslov",
        cidrv4: "obseg IPv4",
        cidrv6: "obseg IPv6",
        base64: "base64 kodiran niz",
        base64url: "base64url kodiran niz",
        json_string: "JSON niz",
        e164: "E.164 številka",
        jwt: "JWT",
        template_literal: "vnos"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "število",
        array: "tabela"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Neveljaven vnos: pričakovano instanceof ".concat(issue2.expected, ", prejeto ").concat(received);
            }
            return "Neveljaven vnos: pričakovano ".concat(expected, ", prejeto ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Neveljaven vnos: pričakovano ".concat(stringifyPrimitive(issue2.values[0]));
            return "Neveljavna možnost: pričakovano eno izmed ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Preveliko: pričakovano, da bo ".concat(issue2.origin ?? "vrednost", " imelo ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "elementov");
            return "Preveliko: pričakovano, da bo ".concat(issue2.origin ?? "vrednost", " ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Premajhno: pričakovano, da bo ".concat(issue2.origin, " imelo ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Premajhno: pričakovano, da bo ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Neveljaven niz: mora se začeti z "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'Neveljaven niz: mora se končati z "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Neveljaven niz: mora vsebovati "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Neveljaven niz: mora ustrezati vzorcu ".concat(_issue.pattern);
            return "Neveljaven ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Neveljavno število: mora biti večkratnik ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Neprepoznan".concat(issue2.keys.length > 1 ? "i ključi" : " ključ", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Neveljaven ključ v ".concat(issue2.origin);
          case "invalid_union":
            return "Neveljaven vnos";
          case "invalid_element":
            return "Neveljavna vrednost v ".concat(issue2.origin);
          default:
            return "Neveljaven vnos";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/sv.js
function sv_default() {
  return {
    localeError: error40()
  };
}
var error40;
var init_sv = __esm({
  "node_modules/zod/v4/locales/sv.js"() {
    init_util();
    error40 = () => {
      const Sizable = {
        string: { unit: "tecken", verb: "att ha" },
        file: { unit: "bytes", verb: "att ha" },
        array: { unit: "objekt", verb: "att innehålla" },
        set: { unit: "objekt", verb: "att innehålla" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "reguljärt uttryck",
        email: "e-postadress",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-datum och tid",
        date: "ISO-datum",
        time: "ISO-tid",
        duration: "ISO-varaktighet",
        ipv4: "IPv4-intervall",
        ipv6: "IPv6-intervall",
        cidrv4: "IPv4-spektrum",
        cidrv6: "IPv6-spektrum",
        base64: "base64-kodad sträng",
        base64url: "base64url-kodad sträng",
        json_string: "JSON-sträng",
        e164: "E.164-nummer",
        jwt: "JWT",
        template_literal: "mall-literal"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "antal",
        array: "lista"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Ogiltig inmatning: förväntat instanceof ".concat(issue2.expected, ", fick ").concat(received);
            }
            return "Ogiltig inmatning: förväntat ".concat(expected, ", fick ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Ogiltig inmatning: förväntat ".concat(stringifyPrimitive(issue2.values[0]));
            return "Ogiltigt val: förväntade en av ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "För stor(t): förväntade ".concat(issue2.origin ?? "värdet", " att ha ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "element");
            }
            return "För stor(t): förväntat ".concat(issue2.origin ?? "värdet", " att ha ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "För lite(t): förväntade ".concat(issue2.origin ?? "värdet", " att ha ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "För lite(t): förväntade ".concat(issue2.origin ?? "värdet", " att ha ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'Ogiltig sträng: måste börja med "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'Ogiltig sträng: måste sluta med "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Ogiltig sträng: måste innehålla "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return 'Ogiltig sträng: måste matcha mönstret "'.concat(_issue.pattern, '"');
            return "Ogiltig(t) ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Ogiltigt tal: måste vara en multipel av ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "".concat(issue2.keys.length > 1 ? "Okända nycklar" : "Okänd nyckel", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Ogiltig nyckel i ".concat(issue2.origin ?? "värdet");
          case "invalid_union":
            return "Ogiltig input";
          case "invalid_element":
            return "Ogiltigt värde i ".concat(issue2.origin ?? "värdet");
          default:
            return "Ogiltig input";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/ta.js
function ta_default() {
  return {
    localeError: error41()
  };
}
var error41;
var init_ta = __esm({
  "node_modules/zod/v4/locales/ta.js"() {
    init_util();
    error41 = () => {
      const Sizable = {
        string: { unit: "எழுத்துக்கள்", verb: "கொண்டிருக்க வேண்டும்" },
        file: { unit: "பைட்டுகள்", verb: "கொண்டிருக்க வேண்டும்" },
        array: { unit: "உறுப்புகள்", verb: "கொண்டிருக்க வேண்டும்" },
        set: { unit: "உறுப்புகள்", verb: "கொண்டிருக்க வேண்டும்" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "உள்ளீடு",
        email: "மின்னஞ்சல் முகவரி",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO தேதி நேரம்",
        date: "ISO தேதி",
        time: "ISO நேரம்",
        duration: "ISO கால அளவு",
        ipv4: "IPv4 முகவரி",
        ipv6: "IPv6 முகவரி",
        cidrv4: "IPv4 வரம்பு",
        cidrv6: "IPv6 வரம்பு",
        base64: "base64-encoded சரம்",
        base64url: "base64url-encoded சரம்",
        json_string: "JSON சரம்",
        e164: "E.164 எண்",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "எண்",
        array: "அணி",
        null: "வெறுமை"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "தவறான உள்ளீடு: எதிர்பார்க்கப்பட்டது instanceof ".concat(issue2.expected, ", பெறப்பட்டது ").concat(received);
            }
            return "தவறான உள்ளீடு: எதிர்பார்க்கப்பட்டது ".concat(expected, ", பெறப்பட்டது ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "தவறான உள்ளீடு: எதிர்பார்க்கப்பட்டது ".concat(stringifyPrimitive(issue2.values[0]));
            return "தவறான விருப்பம்: எதிர்பார்க்கப்பட்டது ".concat(joinValues(issue2.values, "|"), " இல் ஒன்று");
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "மிக பெரியது: எதிர்பார்க்கப்பட்டது ".concat(issue2.origin ?? "மதிப்பு", " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "உறுப்புகள்", " ஆக இருக்க வேண்டும்");
            }
            return "மிக பெரியது: எதிர்பார்க்கப்பட்டது ".concat(issue2.origin ?? "மதிப்பு", " ").concat(adj).concat(issue2.maximum.toString(), " ஆக இருக்க வேண்டும்");
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "மிகச் சிறியது: எதிர்பார்க்கப்பட்டது ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit, " ஆக இருக்க வேண்டும்");
            }
            return "மிகச் சிறியது: எதிர்பார்க்கப்பட்டது ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString(), " ஆக இருக்க வேண்டும்");
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'தவறான சரம்: "'.concat(_issue.prefix, '" இல் தொடங்க வேண்டும்');
            if (_issue.format === "ends_with")
              return 'தவறான சரம்: "'.concat(_issue.suffix, '" இல் முடிவடைய வேண்டும்');
            if (_issue.format === "includes")
              return 'தவறான சரம்: "'.concat(_issue.includes, '" ஐ உள்ளடக்க வேண்டும்');
            if (_issue.format === "regex")
              return "தவறான சரம்: ".concat(_issue.pattern, " முறைபாட்டுடன் பொருந்த வேண்டும்");
            return "தவறான ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "தவறான எண்: ".concat(issue2.divisor, " இன் பலமாக இருக்க வேண்டும்");
          case "unrecognized_keys":
            return "அடையாளம் தெரியாத விசை".concat(issue2.keys.length > 1 ? "கள்" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "".concat(issue2.origin, " இல் தவறான விசை");
          case "invalid_union":
            return "தவறான உள்ளீடு";
          case "invalid_element":
            return "".concat(issue2.origin, " இல் தவறான மதிப்பு");
          default:
            return "தவறான உள்ளீடு";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/th.js
function th_default() {
  return {
    localeError: error42()
  };
}
var error42;
var init_th = __esm({
  "node_modules/zod/v4/locales/th.js"() {
    init_util();
    error42 = () => {
      const Sizable = {
        string: { unit: "ตัวอักษร", verb: "ควรมี" },
        file: { unit: "ไบต์", verb: "ควรมี" },
        array: { unit: "รายการ", verb: "ควรมี" },
        set: { unit: "รายการ", verb: "ควรมี" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "ข้อมูลที่ป้อน",
        email: "ที่อยู่อีเมล",
        url: "URL",
        emoji: "อิโมจิ",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "วันที่เวลาแบบ ISO",
        date: "วันที่แบบ ISO",
        time: "เวลาแบบ ISO",
        duration: "ช่วงเวลาแบบ ISO",
        ipv4: "ที่อยู่ IPv4",
        ipv6: "ที่อยู่ IPv6",
        cidrv4: "ช่วง IP แบบ IPv4",
        cidrv6: "ช่วง IP แบบ IPv6",
        base64: "ข้อความแบบ Base64",
        base64url: "ข้อความแบบ Base64 สำหรับ URL",
        json_string: "ข้อความแบบ JSON",
        e164: "เบอร์โทรศัพท์ระหว่างประเทศ (E.164)",
        jwt: "โทเคน JWT",
        template_literal: "ข้อมูลที่ป้อน"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "ตัวเลข",
        array: "อาร์เรย์ (Array)",
        null: "ไม่มีค่า (null)"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "ประเภทข้อมูลไม่ถูกต้อง: ควรเป็น instanceof ".concat(issue2.expected, " แต่ได้รับ ").concat(received);
            }
            return "ประเภทข้อมูลไม่ถูกต้อง: ควรเป็น ".concat(expected, " แต่ได้รับ ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "ค่าไม่ถูกต้อง: ควรเป็น ".concat(stringifyPrimitive(issue2.values[0]));
            return "ตัวเลือกไม่ถูกต้อง: ควรเป็นหนึ่งใน ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "ไม่เกิน" : "น้อยกว่า";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "เกินกำหนด: ".concat(issue2.origin ?? "ค่า", " ควรมี").concat(adj, " ").concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "รายการ");
            return "เกินกำหนด: ".concat(issue2.origin ?? "ค่า", " ควรมี").concat(adj, " ").concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? "อย่างน้อย" : "มากกว่า";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "น้อยกว่ากำหนด: ".concat(issue2.origin, " ควรมี").concat(adj, " ").concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "น้อยกว่ากำหนด: ".concat(issue2.origin, " ควรมี").concat(adj, " ").concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'รูปแบบไม่ถูกต้อง: ข้อความต้องขึ้นต้นด้วย "'.concat(_issue.prefix, '"');
            }
            if (_issue.format === "ends_with")
              return 'รูปแบบไม่ถูกต้อง: ข้อความต้องลงท้ายด้วย "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'รูปแบบไม่ถูกต้อง: ข้อความต้องมี "'.concat(_issue.includes, '" อยู่ในข้อความ');
            if (_issue.format === "regex")
              return "รูปแบบไม่ถูกต้อง: ต้องตรงกับรูปแบบที่กำหนด ".concat(_issue.pattern);
            return "รูปแบบไม่ถูกต้อง: ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "ตัวเลขไม่ถูกต้อง: ต้องเป็นจำนวนที่หารด้วย ".concat(issue2.divisor, " ได้ลงตัว");
          case "unrecognized_keys":
            return "พบคีย์ที่ไม่รู้จัก: ".concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "คีย์ไม่ถูกต้องใน ".concat(issue2.origin);
          case "invalid_union":
            return "ข้อมูลไม่ถูกต้อง: ไม่ตรงกับรูปแบบยูเนียนที่กำหนดไว้";
          case "invalid_element":
            return "ข้อมูลไม่ถูกต้องใน ".concat(issue2.origin);
          default:
            return "ข้อมูลไม่ถูกต้อง";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/tr.js
function tr_default() {
  return {
    localeError: error43()
  };
}
var error43;
var init_tr = __esm({
  "node_modules/zod/v4/locales/tr.js"() {
    init_util();
    error43 = () => {
      const Sizable = {
        string: { unit: "karakter", verb: "olmalı" },
        file: { unit: "bayt", verb: "olmalı" },
        array: { unit: "öğe", verb: "olmalı" },
        set: { unit: "öğe", verb: "olmalı" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "girdi",
        email: "e-posta adresi",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO tarih ve saat",
        date: "ISO tarih",
        time: "ISO saat",
        duration: "ISO süre",
        ipv4: "IPv4 adresi",
        ipv6: "IPv6 adresi",
        cidrv4: "IPv4 aralığı",
        cidrv6: "IPv6 aralığı",
        base64: "base64 ile şifrelenmiş metin",
        base64url: "base64url ile şifrelenmiş metin",
        json_string: "JSON dizesi",
        e164: "E.164 sayısı",
        jwt: "JWT",
        template_literal: "Şablon dizesi"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Geçersiz değer: beklenen instanceof ".concat(issue2.expected, ", alınan ").concat(received);
            }
            return "Geçersiz değer: beklenen ".concat(expected, ", alınan ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Geçersiz değer: beklenen ".concat(stringifyPrimitive(issue2.values[0]));
            return "Geçersiz seçenek: aşağıdakilerden biri olmalı: ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Çok büyük: beklenen ".concat(issue2.origin ?? "değer", " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "öğe");
            return "Çok büyük: beklenen ".concat(issue2.origin ?? "değer", " ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Çok küçük: beklenen ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            return "Çok küçük: beklenen ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Geçersiz metin: "'.concat(_issue.prefix, '" ile başlamalı');
            if (_issue.format === "ends_with")
              return 'Geçersiz metin: "'.concat(_issue.suffix, '" ile bitmeli');
            if (_issue.format === "includes")
              return 'Geçersiz metin: "'.concat(_issue.includes, '" içermeli');
            if (_issue.format === "regex")
              return "Geçersiz metin: ".concat(_issue.pattern, " desenine uymalı");
            return "Geçersiz ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Geçersiz sayı: ".concat(issue2.divisor, " ile tam bölünebilmeli");
          case "unrecognized_keys":
            return "Tanınmayan anahtar".concat(issue2.keys.length > 1 ? "lar" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "".concat(issue2.origin, " içinde geçersiz anahtar");
          case "invalid_union":
            return "Geçersiz değer";
          case "invalid_element":
            return "".concat(issue2.origin, " içinde geçersiz değer");
          default:
            return "Geçersiz değer";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/uk.js
function uk_default() {
  return {
    localeError: error44()
  };
}
var error44;
var init_uk = __esm({
  "node_modules/zod/v4/locales/uk.js"() {
    init_util();
    error44 = () => {
      const Sizable = {
        string: { unit: "символів", verb: "матиме" },
        file: { unit: "байтів", verb: "матиме" },
        array: { unit: "елементів", verb: "матиме" },
        set: { unit: "елементів", verb: "матиме" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "вхідні дані",
        email: "адреса електронної пошти",
        url: "URL",
        emoji: "емодзі",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "дата та час ISO",
        date: "дата ISO",
        time: "час ISO",
        duration: "тривалість ISO",
        ipv4: "адреса IPv4",
        ipv6: "адреса IPv6",
        cidrv4: "діапазон IPv4",
        cidrv6: "діапазон IPv6",
        base64: "рядок у кодуванні base64",
        base64url: "рядок у кодуванні base64url",
        json_string: "рядок JSON",
        e164: "номер E.164",
        jwt: "JWT",
        template_literal: "вхідні дані"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "число",
        array: "масив"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Неправильні вхідні дані: очікується instanceof ".concat(issue2.expected, ", отримано ").concat(received);
            }
            return "Неправильні вхідні дані: очікується ".concat(expected, ", отримано ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Неправильні вхідні дані: очікується ".concat(stringifyPrimitive(issue2.values[0]));
            return "Неправильна опція: очікується одне з ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Занадто велике: очікується, що ".concat(issue2.origin ?? "значення", " ").concat(sizing.verb, " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "елементів");
            return "Занадто велике: очікується, що ".concat(issue2.origin ?? "значення", " буде ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Занадто мале: очікується, що ".concat(issue2.origin, " ").concat(sizing.verb, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Занадто мале: очікується, що ".concat(issue2.origin, " буде ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Неправильний рядок: повинен починатися з "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Неправильний рядок: повинен закінчуватися на "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Неправильний рядок: повинен містити "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Неправильний рядок: повинен відповідати шаблону ".concat(_issue.pattern);
            return "Неправильний ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Неправильне число: повинно бути кратним ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Нерозпізнаний ключ".concat(issue2.keys.length > 1 ? "і" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Неправильний ключ у ".concat(issue2.origin);
          case "invalid_union":
            return "Неправильні вхідні дані";
          case "invalid_element":
            return "Неправильне значення у ".concat(issue2.origin);
          default:
            return "Неправильні вхідні дані";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/ua.js
function ua_default() {
  return uk_default();
}
var init_ua = __esm({
  "node_modules/zod/v4/locales/ua.js"() {
    init_uk();
  }
});

// node_modules/zod/v4/locales/ur.js
function ur_default() {
  return {
    localeError: error45()
  };
}
var error45;
var init_ur = __esm({
  "node_modules/zod/v4/locales/ur.js"() {
    init_util();
    error45 = () => {
      const Sizable = {
        string: { unit: "حروف", verb: "ہونا" },
        file: { unit: "بائٹس", verb: "ہونا" },
        array: { unit: "آئٹمز", verb: "ہونا" },
        set: { unit: "آئٹمز", verb: "ہونا" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "ان پٹ",
        email: "ای میل ایڈریس",
        url: "یو آر ایل",
        emoji: "ایموجی",
        uuid: "یو یو آئی ڈی",
        uuidv4: "یو یو آئی ڈی وی 4",
        uuidv6: "یو یو آئی ڈی وی 6",
        nanoid: "نینو آئی ڈی",
        guid: "جی یو آئی ڈی",
        cuid: "سی یو آئی ڈی",
        cuid2: "سی یو آئی ڈی 2",
        ulid: "یو ایل آئی ڈی",
        xid: "ایکس آئی ڈی",
        ksuid: "کے ایس یو آئی ڈی",
        datetime: "آئی ایس او ڈیٹ ٹائم",
        date: "آئی ایس او تاریخ",
        time: "آئی ایس او وقت",
        duration: "آئی ایس او مدت",
        ipv4: "آئی پی وی 4 ایڈریس",
        ipv6: "آئی پی وی 6 ایڈریس",
        cidrv4: "آئی پی وی 4 رینج",
        cidrv6: "آئی پی وی 6 رینج",
        base64: "بیس 64 ان کوڈڈ سٹرنگ",
        base64url: "بیس 64 یو آر ایل ان کوڈڈ سٹرنگ",
        json_string: "جے ایس او این سٹرنگ",
        e164: "ای 164 نمبر",
        jwt: "جے ڈبلیو ٹی",
        template_literal: "ان پٹ"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "نمبر",
        array: "آرے",
        null: "نل"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "غلط ان پٹ: instanceof ".concat(issue2.expected, " متوقع تھا، ").concat(received, " موصول ہوا");
            }
            return "غلط ان پٹ: ".concat(expected, " متوقع تھا، ").concat(received, " موصول ہوا");
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "غلط ان پٹ: ".concat(stringifyPrimitive(issue2.values[0]), " متوقع تھا");
            return "غلط آپشن: ".concat(joinValues(issue2.values, "|"), " میں سے ایک متوقع تھا");
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "بہت بڑا: ".concat(issue2.origin ?? "ویلیو", " کے ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "عناصر", " ہونے متوقع تھے");
            return "بہت بڑا: ".concat(issue2.origin ?? "ویلیو", " کا ").concat(adj).concat(issue2.maximum.toString(), " ہونا متوقع تھا");
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "بہت چھوٹا: ".concat(issue2.origin, " کے ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit, " ہونے متوقع تھے");
            }
            return "بہت چھوٹا: ".concat(issue2.origin, " کا ").concat(adj).concat(issue2.minimum.toString(), " ہونا متوقع تھا");
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return 'غلط سٹرنگ: "'.concat(_issue.prefix, '" سے شروع ہونا چاہیے');
            }
            if (_issue.format === "ends_with")
              return 'غلط سٹرنگ: "'.concat(_issue.suffix, '" پر ختم ہونا چاہیے');
            if (_issue.format === "includes")
              return 'غلط سٹرنگ: "'.concat(_issue.includes, '" شامل ہونا چاہیے');
            if (_issue.format === "regex")
              return "غلط سٹرنگ: پیٹرن ".concat(_issue.pattern, " سے میچ ہونا چاہیے");
            return "غلط ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "غلط نمبر: ".concat(issue2.divisor, " کا مضاعف ہونا چاہیے");
          case "unrecognized_keys":
            return "غیر تسلیم شدہ کی".concat(issue2.keys.length > 1 ? "ز" : "", ": ").concat(joinValues(issue2.keys, "، "));
          case "invalid_key":
            return "".concat(issue2.origin, " میں غلط کی");
          case "invalid_union":
            return "غلط ان پٹ";
          case "invalid_element":
            return "".concat(issue2.origin, " میں غلط ویلیو");
          default:
            return "غلط ان پٹ";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/uz.js
function uz_default() {
  return {
    localeError: error46()
  };
}
var error46;
var init_uz = __esm({
  "node_modules/zod/v4/locales/uz.js"() {
    init_util();
    error46 = () => {
      const Sizable = {
        string: { unit: "belgi", verb: "bo‘lishi kerak" },
        file: { unit: "bayt", verb: "bo‘lishi kerak" },
        array: { unit: "element", verb: "bo‘lishi kerak" },
        set: { unit: "element", verb: "bo‘lishi kerak" },
        map: { unit: "yozuv", verb: "bo‘lishi kerak" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "kirish",
        email: "elektron pochta manzili",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO sana va vaqti",
        date: "ISO sana",
        time: "ISO vaqt",
        duration: "ISO davomiylik",
        ipv4: "IPv4 manzil",
        ipv6: "IPv6 manzil",
        mac: "MAC manzil",
        cidrv4: "IPv4 diapazon",
        cidrv6: "IPv6 diapazon",
        base64: "base64 kodlangan satr",
        base64url: "base64url kodlangan satr",
        json_string: "JSON satr",
        e164: "E.164 raqam",
        jwt: "JWT",
        template_literal: "kirish"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "raqam",
        array: "massiv"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Noto‘g‘ri kirish: kutilgan instanceof ".concat(issue2.expected, ", qabul qilingan ").concat(received);
            }
            return "Noto‘g‘ri kirish: kutilgan ".concat(expected, ", qabul qilingan ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Noto‘g‘ri kirish: kutilgan ".concat(stringifyPrimitive(issue2.values[0]));
            return "Noto‘g‘ri variant: quyidagilardan biri kutilgan ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Juda katta: kutilgan ".concat(issue2.origin ?? "qiymat", " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit, " ").concat(sizing.verb);
            return "Juda katta: kutilgan ".concat(issue2.origin ?? "qiymat", " ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Juda kichik: kutilgan ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit, " ").concat(sizing.verb);
            }
            return "Juda kichik: kutilgan ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Noto‘g‘ri satr: "'.concat(_issue.prefix, '" bilan boshlanishi kerak');
            if (_issue.format === "ends_with")
              return 'Noto‘g‘ri satr: "'.concat(_issue.suffix, '" bilan tugashi kerak');
            if (_issue.format === "includes")
              return 'Noto‘g‘ri satr: "'.concat(_issue.includes, '" ni o‘z ichiga olishi kerak');
            if (_issue.format === "regex")
              return "Noto‘g‘ri satr: ".concat(_issue.pattern, " shabloniga mos kelishi kerak");
            return "Noto‘g‘ri ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Noto‘g‘ri raqam: ".concat(issue2.divisor, " ning karralisi bo‘lishi kerak");
          case "unrecognized_keys":
            return "Noma’lum kalit".concat(issue2.keys.length > 1 ? "lar" : "", ": ").concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "".concat(issue2.origin, " dagi kalit noto‘g‘ri");
          case "invalid_union":
            return "Noto‘g‘ri kirish";
          case "invalid_element":
            return "".concat(issue2.origin, " da noto‘g‘ri qiymat");
          default:
            return "Noto‘g‘ri kirish";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/vi.js
function vi_default() {
  return {
    localeError: error47()
  };
}
var error47;
var init_vi = __esm({
  "node_modules/zod/v4/locales/vi.js"() {
    init_util();
    error47 = () => {
      const Sizable = {
        string: { unit: "ký tự", verb: "có" },
        file: { unit: "byte", verb: "có" },
        array: { unit: "phần tử", verb: "có" },
        set: { unit: "phần tử", verb: "có" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "đầu vào",
        email: "địa chỉ email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ngày giờ ISO",
        date: "ngày ISO",
        time: "giờ ISO",
        duration: "khoảng thời gian ISO",
        ipv4: "địa chỉ IPv4",
        ipv6: "địa chỉ IPv6",
        cidrv4: "dải IPv4",
        cidrv6: "dải IPv6",
        base64: "chuỗi mã hóa base64",
        base64url: "chuỗi mã hóa base64url",
        json_string: "chuỗi JSON",
        e164: "số E.164",
        jwt: "JWT",
        template_literal: "đầu vào"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "số",
        array: "mảng"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Đầu vào không hợp lệ: mong đợi instanceof ".concat(issue2.expected, ", nhận được ").concat(received);
            }
            return "Đầu vào không hợp lệ: mong đợi ".concat(expected, ", nhận được ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Đầu vào không hợp lệ: mong đợi ".concat(stringifyPrimitive(issue2.values[0]));
            return "Tùy chọn không hợp lệ: mong đợi một trong các giá trị ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Quá lớn: mong đợi ".concat(issue2.origin ?? "giá trị", " ").concat(sizing.verb, " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "phần tử");
            return "Quá lớn: mong đợi ".concat(issue2.origin ?? "giá trị", " ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "Quá nhỏ: mong đợi ".concat(issue2.origin, " ").concat(sizing.verb, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "Quá nhỏ: mong đợi ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Chuỗi không hợp lệ: phải bắt đầu bằng "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Chuỗi không hợp lệ: phải kết thúc bằng "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Chuỗi không hợp lệ: phải bao gồm "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Chuỗi không hợp lệ: phải khớp với mẫu ".concat(_issue.pattern);
            return "".concat(FormatDictionary[_issue.format] ?? issue2.format, " không hợp lệ");
          }
          case "not_multiple_of":
            return "Số không hợp lệ: phải là bội số của ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Khóa không được nhận dạng: ".concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Khóa không hợp lệ trong ".concat(issue2.origin);
          case "invalid_union":
            return "Đầu vào không hợp lệ";
          case "invalid_element":
            return "Giá trị không hợp lệ trong ".concat(issue2.origin);
          default:
            return "Đầu vào không hợp lệ";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/zh-CN.js
function zh_CN_default() {
  return {
    localeError: error48()
  };
}
var error48;
var init_zh_CN = __esm({
  "node_modules/zod/v4/locales/zh-CN.js"() {
    init_util();
    error48 = () => {
      const Sizable = {
        string: { unit: "字符", verb: "包含" },
        file: { unit: "字节", verb: "包含" },
        array: { unit: "项", verb: "包含" },
        set: { unit: "项", verb: "包含" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "输入",
        email: "电子邮件",
        url: "URL",
        emoji: "表情符号",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO日期时间",
        date: "ISO日期",
        time: "ISO时间",
        duration: "ISO时长",
        ipv4: "IPv4地址",
        ipv6: "IPv6地址",
        cidrv4: "IPv4网段",
        cidrv6: "IPv6网段",
        base64: "base64编码字符串",
        base64url: "base64url编码字符串",
        json_string: "JSON字符串",
        e164: "E.164号码",
        jwt: "JWT",
        template_literal: "输入"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "数字",
        array: "数组",
        null: "空值(null)"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "无效输入：期望 instanceof ".concat(issue2.expected, "，实际接收 ").concat(received);
            }
            return "无效输入：期望 ".concat(expected, "，实际接收 ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "无效输入：期望 ".concat(stringifyPrimitive(issue2.values[0]));
            return "无效选项：期望以下之一 ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "数值过大：期望 ".concat(issue2.origin ?? "值", " ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "个元素");
            return "数值过大：期望 ".concat(issue2.origin ?? "值", " ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "数值过小：期望 ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "数值过小：期望 ".concat(issue2.origin, " ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return '无效字符串：必须以 "'.concat(_issue.prefix, '" 开头');
            if (_issue.format === "ends_with")
              return '无效字符串：必须以 "'.concat(_issue.suffix, '" 结尾');
            if (_issue.format === "includes")
              return '无效字符串：必须包含 "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "无效字符串：必须满足正则表达式 ".concat(_issue.pattern);
            return "无效".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "无效数字：必须是 ".concat(issue2.divisor, " 的倍数");
          case "unrecognized_keys":
            return "出现未知的键(key): ".concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "".concat(issue2.origin, " 中的键(key)无效");
          case "invalid_union":
            return "无效输入";
          case "invalid_element":
            return "".concat(issue2.origin, " 中包含无效值(value)");
          default:
            return "无效输入";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/zh-TW.js
function zh_TW_default() {
  return {
    localeError: error49()
  };
}
var error49;
var init_zh_TW = __esm({
  "node_modules/zod/v4/locales/zh-TW.js"() {
    init_util();
    error49 = () => {
      const Sizable = {
        string: { unit: "字元", verb: "擁有" },
        file: { unit: "位元組", verb: "擁有" },
        array: { unit: "項目", verb: "擁有" },
        set: { unit: "項目", verb: "擁有" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "輸入",
        email: "郵件地址",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO 日期時間",
        date: "ISO 日期",
        time: "ISO 時間",
        duration: "ISO 期間",
        ipv4: "IPv4 位址",
        ipv6: "IPv6 位址",
        cidrv4: "IPv4 範圍",
        cidrv6: "IPv6 範圍",
        base64: "base64 編碼字串",
        base64url: "base64url 編碼字串",
        json_string: "JSON 字串",
        e164: "E.164 數值",
        jwt: "JWT",
        template_literal: "輸入"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "無效的輸入值：預期為 instanceof ".concat(issue2.expected, "，但收到 ").concat(received);
            }
            return "無效的輸入值：預期為 ".concat(expected, "，但收到 ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "無效的輸入值：預期為 ".concat(stringifyPrimitive(issue2.values[0]));
            return "無效的選項：預期為以下其中之一 ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "數值過大：預期 ".concat(issue2.origin ?? "值", " 應為 ").concat(adj).concat(issue2.maximum.toString(), " ").concat(sizing.unit ?? "個元素");
            return "數值過大：預期 ".concat(issue2.origin ?? "值", " 應為 ").concat(adj).concat(issue2.maximum.toString());
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return "數值過小：預期 ".concat(issue2.origin, " 應為 ").concat(adj).concat(issue2.minimum.toString(), " ").concat(sizing.unit);
            }
            return "數值過小：預期 ".concat(issue2.origin, " 應為 ").concat(adj).concat(issue2.minimum.toString());
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return '無效的字串：必須以 "'.concat(_issue.prefix, '" 開頭');
            }
            if (_issue.format === "ends_with")
              return '無效的字串：必須以 "'.concat(_issue.suffix, '" 結尾');
            if (_issue.format === "includes")
              return '無效的字串：必須包含 "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "無效的字串：必須符合格式 ".concat(_issue.pattern);
            return "無效的 ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "無效的數字：必須為 ".concat(issue2.divisor, " 的倍數");
          case "unrecognized_keys":
            return "無法識別的鍵值".concat(issue2.keys.length > 1 ? "們" : "", "：").concat(joinValues(issue2.keys, "、"));
          case "invalid_key":
            return "".concat(issue2.origin, " 中有無效的鍵值");
          case "invalid_union":
            return "無效的輸入值";
          case "invalid_element":
            return "".concat(issue2.origin, " 中有無效的值");
          default:
            return "無效的輸入值";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/yo.js
function yo_default() {
  return {
    localeError: error50()
  };
}
var error50;
var init_yo = __esm({
  "node_modules/zod/v4/locales/yo.js"() {
    init_util();
    error50 = () => {
      const Sizable = {
        string: { unit: "àmi", verb: "ní" },
        file: { unit: "bytes", verb: "ní" },
        array: { unit: "nkan", verb: "ní" },
        set: { unit: "nkan", verb: "ní" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "ẹ̀rọ ìbáwọlé",
        email: "àdírẹ́sì ìmẹ́lì",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "àkókò ISO",
        date: "ọjọ́ ISO",
        time: "àkókò ISO",
        duration: "àkókò tó pé ISO",
        ipv4: "àdírẹ́sì IPv4",
        ipv6: "àdírẹ́sì IPv6",
        cidrv4: "àgbègbè IPv4",
        cidrv6: "àgbègbè IPv6",
        base64: "ọ̀rọ̀ tí a kọ́ ní base64",
        base64url: "ọ̀rọ̀ base64url",
        json_string: "ọ̀rọ̀ JSON",
        e164: "nọ́mbà E.164",
        jwt: "JWT",
        template_literal: "ẹ̀rọ ìbáwọlé"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "nọ́mbà",
        array: "akopọ"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
            const receivedType = parsedType(issue2.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue2.expected)) {
              return "Ìbáwọlé aṣìṣe: a ní láti fi instanceof ".concat(issue2.expected, ", àmọ̀ a rí ").concat(received);
            }
            return "Ìbáwọlé aṣìṣe: a ní láti fi ".concat(expected, ", àmọ̀ a rí ").concat(received);
          }
          case "invalid_value":
            if (issue2.values.length === 1)
              return "Ìbáwọlé aṣìṣe: a ní láti fi ".concat(stringifyPrimitive(issue2.values[0]));
            return "Àṣàyàn aṣìṣe: yan ọ̀kan lára ".concat(joinValues(issue2.values, "|"));
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Tó pọ̀ jù: a ní láti jẹ́ pé ".concat(issue2.origin ?? "iye", " ").concat(sizing.verb, " ").concat(adj).concat(issue2.maximum, " ").concat(sizing.unit);
            return "Tó pọ̀ jù: a ní láti jẹ́ ".concat(adj).concat(issue2.maximum);
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return "Kéré ju: a ní láti jẹ́ pé ".concat(issue2.origin, " ").concat(sizing.verb, " ").concat(adj).concat(issue2.minimum, " ").concat(sizing.unit);
            return "Kéré ju: a ní láti jẹ́ ".concat(adj).concat(issue2.minimum);
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return 'Ọ̀rọ̀ aṣìṣe: gbọ́dọ̀ bẹ̀rẹ̀ pẹ̀lú "'.concat(_issue.prefix, '"');
            if (_issue.format === "ends_with")
              return 'Ọ̀rọ̀ aṣìṣe: gbọ́dọ̀ parí pẹ̀lú "'.concat(_issue.suffix, '"');
            if (_issue.format === "includes")
              return 'Ọ̀rọ̀ aṣìṣe: gbọ́dọ̀ ní "'.concat(_issue.includes, '"');
            if (_issue.format === "regex")
              return "Ọ̀rọ̀ aṣìṣe: gbọ́dọ̀ bá àpẹẹrẹ mu ".concat(_issue.pattern);
            return "Aṣìṣe: ".concat(FormatDictionary[_issue.format] ?? issue2.format);
          }
          case "not_multiple_of":
            return "Nọ́mbà aṣìṣe: gbọ́dọ̀ jẹ́ èyà pípín ti ".concat(issue2.divisor);
          case "unrecognized_keys":
            return "Bọtìnì àìmọ̀: ".concat(joinValues(issue2.keys, ", "));
          case "invalid_key":
            return "Bọtìnì aṣìṣe nínú ".concat(issue2.origin);
          case "invalid_union":
            return "Ìbáwọlé aṣìṣe";
          case "invalid_element":
            return "Iye aṣìṣe nínú ".concat(issue2.origin);
          default:
            return "Ìbáwọlé aṣìṣe";
        }
      };
    };
  }
});

// node_modules/zod/v4/locales/index.js
var locales_exports = {};
__export(locales_exports, {
  ar: () => ar_default,
  az: () => az_default,
  be: () => be_default,
  bg: () => bg_default,
  ca: () => ca_default,
  cs: () => cs_default,
  da: () => da_default,
  de: () => de_default,
  el: () => el_default,
  en: () => en_default,
  eo: () => eo_default,
  es: () => es_default,
  fa: () => fa_default,
  fi: () => fi_default,
  fr: () => fr_default,
  frCA: () => fr_CA_default,
  he: () => he_default,
  hr: () => hr_default,
  hu: () => hu_default,
  hy: () => hy_default,
  id: () => id_default,
  is: () => is_default,
  it: () => it_default,
  ja: () => ja_default,
  ka: () => ka_default,
  kh: () => kh_default,
  km: () => km_default,
  ko: () => ko_default,
  lt: () => lt_default,
  mk: () => mk_default,
  ms: () => ms_default,
  nl: () => nl_default,
  no: () => no_default,
  ota: () => ota_default,
  pl: () => pl_default,
  ps: () => ps_default,
  pt: () => pt_default,
  ro: () => ro_default,
  ru: () => ru_default,
  sl: () => sl_default,
  sv: () => sv_default,
  ta: () => ta_default,
  th: () => th_default,
  tr: () => tr_default,
  ua: () => ua_default,
  uk: () => uk_default,
  ur: () => ur_default,
  uz: () => uz_default,
  vi: () => vi_default,
  yo: () => yo_default,
  zhCN: () => zh_CN_default,
  zhTW: () => zh_TW_default
});
var init_locales = __esm({
  "node_modules/zod/v4/locales/index.js"() {
    init_ar();
    init_az();
    init_be();
    init_bg();
    init_ca();
    init_cs();
    init_da();
    init_de();
    init_el();
    init_en();
    init_eo();
    init_es();
    init_fa();
    init_fi();
    init_fr();
    init_fr_CA();
    init_he();
    init_hr();
    init_hu();
    init_hy();
    init_id();
    init_is();
    init_it();
    init_ja();
    init_ka();
    init_kh();
    init_km();
    init_ko();
    init_lt();
    init_mk();
    init_ms();
    init_nl();
    init_no();
    init_ota();
    init_ps();
    init_pl();
    init_pt();
    init_ro();
    init_ru();
    init_sl();
    init_sv();
    init_ta();
    init_th();
    init_tr();
    init_ua();
    init_uk();
    init_ur();
    init_uz();
    init_vi();
    init_zh_CN();
    init_zh_TW();
    init_yo();
  }
});

// node_modules/zod/v4/core/registries.js
function registry() {
  return new $ZodRegistry();
}
var _a2, $output, $input, $ZodRegistry, globalRegistry;
var init_registries = __esm({
  "node_modules/zod/v4/core/registries.js"() {
    $output = /* @__PURE__ */ Symbol("ZodOutput");
    $input = /* @__PURE__ */ Symbol("ZodInput");
    $ZodRegistry = class {
      constructor() {
        this._map = /* @__PURE__ */ new WeakMap();
        this._idmap = /* @__PURE__ */ new Map();
      }
      add(schema, ..._meta) {
        const meta3 = _meta[0];
        this._map.set(schema, meta3);
        if (meta3 && typeof meta3 === "object" && "id" in meta3) {
          this._idmap.set(meta3.id, schema);
        }
        return this;
      }
      clear() {
        this._map = /* @__PURE__ */ new WeakMap();
        this._idmap = /* @__PURE__ */ new Map();
        return this;
      }
      remove(schema) {
        const meta3 = this._map.get(schema);
        if (meta3 && typeof meta3 === "object" && "id" in meta3) {
          this._idmap.delete(meta3.id);
        }
        this._map.delete(schema);
        return this;
      }
      get(schema) {
        const p2 = schema._zod.parent;
        if (p2) {
          const pm = { ...this.get(p2) ?? {} };
          delete pm.id;
          const f2 = { ...pm, ...this._map.get(schema) };
          return Object.keys(f2).length ? f2 : void 0;
        }
        return this._map.get(schema);
      }
      has(schema) {
        return this._map.has(schema);
      }
    };
    (_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
    globalRegistry = globalThis.__zod_globalRegistry;
  }
});

// node_modules/zod/v4/core/api.js
// @__NO_SIDE_EFFECTS__
function _string(Class2, params) {
  return new Class2({
    type: "string",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedString(Class2, params) {
  return new Class2({
    type: "string",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _mac(Class2, params) {
  return new Class2({
    type: "string",
    format: "mac",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _number(Class2, params) {
  return new Class2({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedNumber(Class2, params) {
  return new Class2({
    type: "number",
    coerce: true,
    checks: [],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _float32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _float64(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "int32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uint32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "uint32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedBoolean(Class2, params) {
  return new Class2({
    type: "boolean",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _bigint(Class2, params) {
  return new Class2({
    type: "bigint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedBigint(Class2, params) {
  return new Class2({
    type: "bigint",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "int64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uint64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "uint64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _symbol(Class2, params) {
  return new Class2({
    type: "symbol",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _undefined2(Class2, params) {
  return new Class2({
    type: "undefined",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _any(Class2) {
  return new Class2({
    type: "any"
  });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
// @__NO_SIDE_EFFECTS__
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _void(Class2, params) {
  return new Class2({
    type: "void",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _date(Class2, params) {
  return new Class2({
    type: "date",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedDate(Class2, params) {
  return new Class2({
    type: "date",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nan(Class2, params) {
  return new Class2({
    type: "nan",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _positive(params) {
  return /* @__PURE__ */ _gt(0, params);
}
// @__NO_SIDE_EFFECTS__
function _negative(params) {
  return /* @__PURE__ */ _lt(0, params);
}
// @__NO_SIDE_EFFECTS__
function _nonpositive(params) {
  return /* @__PURE__ */ _lte(0, params);
}
// @__NO_SIDE_EFFECTS__
function _nonnegative(params) {
  return /* @__PURE__ */ _gte(0, params);
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
// @__NO_SIDE_EFFECTS__
function _maxSize(maximum, params) {
  return new $ZodCheckMaxSize({
    check: "max_size",
    ...normalizeParams(params),
    maximum
  });
}
// @__NO_SIDE_EFFECTS__
function _minSize(minimum, params) {
  return new $ZodCheckMinSize({
    check: "min_size",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _size(size, params) {
  return new $ZodCheckSizeEquals({
    check: "size_equals",
    ...normalizeParams(params),
    size
  });
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
// @__NO_SIDE_EFFECTS__
function _property(property, schema, params) {
  return new $ZodCheckProperty({
    check: "property",
    property,
    schema,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _mime(types, params) {
  return new $ZodCheckMimeType({
    check: "mime_type",
    mime: types,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
  return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
  return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
  return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _union(Class2, options, params) {
  return new Class2({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
function _xor(Class2, options, params) {
  return new Class2({
    type: "union",
    options,
    inclusive: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _discriminatedUnion(Class2, discriminator, options, params) {
  return new Class2({
    type: "union",
    options,
    discriminator,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _intersection(Class2, left, right) {
  return new Class2({
    type: "intersection",
    left,
    right
  });
}
// @__NO_SIDE_EFFECTS__
function _tuple(Class2, items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new Class2({
    type: "tuple",
    items,
    rest,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _record(Class2, keyType, valueType, params) {
  return new Class2({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _map(Class2, keyType, valueType, params) {
  return new Class2({
    type: "map",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _set(Class2, valueType, params) {
  return new Class2({
    type: "set",
    valueType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _enum(Class2, values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v2) => [v2, v2])) : values;
  return new Class2({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nativeEnum(Class2, entries, params) {
  return new Class2({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _literal(Class2, value, params) {
  return new Class2({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _file(Class2, params) {
  return new Class2({
    type: "file",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _transform(Class2, fn) {
  return new Class2({
    type: "transform",
    transform: fn
  });
}
// @__NO_SIDE_EFFECTS__
function _optional(Class2, innerType) {
  return new Class2({
    type: "optional",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _nullable(Class2, innerType) {
  return new Class2({
    type: "nullable",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _default(Class2, innerType, defaultValue) {
  return new Class2({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
// @__NO_SIDE_EFFECTS__
function _nonoptional(Class2, innerType, params) {
  return new Class2({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _success(Class2, innerType) {
  return new Class2({
    type: "success",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _catch(Class2, innerType, catchValue) {
  return new Class2({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
// @__NO_SIDE_EFFECTS__
function _pipe(Class2, in_, out) {
  return new Class2({
    type: "pipe",
    in: in_,
    out
  });
}
// @__NO_SIDE_EFFECTS__
function _readonly(Class2, innerType) {
  return new Class2({
    type: "readonly",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _templateLiteral(Class2, parts, params) {
  return new Class2({
    type: "template_literal",
    parts,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _lazy(Class2, getter) {
  return new Class2({
    type: "lazy",
    getter
  });
}
// @__NO_SIDE_EFFECTS__
function _promise(Class2, innerType) {
  return new Class2({
    type: "promise",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _custom(Class2, fn, _params) {
  const norm = normalizeParams(_params);
  norm.abort ?? (norm.abort = true);
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...norm
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
  const ch = /* @__PURE__ */ _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
// @__NO_SIDE_EFFECTS__
function describe(description) {
  const ch = new $ZodCheck({ check: "describe" });
  ch._zod.onattach = [
    (inst) => {
      const existing = globalRegistry.get(inst) ?? {};
      globalRegistry.add(inst, { ...existing, description });
    }
  ];
  ch._zod.check = () => {
  };
  return ch;
}
// @__NO_SIDE_EFFECTS__
function meta(metadata) {
  const ch = new $ZodCheck({ check: "meta" });
  ch._zod.onattach = [
    (inst) => {
      const existing = globalRegistry.get(inst) ?? {};
      globalRegistry.add(inst, { ...existing, ...metadata });
    }
  ];
  ch._zod.check = () => {
  };
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _stringbool(Classes, _params) {
  const params = normalizeParams(_params);
  let truthyArray = params.truthy ?? ["true", "1", "yes", "on", "y", "enabled"];
  let falsyArray = params.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
  if (params.case !== "sensitive") {
    truthyArray = truthyArray.map((v2) => typeof v2 === "string" ? v2.toLowerCase() : v2);
    falsyArray = falsyArray.map((v2) => typeof v2 === "string" ? v2.toLowerCase() : v2);
  }
  const truthySet = new Set(truthyArray);
  const falsySet = new Set(falsyArray);
  const _Codec = Classes.Codec ?? $ZodCodec;
  const _Boolean = Classes.Boolean ?? $ZodBoolean;
  const _String = Classes.String ?? $ZodString;
  const stringSchema = new _String({ type: "string", error: params.error });
  const booleanSchema = new _Boolean({ type: "boolean", error: params.error });
  const codec2 = new _Codec({
    type: "pipe",
    in: stringSchema,
    out: booleanSchema,
    transform: ((input, payload) => {
      let data = input;
      if (params.case !== "sensitive")
        data = data.toLowerCase();
      if (truthySet.has(data)) {
        return true;
      } else if (falsySet.has(data)) {
        return false;
      } else {
        payload.issues.push({
          code: "invalid_value",
          expected: "stringbool",
          values: [...truthySet, ...falsySet],
          input: payload.value,
          inst: codec2,
          continue: false
        });
        return {};
      }
    }),
    reverseTransform: ((input, _payload) => {
      if (input === true) {
        return truthyArray[0] || "true";
      } else {
        return falsyArray[0] || "false";
      }
    }),
    error: params.error
  });
  return codec2;
}
// @__NO_SIDE_EFFECTS__
function _stringFormat(Class2, format, fnOrRegex, _params = {}) {
  const params = normalizeParams(_params);
  const def = {
    ...normalizeParams(_params),
    check: "string_format",
    type: "string",
    format,
    fn: typeof fnOrRegex === "function" ? fnOrRegex : (val) => fnOrRegex.test(val),
    ...params
  };
  if (fnOrRegex instanceof RegExp) {
    def.pattern = fnOrRegex;
  }
  const inst = new Class2(def);
  return inst;
}
var TimePrecision;
var init_api = __esm({
  "node_modules/zod/v4/core/api.js"() {
    init_checks();
    init_registries();
    init_schemas();
    init_util();
    TimePrecision = {
      Any: null,
      Minute: -1,
      Second: 0,
      Millisecond: 3,
      Microsecond: 6
    };
  }
});

// node_modules/zod/v4/core/to-json-schema.js
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {
    }),
    io: params?.io ?? "output",
    counter: 0,
    seen: /* @__PURE__ */ new Map(),
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    external: params?.external ?? void 0
  };
}
function process2(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a4;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
  ctx.seen.set(schema, result);
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error("[toJSONSchema]: Non-representable type encountered: ".concat(def.type));
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      process2(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta3 = ctx.metadataRegistry.get(schema);
  if (meta3)
    Object.assign(result.schema, meta3);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a4 = result.schema).default ?? (_a4.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const idToSchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error('Duplicate schema id "'.concat(id, '" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.'));
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id2) => id2);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? "schema".concat(ctx.counter++);
      entry[1].defId = id;
      return { defId: id, ref: "".concat(uriGenerator("__shared"), "#/").concat(defsSegment, "/").concat(id) };
    }
    if (entry[1] === root) {
      return { ref: "#" };
    }
    const uriPrefix = "#";
    const defUriPrefix = "".concat(uriPrefix, "/").concat(defsSegment, "/");
    const defId = entry[1].schema.id ?? "__schema".concat(ctx.counter++);
    return { defId, ref: defUriPrefix + defId };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema2 = seen.schema;
    for (const key in schema2) {
      delete schema2[key];
    }
    schema2.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error("Cycle detected: " + "#/".concat(seen.cycle?.join("/"), "/<root>") + '\n\nSet the `cycles` parameter to `"ref"` to resolve cyclical schemas with defs.');
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
        continue;
      }
    }
  }
}
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema2 = seen.def ?? seen.schema;
    const _cached = { ...schema2 };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema2.allOf = schema2.allOf ?? [];
        schema2.allOf.push(refSchema);
      } else {
        Object.assign(schema2, refSchema);
      }
      Object.assign(schema2, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema2[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema2[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema2.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema2) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema2[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema2,
      path: seen.path ?? []
    });
  };
  for (const entry of [...ctx.seen.entries()].reverse()) {
    flattenRef(entry[0]);
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {
  } else {
  }
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  Object.assign(result, root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== void 0 && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (seen.def && seen.defId) {
      if (seen.def.id === seen.defId)
        delete seen.def.id;
      defs[seen.defId] = seen.def;
    }
  }
  if (ctx.external) {
  } else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
var createToJSONSchemaMethod, createStandardJSONSchemaMethod;
var init_to_json_schema = __esm({
  "node_modules/zod/v4/core/to-json-schema.js"() {
    init_registries();
    createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
      const ctx = initializeContext({ ...params, processors });
      process2(schema, ctx);
      extractDefs(ctx, schema);
      return finalize(ctx, schema);
    };
    createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
      const { libraryOptions, target } = params ?? {};
      const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
      process2(schema, ctx);
      extractDefs(ctx, schema);
      return finalize(ctx, schema);
    };
  }
});

// node_modules/zod/v4/core/json-schema-processors.js
function toJSONSchema(input, params) {
  if ("_idmap" in input) {
    const registry2 = input;
    const ctx2 = initializeContext({ ...params, processors: allProcessors });
    const defs = {};
    for (const entry of registry2._idmap.entries()) {
      const [_2, schema] = entry;
      process2(schema, ctx2);
    }
    const schemas = {};
    const external = {
      registry: registry2,
      uri: params?.uri,
      defs
    };
    ctx2.external = external;
    for (const entry of registry2._idmap.entries()) {
      const [key, schema] = entry;
      extractDefs(ctx2, schema);
      schemas[key] = finalize(ctx2, schema);
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment = ctx2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  const ctx = initializeContext({ ...params, processors: allProcessors });
  process2(input, ctx);
  extractDefs(ctx, input);
  return finalize(ctx, input);
}
var formatMap, stringProcessor, numberProcessor, booleanProcessor, bigintProcessor, symbolProcessor, nullProcessor, undefinedProcessor, voidProcessor, neverProcessor, anyProcessor, unknownProcessor, dateProcessor, enumProcessor, literalProcessor, nanProcessor, templateLiteralProcessor, fileProcessor, successProcessor, customProcessor, functionProcessor, transformProcessor, mapProcessor, setProcessor, arrayProcessor, objectProcessor, unionProcessor, intersectionProcessor, tupleProcessor, recordProcessor, nullableProcessor, nonoptionalProcessor, defaultProcessor, prefaultProcessor, catchProcessor, pipeProcessor, readonlyProcessor, promiseProcessor, optionalProcessor, lazyProcessor, allProcessors;
var init_json_schema_processors = __esm({
  "node_modules/zod/v4/core/json-schema-processors.js"() {
    init_to_json_schema();
    init_util();
    formatMap = {
      guid: "uuid",
      url: "uri",
      datetime: "date-time",
      json_string: "json-string",
      regex: ""
      // do not set
    };
    stringProcessor = (schema, ctx, _json, _params) => {
      const json2 = _json;
      json2.type = "string";
      const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
      if (typeof minimum === "number")
        json2.minLength = minimum;
      if (typeof maximum === "number")
        json2.maxLength = maximum;
      if (format) {
        json2.format = formatMap[format] ?? format;
        if (json2.format === "")
          delete json2.format;
        if (format === "time") {
          delete json2.format;
        }
      }
      if (contentEncoding)
        json2.contentEncoding = contentEncoding;
      if (patterns && patterns.size > 0) {
        const regexes = [...patterns];
        if (regexes.length === 1)
          json2.pattern = regexes[0].source;
        else if (regexes.length > 1) {
          json2.allOf = [
            ...regexes.map((regex) => ({
              ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
              pattern: regex.source
            }))
          ];
        }
      }
    };
    numberProcessor = (schema, ctx, _json, _params) => {
      const json2 = _json;
      const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
      if (typeof format === "string" && format.includes("int"))
        json2.type = "integer";
      else
        json2.type = "number";
      const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
      const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
      const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
      if (exMin) {
        if (legacy) {
          json2.minimum = exclusiveMinimum;
          json2.exclusiveMinimum = true;
        } else {
          json2.exclusiveMinimum = exclusiveMinimum;
        }
      } else if (typeof minimum === "number") {
        json2.minimum = minimum;
      }
      if (exMax) {
        if (legacy) {
          json2.maximum = exclusiveMaximum;
          json2.exclusiveMaximum = true;
        } else {
          json2.exclusiveMaximum = exclusiveMaximum;
        }
      } else if (typeof maximum === "number") {
        json2.maximum = maximum;
      }
      if (typeof multipleOf === "number")
        json2.multipleOf = multipleOf;
    };
    booleanProcessor = (_schema, _ctx, json2, _params) => {
      json2.type = "boolean";
    };
    bigintProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("BigInt cannot be represented in JSON Schema");
      }
    };
    symbolProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Symbols cannot be represented in JSON Schema");
      }
    };
    nullProcessor = (_schema, ctx, json2, _params) => {
      if (ctx.target === "openapi-3.0") {
        json2.type = "string";
        json2.nullable = true;
        json2.enum = [null];
      } else {
        json2.type = "null";
      }
    };
    undefinedProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Undefined cannot be represented in JSON Schema");
      }
    };
    voidProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Void cannot be represented in JSON Schema");
      }
    };
    neverProcessor = (_schema, _ctx, json2, _params) => {
      json2.not = {};
    };
    anyProcessor = (_schema, _ctx, _json, _params) => {
    };
    unknownProcessor = (_schema, _ctx, _json, _params) => {
    };
    dateProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Date cannot be represented in JSON Schema");
      }
    };
    enumProcessor = (schema, _ctx, json2, _params) => {
      const def = schema._zod.def;
      const values = getEnumValues(def.entries);
      if (values.every((v2) => typeof v2 === "number"))
        json2.type = "number";
      if (values.every((v2) => typeof v2 === "string"))
        json2.type = "string";
      json2.enum = values;
    };
    literalProcessor = (schema, ctx, json2, _params) => {
      const def = schema._zod.def;
      const vals = [];
      for (const val of def.values) {
        if (val === void 0) {
          if (ctx.unrepresentable === "throw") {
            throw new Error("Literal `undefined` cannot be represented in JSON Schema");
          } else {
          }
        } else if (typeof val === "bigint") {
          if (ctx.unrepresentable === "throw") {
            throw new Error("BigInt literals cannot be represented in JSON Schema");
          } else {
            vals.push(Number(val));
          }
        } else {
          vals.push(val);
        }
      }
      if (vals.length === 0) {
      } else if (vals.length === 1) {
        const val = vals[0];
        json2.type = val === null ? "null" : typeof val;
        if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
          json2.enum = [val];
        } else {
          json2.const = val;
        }
      } else {
        if (vals.every((v2) => typeof v2 === "number"))
          json2.type = "number";
        if (vals.every((v2) => typeof v2 === "string"))
          json2.type = "string";
        if (vals.every((v2) => typeof v2 === "boolean"))
          json2.type = "boolean";
        if (vals.every((v2) => v2 === null))
          json2.type = "null";
        json2.enum = vals;
      }
    };
    nanProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("NaN cannot be represented in JSON Schema");
      }
    };
    templateLiteralProcessor = (schema, _ctx, json2, _params) => {
      const _json = json2;
      const pattern = schema._zod.pattern;
      if (!pattern)
        throw new Error("Pattern not found in template literal");
      _json.type = "string";
      _json.pattern = pattern.source;
    };
    fileProcessor = (schema, _ctx, json2, _params) => {
      const _json = json2;
      const file2 = {
        type: "string",
        format: "binary",
        contentEncoding: "binary"
      };
      const { minimum, maximum, mime } = schema._zod.bag;
      if (minimum !== void 0)
        file2.minLength = minimum;
      if (maximum !== void 0)
        file2.maxLength = maximum;
      if (mime) {
        if (mime.length === 1) {
          file2.contentMediaType = mime[0];
          Object.assign(_json, file2);
        } else {
          Object.assign(_json, file2);
          _json.anyOf = mime.map((m2) => ({ contentMediaType: m2 }));
        }
      } else {
        Object.assign(_json, file2);
      }
    };
    successProcessor = (_schema, _ctx, json2, _params) => {
      json2.type = "boolean";
    };
    customProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Custom types cannot be represented in JSON Schema");
      }
    };
    functionProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Function types cannot be represented in JSON Schema");
      }
    };
    transformProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Transforms cannot be represented in JSON Schema");
      }
    };
    mapProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Map cannot be represented in JSON Schema");
      }
    };
    setProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Set cannot be represented in JSON Schema");
      }
    };
    arrayProcessor = (schema, ctx, _json, params) => {
      const json2 = _json;
      const def = schema._zod.def;
      const { minimum, maximum } = schema._zod.bag;
      if (typeof minimum === "number")
        json2.minItems = minimum;
      if (typeof maximum === "number")
        json2.maxItems = maximum;
      json2.type = "array";
      json2.items = process2(def.element, ctx, {
        ...params,
        path: [...params.path, "items"]
      });
    };
    objectProcessor = (schema, ctx, _json, params) => {
      const json2 = _json;
      const def = schema._zod.def;
      json2.type = "object";
      json2.properties = {};
      const shape = def.shape;
      for (const key in shape) {
        json2.properties[key] = process2(shape[key], ctx, {
          ...params,
          path: [...params.path, "properties", key]
        });
      }
      const allKeys = new Set(Object.keys(shape));
      const requiredKeys = new Set([...allKeys].filter((key) => {
        const v2 = def.shape[key]._zod;
        if (ctx.io === "input") {
          return v2.optin === void 0;
        } else {
          return v2.optout === void 0;
        }
      }));
      if (requiredKeys.size > 0) {
        json2.required = Array.from(requiredKeys);
      }
      if (def.catchall?._zod.def.type === "never") {
        json2.additionalProperties = false;
      } else if (!def.catchall) {
        if (ctx.io === "output")
          json2.additionalProperties = false;
      } else if (def.catchall) {
        json2.additionalProperties = process2(def.catchall, ctx, {
          ...params,
          path: [...params.path, "additionalProperties"]
        });
      }
    };
    unionProcessor = (schema, ctx, json2, params) => {
      const def = schema._zod.def;
      const isExclusive = def.inclusive === false;
      const options = def.options.map((x2, i2) => process2(x2, ctx, {
        ...params,
        path: [...params.path, isExclusive ? "oneOf" : "anyOf", i2]
      }));
      if (isExclusive) {
        json2.oneOf = options;
      } else {
        json2.anyOf = options;
      }
    };
    intersectionProcessor = (schema, ctx, json2, params) => {
      const def = schema._zod.def;
      const a = process2(def.left, ctx, {
        ...params,
        path: [...params.path, "allOf", 0]
      });
      const b = process2(def.right, ctx, {
        ...params,
        path: [...params.path, "allOf", 1]
      });
      const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
      const allOf = [
        ...isSimpleIntersection(a) ? a.allOf : [a],
        ...isSimpleIntersection(b) ? b.allOf : [b]
      ];
      json2.allOf = allOf;
    };
    tupleProcessor = (schema, ctx, _json, params) => {
      const json2 = _json;
      const def = schema._zod.def;
      json2.type = "array";
      const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
      const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
      const prefixItems = def.items.map((x2, i2) => process2(x2, ctx, {
        ...params,
        path: [...params.path, prefixPath, i2]
      }));
      const rest = def.rest ? process2(def.rest, ctx, {
        ...params,
        path: [...params.path, restPath, ...ctx.target === "openapi-3.0" ? [def.items.length] : []]
      }) : null;
      if (ctx.target === "draft-2020-12") {
        json2.prefixItems = prefixItems;
        if (rest) {
          json2.items = rest;
        }
      } else if (ctx.target === "openapi-3.0") {
        json2.items = {
          anyOf: prefixItems
        };
        if (rest) {
          json2.items.anyOf.push(rest);
        }
        json2.minItems = prefixItems.length;
        if (!rest) {
          json2.maxItems = prefixItems.length;
        }
      } else {
        json2.items = prefixItems;
        if (rest) {
          json2.additionalItems = rest;
        }
      }
      const { minimum, maximum } = schema._zod.bag;
      if (typeof minimum === "number")
        json2.minItems = minimum;
      if (typeof maximum === "number")
        json2.maxItems = maximum;
    };
    recordProcessor = (schema, ctx, _json, params) => {
      const json2 = _json;
      const def = schema._zod.def;
      json2.type = "object";
      const keyType = def.keyType;
      const keyBag = keyType._zod.bag;
      const patterns = keyBag?.patterns;
      if (def.mode === "loose" && patterns && patterns.size > 0) {
        const valueSchema = process2(def.valueType, ctx, {
          ...params,
          path: [...params.path, "patternProperties", "*"]
        });
        json2.patternProperties = {};
        for (const pattern of patterns) {
          json2.patternProperties[pattern.source] = valueSchema;
        }
      } else {
        if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
          json2.propertyNames = process2(def.keyType, ctx, {
            ...params,
            path: [...params.path, "propertyNames"]
          });
        }
        json2.additionalProperties = process2(def.valueType, ctx, {
          ...params,
          path: [...params.path, "additionalProperties"]
        });
      }
      const keyValues = keyType._zod.values;
      if (keyValues) {
        const validKeyValues = [...keyValues].filter((v2) => typeof v2 === "string" || typeof v2 === "number");
        if (validKeyValues.length > 0) {
          json2.required = validKeyValues;
        }
      }
    };
    nullableProcessor = (schema, ctx, json2, params) => {
      const def = schema._zod.def;
      const inner = process2(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      if (ctx.target === "openapi-3.0") {
        seen.ref = def.innerType;
        json2.nullable = true;
      } else {
        json2.anyOf = [inner, { type: "null" }];
      }
    };
    nonoptionalProcessor = (schema, ctx, _json, params) => {
      const def = schema._zod.def;
      process2(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
    };
    defaultProcessor = (schema, ctx, json2, params) => {
      const def = schema._zod.def;
      process2(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
      json2.default = JSON.parse(JSON.stringify(def.defaultValue));
    };
    prefaultProcessor = (schema, ctx, json2, params) => {
      const def = schema._zod.def;
      process2(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
      if (ctx.io === "input")
        json2._prefault = JSON.parse(JSON.stringify(def.defaultValue));
    };
    catchProcessor = (schema, ctx, json2, params) => {
      const def = schema._zod.def;
      process2(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
      let catchValue;
      try {
        catchValue = def.catchValue(void 0);
      } catch {
        throw new Error("Dynamic catch values are not supported in JSON Schema");
      }
      json2.default = catchValue;
    };
    pipeProcessor = (schema, ctx, _json, params) => {
      const def = schema._zod.def;
      const inIsTransform = def.in._zod.traits.has("$ZodTransform");
      const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
      process2(innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = innerType;
    };
    readonlyProcessor = (schema, ctx, json2, params) => {
      const def = schema._zod.def;
      process2(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
      json2.readOnly = true;
    };
    promiseProcessor = (schema, ctx, _json, params) => {
      const def = schema._zod.def;
      process2(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
    };
    optionalProcessor = (schema, ctx, _json, params) => {
      const def = schema._zod.def;
      process2(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
    };
    lazyProcessor = (schema, ctx, _json, params) => {
      const innerType = schema._zod.innerType;
      process2(innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = innerType;
    };
    allProcessors = {
      string: stringProcessor,
      number: numberProcessor,
      boolean: booleanProcessor,
      bigint: bigintProcessor,
      symbol: symbolProcessor,
      null: nullProcessor,
      undefined: undefinedProcessor,
      void: voidProcessor,
      never: neverProcessor,
      any: anyProcessor,
      unknown: unknownProcessor,
      date: dateProcessor,
      enum: enumProcessor,
      literal: literalProcessor,
      nan: nanProcessor,
      template_literal: templateLiteralProcessor,
      file: fileProcessor,
      success: successProcessor,
      custom: customProcessor,
      function: functionProcessor,
      transform: transformProcessor,
      map: mapProcessor,
      set: setProcessor,
      array: arrayProcessor,
      object: objectProcessor,
      union: unionProcessor,
      intersection: intersectionProcessor,
      tuple: tupleProcessor,
      record: recordProcessor,
      nullable: nullableProcessor,
      nonoptional: nonoptionalProcessor,
      default: defaultProcessor,
      prefault: prefaultProcessor,
      catch: catchProcessor,
      pipe: pipeProcessor,
      readonly: readonlyProcessor,
      promise: promiseProcessor,
      optional: optionalProcessor,
      lazy: lazyProcessor
    };
  }
});

// node_modules/zod/v4/core/json-schema-generator.js
var JSONSchemaGenerator;
var init_json_schema_generator = __esm({
  "node_modules/zod/v4/core/json-schema-generator.js"() {
    init_json_schema_processors();
    init_to_json_schema();
    JSONSchemaGenerator = class {
      /** @deprecated Access via ctx instead */
      get metadataRegistry() {
        return this.ctx.metadataRegistry;
      }
      /** @deprecated Access via ctx instead */
      get target() {
        return this.ctx.target;
      }
      /** @deprecated Access via ctx instead */
      get unrepresentable() {
        return this.ctx.unrepresentable;
      }
      /** @deprecated Access via ctx instead */
      get override() {
        return this.ctx.override;
      }
      /** @deprecated Access via ctx instead */
      get io() {
        return this.ctx.io;
      }
      /** @deprecated Access via ctx instead */
      get counter() {
        return this.ctx.counter;
      }
      set counter(value) {
        this.ctx.counter = value;
      }
      /** @deprecated Access via ctx instead */
      get seen() {
        return this.ctx.seen;
      }
      constructor(params) {
        let normalizedTarget = params?.target ?? "draft-2020-12";
        if (normalizedTarget === "draft-4")
          normalizedTarget = "draft-04";
        if (normalizedTarget === "draft-7")
          normalizedTarget = "draft-07";
        this.ctx = initializeContext({
          processors: allProcessors,
          target: normalizedTarget,
          ...params?.metadata && { metadata: params.metadata },
          ...params?.unrepresentable && { unrepresentable: params.unrepresentable },
          ...params?.override && { override: params.override },
          ...params?.io && { io: params.io }
        });
      }
      /**
       * Process a schema to prepare it for JSON Schema generation.
       * This must be called before emit().
       */
      process(schema, _params = { path: [], schemaPath: [] }) {
        return process2(schema, this.ctx, _params);
      }
      /**
       * Emit the final JSON Schema after processing.
       * Must call process() first.
       */
      emit(schema, _params) {
        if (_params) {
          if (_params.cycles)
            this.ctx.cycles = _params.cycles;
          if (_params.reused)
            this.ctx.reused = _params.reused;
          if (_params.external)
            this.ctx.external = _params.external;
        }
        extractDefs(this.ctx, schema);
        const result = finalize(this.ctx, schema);
        const { "~standard": _2, ...plainResult } = result;
        return plainResult;
      }
    };
  }
});

// node_modules/zod/v4/core/json-schema.js
var json_schema_exports = {};
var init_json_schema = __esm({
  "node_modules/zod/v4/core/json-schema.js"() {
  }
});

// node_modules/zod/v4/core/index.js
var core_exports2 = {};
__export(core_exports2, {
  $ZodAny: () => $ZodAny,
  $ZodArray: () => $ZodArray,
  $ZodAsyncError: () => $ZodAsyncError,
  $ZodBase64: () => $ZodBase64,
  $ZodBase64URL: () => $ZodBase64URL,
  $ZodBigInt: () => $ZodBigInt,
  $ZodBigIntFormat: () => $ZodBigIntFormat,
  $ZodBoolean: () => $ZodBoolean,
  $ZodCIDRv4: () => $ZodCIDRv4,
  $ZodCIDRv6: () => $ZodCIDRv6,
  $ZodCUID: () => $ZodCUID,
  $ZodCUID2: () => $ZodCUID2,
  $ZodCatch: () => $ZodCatch,
  $ZodCheck: () => $ZodCheck,
  $ZodCheckBigIntFormat: () => $ZodCheckBigIntFormat,
  $ZodCheckEndsWith: () => $ZodCheckEndsWith,
  $ZodCheckGreaterThan: () => $ZodCheckGreaterThan,
  $ZodCheckIncludes: () => $ZodCheckIncludes,
  $ZodCheckLengthEquals: () => $ZodCheckLengthEquals,
  $ZodCheckLessThan: () => $ZodCheckLessThan,
  $ZodCheckLowerCase: () => $ZodCheckLowerCase,
  $ZodCheckMaxLength: () => $ZodCheckMaxLength,
  $ZodCheckMaxSize: () => $ZodCheckMaxSize,
  $ZodCheckMimeType: () => $ZodCheckMimeType,
  $ZodCheckMinLength: () => $ZodCheckMinLength,
  $ZodCheckMinSize: () => $ZodCheckMinSize,
  $ZodCheckMultipleOf: () => $ZodCheckMultipleOf,
  $ZodCheckNumberFormat: () => $ZodCheckNumberFormat,
  $ZodCheckOverwrite: () => $ZodCheckOverwrite,
  $ZodCheckProperty: () => $ZodCheckProperty,
  $ZodCheckRegex: () => $ZodCheckRegex,
  $ZodCheckSizeEquals: () => $ZodCheckSizeEquals,
  $ZodCheckStartsWith: () => $ZodCheckStartsWith,
  $ZodCheckStringFormat: () => $ZodCheckStringFormat,
  $ZodCheckUpperCase: () => $ZodCheckUpperCase,
  $ZodCodec: () => $ZodCodec,
  $ZodCustom: () => $ZodCustom,
  $ZodCustomStringFormat: () => $ZodCustomStringFormat,
  $ZodDate: () => $ZodDate,
  $ZodDefault: () => $ZodDefault,
  $ZodDiscriminatedUnion: () => $ZodDiscriminatedUnion,
  $ZodE164: () => $ZodE164,
  $ZodEmail: () => $ZodEmail,
  $ZodEmoji: () => $ZodEmoji,
  $ZodEncodeError: () => $ZodEncodeError,
  $ZodEnum: () => $ZodEnum,
  $ZodError: () => $ZodError,
  $ZodExactOptional: () => $ZodExactOptional,
  $ZodFile: () => $ZodFile,
  $ZodFunction: () => $ZodFunction,
  $ZodGUID: () => $ZodGUID,
  $ZodIPv4: () => $ZodIPv4,
  $ZodIPv6: () => $ZodIPv6,
  $ZodISODate: () => $ZodISODate,
  $ZodISODateTime: () => $ZodISODateTime,
  $ZodISODuration: () => $ZodISODuration,
  $ZodISOTime: () => $ZodISOTime,
  $ZodIntersection: () => $ZodIntersection,
  $ZodJWT: () => $ZodJWT,
  $ZodKSUID: () => $ZodKSUID,
  $ZodLazy: () => $ZodLazy,
  $ZodLiteral: () => $ZodLiteral,
  $ZodMAC: () => $ZodMAC,
  $ZodMap: () => $ZodMap,
  $ZodNaN: () => $ZodNaN,
  $ZodNanoID: () => $ZodNanoID,
  $ZodNever: () => $ZodNever,
  $ZodNonOptional: () => $ZodNonOptional,
  $ZodNull: () => $ZodNull,
  $ZodNullable: () => $ZodNullable,
  $ZodNumber: () => $ZodNumber,
  $ZodNumberFormat: () => $ZodNumberFormat,
  $ZodObject: () => $ZodObject,
  $ZodObjectJIT: () => $ZodObjectJIT,
  $ZodOptional: () => $ZodOptional,
  $ZodPipe: () => $ZodPipe,
  $ZodPrefault: () => $ZodPrefault,
  $ZodPreprocess: () => $ZodPreprocess,
  $ZodPromise: () => $ZodPromise,
  $ZodReadonly: () => $ZodReadonly,
  $ZodRealError: () => $ZodRealError,
  $ZodRecord: () => $ZodRecord,
  $ZodRegistry: () => $ZodRegistry,
  $ZodSet: () => $ZodSet,
  $ZodString: () => $ZodString,
  $ZodStringFormat: () => $ZodStringFormat,
  $ZodSuccess: () => $ZodSuccess,
  $ZodSymbol: () => $ZodSymbol,
  $ZodTemplateLiteral: () => $ZodTemplateLiteral,
  $ZodTransform: () => $ZodTransform,
  $ZodTuple: () => $ZodTuple,
  $ZodType: () => $ZodType,
  $ZodULID: () => $ZodULID,
  $ZodURL: () => $ZodURL,
  $ZodUUID: () => $ZodUUID,
  $ZodUndefined: () => $ZodUndefined,
  $ZodUnion: () => $ZodUnion,
  $ZodUnknown: () => $ZodUnknown,
  $ZodVoid: () => $ZodVoid,
  $ZodXID: () => $ZodXID,
  $ZodXor: () => $ZodXor,
  $brand: () => $brand,
  $constructor: () => $constructor,
  $input: () => $input,
  $output: () => $output,
  Doc: () => Doc,
  JSONSchema: () => json_schema_exports,
  JSONSchemaGenerator: () => JSONSchemaGenerator,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  _any: () => _any,
  _array: () => _array,
  _base64: () => _base64,
  _base64url: () => _base64url,
  _bigint: () => _bigint,
  _boolean: () => _boolean,
  _catch: () => _catch,
  _check: () => _check,
  _cidrv4: () => _cidrv4,
  _cidrv6: () => _cidrv6,
  _coercedBigint: () => _coercedBigint,
  _coercedBoolean: () => _coercedBoolean,
  _coercedDate: () => _coercedDate,
  _coercedNumber: () => _coercedNumber,
  _coercedString: () => _coercedString,
  _cuid: () => _cuid,
  _cuid2: () => _cuid2,
  _custom: () => _custom,
  _date: () => _date,
  _decode: () => _decode,
  _decodeAsync: () => _decodeAsync,
  _default: () => _default,
  _discriminatedUnion: () => _discriminatedUnion,
  _e164: () => _e164,
  _email: () => _email,
  _emoji: () => _emoji2,
  _encode: () => _encode,
  _encodeAsync: () => _encodeAsync,
  _endsWith: () => _endsWith,
  _enum: () => _enum,
  _file: () => _file,
  _float32: () => _float32,
  _float64: () => _float64,
  _gt: () => _gt,
  _gte: () => _gte,
  _guid: () => _guid,
  _includes: () => _includes,
  _int: () => _int,
  _int32: () => _int32,
  _int64: () => _int64,
  _intersection: () => _intersection,
  _ipv4: () => _ipv4,
  _ipv6: () => _ipv6,
  _isoDate: () => _isoDate,
  _isoDateTime: () => _isoDateTime,
  _isoDuration: () => _isoDuration,
  _isoTime: () => _isoTime,
  _jwt: () => _jwt,
  _ksuid: () => _ksuid,
  _lazy: () => _lazy,
  _length: () => _length,
  _literal: () => _literal,
  _lowercase: () => _lowercase,
  _lt: () => _lt,
  _lte: () => _lte,
  _mac: () => _mac,
  _map: () => _map,
  _max: () => _lte,
  _maxLength: () => _maxLength,
  _maxSize: () => _maxSize,
  _mime: () => _mime,
  _min: () => _gte,
  _minLength: () => _minLength,
  _minSize: () => _minSize,
  _multipleOf: () => _multipleOf,
  _nan: () => _nan,
  _nanoid: () => _nanoid,
  _nativeEnum: () => _nativeEnum,
  _negative: () => _negative,
  _never: () => _never,
  _nonnegative: () => _nonnegative,
  _nonoptional: () => _nonoptional,
  _nonpositive: () => _nonpositive,
  _normalize: () => _normalize,
  _null: () => _null2,
  _nullable: () => _nullable,
  _number: () => _number,
  _optional: () => _optional,
  _overwrite: () => _overwrite,
  _parse: () => _parse,
  _parseAsync: () => _parseAsync,
  _pipe: () => _pipe,
  _positive: () => _positive,
  _promise: () => _promise,
  _property: () => _property,
  _readonly: () => _readonly,
  _record: () => _record,
  _refine: () => _refine,
  _regex: () => _regex,
  _safeDecode: () => _safeDecode,
  _safeDecodeAsync: () => _safeDecodeAsync,
  _safeEncode: () => _safeEncode,
  _safeEncodeAsync: () => _safeEncodeAsync,
  _safeParse: () => _safeParse,
  _safeParseAsync: () => _safeParseAsync,
  _set: () => _set,
  _size: () => _size,
  _slugify: () => _slugify,
  _startsWith: () => _startsWith,
  _string: () => _string,
  _stringFormat: () => _stringFormat,
  _stringbool: () => _stringbool,
  _success: () => _success,
  _superRefine: () => _superRefine,
  _symbol: () => _symbol,
  _templateLiteral: () => _templateLiteral,
  _toLowerCase: () => _toLowerCase,
  _toUpperCase: () => _toUpperCase,
  _transform: () => _transform,
  _trim: () => _trim,
  _tuple: () => _tuple,
  _uint32: () => _uint32,
  _uint64: () => _uint64,
  _ulid: () => _ulid,
  _undefined: () => _undefined2,
  _union: () => _union,
  _unknown: () => _unknown,
  _uppercase: () => _uppercase,
  _url: () => _url,
  _uuid: () => _uuid,
  _uuidv4: () => _uuidv4,
  _uuidv6: () => _uuidv6,
  _uuidv7: () => _uuidv7,
  _void: () => _void,
  _xid: () => _xid,
  _xor: () => _xor,
  clone: () => clone,
  config: () => config,
  createStandardJSONSchemaMethod: () => createStandardJSONSchemaMethod,
  createToJSONSchemaMethod: () => createToJSONSchemaMethod,
  decode: () => decode,
  decodeAsync: () => decodeAsync,
  describe: () => describe,
  encode: () => encode,
  encodeAsync: () => encodeAsync,
  extractDefs: () => extractDefs,
  finalize: () => finalize,
  flattenError: () => flattenError,
  formatError: () => formatError,
  globalConfig: () => globalConfig,
  globalRegistry: () => globalRegistry,
  initializeContext: () => initializeContext,
  isValidBase64: () => isValidBase64,
  isValidBase64URL: () => isValidBase64URL,
  isValidJWT: () => isValidJWT,
  locales: () => locales_exports,
  meta: () => meta,
  parse: () => parse,
  parseAsync: () => parseAsync,
  prettifyError: () => prettifyError,
  process: () => process2,
  regexes: () => regexes_exports,
  registry: () => registry,
  safeDecode: () => safeDecode,
  safeDecodeAsync: () => safeDecodeAsync,
  safeEncode: () => safeEncode,
  safeEncodeAsync: () => safeEncodeAsync,
  safeParse: () => safeParse,
  safeParseAsync: () => safeParseAsync,
  toDotPath: () => toDotPath,
  toJSONSchema: () => toJSONSchema,
  treeifyError: () => treeifyError,
  util: () => util_exports,
  version: () => version
});
var init_core2 = __esm({
  "node_modules/zod/v4/core/index.js"() {
    init_core();
    init_parse();
    init_errors();
    init_schemas();
    init_checks();
    init_versions();
    init_util();
    init_regexes();
    init_locales();
    init_registries();
    init_doc();
    init_api();
    init_to_json_schema();
    init_json_schema_processors();
    init_json_schema_generator();
    init_json_schema();
  }
});

// node_modules/zod/v4/classic/checks.js
var checks_exports2 = {};
__export(checks_exports2, {
  endsWith: () => _endsWith,
  gt: () => _gt,
  gte: () => _gte,
  includes: () => _includes,
  length: () => _length,
  lowercase: () => _lowercase,
  lt: () => _lt,
  lte: () => _lte,
  maxLength: () => _maxLength,
  maxSize: () => _maxSize,
  mime: () => _mime,
  minLength: () => _minLength,
  minSize: () => _minSize,
  multipleOf: () => _multipleOf,
  negative: () => _negative,
  nonnegative: () => _nonnegative,
  nonpositive: () => _nonpositive,
  normalize: () => _normalize,
  overwrite: () => _overwrite,
  positive: () => _positive,
  property: () => _property,
  regex: () => _regex,
  size: () => _size,
  slugify: () => _slugify,
  startsWith: () => _startsWith,
  toLowerCase: () => _toLowerCase,
  toUpperCase: () => _toUpperCase,
  trim: () => _trim,
  uppercase: () => _uppercase
});
var init_checks2 = __esm({
  "node_modules/zod/v4/classic/checks.js"() {
    init_core2();
  }
});

// node_modules/zod/v4/classic/iso.js
var iso_exports = {};
__export(iso_exports, {
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  date: () => date2,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
function date2(params) {
  return _isoDate(ZodISODate, params);
}
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}
var ZodISODateTime, ZodISODate, ZodISOTime, ZodISODuration;
var init_iso = __esm({
  "node_modules/zod/v4/classic/iso.js"() {
    init_core2();
    init_schemas2();
    ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
      $ZodISODateTime.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
      $ZodISODate.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
      $ZodISOTime.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
      $ZodISODuration.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
  }
});

// node_modules/zod/v4/classic/errors.js
var initializer2, ZodError, ZodRealError;
var init_errors2 = __esm({
  "node_modules/zod/v4/classic/errors.js"() {
    init_core2();
    init_core2();
    init_util();
    initializer2 = (inst, issues) => {
      $ZodError.init(inst, issues);
      inst.name = "ZodError";
      Object.defineProperties(inst, {
        format: {
          value: (mapper) => formatError(inst, mapper)
          // enumerable: false,
        },
        flatten: {
          value: (mapper) => flattenError(inst, mapper)
          // enumerable: false,
        },
        addIssue: {
          value: (issue2) => {
            inst.issues.push(issue2);
            inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
          }
          // enumerable: false,
        },
        addIssues: {
          value: (issues2) => {
            inst.issues.push(...issues2);
            inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
          }
          // enumerable: false,
        },
        isEmpty: {
          get() {
            return inst.issues.length === 0;
          }
          // enumerable: false,
        }
      });
    };
    ZodError = /* @__PURE__ */ $constructor("ZodError", initializer2);
    ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, {
      Parent: Error
    });
  }
});

// node_modules/zod/v4/classic/parse.js
var parse2, parseAsync2, safeParse2, safeParseAsync2, encode2, decode2, encodeAsync2, decodeAsync2, safeEncode2, safeDecode2, safeEncodeAsync2, safeDecodeAsync2;
var init_parse2 = __esm({
  "node_modules/zod/v4/classic/parse.js"() {
    init_core2();
    init_errors2();
    parse2 = /* @__PURE__ */ _parse(ZodRealError);
    parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
    safeParse2 = /* @__PURE__ */ _safeParse(ZodRealError);
    safeParseAsync2 = /* @__PURE__ */ _safeParseAsync(ZodRealError);
    encode2 = /* @__PURE__ */ _encode(ZodRealError);
    decode2 = /* @__PURE__ */ _decode(ZodRealError);
    encodeAsync2 = /* @__PURE__ */ _encodeAsync(ZodRealError);
    decodeAsync2 = /* @__PURE__ */ _decodeAsync(ZodRealError);
    safeEncode2 = /* @__PURE__ */ _safeEncode(ZodRealError);
    safeDecode2 = /* @__PURE__ */ _safeDecode(ZodRealError);
    safeEncodeAsync2 = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
    safeDecodeAsync2 = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
  }
});

// node_modules/zod/v4/classic/schemas.js
var schemas_exports2 = {};
__export(schemas_exports2, {
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBase64: () => ZodBase64,
  ZodBase64URL: () => ZodBase64URL,
  ZodBigInt: () => ZodBigInt,
  ZodBigIntFormat: () => ZodBigIntFormat,
  ZodBoolean: () => ZodBoolean,
  ZodCIDRv4: () => ZodCIDRv4,
  ZodCIDRv6: () => ZodCIDRv6,
  ZodCUID: () => ZodCUID,
  ZodCUID2: () => ZodCUID2,
  ZodCatch: () => ZodCatch,
  ZodCodec: () => ZodCodec,
  ZodCustom: () => ZodCustom,
  ZodCustomStringFormat: () => ZodCustomStringFormat,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodE164: () => ZodE164,
  ZodEmail: () => ZodEmail,
  ZodEmoji: () => ZodEmoji,
  ZodEnum: () => ZodEnum,
  ZodExactOptional: () => ZodExactOptional,
  ZodFile: () => ZodFile,
  ZodFunction: () => ZodFunction,
  ZodGUID: () => ZodGUID,
  ZodIPv4: () => ZodIPv4,
  ZodIPv6: () => ZodIPv6,
  ZodIntersection: () => ZodIntersection,
  ZodJWT: () => ZodJWT,
  ZodKSUID: () => ZodKSUID,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMAC: () => ZodMAC,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNanoID: () => ZodNanoID,
  ZodNever: () => ZodNever,
  ZodNonOptional: () => ZodNonOptional,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodNumberFormat: () => ZodNumberFormat,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodPipe: () => ZodPipe,
  ZodPrefault: () => ZodPrefault,
  ZodPreprocess: () => ZodPreprocess,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodStringFormat: () => ZodStringFormat,
  ZodSuccess: () => ZodSuccess,
  ZodSymbol: () => ZodSymbol,
  ZodTemplateLiteral: () => ZodTemplateLiteral,
  ZodTransform: () => ZodTransform,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodULID: () => ZodULID,
  ZodURL: () => ZodURL,
  ZodUUID: () => ZodUUID,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  ZodXID: () => ZodXID,
  ZodXor: () => ZodXor,
  _ZodString: () => _ZodString,
  _default: () => _default2,
  _function: () => _function,
  any: () => any,
  array: () => array,
  base64: () => base642,
  base64url: () => base64url2,
  bigint: () => bigint2,
  boolean: () => boolean2,
  catch: () => _catch2,
  check: () => check,
  cidrv4: () => cidrv42,
  cidrv6: () => cidrv62,
  codec: () => codec,
  cuid: () => cuid3,
  cuid2: () => cuid22,
  custom: () => custom,
  date: () => date3,
  describe: () => describe2,
  discriminatedUnion: () => discriminatedUnion,
  e164: () => e1642,
  email: () => email2,
  emoji: () => emoji2,
  enum: () => _enum2,
  exactOptional: () => exactOptional,
  file: () => file,
  float32: () => float32,
  float64: () => float64,
  function: () => _function,
  guid: () => guid2,
  hash: () => hash,
  hex: () => hex2,
  hostname: () => hostname2,
  httpUrl: () => httpUrl,
  instanceof: () => _instanceof,
  int: () => int,
  int32: () => int32,
  int64: () => int64,
  intersection: () => intersection,
  invertCodec: () => invertCodec,
  ipv4: () => ipv42,
  ipv6: () => ipv62,
  json: () => json,
  jwt: () => jwt,
  keyof: () => keyof,
  ksuid: () => ksuid2,
  lazy: () => lazy,
  literal: () => literal,
  looseObject: () => looseObject,
  looseRecord: () => looseRecord,
  mac: () => mac2,
  map: () => map,
  meta: () => meta2,
  nan: () => nan,
  nanoid: () => nanoid2,
  nativeEnum: () => nativeEnum,
  never: () => never,
  nonoptional: () => nonoptional,
  null: () => _null3,
  nullable: () => nullable,
  nullish: () => nullish2,
  number: () => number2,
  object: () => object,
  optional: () => optional,
  partialRecord: () => partialRecord,
  pipe: () => pipe,
  prefault: () => prefault,
  preprocess: () => preprocess,
  promise: () => promise,
  readonly: () => readonly,
  record: () => record,
  refine: () => refine,
  set: () => set,
  strictObject: () => strictObject,
  string: () => string2,
  stringFormat: () => stringFormat,
  stringbool: () => stringbool,
  success: () => success,
  superRefine: () => superRefine,
  symbol: () => symbol,
  templateLiteral: () => templateLiteral,
  transform: () => transform,
  tuple: () => tuple,
  uint32: () => uint32,
  uint64: () => uint64,
  ulid: () => ulid2,
  undefined: () => _undefined3,
  union: () => union,
  unknown: () => unknown,
  url: () => url,
  uuid: () => uuid2,
  uuidv4: () => uuidv4,
  uuidv6: () => uuidv6,
  uuidv7: () => uuidv7,
  void: () => _void2,
  xid: () => xid2,
  xor: () => xor
});
function _installLazyMethods(inst, group, methods) {
  const proto = Object.getPrototypeOf(inst);
  let installed = _installedGroups.get(proto);
  if (!installed) {
    installed = /* @__PURE__ */ new Set();
    _installedGroups.set(proto, installed);
  }
  if (installed.has(group))
    return;
  installed.add(group);
  for (const key in methods) {
    const fn = methods[key];
    Object.defineProperty(proto, key, {
      configurable: true,
      enumerable: false,
      get() {
        const bound = fn.bind(this);
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: bound
        });
        return bound;
      },
      set(v2) {
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: v2
        });
      }
    });
  }
}
function string2(params) {
  return _string(ZodString, params);
}
function email2(params) {
  return _email(ZodEmail, params);
}
function guid2(params) {
  return _guid(ZodGUID, params);
}
function uuid2(params) {
  return _uuid(ZodUUID, params);
}
function uuidv4(params) {
  return _uuidv4(ZodUUID, params);
}
function uuidv6(params) {
  return _uuidv6(ZodUUID, params);
}
function uuidv7(params) {
  return _uuidv7(ZodUUID, params);
}
function url(params) {
  return _url(ZodURL, params);
}
function httpUrl(params) {
  return _url(ZodURL, {
    protocol: regexes_exports.httpProtocol,
    hostname: regexes_exports.domain,
    ...util_exports.normalizeParams(params)
  });
}
function emoji2(params) {
  return _emoji2(ZodEmoji, params);
}
function nanoid2(params) {
  return _nanoid(ZodNanoID, params);
}
function cuid3(params) {
  return _cuid(ZodCUID, params);
}
function cuid22(params) {
  return _cuid2(ZodCUID2, params);
}
function ulid2(params) {
  return _ulid(ZodULID, params);
}
function xid2(params) {
  return _xid(ZodXID, params);
}
function ksuid2(params) {
  return _ksuid(ZodKSUID, params);
}
function ipv42(params) {
  return _ipv4(ZodIPv4, params);
}
function mac2(params) {
  return _mac(ZodMAC, params);
}
function ipv62(params) {
  return _ipv6(ZodIPv6, params);
}
function cidrv42(params) {
  return _cidrv4(ZodCIDRv4, params);
}
function cidrv62(params) {
  return _cidrv6(ZodCIDRv6, params);
}
function base642(params) {
  return _base64(ZodBase64, params);
}
function base64url2(params) {
  return _base64url(ZodBase64URL, params);
}
function e1642(params) {
  return _e164(ZodE164, params);
}
function jwt(params) {
  return _jwt(ZodJWT, params);
}
function stringFormat(format, fnOrRegex, _params = {}) {
  return _stringFormat(ZodCustomStringFormat, format, fnOrRegex, _params);
}
function hostname2(_params) {
  return _stringFormat(ZodCustomStringFormat, "hostname", regexes_exports.hostname, _params);
}
function hex2(_params) {
  return _stringFormat(ZodCustomStringFormat, "hex", regexes_exports.hex, _params);
}
function hash(alg, params) {
  const enc = params?.enc ?? "hex";
  const format = "".concat(alg, "_").concat(enc);
  const regex = regexes_exports[format];
  if (!regex)
    throw new Error("Unrecognized hash format: ".concat(format));
  return _stringFormat(ZodCustomStringFormat, format, regex, params);
}
function number2(params) {
  return _number(ZodNumber, params);
}
function int(params) {
  return _int(ZodNumberFormat, params);
}
function float32(params) {
  return _float32(ZodNumberFormat, params);
}
function float64(params) {
  return _float64(ZodNumberFormat, params);
}
function int32(params) {
  return _int32(ZodNumberFormat, params);
}
function uint32(params) {
  return _uint32(ZodNumberFormat, params);
}
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
function bigint2(params) {
  return _bigint(ZodBigInt, params);
}
function int64(params) {
  return _int64(ZodBigIntFormat, params);
}
function uint64(params) {
  return _uint64(ZodBigIntFormat, params);
}
function symbol(params) {
  return _symbol(ZodSymbol, params);
}
function _undefined3(params) {
  return _undefined2(ZodUndefined, params);
}
function _null3(params) {
  return _null2(ZodNull, params);
}
function any() {
  return _any(ZodAny);
}
function unknown() {
  return _unknown(ZodUnknown);
}
function never(params) {
  return _never(ZodNever, params);
}
function _void2(params) {
  return _void(ZodVoid, params);
}
function date3(params) {
  return _date(ZodDate, params);
}
function array(element, params) {
  return _array(ZodArray, element, params);
}
function keyof(schema) {
  const shape = schema._zod.def.shape;
  return _enum2(Object.keys(shape));
}
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...util_exports.normalizeParams(params)
  };
  return new ZodObject(def);
}
function strictObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: never(),
    ...util_exports.normalizeParams(params)
  });
}
function looseObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: unknown(),
    ...util_exports.normalizeParams(params)
  });
}
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...util_exports.normalizeParams(params)
  });
}
function xor(options, params) {
  return new ZodXor({
    type: "union",
    options,
    inclusive: false,
    ...util_exports.normalizeParams(params)
  });
}
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...util_exports.normalizeParams(params)
  });
}
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
function tuple(items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new ZodTuple({
    type: "tuple",
    items,
    rest,
    ...util_exports.normalizeParams(params)
  });
}
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string2(),
      valueType: keyType,
      ...util_exports.normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function partialRecord(keyType, valueType, params) {
  const k2 = clone(keyType);
  k2._zod.values = void 0;
  return new ZodRecord({
    type: "record",
    keyType: k2,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function looseRecord(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    mode: "loose",
    ...util_exports.normalizeParams(params)
  });
}
function map(keyType, valueType, params) {
  return new ZodMap({
    type: "map",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function set(valueType, params) {
  return new ZodSet({
    type: "set",
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function _enum2(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v2) => [v2, v2])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
function nativeEnum(entries, params) {
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params)
  });
}
function file(params) {
  return _file(ZodFile, params);
}
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
function nullish2(innerType) {
  return optional(nullable(innerType));
}
function _default2(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...util_exports.normalizeParams(params)
  });
}
function success(innerType) {
  return new ZodSuccess({
    type: "success",
    innerType
  });
}
function _catch2(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
function nan(params) {
  return _nan(ZodNaN, params);
}
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
function codec(in_, out, params) {
  return new ZodCodec({
    type: "pipe",
    in: in_,
    out,
    transform: params.decode,
    reverseTransform: params.encode
  });
}
function invertCodec(codec2) {
  const def = codec2._zod.def;
  return new ZodCodec({
    type: "pipe",
    in: def.out,
    out: def.in,
    transform: def.reverseTransform,
    reverseTransform: def.transform
  });
}
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
function templateLiteral(parts, params) {
  return new ZodTemplateLiteral({
    type: "template_literal",
    parts,
    ...util_exports.normalizeParams(params)
  });
}
function lazy(getter) {
  return new ZodLazy({
    type: "lazy",
    getter
  });
}
function promise(innerType) {
  return new ZodPromise({
    type: "promise",
    innerType
  });
}
function _function(params) {
  return new ZodFunction({
    type: "function",
    input: Array.isArray(params?.input) ? tuple(params?.input) : params?.input ?? array(unknown()),
    output: params?.output ?? unknown()
  });
}
function check(fn) {
  const ch = new $ZodCheck({
    check: "custom"
    // ...util.normalizeParams(params),
  });
  ch._zod.check = fn;
  return ch;
}
function custom(fn, _params) {
  return _custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
function _instanceof(cls, params = {}) {
  const inst = new ZodCustom({
    type: "custom",
    check: "custom",
    fn: (data) => data instanceof cls,
    abort: true,
    ...util_exports.normalizeParams(params)
  });
  inst._zod.bag.Class = cls;
  inst._zod.check = (payload) => {
    if (!(payload.value instanceof cls)) {
      payload.issues.push({
        code: "invalid_type",
        expected: cls.name,
        input: payload.value,
        inst,
        path: [...inst._zod.def.path ?? []]
      });
    }
  };
  return inst;
}
function json(params) {
  const jsonSchema = lazy(() => {
    return union([string2(params), number2(), boolean2(), _null3(), array(jsonSchema), record(string2(), jsonSchema)]);
  });
  return jsonSchema;
}
function preprocess(fn, schema) {
  return new ZodPreprocess({
    type: "pipe",
    in: transform(fn),
    out: schema
  });
}
var _installedGroups, ZodType, _ZodString, ZodString, ZodStringFormat, ZodEmail, ZodGUID, ZodUUID, ZodURL, ZodEmoji, ZodNanoID, ZodCUID, ZodCUID2, ZodULID, ZodXID, ZodKSUID, ZodIPv4, ZodMAC, ZodIPv6, ZodCIDRv4, ZodCIDRv6, ZodBase64, ZodBase64URL, ZodE164, ZodJWT, ZodCustomStringFormat, ZodNumber, ZodNumberFormat, ZodBoolean, ZodBigInt, ZodBigIntFormat, ZodSymbol, ZodUndefined, ZodNull, ZodAny, ZodUnknown, ZodNever, ZodVoid, ZodDate, ZodArray, ZodObject, ZodUnion, ZodXor, ZodDiscriminatedUnion, ZodIntersection, ZodTuple, ZodRecord, ZodMap, ZodSet, ZodEnum, ZodLiteral, ZodFile, ZodTransform, ZodOptional, ZodExactOptional, ZodNullable, ZodDefault, ZodPrefault, ZodNonOptional, ZodSuccess, ZodCatch, ZodNaN, ZodPipe, ZodCodec, ZodPreprocess, ZodReadonly, ZodTemplateLiteral, ZodLazy, ZodPromise, ZodFunction, ZodCustom, describe2, meta2, stringbool;
var init_schemas2 = __esm({
  "node_modules/zod/v4/classic/schemas.js"() {
    init_core2();
    init_core2();
    init_json_schema_processors();
    init_to_json_schema();
    init_checks2();
    init_iso();
    init_parse2();
    _installedGroups = /* @__PURE__ */ new WeakMap();
    ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
      $ZodType.init(inst, def);
      Object.assign(inst["~standard"], {
        jsonSchema: {
          input: createStandardJSONSchemaMethod(inst, "input"),
          output: createStandardJSONSchemaMethod(inst, "output")
        }
      });
      inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
      inst.def = def;
      inst.type = def.type;
      Object.defineProperty(inst, "_def", { value: def });
      inst.parse = (data, params) => parse2(inst, data, params, { callee: inst.parse });
      inst.safeParse = (data, params) => safeParse2(inst, data, params);
      inst.parseAsync = async (data, params) => parseAsync2(inst, data, params, { callee: inst.parseAsync });
      inst.safeParseAsync = async (data, params) => safeParseAsync2(inst, data, params);
      inst.spa = inst.safeParseAsync;
      inst.encode = (data, params) => encode2(inst, data, params);
      inst.decode = (data, params) => decode2(inst, data, params);
      inst.encodeAsync = async (data, params) => encodeAsync2(inst, data, params);
      inst.decodeAsync = async (data, params) => decodeAsync2(inst, data, params);
      inst.safeEncode = (data, params) => safeEncode2(inst, data, params);
      inst.safeDecode = (data, params) => safeDecode2(inst, data, params);
      inst.safeEncodeAsync = async (data, params) => safeEncodeAsync2(inst, data, params);
      inst.safeDecodeAsync = async (data, params) => safeDecodeAsync2(inst, data, params);
      _installLazyMethods(inst, "ZodType", {
        check(...chks) {
          const def2 = this.def;
          return this.clone(util_exports.mergeDefs(def2, {
            checks: [
              ...def2.checks ?? [],
              ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
            ]
          }), { parent: true });
        },
        with(...chks) {
          return this.check(...chks);
        },
        clone(def2, params) {
          return clone(this, def2, params);
        },
        brand() {
          return this;
        },
        register(reg, meta3) {
          reg.add(this, meta3);
          return this;
        },
        refine(check2, params) {
          return this.check(refine(check2, params));
        },
        superRefine(refinement, params) {
          return this.check(superRefine(refinement, params));
        },
        overwrite(fn) {
          return this.check(_overwrite(fn));
        },
        optional() {
          return optional(this);
        },
        exactOptional() {
          return exactOptional(this);
        },
        nullable() {
          return nullable(this);
        },
        nullish() {
          return optional(nullable(this));
        },
        nonoptional(params) {
          return nonoptional(this, params);
        },
        array() {
          return array(this);
        },
        or(arg) {
          return union([this, arg]);
        },
        and(arg) {
          return intersection(this, arg);
        },
        transform(tx) {
          return pipe(this, transform(tx));
        },
        default(d2) {
          return _default2(this, d2);
        },
        prefault(d2) {
          return prefault(this, d2);
        },
        catch(params) {
          return _catch2(this, params);
        },
        pipe(target) {
          return pipe(this, target);
        },
        readonly() {
          return readonly(this);
        },
        describe(description) {
          const cl = this.clone();
          globalRegistry.add(cl, { description });
          return cl;
        },
        meta(...args) {
          if (args.length === 0)
            return globalRegistry.get(this);
          const cl = this.clone();
          globalRegistry.add(cl, args[0]);
          return cl;
        },
        isOptional() {
          return this.safeParse(void 0).success;
        },
        isNullable() {
          return this.safeParse(null).success;
        },
        apply(fn) {
          return fn(this);
        }
      });
      Object.defineProperty(inst, "description", {
        get() {
          return globalRegistry.get(inst)?.description;
        },
        configurable: true
      });
      return inst;
    });
    _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
      $ZodString.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => stringProcessor(inst, ctx, json2, params);
      const bag = inst._zod.bag;
      inst.format = bag.format ?? null;
      inst.minLength = bag.minimum ?? null;
      inst.maxLength = bag.maximum ?? null;
      _installLazyMethods(inst, "_ZodString", {
        regex(...args) {
          return this.check(_regex(...args));
        },
        includes(...args) {
          return this.check(_includes(...args));
        },
        startsWith(...args) {
          return this.check(_startsWith(...args));
        },
        endsWith(...args) {
          return this.check(_endsWith(...args));
        },
        min(...args) {
          return this.check(_minLength(...args));
        },
        max(...args) {
          return this.check(_maxLength(...args));
        },
        length(...args) {
          return this.check(_length(...args));
        },
        nonempty(...args) {
          return this.check(_minLength(1, ...args));
        },
        lowercase(params) {
          return this.check(_lowercase(params));
        },
        uppercase(params) {
          return this.check(_uppercase(params));
        },
        trim() {
          return this.check(_trim());
        },
        normalize(...args) {
          return this.check(_normalize(...args));
        },
        toLowerCase() {
          return this.check(_toLowerCase());
        },
        toUpperCase() {
          return this.check(_toUpperCase());
        },
        slugify() {
          return this.check(_slugify());
        }
      });
    });
    ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
      $ZodString.init(inst, def);
      _ZodString.init(inst, def);
      inst.email = (params) => inst.check(_email(ZodEmail, params));
      inst.url = (params) => inst.check(_url(ZodURL, params));
      inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
      inst.emoji = (params) => inst.check(_emoji2(ZodEmoji, params));
      inst.guid = (params) => inst.check(_guid(ZodGUID, params));
      inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
      inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
      inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
      inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
      inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
      inst.guid = (params) => inst.check(_guid(ZodGUID, params));
      inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
      inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
      inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
      inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
      inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
      inst.xid = (params) => inst.check(_xid(ZodXID, params));
      inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
      inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
      inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
      inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
      inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
      inst.e164 = (params) => inst.check(_e164(ZodE164, params));
      inst.datetime = (params) => inst.check(datetime2(params));
      inst.date = (params) => inst.check(date2(params));
      inst.time = (params) => inst.check(time2(params));
      inst.duration = (params) => inst.check(duration2(params));
    });
    ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
      $ZodStringFormat.init(inst, def);
      _ZodString.init(inst, def);
    });
    ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
      $ZodEmail.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
      $ZodGUID.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
      $ZodUUID.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
      $ZodURL.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
      $ZodEmoji.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
      $ZodNanoID.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
      $ZodCUID.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
      $ZodCUID2.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
      $ZodULID.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
      $ZodXID.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
      $ZodKSUID.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
      $ZodIPv4.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodMAC = /* @__PURE__ */ $constructor("ZodMAC", (inst, def) => {
      $ZodMAC.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
      $ZodIPv6.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
      $ZodCIDRv4.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
      $ZodCIDRv6.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
      $ZodBase64.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
      $ZodBase64URL.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
      $ZodE164.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
      $ZodJWT.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodCustomStringFormat = /* @__PURE__ */ $constructor("ZodCustomStringFormat", (inst, def) => {
      $ZodCustomStringFormat.init(inst, def);
      ZodStringFormat.init(inst, def);
    });
    ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
      $ZodNumber.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => numberProcessor(inst, ctx, json2, params);
      _installLazyMethods(inst, "ZodNumber", {
        gt(value, params) {
          return this.check(_gt(value, params));
        },
        gte(value, params) {
          return this.check(_gte(value, params));
        },
        min(value, params) {
          return this.check(_gte(value, params));
        },
        lt(value, params) {
          return this.check(_lt(value, params));
        },
        lte(value, params) {
          return this.check(_lte(value, params));
        },
        max(value, params) {
          return this.check(_lte(value, params));
        },
        int(params) {
          return this.check(int(params));
        },
        safe(params) {
          return this.check(int(params));
        },
        positive(params) {
          return this.check(_gt(0, params));
        },
        nonnegative(params) {
          return this.check(_gte(0, params));
        },
        negative(params) {
          return this.check(_lt(0, params));
        },
        nonpositive(params) {
          return this.check(_lte(0, params));
        },
        multipleOf(value, params) {
          return this.check(_multipleOf(value, params));
        },
        step(value, params) {
          return this.check(_multipleOf(value, params));
        },
        finite() {
          return this;
        }
      });
      const bag = inst._zod.bag;
      inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
      inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
      inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
      inst.isFinite = true;
      inst.format = bag.format ?? null;
    });
    ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
      $ZodNumberFormat.init(inst, def);
      ZodNumber.init(inst, def);
    });
    ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
      $ZodBoolean.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => booleanProcessor(inst, ctx, json2, params);
    });
    ZodBigInt = /* @__PURE__ */ $constructor("ZodBigInt", (inst, def) => {
      $ZodBigInt.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => bigintProcessor(inst, ctx, json2, params);
      inst.gte = (value, params) => inst.check(_gte(value, params));
      inst.min = (value, params) => inst.check(_gte(value, params));
      inst.gt = (value, params) => inst.check(_gt(value, params));
      inst.gte = (value, params) => inst.check(_gte(value, params));
      inst.min = (value, params) => inst.check(_gte(value, params));
      inst.lt = (value, params) => inst.check(_lt(value, params));
      inst.lte = (value, params) => inst.check(_lte(value, params));
      inst.max = (value, params) => inst.check(_lte(value, params));
      inst.positive = (params) => inst.check(_gt(BigInt(0), params));
      inst.negative = (params) => inst.check(_lt(BigInt(0), params));
      inst.nonpositive = (params) => inst.check(_lte(BigInt(0), params));
      inst.nonnegative = (params) => inst.check(_gte(BigInt(0), params));
      inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
      const bag = inst._zod.bag;
      inst.minValue = bag.minimum ?? null;
      inst.maxValue = bag.maximum ?? null;
      inst.format = bag.format ?? null;
    });
    ZodBigIntFormat = /* @__PURE__ */ $constructor("ZodBigIntFormat", (inst, def) => {
      $ZodBigIntFormat.init(inst, def);
      ZodBigInt.init(inst, def);
    });
    ZodSymbol = /* @__PURE__ */ $constructor("ZodSymbol", (inst, def) => {
      $ZodSymbol.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => symbolProcessor(inst, ctx, json2, params);
    });
    ZodUndefined = /* @__PURE__ */ $constructor("ZodUndefined", (inst, def) => {
      $ZodUndefined.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => undefinedProcessor(inst, ctx, json2, params);
    });
    ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
      $ZodNull.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => nullProcessor(inst, ctx, json2, params);
    });
    ZodAny = /* @__PURE__ */ $constructor("ZodAny", (inst, def) => {
      $ZodAny.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => anyProcessor(inst, ctx, json2, params);
    });
    ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
      $ZodUnknown.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => unknownProcessor(inst, ctx, json2, params);
    });
    ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
      $ZodNever.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => neverProcessor(inst, ctx, json2, params);
    });
    ZodVoid = /* @__PURE__ */ $constructor("ZodVoid", (inst, def) => {
      $ZodVoid.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => voidProcessor(inst, ctx, json2, params);
    });
    ZodDate = /* @__PURE__ */ $constructor("ZodDate", (inst, def) => {
      $ZodDate.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => dateProcessor(inst, ctx, json2, params);
      inst.min = (value, params) => inst.check(_gte(value, params));
      inst.max = (value, params) => inst.check(_lte(value, params));
      const c = inst._zod.bag;
      inst.minDate = c.minimum ? new Date(c.minimum) : null;
      inst.maxDate = c.maximum ? new Date(c.maximum) : null;
    });
    ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
      $ZodArray.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => arrayProcessor(inst, ctx, json2, params);
      inst.element = def.element;
      _installLazyMethods(inst, "ZodArray", {
        min(n, params) {
          return this.check(_minLength(n, params));
        },
        nonempty(params) {
          return this.check(_minLength(1, params));
        },
        max(n, params) {
          return this.check(_maxLength(n, params));
        },
        length(n, params) {
          return this.check(_length(n, params));
        },
        unwrap() {
          return this.element;
        }
      });
    });
    ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
      $ZodObjectJIT.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => objectProcessor(inst, ctx, json2, params);
      util_exports.defineLazy(inst, "shape", () => {
        return def.shape;
      });
      _installLazyMethods(inst, "ZodObject", {
        keyof() {
          return _enum2(Object.keys(this._zod.def.shape));
        },
        catchall(catchall) {
          return this.clone({ ...this._zod.def, catchall });
        },
        passthrough() {
          return this.clone({ ...this._zod.def, catchall: unknown() });
        },
        loose() {
          return this.clone({ ...this._zod.def, catchall: unknown() });
        },
        strict() {
          return this.clone({ ...this._zod.def, catchall: never() });
        },
        strip() {
          return this.clone({ ...this._zod.def, catchall: void 0 });
        },
        extend(incoming) {
          return util_exports.extend(this, incoming);
        },
        safeExtend(incoming) {
          return util_exports.safeExtend(this, incoming);
        },
        merge(other) {
          return util_exports.merge(this, other);
        },
        pick(mask) {
          return util_exports.pick(this, mask);
        },
        omit(mask) {
          return util_exports.omit(this, mask);
        },
        partial(...args) {
          return util_exports.partial(ZodOptional, this, args[0]);
        },
        required(...args) {
          return util_exports.required(ZodNonOptional, this, args[0]);
        }
      });
    });
    ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
      $ZodUnion.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => unionProcessor(inst, ctx, json2, params);
      inst.options = def.options;
    });
    ZodXor = /* @__PURE__ */ $constructor("ZodXor", (inst, def) => {
      ZodUnion.init(inst, def);
      $ZodXor.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => unionProcessor(inst, ctx, json2, params);
      inst.options = def.options;
    });
    ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
      ZodUnion.init(inst, def);
      $ZodDiscriminatedUnion.init(inst, def);
    });
    ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
      $ZodIntersection.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => intersectionProcessor(inst, ctx, json2, params);
    });
    ZodTuple = /* @__PURE__ */ $constructor("ZodTuple", (inst, def) => {
      $ZodTuple.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => tupleProcessor(inst, ctx, json2, params);
      inst.rest = (rest) => inst.clone({
        ...inst._zod.def,
        rest
      });
    });
    ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
      $ZodRecord.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => recordProcessor(inst, ctx, json2, params);
      inst.keyType = def.keyType;
      inst.valueType = def.valueType;
    });
    ZodMap = /* @__PURE__ */ $constructor("ZodMap", (inst, def) => {
      $ZodMap.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => mapProcessor(inst, ctx, json2, params);
      inst.keyType = def.keyType;
      inst.valueType = def.valueType;
      inst.min = (...args) => inst.check(_minSize(...args));
      inst.nonempty = (params) => inst.check(_minSize(1, params));
      inst.max = (...args) => inst.check(_maxSize(...args));
      inst.size = (...args) => inst.check(_size(...args));
    });
    ZodSet = /* @__PURE__ */ $constructor("ZodSet", (inst, def) => {
      $ZodSet.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => setProcessor(inst, ctx, json2, params);
      inst.min = (...args) => inst.check(_minSize(...args));
      inst.nonempty = (params) => inst.check(_minSize(1, params));
      inst.max = (...args) => inst.check(_maxSize(...args));
      inst.size = (...args) => inst.check(_size(...args));
    });
    ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
      $ZodEnum.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => enumProcessor(inst, ctx, json2, params);
      inst.enum = def.entries;
      inst.options = Object.values(def.entries);
      const keys = new Set(Object.keys(def.entries));
      inst.extract = (values, params) => {
        const newEntries = {};
        for (const value of values) {
          if (keys.has(value)) {
            newEntries[value] = def.entries[value];
          } else
            throw new Error("Key ".concat(value, " not found in enum"));
        }
        return new ZodEnum({
          ...def,
          checks: [],
          ...util_exports.normalizeParams(params),
          entries: newEntries
        });
      };
      inst.exclude = (values, params) => {
        const newEntries = { ...def.entries };
        for (const value of values) {
          if (keys.has(value)) {
            delete newEntries[value];
          } else
            throw new Error("Key ".concat(value, " not found in enum"));
        }
        return new ZodEnum({
          ...def,
          checks: [],
          ...util_exports.normalizeParams(params),
          entries: newEntries
        });
      };
    });
    ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
      $ZodLiteral.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => literalProcessor(inst, ctx, json2, params);
      inst.values = new Set(def.values);
      Object.defineProperty(inst, "value", {
        get() {
          if (def.values.length > 1) {
            throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
          }
          return def.values[0];
        }
      });
    });
    ZodFile = /* @__PURE__ */ $constructor("ZodFile", (inst, def) => {
      $ZodFile.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => fileProcessor(inst, ctx, json2, params);
      inst.min = (size, params) => inst.check(_minSize(size, params));
      inst.max = (size, params) => inst.check(_maxSize(size, params));
      inst.mime = (types, params) => inst.check(_mime(Array.isArray(types) ? types : [types], params));
    });
    ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
      $ZodTransform.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => transformProcessor(inst, ctx, json2, params);
      inst._zod.parse = (payload, _ctx) => {
        if (_ctx.direction === "backward") {
          throw new $ZodEncodeError(inst.constructor.name);
        }
        payload.addIssue = (issue2) => {
          if (typeof issue2 === "string") {
            payload.issues.push(util_exports.issue(issue2, payload.value, def));
          } else {
            const _issue = issue2;
            if (_issue.fatal)
              _issue.continue = false;
            _issue.code ?? (_issue.code = "custom");
            _issue.input ?? (_issue.input = payload.value);
            _issue.inst ?? (_issue.inst = inst);
            payload.issues.push(util_exports.issue(_issue));
          }
        };
        const output = def.transform(payload.value, payload);
        if (output instanceof Promise) {
          return output.then((output2) => {
            payload.value = output2;
            payload.fallback = true;
            return payload;
          });
        }
        payload.value = output;
        payload.fallback = true;
        return payload;
      };
    });
    ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
      $ZodOptional.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => optionalProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
      $ZodExactOptional.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => optionalProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
      $ZodNullable.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => nullableProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
      $ZodDefault.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => defaultProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
      inst.removeDefault = inst.unwrap;
    });
    ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
      $ZodPrefault.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => prefaultProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
      $ZodNonOptional.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => nonoptionalProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    ZodSuccess = /* @__PURE__ */ $constructor("ZodSuccess", (inst, def) => {
      $ZodSuccess.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => successProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
      $ZodCatch.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => catchProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
      inst.removeCatch = inst.unwrap;
    });
    ZodNaN = /* @__PURE__ */ $constructor("ZodNaN", (inst, def) => {
      $ZodNaN.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => nanProcessor(inst, ctx, json2, params);
    });
    ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
      $ZodPipe.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => pipeProcessor(inst, ctx, json2, params);
      inst.in = def.in;
      inst.out = def.out;
    });
    ZodCodec = /* @__PURE__ */ $constructor("ZodCodec", (inst, def) => {
      ZodPipe.init(inst, def);
      $ZodCodec.init(inst, def);
    });
    ZodPreprocess = /* @__PURE__ */ $constructor("ZodPreprocess", (inst, def) => {
      ZodPipe.init(inst, def);
      $ZodPreprocess.init(inst, def);
    });
    ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
      $ZodReadonly.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => readonlyProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    ZodTemplateLiteral = /* @__PURE__ */ $constructor("ZodTemplateLiteral", (inst, def) => {
      $ZodTemplateLiteral.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => templateLiteralProcessor(inst, ctx, json2, params);
    });
    ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
      $ZodLazy.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => lazyProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.getter();
    });
    ZodPromise = /* @__PURE__ */ $constructor("ZodPromise", (inst, def) => {
      $ZodPromise.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => promiseProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    ZodFunction = /* @__PURE__ */ $constructor("ZodFunction", (inst, def) => {
      $ZodFunction.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => functionProcessor(inst, ctx, json2, params);
    });
    ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
      $ZodCustom.init(inst, def);
      ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => customProcessor(inst, ctx, json2, params);
    });
    describe2 = describe;
    meta2 = meta;
    stringbool = (...args) => _stringbool({
      Codec: ZodCodec,
      Boolean: ZodBoolean,
      String: ZodString
    }, ...args);
  }
});

// node_modules/zod/v4/classic/compat.js
function setErrorMap(map2) {
  config({
    customError: map2
  });
}
function getErrorMap() {
  return config().customError;
}
var ZodIssueCode, ZodFirstPartyTypeKind;
var init_compat = __esm({
  "node_modules/zod/v4/classic/compat.js"() {
    init_core2();
    ZodIssueCode = {
      invalid_type: "invalid_type",
      too_big: "too_big",
      too_small: "too_small",
      invalid_format: "invalid_format",
      not_multiple_of: "not_multiple_of",
      unrecognized_keys: "unrecognized_keys",
      invalid_union: "invalid_union",
      invalid_key: "invalid_key",
      invalid_element: "invalid_element",
      invalid_value: "invalid_value",
      custom: "custom"
    };
    /* @__PURE__ */ (function(ZodFirstPartyTypeKind2) {
    })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
  }
});

// node_modules/zod/v4/classic/from-json-schema.js
function detectVersion(schema, defaultTarget) {
  const $schema = schema.$schema;
  if ($schema === "https://json-schema.org/draft/2020-12/schema") {
    return "draft-2020-12";
  }
  if ($schema === "http://json-schema.org/draft-07/schema#") {
    return "draft-7";
  }
  if ($schema === "http://json-schema.org/draft-04/schema#") {
    return "draft-4";
  }
  return defaultTarget ?? "draft-2020-12";
}
function resolveRef(ref, ctx) {
  if (!ref.startsWith("#")) {
    throw new Error("External $ref is not supported, only local refs (#/...) are allowed");
  }
  const path2 = ref.slice(1).split("/").filter(Boolean);
  if (path2.length === 0) {
    return ctx.rootSchema;
  }
  const defsKey = ctx.version === "draft-2020-12" ? "$defs" : "definitions";
  if (path2[0] === defsKey) {
    const key = path2[1];
    if (!key || !ctx.defs[key]) {
      throw new Error("Reference not found: ".concat(ref));
    }
    return ctx.defs[key];
  }
  throw new Error("Reference not found: ".concat(ref));
}
function convertBaseSchema(schema, ctx) {
  if (schema.not !== void 0) {
    if (typeof schema.not === "object" && Object.keys(schema.not).length === 0) {
      return z.never();
    }
    throw new Error("not is not supported in Zod (except { not: {} } for never)");
  }
  if (schema.unevaluatedItems !== void 0) {
    throw new Error("unevaluatedItems is not supported");
  }
  if (schema.unevaluatedProperties !== void 0) {
    throw new Error("unevaluatedProperties is not supported");
  }
  if (schema.if !== void 0 || schema.then !== void 0 || schema.else !== void 0) {
    throw new Error("Conditional schemas (if/then/else) are not supported");
  }
  if (schema.dependentSchemas !== void 0 || schema.dependentRequired !== void 0) {
    throw new Error("dependentSchemas and dependentRequired are not supported");
  }
  if (schema.$ref) {
    const refPath = schema.$ref;
    if (ctx.refs.has(refPath)) {
      return ctx.refs.get(refPath);
    }
    if (ctx.processing.has(refPath)) {
      return z.lazy(() => {
        if (!ctx.refs.has(refPath)) {
          throw new Error("Circular reference not resolved: ".concat(refPath));
        }
        return ctx.refs.get(refPath);
      });
    }
    ctx.processing.add(refPath);
    const resolved = resolveRef(refPath, ctx);
    const zodSchema2 = convertSchema(resolved, ctx);
    ctx.refs.set(refPath, zodSchema2);
    ctx.processing.delete(refPath);
    return zodSchema2;
  }
  if (schema.enum !== void 0) {
    const enumValues = schema.enum;
    if (ctx.version === "openapi-3.0" && schema.nullable === true && enumValues.length === 1 && enumValues[0] === null) {
      return z.null();
    }
    if (enumValues.length === 0) {
      return z.never();
    }
    if (enumValues.length === 1) {
      return z.literal(enumValues[0]);
    }
    if (enumValues.every((v2) => typeof v2 === "string")) {
      return z.enum(enumValues);
    }
    const literalSchemas = enumValues.map((v2) => z.literal(v2));
    if (literalSchemas.length < 2) {
      return literalSchemas[0];
    }
    return z.union([literalSchemas[0], literalSchemas[1], ...literalSchemas.slice(2)]);
  }
  if (schema.const !== void 0) {
    return z.literal(schema.const);
  }
  const type = schema.type;
  if (Array.isArray(type)) {
    const typeSchemas = type.map((t) => {
      const typeSchema = { ...schema, type: t };
      return convertBaseSchema(typeSchema, ctx);
    });
    if (typeSchemas.length === 0) {
      return z.never();
    }
    if (typeSchemas.length === 1) {
      return typeSchemas[0];
    }
    return z.union(typeSchemas);
  }
  if (!type) {
    return z.any();
  }
  let zodSchema;
  switch (type) {
    case "string": {
      let stringSchema = z.string();
      if (schema.format) {
        const format = schema.format;
        if (format === "email") {
          stringSchema = stringSchema.check(z.email());
        } else if (format === "uri" || format === "uri-reference") {
          stringSchema = stringSchema.check(z.url());
        } else if (format === "uuid" || format === "guid") {
          stringSchema = stringSchema.check(z.uuid());
        } else if (format === "date-time") {
          stringSchema = stringSchema.check(z.iso.datetime());
        } else if (format === "date") {
          stringSchema = stringSchema.check(z.iso.date());
        } else if (format === "time") {
          stringSchema = stringSchema.check(z.iso.time());
        } else if (format === "duration") {
          stringSchema = stringSchema.check(z.iso.duration());
        } else if (format === "ipv4") {
          stringSchema = stringSchema.check(z.ipv4());
        } else if (format === "ipv6") {
          stringSchema = stringSchema.check(z.ipv6());
        } else if (format === "mac") {
          stringSchema = stringSchema.check(z.mac());
        } else if (format === "cidr") {
          stringSchema = stringSchema.check(z.cidrv4());
        } else if (format === "cidr-v6") {
          stringSchema = stringSchema.check(z.cidrv6());
        } else if (format === "base64") {
          stringSchema = stringSchema.check(z.base64());
        } else if (format === "base64url") {
          stringSchema = stringSchema.check(z.base64url());
        } else if (format === "e164") {
          stringSchema = stringSchema.check(z.e164());
        } else if (format === "jwt") {
          stringSchema = stringSchema.check(z.jwt());
        } else if (format === "emoji") {
          stringSchema = stringSchema.check(z.emoji());
        } else if (format === "nanoid") {
          stringSchema = stringSchema.check(z.nanoid());
        } else if (format === "cuid") {
          stringSchema = stringSchema.check(z.cuid());
        } else if (format === "cuid2") {
          stringSchema = stringSchema.check(z.cuid2());
        } else if (format === "ulid") {
          stringSchema = stringSchema.check(z.ulid());
        } else if (format === "xid") {
          stringSchema = stringSchema.check(z.xid());
        } else if (format === "ksuid") {
          stringSchema = stringSchema.check(z.ksuid());
        }
      }
      if (typeof schema.minLength === "number") {
        stringSchema = stringSchema.min(schema.minLength);
      }
      if (typeof schema.maxLength === "number") {
        stringSchema = stringSchema.max(schema.maxLength);
      }
      if (schema.pattern) {
        stringSchema = stringSchema.regex(new RegExp(schema.pattern));
      }
      zodSchema = stringSchema;
      break;
    }
    case "number":
    case "integer": {
      let numberSchema = type === "integer" ? z.number().int() : z.number();
      if (typeof schema.minimum === "number") {
        numberSchema = numberSchema.min(schema.minimum);
      }
      if (typeof schema.maximum === "number") {
        numberSchema = numberSchema.max(schema.maximum);
      }
      if (typeof schema.exclusiveMinimum === "number") {
        numberSchema = numberSchema.gt(schema.exclusiveMinimum);
      } else if (schema.exclusiveMinimum === true && typeof schema.minimum === "number") {
        numberSchema = numberSchema.gt(schema.minimum);
      }
      if (typeof schema.exclusiveMaximum === "number") {
        numberSchema = numberSchema.lt(schema.exclusiveMaximum);
      } else if (schema.exclusiveMaximum === true && typeof schema.maximum === "number") {
        numberSchema = numberSchema.lt(schema.maximum);
      }
      if (typeof schema.multipleOf === "number") {
        numberSchema = numberSchema.multipleOf(schema.multipleOf);
      }
      zodSchema = numberSchema;
      break;
    }
    case "boolean": {
      zodSchema = z.boolean();
      break;
    }
    case "null": {
      zodSchema = z.null();
      break;
    }
    case "object": {
      const shape = {};
      const properties = schema.properties || {};
      const requiredSet = new Set(schema.required || []);
      for (const [key, propSchema] of Object.entries(properties)) {
        const propZodSchema = convertSchema(propSchema, ctx);
        shape[key] = requiredSet.has(key) ? propZodSchema : propZodSchema.optional();
      }
      if (schema.propertyNames) {
        const keySchema = convertSchema(schema.propertyNames, ctx);
        const valueSchema = schema.additionalProperties && typeof schema.additionalProperties === "object" ? convertSchema(schema.additionalProperties, ctx) : z.any();
        if (Object.keys(shape).length === 0) {
          zodSchema = z.record(keySchema, valueSchema);
          break;
        }
        const objectSchema2 = z.object(shape).passthrough();
        const recordSchema = z.looseRecord(keySchema, valueSchema);
        zodSchema = z.intersection(objectSchema2, recordSchema);
        break;
      }
      if (schema.patternProperties) {
        const patternProps = schema.patternProperties;
        const patternKeys = Object.keys(patternProps);
        const looseRecords = [];
        for (const pattern of patternKeys) {
          const patternValue = convertSchema(patternProps[pattern], ctx);
          const keySchema = z.string().regex(new RegExp(pattern));
          looseRecords.push(z.looseRecord(keySchema, patternValue));
        }
        const schemasToIntersect = [];
        if (Object.keys(shape).length > 0) {
          schemasToIntersect.push(z.object(shape).passthrough());
        }
        schemasToIntersect.push(...looseRecords);
        if (schemasToIntersect.length === 0) {
          zodSchema = z.object({}).passthrough();
        } else if (schemasToIntersect.length === 1) {
          zodSchema = schemasToIntersect[0];
        } else {
          let result = z.intersection(schemasToIntersect[0], schemasToIntersect[1]);
          for (let i2 = 2; i2 < schemasToIntersect.length; i2++) {
            result = z.intersection(result, schemasToIntersect[i2]);
          }
          zodSchema = result;
        }
        break;
      }
      const objectSchema = z.object(shape);
      if (schema.additionalProperties === false) {
        zodSchema = objectSchema.strict();
      } else if (typeof schema.additionalProperties === "object") {
        zodSchema = objectSchema.catchall(convertSchema(schema.additionalProperties, ctx));
      } else {
        zodSchema = objectSchema.passthrough();
      }
      break;
    }
    case "array": {
      const prefixItems = schema.prefixItems;
      const items = schema.items;
      if (prefixItems && Array.isArray(prefixItems)) {
        const tupleItems = prefixItems.map((item) => convertSchema(item, ctx));
        const rest = items && typeof items === "object" && !Array.isArray(items) ? convertSchema(items, ctx) : void 0;
        if (rest) {
          zodSchema = z.tuple(tupleItems).rest(rest);
        } else {
          zodSchema = z.tuple(tupleItems);
        }
        if (typeof schema.minItems === "number") {
          zodSchema = zodSchema.check(z.minLength(schema.minItems));
        }
        if (typeof schema.maxItems === "number") {
          zodSchema = zodSchema.check(z.maxLength(schema.maxItems));
        }
      } else if (Array.isArray(items)) {
        const tupleItems = items.map((item) => convertSchema(item, ctx));
        const rest = schema.additionalItems && typeof schema.additionalItems === "object" ? convertSchema(schema.additionalItems, ctx) : void 0;
        if (rest) {
          zodSchema = z.tuple(tupleItems).rest(rest);
        } else {
          zodSchema = z.tuple(tupleItems);
        }
        if (typeof schema.minItems === "number") {
          zodSchema = zodSchema.check(z.minLength(schema.minItems));
        }
        if (typeof schema.maxItems === "number") {
          zodSchema = zodSchema.check(z.maxLength(schema.maxItems));
        }
      } else if (items !== void 0) {
        const element = convertSchema(items, ctx);
        let arraySchema = z.array(element);
        if (typeof schema.minItems === "number") {
          arraySchema = arraySchema.min(schema.minItems);
        }
        if (typeof schema.maxItems === "number") {
          arraySchema = arraySchema.max(schema.maxItems);
        }
        zodSchema = arraySchema;
      } else {
        zodSchema = z.array(z.any());
      }
      break;
    }
    default:
      throw new Error("Unsupported type: ".concat(type));
  }
  return zodSchema;
}
function convertSchema(schema, ctx) {
  if (typeof schema === "boolean") {
    return schema ? z.any() : z.never();
  }
  let baseSchema = convertBaseSchema(schema, ctx);
  const hasExplicitType = schema.type || schema.enum !== void 0 || schema.const !== void 0;
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const options = schema.anyOf.map((s) => convertSchema(s, ctx));
    const anyOfUnion = z.union(options);
    baseSchema = hasExplicitType ? z.intersection(baseSchema, anyOfUnion) : anyOfUnion;
  }
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const options = schema.oneOf.map((s) => convertSchema(s, ctx));
    const oneOfUnion = z.xor(options);
    baseSchema = hasExplicitType ? z.intersection(baseSchema, oneOfUnion) : oneOfUnion;
  }
  if (schema.allOf && Array.isArray(schema.allOf)) {
    if (schema.allOf.length === 0) {
      baseSchema = hasExplicitType ? baseSchema : z.any();
    } else {
      let result = hasExplicitType ? baseSchema : convertSchema(schema.allOf[0], ctx);
      const startIdx = hasExplicitType ? 0 : 1;
      for (let i2 = startIdx; i2 < schema.allOf.length; i2++) {
        result = z.intersection(result, convertSchema(schema.allOf[i2], ctx));
      }
      baseSchema = result;
    }
  }
  if (schema.nullable === true && ctx.version === "openapi-3.0") {
    baseSchema = z.nullable(baseSchema);
  }
  if (schema.readOnly === true) {
    baseSchema = z.readonly(baseSchema);
  }
  if (schema.default !== void 0) {
    baseSchema = baseSchema.default(schema.default);
  }
  const extraMeta = {};
  const coreMetadataKeys = ["$id", "id", "$comment", "$anchor", "$vocabulary", "$dynamicRef", "$dynamicAnchor"];
  for (const key of coreMetadataKeys) {
    if (key in schema) {
      extraMeta[key] = schema[key];
    }
  }
  const contentMetadataKeys = ["contentEncoding", "contentMediaType", "contentSchema"];
  for (const key of contentMetadataKeys) {
    if (key in schema) {
      extraMeta[key] = schema[key];
    }
  }
  for (const key of Object.keys(schema)) {
    if (!RECOGNIZED_KEYS.has(key)) {
      extraMeta[key] = schema[key];
    }
  }
  if (Object.keys(extraMeta).length > 0) {
    ctx.registry.add(baseSchema, extraMeta);
  }
  if (schema.description) {
    baseSchema = baseSchema.describe(schema.description);
  }
  return baseSchema;
}
function fromJSONSchema(schema, params) {
  if (typeof schema === "boolean") {
    return schema ? z.any() : z.never();
  }
  let normalized;
  try {
    normalized = JSON.parse(JSON.stringify(schema));
  } catch {
    throw new Error("fromJSONSchema input is not valid JSON (possibly cyclic); use $defs/$ref for recursive schemas");
  }
  const version2 = detectVersion(normalized, params?.defaultTarget);
  const defs = normalized.$defs || normalized.definitions || {};
  const ctx = {
    version: version2,
    defs,
    refs: /* @__PURE__ */ new Map(),
    processing: /* @__PURE__ */ new Set(),
    rootSchema: normalized,
    registry: params?.registry ?? globalRegistry
  };
  return convertSchema(normalized, ctx);
}
var z, RECOGNIZED_KEYS;
var init_from_json_schema = __esm({
  "node_modules/zod/v4/classic/from-json-schema.js"() {
    init_registries();
    init_checks2();
    init_iso();
    init_schemas2();
    z = {
      ...schemas_exports2,
      ...checks_exports2,
      iso: iso_exports
    };
    RECOGNIZED_KEYS = /* @__PURE__ */ new Set([
      // Schema identification
      "$schema",
      "$ref",
      "$defs",
      "definitions",
      // Core schema keywords
      "$id",
      "id",
      "$comment",
      "$anchor",
      "$vocabulary",
      "$dynamicRef",
      "$dynamicAnchor",
      // Type
      "type",
      "enum",
      "const",
      // Composition
      "anyOf",
      "oneOf",
      "allOf",
      "not",
      // Object
      "properties",
      "required",
      "additionalProperties",
      "patternProperties",
      "propertyNames",
      "minProperties",
      "maxProperties",
      // Array
      "items",
      "prefixItems",
      "additionalItems",
      "minItems",
      "maxItems",
      "uniqueItems",
      "contains",
      "minContains",
      "maxContains",
      // String
      "minLength",
      "maxLength",
      "pattern",
      "format",
      // Number
      "minimum",
      "maximum",
      "exclusiveMinimum",
      "exclusiveMaximum",
      "multipleOf",
      // Already handled metadata
      "description",
      "default",
      // Content
      "contentEncoding",
      "contentMediaType",
      "contentSchema",
      // Unsupported (error-throwing)
      "unevaluatedItems",
      "unevaluatedProperties",
      "if",
      "then",
      "else",
      "dependentSchemas",
      "dependentRequired",
      // OpenAPI
      "nullable",
      "readOnly"
    ]);
  }
});

// node_modules/zod/v4/classic/coerce.js
var coerce_exports = {};
__export(coerce_exports, {
  bigint: () => bigint3,
  boolean: () => boolean3,
  date: () => date4,
  number: () => number3,
  string: () => string3
});
function string3(params) {
  return _coercedString(ZodString, params);
}
function number3(params) {
  return _coercedNumber(ZodNumber, params);
}
function boolean3(params) {
  return _coercedBoolean(ZodBoolean, params);
}
function bigint3(params) {
  return _coercedBigint(ZodBigInt, params);
}
function date4(params) {
  return _coercedDate(ZodDate, params);
}
var init_coerce = __esm({
  "node_modules/zod/v4/classic/coerce.js"() {
    init_core2();
    init_schemas2();
  }
});

// node_modules/zod/v4/classic/external.js
var external_exports = {};
__export(external_exports, {
  $brand: () => $brand,
  $input: () => $input,
  $output: () => $output,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBase64: () => ZodBase64,
  ZodBase64URL: () => ZodBase64URL,
  ZodBigInt: () => ZodBigInt,
  ZodBigIntFormat: () => ZodBigIntFormat,
  ZodBoolean: () => ZodBoolean,
  ZodCIDRv4: () => ZodCIDRv4,
  ZodCIDRv6: () => ZodCIDRv6,
  ZodCUID: () => ZodCUID,
  ZodCUID2: () => ZodCUID2,
  ZodCatch: () => ZodCatch,
  ZodCodec: () => ZodCodec,
  ZodCustom: () => ZodCustom,
  ZodCustomStringFormat: () => ZodCustomStringFormat,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodE164: () => ZodE164,
  ZodEmail: () => ZodEmail,
  ZodEmoji: () => ZodEmoji,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodExactOptional: () => ZodExactOptional,
  ZodFile: () => ZodFile,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodGUID: () => ZodGUID,
  ZodIPv4: () => ZodIPv4,
  ZodIPv6: () => ZodIPv6,
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodJWT: () => ZodJWT,
  ZodKSUID: () => ZodKSUID,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMAC: () => ZodMAC,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNanoID: () => ZodNanoID,
  ZodNever: () => ZodNever,
  ZodNonOptional: () => ZodNonOptional,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodNumberFormat: () => ZodNumberFormat,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodPipe: () => ZodPipe,
  ZodPrefault: () => ZodPrefault,
  ZodPreprocess: () => ZodPreprocess,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRealError: () => ZodRealError,
  ZodRecord: () => ZodRecord,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodStringFormat: () => ZodStringFormat,
  ZodSuccess: () => ZodSuccess,
  ZodSymbol: () => ZodSymbol,
  ZodTemplateLiteral: () => ZodTemplateLiteral,
  ZodTransform: () => ZodTransform,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodULID: () => ZodULID,
  ZodURL: () => ZodURL,
  ZodUUID: () => ZodUUID,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  ZodXID: () => ZodXID,
  ZodXor: () => ZodXor,
  _ZodString: () => _ZodString,
  _default: () => _default2,
  _function: () => _function,
  any: () => any,
  array: () => array,
  base64: () => base642,
  base64url: () => base64url2,
  bigint: () => bigint2,
  boolean: () => boolean2,
  catch: () => _catch2,
  check: () => check,
  cidrv4: () => cidrv42,
  cidrv6: () => cidrv62,
  clone: () => clone,
  codec: () => codec,
  coerce: () => coerce_exports,
  config: () => config,
  core: () => core_exports2,
  cuid: () => cuid3,
  cuid2: () => cuid22,
  custom: () => custom,
  date: () => date3,
  decode: () => decode2,
  decodeAsync: () => decodeAsync2,
  describe: () => describe2,
  discriminatedUnion: () => discriminatedUnion,
  e164: () => e1642,
  email: () => email2,
  emoji: () => emoji2,
  encode: () => encode2,
  encodeAsync: () => encodeAsync2,
  endsWith: () => _endsWith,
  enum: () => _enum2,
  exactOptional: () => exactOptional,
  file: () => file,
  flattenError: () => flattenError,
  float32: () => float32,
  float64: () => float64,
  formatError: () => formatError,
  fromJSONSchema: () => fromJSONSchema,
  function: () => _function,
  getErrorMap: () => getErrorMap,
  globalRegistry: () => globalRegistry,
  gt: () => _gt,
  gte: () => _gte,
  guid: () => guid2,
  hash: () => hash,
  hex: () => hex2,
  hostname: () => hostname2,
  httpUrl: () => httpUrl,
  includes: () => _includes,
  instanceof: () => _instanceof,
  int: () => int,
  int32: () => int32,
  int64: () => int64,
  intersection: () => intersection,
  invertCodec: () => invertCodec,
  ipv4: () => ipv42,
  ipv6: () => ipv62,
  iso: () => iso_exports,
  json: () => json,
  jwt: () => jwt,
  keyof: () => keyof,
  ksuid: () => ksuid2,
  lazy: () => lazy,
  length: () => _length,
  literal: () => literal,
  locales: () => locales_exports,
  looseObject: () => looseObject,
  looseRecord: () => looseRecord,
  lowercase: () => _lowercase,
  lt: () => _lt,
  lte: () => _lte,
  mac: () => mac2,
  map: () => map,
  maxLength: () => _maxLength,
  maxSize: () => _maxSize,
  meta: () => meta2,
  mime: () => _mime,
  minLength: () => _minLength,
  minSize: () => _minSize,
  multipleOf: () => _multipleOf,
  nan: () => nan,
  nanoid: () => nanoid2,
  nativeEnum: () => nativeEnum,
  negative: () => _negative,
  never: () => never,
  nonnegative: () => _nonnegative,
  nonoptional: () => nonoptional,
  nonpositive: () => _nonpositive,
  normalize: () => _normalize,
  null: () => _null3,
  nullable: () => nullable,
  nullish: () => nullish2,
  number: () => number2,
  object: () => object,
  optional: () => optional,
  overwrite: () => _overwrite,
  parse: () => parse2,
  parseAsync: () => parseAsync2,
  partialRecord: () => partialRecord,
  pipe: () => pipe,
  positive: () => _positive,
  prefault: () => prefault,
  preprocess: () => preprocess,
  prettifyError: () => prettifyError,
  promise: () => promise,
  property: () => _property,
  readonly: () => readonly,
  record: () => record,
  refine: () => refine,
  regex: () => _regex,
  regexes: () => regexes_exports,
  registry: () => registry,
  safeDecode: () => safeDecode2,
  safeDecodeAsync: () => safeDecodeAsync2,
  safeEncode: () => safeEncode2,
  safeEncodeAsync: () => safeEncodeAsync2,
  safeParse: () => safeParse2,
  safeParseAsync: () => safeParseAsync2,
  set: () => set,
  setErrorMap: () => setErrorMap,
  size: () => _size,
  slugify: () => _slugify,
  startsWith: () => _startsWith,
  strictObject: () => strictObject,
  string: () => string2,
  stringFormat: () => stringFormat,
  stringbool: () => stringbool,
  success: () => success,
  superRefine: () => superRefine,
  symbol: () => symbol,
  templateLiteral: () => templateLiteral,
  toJSONSchema: () => toJSONSchema,
  toLowerCase: () => _toLowerCase,
  toUpperCase: () => _toUpperCase,
  transform: () => transform,
  treeifyError: () => treeifyError,
  trim: () => _trim,
  tuple: () => tuple,
  uint32: () => uint32,
  uint64: () => uint64,
  ulid: () => ulid2,
  undefined: () => _undefined3,
  union: () => union,
  unknown: () => unknown,
  uppercase: () => _uppercase,
  url: () => url,
  util: () => util_exports,
  uuid: () => uuid2,
  uuidv4: () => uuidv4,
  uuidv6: () => uuidv6,
  uuidv7: () => uuidv7,
  void: () => _void2,
  xid: () => xid2,
  xor: () => xor
});
var init_external = __esm({
  "node_modules/zod/v4/classic/external.js"() {
    init_core2();
    init_schemas2();
    init_checks2();
    init_errors2();
    init_parse2();
    init_compat();
    init_core2();
    init_en();
    init_core2();
    init_json_schema_processors();
    init_from_json_schema();
    init_locales();
    init_iso();
    init_iso();
    init_coerce();
    config(en_default());
  }
});

// node_modules/zod/v4/classic/index.js
var init_classic = __esm({
  "node_modules/zod/v4/classic/index.js"() {
    init_external();
    init_external();
  }
});

// node_modules/zod/v4/index.js
var init_v4 = __esm({
  "node_modules/zod/v4/index.js"() {
    init_classic();
  }
});

// mcp/server.source.mjs
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// node_modules/@modelcontextprotocol/sdk/dist/esm/types.js
init_v4();
var RELATED_TASK_META_KEY = "io.modelcontextprotocol/related-task";
var JSONRPC_VERSION = "2.0";
var AssertObjectSchema = custom((v2) => v2 !== null && (typeof v2 === "object" || typeof v2 === "function"));
var ProgressTokenSchema = union([string2(), number2().int()]);
var CursorSchema = string2();
var TaskCreationParamsSchema = looseObject({
  /**
   * Requested duration in milliseconds to retain task from creation.
   */
  ttl: number2().optional(),
  /**
   * Time in milliseconds to wait between task status requests.
   */
  pollInterval: number2().optional()
});
var TaskMetadataSchema = object({
  ttl: number2().optional()
});
var RelatedTaskMetadataSchema = object({
  taskId: string2()
});
var RequestMetaSchema = looseObject({
  /**
   * If specified, the caller is requesting out-of-band progress notifications for this request (as represented by notifications/progress). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.
   */
  progressToken: ProgressTokenSchema.optional(),
  /**
   * If specified, this request is related to the provided task.
   */
  [RELATED_TASK_META_KEY]: RelatedTaskMetadataSchema.optional()
});
var BaseRequestParamsSchema = object({
  /**
   * See [General fields: `_meta`](/specification/draft/basic/index#meta) for notes on `_meta` usage.
   */
  _meta: RequestMetaSchema.optional()
});
var TaskAugmentedRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * If specified, the caller is requesting task-augmented execution for this request.
   * The request will return a CreateTaskResult immediately, and the actual result can be
   * retrieved later via tasks/result.
   *
   * Task augmentation is subject to capability negotiation - receivers MUST declare support
   * for task augmentation of specific request types in their capabilities.
   */
  task: TaskMetadataSchema.optional()
});
var RequestSchema = object({
  method: string2(),
  params: BaseRequestParamsSchema.loose().optional()
});
var NotificationsParamsSchema = object({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: RequestMetaSchema.optional()
});
var NotificationSchema = object({
  method: string2(),
  params: NotificationsParamsSchema.loose().optional()
});
var ResultSchema = looseObject({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: RequestMetaSchema.optional()
});
var RequestIdSchema = union([string2(), number2().int()]);
var JSONRPCRequestSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  ...RequestSchema.shape
}).strict();
var JSONRPCNotificationSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  ...NotificationSchema.shape
}).strict();
var JSONRPCResultResponseSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  result: ResultSchema
}).strict();
var ErrorCode;
(function(ErrorCode2) {
  ErrorCode2[ErrorCode2["ConnectionClosed"] = -32e3] = "ConnectionClosed";
  ErrorCode2[ErrorCode2["RequestTimeout"] = -32001] = "RequestTimeout";
  ErrorCode2[ErrorCode2["ParseError"] = -32700] = "ParseError";
  ErrorCode2[ErrorCode2["InvalidRequest"] = -32600] = "InvalidRequest";
  ErrorCode2[ErrorCode2["MethodNotFound"] = -32601] = "MethodNotFound";
  ErrorCode2[ErrorCode2["InvalidParams"] = -32602] = "InvalidParams";
  ErrorCode2[ErrorCode2["InternalError"] = -32603] = "InternalError";
  ErrorCode2[ErrorCode2["UrlElicitationRequired"] = -32042] = "UrlElicitationRequired";
})(ErrorCode || (ErrorCode = {}));
var JSONRPCErrorResponseSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema.optional(),
  error: object({
    /**
     * The error type that occurred.
     */
    code: number2().int(),
    /**
     * A short description of the error. The message SHOULD be limited to a concise single sentence.
     */
    message: string2(),
    /**
     * Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).
     */
    data: unknown().optional()
  })
}).strict();
var JSONRPCMessageSchema = union([
  JSONRPCRequestSchema,
  JSONRPCNotificationSchema,
  JSONRPCResultResponseSchema,
  JSONRPCErrorResponseSchema
]);
var JSONRPCResponseSchema = union([JSONRPCResultResponseSchema, JSONRPCErrorResponseSchema]);
var EmptyResultSchema = ResultSchema.strict();
var CancelledNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The ID of the request to cancel.
   *
   * This MUST correspond to the ID of a request previously issued in the same direction.
   */
  requestId: RequestIdSchema.optional(),
  /**
   * An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.
   */
  reason: string2().optional()
});
var CancelledNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/cancelled"),
  params: CancelledNotificationParamsSchema
});
var IconSchema = object({
  /**
   * URL or data URI for the icon.
   */
  src: string2(),
  /**
   * Optional MIME type for the icon.
   */
  mimeType: string2().optional(),
  /**
   * Optional array of strings that specify sizes at which the icon can be used.
   * Each string should be in WxH format (e.g., `"48x48"`, `"96x96"`) or `"any"` for scalable formats like SVG.
   *
   * If not provided, the client should assume that the icon can be used at any size.
   */
  sizes: array(string2()).optional(),
  /**
   * Optional specifier for the theme this icon is designed for. `light` indicates
   * the icon is designed to be used with a light background, and `dark` indicates
   * the icon is designed to be used with a dark background.
   *
   * If not provided, the client should assume the icon can be used with any theme.
   */
  theme: _enum2(["light", "dark"]).optional()
});
var IconsSchema = object({
  /**
   * Optional set of sized icons that the client can display in a user interface.
   *
   * Clients that support rendering icons MUST support at least the following MIME types:
   * - `image/png` - PNG images (safe, universal compatibility)
   * - `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)
   *
   * Clients that support rendering icons SHOULD also support:
   * - `image/svg+xml` - SVG images (scalable but requires security precautions)
   * - `image/webp` - WebP images (modern, efficient format)
   */
  icons: array(IconSchema).optional()
});
var BaseMetadataSchema = object({
  /** Intended for programmatic or logical use, but used as a display name in past specs or fallback */
  name: string2(),
  /**
   * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
   * even by those unfamiliar with domain-specific terminology.
   *
   * If not provided, the name should be used for display (except for Tool,
   * where `annotations.title` should be given precedence over using `name`,
   * if present).
   */
  title: string2().optional()
});
var ImplementationSchema = BaseMetadataSchema.extend({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  version: string2(),
  /**
   * An optional URL of the website for this implementation.
   */
  websiteUrl: string2().optional(),
  /**
   * An optional human-readable description of what this implementation does.
   *
   * This can be used by clients or servers to provide context about their purpose
   * and capabilities. For example, a server might describe the types of resources
   * or tools it provides, while a client might describe its intended use case.
   */
  description: string2().optional()
});
var FormElicitationCapabilitySchema = intersection(object({
  applyDefaults: boolean2().optional()
}), record(string2(), unknown()));
var ElicitationCapabilitySchema = preprocess((value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (Object.keys(value).length === 0) {
      return { form: {} };
    }
  }
  return value;
}, intersection(object({
  form: FormElicitationCapabilitySchema.optional(),
  url: AssertObjectSchema.optional()
}), record(string2(), unknown()).optional()));
var ClientTasksCapabilitySchema = looseObject({
  /**
   * Present if the client supports listing tasks.
   */
  list: AssertObjectSchema.optional(),
  /**
   * Present if the client supports cancelling tasks.
   */
  cancel: AssertObjectSchema.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: looseObject({
    /**
     * Task support for sampling requests.
     */
    sampling: looseObject({
      createMessage: AssertObjectSchema.optional()
    }).optional(),
    /**
     * Task support for elicitation requests.
     */
    elicitation: looseObject({
      create: AssertObjectSchema.optional()
    }).optional()
  }).optional()
});
var ServerTasksCapabilitySchema = looseObject({
  /**
   * Present if the server supports listing tasks.
   */
  list: AssertObjectSchema.optional(),
  /**
   * Present if the server supports cancelling tasks.
   */
  cancel: AssertObjectSchema.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: looseObject({
    /**
     * Task support for tool requests.
     */
    tools: looseObject({
      call: AssertObjectSchema.optional()
    }).optional()
  }).optional()
});
var ClientCapabilitiesSchema = object({
  /**
   * Experimental, non-standard capabilities that the client supports.
   */
  experimental: record(string2(), AssertObjectSchema).optional(),
  /**
   * Present if the client supports sampling from an LLM.
   */
  sampling: object({
    /**
     * Present if the client supports context inclusion via includeContext parameter.
     * If not declared, servers SHOULD only use `includeContext: "none"` (or omit it).
     */
    context: AssertObjectSchema.optional(),
    /**
     * Present if the client supports tool use via tools and toolChoice parameters.
     */
    tools: AssertObjectSchema.optional()
  }).optional(),
  /**
   * Present if the client supports eliciting user input.
   */
  elicitation: ElicitationCapabilitySchema.optional(),
  /**
   * Present if the client supports listing roots.
   */
  roots: object({
    /**
     * Whether the client supports issuing notifications for changes to the roots list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the client supports task creation.
   */
  tasks: ClientTasksCapabilitySchema.optional(),
  /**
   * Extensions that the client supports. Keys are extension identifiers (vendor-prefix/extension-name).
   */
  extensions: record(string2(), AssertObjectSchema).optional()
});
var InitializeRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.
   */
  protocolVersion: string2(),
  capabilities: ClientCapabilitiesSchema,
  clientInfo: ImplementationSchema
});
var InitializeRequestSchema = RequestSchema.extend({
  method: literal("initialize"),
  params: InitializeRequestParamsSchema
});
var ServerCapabilitiesSchema = object({
  /**
   * Experimental, non-standard capabilities that the server supports.
   */
  experimental: record(string2(), AssertObjectSchema).optional(),
  /**
   * Present if the server supports sending log messages to the client.
   */
  logging: AssertObjectSchema.optional(),
  /**
   * Present if the server supports sending completions to the client.
   */
  completions: AssertObjectSchema.optional(),
  /**
   * Present if the server offers any prompt templates.
   */
  prompts: object({
    /**
     * Whether this server supports issuing notifications for changes to the prompt list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the server offers any resources to read.
   */
  resources: object({
    /**
     * Whether this server supports clients subscribing to resource updates.
     */
    subscribe: boolean2().optional(),
    /**
     * Whether this server supports issuing notifications for changes to the resource list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the server offers any tools to call.
   */
  tools: object({
    /**
     * Whether this server supports issuing notifications for changes to the tool list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the server supports task creation.
   */
  tasks: ServerTasksCapabilitySchema.optional(),
  /**
   * Extensions that the server supports. Keys are extension identifiers (vendor-prefix/extension-name).
   */
  extensions: record(string2(), AssertObjectSchema).optional()
});
var InitializeResultSchema = ResultSchema.extend({
  /**
   * The version of the Model Context Protocol that the server wants to use. This may not match the version that the client requested. If the client cannot support this version, it MUST disconnect.
   */
  protocolVersion: string2(),
  capabilities: ServerCapabilitiesSchema,
  serverInfo: ImplementationSchema,
  /**
   * Instructions describing how to use the server and its features.
   *
   * This can be used by clients to improve the LLM's understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt.
   */
  instructions: string2().optional()
});
var InitializedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/initialized"),
  params: NotificationsParamsSchema.optional()
});
var PingRequestSchema = RequestSchema.extend({
  method: literal("ping"),
  params: BaseRequestParamsSchema.optional()
});
var ProgressSchema = object({
  /**
   * The progress thus far. This should increase every time progress is made, even if the total is unknown.
   */
  progress: number2(),
  /**
   * Total number of items to process (or total progress required), if known.
   */
  total: optional(number2()),
  /**
   * An optional message describing the current progress.
   */
  message: optional(string2())
});
var ProgressNotificationParamsSchema = object({
  ...NotificationsParamsSchema.shape,
  ...ProgressSchema.shape,
  /**
   * The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.
   */
  progressToken: ProgressTokenSchema
});
var ProgressNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/progress"),
  params: ProgressNotificationParamsSchema
});
var PaginatedRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * An opaque token representing the current pagination position.
   * If provided, the server should return results starting after this cursor.
   */
  cursor: CursorSchema.optional()
});
var PaginatedRequestSchema = RequestSchema.extend({
  params: PaginatedRequestParamsSchema.optional()
});
var PaginatedResultSchema = ResultSchema.extend({
  /**
   * An opaque token representing the pagination position after the last returned result.
   * If present, there may be more results available.
   */
  nextCursor: CursorSchema.optional()
});
var TaskStatusSchema = _enum2(["working", "input_required", "completed", "failed", "cancelled"]);
var TaskSchema = object({
  taskId: string2(),
  status: TaskStatusSchema,
  /**
   * Time in milliseconds to keep task results available after completion.
   * If null, the task has unlimited lifetime until manually cleaned up.
   */
  ttl: union([number2(), _null3()]),
  /**
   * ISO 8601 timestamp when the task was created.
   */
  createdAt: string2(),
  /**
   * ISO 8601 timestamp when the task was last updated.
   */
  lastUpdatedAt: string2(),
  pollInterval: optional(number2()),
  /**
   * Optional diagnostic message for failed tasks or other status information.
   */
  statusMessage: optional(string2())
});
var CreateTaskResultSchema = ResultSchema.extend({
  task: TaskSchema
});
var TaskStatusNotificationParamsSchema = NotificationsParamsSchema.merge(TaskSchema);
var TaskStatusNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tasks/status"),
  params: TaskStatusNotificationParamsSchema
});
var GetTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/get"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
});
var GetTaskResultSchema = ResultSchema.merge(TaskSchema);
var GetTaskPayloadRequestSchema = RequestSchema.extend({
  method: literal("tasks/result"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
});
var GetTaskPayloadResultSchema = ResultSchema.loose();
var ListTasksRequestSchema = PaginatedRequestSchema.extend({
  method: literal("tasks/list")
});
var ListTasksResultSchema = PaginatedResultSchema.extend({
  tasks: array(TaskSchema)
});
var CancelTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/cancel"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
});
var CancelTaskResultSchema = ResultSchema.merge(TaskSchema);
var ResourceContentsSchema = object({
  /**
   * The URI of this resource.
   */
  uri: string2(),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: optional(string2()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var TextResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
   */
  text: string2()
});
var Base64Schema = string2().refine((val) => {
  try {
    atob(val);
    return true;
  } catch {
    return false;
  }
}, { message: "Invalid Base64 string" });
var BlobResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * A base64-encoded string representing the binary data of the item.
   */
  blob: Base64Schema
});
var RoleSchema = _enum2(["user", "assistant"]);
var AnnotationsSchema = object({
  /**
   * Intended audience(s) for the resource.
   */
  audience: array(RoleSchema).optional(),
  /**
   * Importance hint for the resource, from 0 (least) to 1 (most).
   */
  priority: number2().min(0).max(1).optional(),
  /**
   * ISO 8601 timestamp for the most recent modification.
   */
  lastModified: iso_exports.datetime({ offset: true }).optional()
});
var ResourceSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * The URI of this resource.
   */
  uri: string2(),
  /**
   * A description of what this resource represents.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: optional(string2()),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: optional(string2()),
  /**
   * The size of the raw resource content, in bytes (i.e., before base64 encoding or any tokenization), if known.
   *
   * This can be used by Hosts to display file sizes and estimate context window usage.
   */
  size: optional(number2()),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var ResourceTemplateSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * A URI template (according to RFC 6570) that can be used to construct resource URIs.
   */
  uriTemplate: string2(),
  /**
   * A description of what this template is for.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: optional(string2()),
  /**
   * The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.
   */
  mimeType: optional(string2()),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var ListResourcesRequestSchema = PaginatedRequestSchema.extend({
  method: literal("resources/list")
});
var ListResourcesResultSchema = PaginatedResultSchema.extend({
  resources: array(ResourceSchema)
});
var ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({
  method: literal("resources/templates/list")
});
var ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({
  resourceTemplates: array(ResourceTemplateSchema)
});
var ResourceRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The URI of the resource to read. The URI can use any protocol; it is up to the server how to interpret it.
   *
   * @format uri
   */
  uri: string2()
});
var ReadResourceRequestParamsSchema = ResourceRequestParamsSchema;
var ReadResourceRequestSchema = RequestSchema.extend({
  method: literal("resources/read"),
  params: ReadResourceRequestParamsSchema
});
var ReadResourceResultSchema = ResultSchema.extend({
  contents: array(union([TextResourceContentsSchema, BlobResourceContentsSchema]))
});
var ResourceListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var SubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var SubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/subscribe"),
  params: SubscribeRequestParamsSchema
});
var UnsubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var UnsubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/unsubscribe"),
  params: UnsubscribeRequestParamsSchema
});
var ResourceUpdatedNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.
   */
  uri: string2()
});
var ResourceUpdatedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/updated"),
  params: ResourceUpdatedNotificationParamsSchema
});
var PromptArgumentSchema = object({
  /**
   * The name of the argument.
   */
  name: string2(),
  /**
   * A human-readable description of the argument.
   */
  description: optional(string2()),
  /**
   * Whether this argument must be provided.
   */
  required: optional(boolean2())
});
var PromptSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * An optional description of what this prompt provides
   */
  description: optional(string2()),
  /**
   * A list of arguments to use for templating the prompt.
   */
  arguments: optional(array(PromptArgumentSchema)),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var ListPromptsRequestSchema = PaginatedRequestSchema.extend({
  method: literal("prompts/list")
});
var ListPromptsResultSchema = PaginatedResultSchema.extend({
  prompts: array(PromptSchema)
});
var GetPromptRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The name of the prompt or prompt template.
   */
  name: string2(),
  /**
   * Arguments to use for templating the prompt.
   */
  arguments: record(string2(), string2()).optional()
});
var GetPromptRequestSchema = RequestSchema.extend({
  method: literal("prompts/get"),
  params: GetPromptRequestParamsSchema
});
var TextContentSchema = object({
  type: literal("text"),
  /**
   * The text content of the message.
   */
  text: string2(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var ImageContentSchema = object({
  type: literal("image"),
  /**
   * The base64-encoded image data.
   */
  data: Base64Schema,
  /**
   * The MIME type of the image. Different providers may support different image types.
   */
  mimeType: string2(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var AudioContentSchema = object({
  type: literal("audio"),
  /**
   * The base64-encoded audio data.
   */
  data: Base64Schema,
  /**
   * The MIME type of the audio. Different providers may support different audio types.
   */
  mimeType: string2(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var ToolUseContentSchema = object({
  type: literal("tool_use"),
  /**
   * The name of the tool to invoke.
   * Must match a tool name from the request's tools array.
   */
  name: string2(),
  /**
   * Unique identifier for this tool call.
   * Used to correlate with ToolResultContent in subsequent messages.
   */
  id: string2(),
  /**
   * Arguments to pass to the tool.
   * Must conform to the tool's inputSchema.
   */
  input: record(string2(), unknown()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var EmbeddedResourceSchema = object({
  type: literal("resource"),
  resource: union([TextResourceContentsSchema, BlobResourceContentsSchema]),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var ResourceLinkSchema = ResourceSchema.extend({
  type: literal("resource_link")
});
var ContentBlockSchema = union([
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ResourceLinkSchema,
  EmbeddedResourceSchema
]);
var PromptMessageSchema = object({
  role: RoleSchema,
  content: ContentBlockSchema
});
var GetPromptResultSchema = ResultSchema.extend({
  /**
   * An optional description for the prompt.
   */
  description: string2().optional(),
  messages: array(PromptMessageSchema)
});
var PromptListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/prompts/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ToolAnnotationsSchema = object({
  /**
   * A human-readable title for the tool.
   */
  title: string2().optional(),
  /**
   * If true, the tool does not modify its environment.
   *
   * Default: false
   */
  readOnlyHint: boolean2().optional(),
  /**
   * If true, the tool may perform destructive updates to its environment.
   * If false, the tool performs only additive updates.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: true
   */
  destructiveHint: boolean2().optional(),
  /**
   * If true, calling the tool repeatedly with the same arguments
   * will have no additional effect on the its environment.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: false
   */
  idempotentHint: boolean2().optional(),
  /**
   * If true, this tool may interact with an "open world" of external
   * entities. If false, the tool's domain of interaction is closed.
   * For example, the world of a web search tool is open, whereas that
   * of a memory tool is not.
   *
   * Default: true
   */
  openWorldHint: boolean2().optional()
});
var ToolExecutionSchema = object({
  /**
   * Indicates the tool's preference for task-augmented execution.
   * - "required": Clients MUST invoke the tool as a task
   * - "optional": Clients MAY invoke the tool as a task or normal request
   * - "forbidden": Clients MUST NOT attempt to invoke the tool as a task
   *
   * If not present, defaults to "forbidden".
   */
  taskSupport: _enum2(["required", "optional", "forbidden"]).optional()
});
var ToolSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * A human-readable description of the tool.
   */
  description: string2().optional(),
  /**
   * A JSON Schema 2020-12 object defining the expected parameters for the tool.
   * Must have type: 'object' at the root level per MCP spec.
   */
  inputSchema: object({
    type: literal("object"),
    properties: record(string2(), AssertObjectSchema).optional(),
    required: array(string2()).optional()
  }).catchall(unknown()),
  /**
   * An optional JSON Schema 2020-12 object defining the structure of the tool's output
   * returned in the structuredContent field of a CallToolResult.
   * Must have type: 'object' at the root level per MCP spec.
   */
  outputSchema: object({
    type: literal("object"),
    properties: record(string2(), AssertObjectSchema).optional(),
    required: array(string2()).optional()
  }).catchall(unknown()).optional(),
  /**
   * Optional additional tool information.
   */
  annotations: ToolAnnotationsSchema.optional(),
  /**
   * Execution-related properties for this tool.
   */
  execution: ToolExecutionSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var ListToolsRequestSchema = PaginatedRequestSchema.extend({
  method: literal("tools/list")
});
var ListToolsResultSchema = PaginatedResultSchema.extend({
  tools: array(ToolSchema)
});
var CallToolResultSchema = ResultSchema.extend({
  /**
   * A list of content objects that represent the result of the tool call.
   *
   * If the Tool does not define an outputSchema, this field MUST be present in the result.
   * For backwards compatibility, this field is always present, but it may be empty.
   */
  content: array(ContentBlockSchema).default([]),
  /**
   * An object containing structured tool output.
   *
   * If the Tool defines an outputSchema, this field MUST be present in the result, and contain a JSON object that matches the schema.
   */
  structuredContent: record(string2(), unknown()).optional(),
  /**
   * Whether the tool call ended in an error.
   *
   * If not set, this is assumed to be false (the call was successful).
   *
   * Any errors that originate from the tool SHOULD be reported inside the result
   * object, with `isError` set to true, _not_ as an MCP protocol-level error
   * response. Otherwise, the LLM would not be able to see that an error occurred
   * and self-correct.
   *
   * However, any errors in _finding_ the tool, an error indicating that the
   * server does not support tool calls, or any other exceptional conditions,
   * should be reported as an MCP error response.
   */
  isError: boolean2().optional()
});
var CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({
  toolResult: unknown()
}));
var CallToolRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The name of the tool to call.
   */
  name: string2(),
  /**
   * Arguments to pass to the tool.
   */
  arguments: record(string2(), unknown()).optional()
});
var CallToolRequestSchema = RequestSchema.extend({
  method: literal("tools/call"),
  params: CallToolRequestParamsSchema
});
var ToolListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tools/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ListChangedOptionsBaseSchema = object({
  /**
   * If true, the list will be refreshed automatically when a list changed notification is received.
   * The callback will be called with the updated list.
   *
   * If false, the callback will be called with null items, allowing manual refresh.
   *
   * @default true
   */
  autoRefresh: boolean2().default(true),
  /**
   * Debounce time in milliseconds for list changed notification processing.
   *
   * Multiple notifications received within this timeframe will only trigger one refresh.
   * Set to 0 to disable debouncing.
   *
   * @default 300
   */
  debounceMs: number2().int().nonnegative().default(300)
});
var LoggingLevelSchema = _enum2(["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]);
var SetLevelRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/logging/message.
   */
  level: LoggingLevelSchema
});
var SetLevelRequestSchema = RequestSchema.extend({
  method: literal("logging/setLevel"),
  params: SetLevelRequestParamsSchema
});
var LoggingMessageNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The severity of this log message.
   */
  level: LoggingLevelSchema,
  /**
   * An optional name of the logger issuing this message.
   */
  logger: string2().optional(),
  /**
   * The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here.
   */
  data: unknown()
});
var LoggingMessageNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/message"),
  params: LoggingMessageNotificationParamsSchema
});
var ModelHintSchema = object({
  /**
   * A hint for a model name.
   */
  name: string2().optional()
});
var ModelPreferencesSchema = object({
  /**
   * Optional hints to use for model selection.
   */
  hints: array(ModelHintSchema).optional(),
  /**
   * How much to prioritize cost when selecting a model.
   */
  costPriority: number2().min(0).max(1).optional(),
  /**
   * How much to prioritize sampling speed (latency) when selecting a model.
   */
  speedPriority: number2().min(0).max(1).optional(),
  /**
   * How much to prioritize intelligence and capabilities when selecting a model.
   */
  intelligencePriority: number2().min(0).max(1).optional()
});
var ToolChoiceSchema = object({
  /**
   * Controls when tools are used:
   * - "auto": Model decides whether to use tools (default)
   * - "required": Model MUST use at least one tool before completing
   * - "none": Model MUST NOT use any tools
   */
  mode: _enum2(["auto", "required", "none"]).optional()
});
var ToolResultContentSchema = object({
  type: literal("tool_result"),
  toolUseId: string2().describe("The unique identifier for the corresponding tool call."),
  content: array(ContentBlockSchema).default([]),
  structuredContent: object({}).loose().optional(),
  isError: boolean2().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var SamplingContentSchema = discriminatedUnion("type", [TextContentSchema, ImageContentSchema, AudioContentSchema]);
var SamplingMessageContentBlockSchema = discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ToolUseContentSchema,
  ToolResultContentSchema
]);
var SamplingMessageSchema = object({
  role: RoleSchema,
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)]),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var CreateMessageRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  messages: array(SamplingMessageSchema),
  /**
   * The server's preferences for which model to select. The client MAY modify or omit this request.
   */
  modelPreferences: ModelPreferencesSchema.optional(),
  /**
   * An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.
   */
  systemPrompt: string2().optional(),
  /**
   * A request to include context from one or more MCP servers (including the caller), to be attached to the prompt.
   * The client MAY ignore this request.
   *
   * Default is "none". Values "thisServer" and "allServers" are soft-deprecated. Servers SHOULD only use these values if the client
   * declares ClientCapabilities.sampling.context. These values may be removed in future spec releases.
   */
  includeContext: _enum2(["none", "thisServer", "allServers"]).optional(),
  temperature: number2().optional(),
  /**
   * The requested maximum number of tokens to sample (to prevent runaway completions).
   *
   * The client MAY choose to sample fewer tokens than the requested maximum.
   */
  maxTokens: number2().int(),
  stopSequences: array(string2()).optional(),
  /**
   * Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.
   */
  metadata: AssertObjectSchema.optional(),
  /**
   * Tools that the model may use during generation.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   */
  tools: array(ToolSchema).optional(),
  /**
   * Controls how the model uses tools.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   * Default is `{ mode: "auto" }`.
   */
  toolChoice: ToolChoiceSchema.optional()
});
var CreateMessageRequestSchema = RequestSchema.extend({
  method: literal("sampling/createMessage"),
  params: CreateMessageRequestParamsSchema
});
var CreateMessageResultSchema = ResultSchema.extend({
  /**
   * The name of the model that generated the message.
   */
  model: string2(),
  /**
   * The reason why sampling stopped, if known.
   *
   * Standard values:
   * - "endTurn": Natural end of the assistant's turn
   * - "stopSequence": A stop sequence was encountered
   * - "maxTokens": Maximum token limit was reached
   *
   * This field is an open string to allow for provider-specific stop reasons.
   */
  stopReason: optional(_enum2(["endTurn", "stopSequence", "maxTokens"]).or(string2())),
  role: RoleSchema,
  /**
   * Response content. Single content block (text, image, or audio).
   */
  content: SamplingContentSchema
});
var CreateMessageResultWithToolsSchema = ResultSchema.extend({
  /**
   * The name of the model that generated the message.
   */
  model: string2(),
  /**
   * The reason why sampling stopped, if known.
   *
   * Standard values:
   * - "endTurn": Natural end of the assistant's turn
   * - "stopSequence": A stop sequence was encountered
   * - "maxTokens": Maximum token limit was reached
   * - "toolUse": The model wants to use one or more tools
   *
   * This field is an open string to allow for provider-specific stop reasons.
   */
  stopReason: optional(_enum2(["endTurn", "stopSequence", "maxTokens", "toolUse"]).or(string2())),
  role: RoleSchema,
  /**
   * Response content. May be a single block or array. May include ToolUseContent if stopReason is "toolUse".
   */
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)])
});
var BooleanSchemaSchema = object({
  type: literal("boolean"),
  title: string2().optional(),
  description: string2().optional(),
  default: boolean2().optional()
});
var StringSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  minLength: number2().optional(),
  maxLength: number2().optional(),
  format: _enum2(["email", "uri", "date", "date-time"]).optional(),
  default: string2().optional()
});
var NumberSchemaSchema = object({
  type: _enum2(["number", "integer"]),
  title: string2().optional(),
  description: string2().optional(),
  minimum: number2().optional(),
  maximum: number2().optional(),
  default: number2().optional()
});
var UntitledSingleSelectEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  default: string2().optional()
});
var TitledSingleSelectEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  oneOf: array(object({
    const: string2(),
    title: string2()
  })),
  default: string2().optional()
});
var LegacyTitledEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  enumNames: array(string2()).optional(),
  default: string2().optional()
});
var SingleSelectEnumSchemaSchema = union([UntitledSingleSelectEnumSchemaSchema, TitledSingleSelectEnumSchemaSchema]);
var UntitledMultiSelectEnumSchemaSchema = object({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object({
    type: literal("string"),
    enum: array(string2())
  }),
  default: array(string2()).optional()
});
var TitledMultiSelectEnumSchemaSchema = object({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object({
    anyOf: array(object({
      const: string2(),
      title: string2()
    }))
  }),
  default: array(string2()).optional()
});
var MultiSelectEnumSchemaSchema = union([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema]);
var EnumSchemaSchema = union([LegacyTitledEnumSchemaSchema, SingleSelectEnumSchemaSchema, MultiSelectEnumSchemaSchema]);
var PrimitiveSchemaDefinitionSchema = union([EnumSchemaSchema, BooleanSchemaSchema, StringSchemaSchema, NumberSchemaSchema]);
var ElicitRequestFormParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The elicitation mode.
   *
   * Optional for backward compatibility. Clients MUST treat missing mode as "form".
   */
  mode: literal("form").optional(),
  /**
   * The message to present to the user describing what information is being requested.
   */
  message: string2(),
  /**
   * A restricted subset of JSON Schema.
   * Only top-level properties are allowed, without nesting.
   */
  requestedSchema: object({
    type: literal("object"),
    properties: record(string2(), PrimitiveSchemaDefinitionSchema),
    required: array(string2()).optional()
  })
});
var ElicitRequestURLParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The elicitation mode.
   */
  mode: literal("url"),
  /**
   * The message to present to the user explaining why the interaction is needed.
   */
  message: string2(),
  /**
   * The ID of the elicitation, which must be unique within the context of the server.
   * The client MUST treat this ID as an opaque value.
   */
  elicitationId: string2(),
  /**
   * The URL that the user should navigate to.
   */
  url: string2().url()
});
var ElicitRequestParamsSchema = union([ElicitRequestFormParamsSchema, ElicitRequestURLParamsSchema]);
var ElicitRequestSchema = RequestSchema.extend({
  method: literal("elicitation/create"),
  params: ElicitRequestParamsSchema
});
var ElicitationCompleteNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The ID of the elicitation that completed.
   */
  elicitationId: string2()
});
var ElicitationCompleteNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/elicitation/complete"),
  params: ElicitationCompleteNotificationParamsSchema
});
var ElicitResultSchema = ResultSchema.extend({
  /**
   * The user action in response to the elicitation.
   * - "accept": User submitted the form/confirmed the action
   * - "decline": User explicitly decline the action
   * - "cancel": User dismissed without making an explicit choice
   */
  action: _enum2(["accept", "decline", "cancel"]),
  /**
   * The submitted form data, only present when action is "accept".
   * Contains values matching the requested schema.
   * Per MCP spec, content is "typically omitted" for decline/cancel actions.
   * We normalize null to undefined for leniency while maintaining type compatibility.
   */
  content: preprocess((val) => val === null ? void 0 : val, record(string2(), union([string2(), number2(), boolean2(), array(string2())])).optional())
});
var ResourceTemplateReferenceSchema = object({
  type: literal("ref/resource"),
  /**
   * The URI or URI template of the resource.
   */
  uri: string2()
});
var PromptReferenceSchema = object({
  type: literal("ref/prompt"),
  /**
   * The name of the prompt or prompt template
   */
  name: string2()
});
var CompleteRequestParamsSchema = BaseRequestParamsSchema.extend({
  ref: union([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
  /**
   * The argument's information
   */
  argument: object({
    /**
     * The name of the argument
     */
    name: string2(),
    /**
     * The value of the argument to use for completion matching.
     */
    value: string2()
  }),
  context: object({
    /**
     * Previously-resolved variables in a URI template or prompt.
     */
    arguments: record(string2(), string2()).optional()
  }).optional()
});
var CompleteRequestSchema = RequestSchema.extend({
  method: literal("completion/complete"),
  params: CompleteRequestParamsSchema
});
var CompleteResultSchema = ResultSchema.extend({
  completion: looseObject({
    /**
     * An array of completion values. Must not exceed 100 items.
     */
    values: array(string2()).max(100),
    /**
     * The total number of completion options available. This can exceed the number of values actually sent in the response.
     */
    total: optional(number2().int()),
    /**
     * Indicates whether there are additional completion options beyond those provided in the current response, even if the exact total is unknown.
     */
    hasMore: optional(boolean2())
  })
});
var RootSchema = object({
  /**
   * The URI identifying the root. This *must* start with file:// for now.
   */
  uri: string2().startsWith("file://"),
  /**
   * An optional name for the root.
   */
  name: string2().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var ListRootsRequestSchema = RequestSchema.extend({
  method: literal("roots/list"),
  params: BaseRequestParamsSchema.optional()
});
var ListRootsResultSchema = ResultSchema.extend({
  roots: array(RootSchema)
});
var RootsListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/roots/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ClientRequestSchema = union([
  PingRequestSchema,
  InitializeRequestSchema,
  CompleteRequestSchema,
  SetLevelRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]);
var ClientNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
  TaskStatusNotificationSchema
]);
var ClientResultSchema = union([
  EmptyResultSchema,
  CreateMessageResultSchema,
  CreateMessageResultWithToolsSchema,
  ElicitResultSchema,
  ListRootsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]);
var ServerRequestSchema = union([
  PingRequestSchema,
  CreateMessageRequestSchema,
  ElicitRequestSchema,
  ListRootsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]);
var ServerNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
  TaskStatusNotificationSchema,
  ElicitationCompleteNotificationSchema
]);
var ServerResultSchema = union([
  EmptyResultSchema,
  InitializeResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ReadResourceResultSchema,
  CallToolResultSchema,
  ListToolsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]);

// node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");

// node_modules/@modelcontextprotocol/ext-apps/dist/src/server/index.js
init_v4();
var r = ((Z) => typeof __require < "u" ? __require : typeof Proxy < "u" ? new Proxy(Z, { get: ($, J) => (typeof __require < "u" ? __require : $)[J] }) : Z)(function(Z) {
  if (typeof __require < "u") return __require.apply(this, arguments);
  throw Error('Dynamic require of "' + Z + '" is not supported');
});
var v = external_exports.union([external_exports.literal("light"), external_exports.literal("dark")]).describe("Color theme preference for the host environment.");
var K = external_exports.union([external_exports.literal("inline"), external_exports.literal("fullscreen"), external_exports.literal("pip")]).describe("Display mode for UI presentation.");
var QQ = external_exports.union([external_exports.literal("--color-background-primary"), external_exports.literal("--color-background-secondary"), external_exports.literal("--color-background-tertiary"), external_exports.literal("--color-background-inverse"), external_exports.literal("--color-background-ghost"), external_exports.literal("--color-background-info"), external_exports.literal("--color-background-danger"), external_exports.literal("--color-background-success"), external_exports.literal("--color-background-warning"), external_exports.literal("--color-background-disabled"), external_exports.literal("--color-text-primary"), external_exports.literal("--color-text-secondary"), external_exports.literal("--color-text-tertiary"), external_exports.literal("--color-text-inverse"), external_exports.literal("--color-text-ghost"), external_exports.literal("--color-text-info"), external_exports.literal("--color-text-danger"), external_exports.literal("--color-text-success"), external_exports.literal("--color-text-warning"), external_exports.literal("--color-text-disabled"), external_exports.literal("--color-border-primary"), external_exports.literal("--color-border-secondary"), external_exports.literal("--color-border-tertiary"), external_exports.literal("--color-border-inverse"), external_exports.literal("--color-border-ghost"), external_exports.literal("--color-border-info"), external_exports.literal("--color-border-danger"), external_exports.literal("--color-border-success"), external_exports.literal("--color-border-warning"), external_exports.literal("--color-border-disabled"), external_exports.literal("--color-ring-primary"), external_exports.literal("--color-ring-secondary"), external_exports.literal("--color-ring-inverse"), external_exports.literal("--color-ring-info"), external_exports.literal("--color-ring-danger"), external_exports.literal("--color-ring-success"), external_exports.literal("--color-ring-warning"), external_exports.literal("--font-sans"), external_exports.literal("--font-mono"), external_exports.literal("--font-weight-normal"), external_exports.literal("--font-weight-medium"), external_exports.literal("--font-weight-semibold"), external_exports.literal("--font-weight-bold"), external_exports.literal("--font-text-xs-size"), external_exports.literal("--font-text-sm-size"), external_exports.literal("--font-text-md-size"), external_exports.literal("--font-text-lg-size"), external_exports.literal("--font-heading-xs-size"), external_exports.literal("--font-heading-sm-size"), external_exports.literal("--font-heading-md-size"), external_exports.literal("--font-heading-lg-size"), external_exports.literal("--font-heading-xl-size"), external_exports.literal("--font-heading-2xl-size"), external_exports.literal("--font-heading-3xl-size"), external_exports.literal("--font-text-xs-line-height"), external_exports.literal("--font-text-sm-line-height"), external_exports.literal("--font-text-md-line-height"), external_exports.literal("--font-text-lg-line-height"), external_exports.literal("--font-heading-xs-line-height"), external_exports.literal("--font-heading-sm-line-height"), external_exports.literal("--font-heading-md-line-height"), external_exports.literal("--font-heading-lg-line-height"), external_exports.literal("--font-heading-xl-line-height"), external_exports.literal("--font-heading-2xl-line-height"), external_exports.literal("--font-heading-3xl-line-height"), external_exports.literal("--border-radius-xs"), external_exports.literal("--border-radius-sm"), external_exports.literal("--border-radius-md"), external_exports.literal("--border-radius-lg"), external_exports.literal("--border-radius-xl"), external_exports.literal("--border-radius-full"), external_exports.literal("--border-width-regular"), external_exports.literal("--shadow-hairline"), external_exports.literal("--shadow-sm"), external_exports.literal("--shadow-md"), external_exports.literal("--shadow-lg")]).describe("CSS variable keys available to MCP apps for theming.");
var ZQ = external_exports.record(QQ.describe("Style variables for theming MCP apps.\n\nIndividual style keys are optional - hosts may provide any subset of these values.\nValues are strings containing CSS values (colors, sizes, font stacks, etc.).\n\nNote: This type uses `Record<K, string | undefined>` rather than `Partial<Record<K, string>>`\nfor compatibility with Zod schema generation. Both are functionally equivalent for validation."), external_exports.union([external_exports.string(), external_exports.undefined()]).describe("Style variables for theming MCP apps.\n\nIndividual style keys are optional - hosts may provide any subset of these values.\nValues are strings containing CSS values (colors, sizes, font stacks, etc.).\n\nNote: This type uses `Record<K, string | undefined>` rather than `Partial<Record<K, string>>`\nfor compatibility with Zod schema generation. Both are functionally equivalent for validation.")).describe("Style variables for theming MCP apps.\n\nIndividual style keys are optional - hosts may provide any subset of these values.\nValues are strings containing CSS values (colors, sizes, font stacks, etc.).\n\nNote: This type uses `Record<K, string | undefined>` rather than `Partial<Record<K, string>>`\nfor compatibility with Zod schema generation. Both are functionally equivalent for validation.");
var $Q = external_exports.object({ method: external_exports.literal("ui/open-link"), params: external_exports.object({ url: external_exports.string().describe("URL to open in the host's browser") }) });
var I = external_exports.object({ isError: external_exports.boolean().optional().describe("True if the host failed to open the URL (e.g., due to security policy).") }).passthrough();
var P = external_exports.object({ isError: external_exports.boolean().optional().describe("True if the download failed (e.g., user cancelled or host denied).") }).passthrough();
var w = external_exports.object({ isError: external_exports.boolean().optional().describe("True if the host rejected or failed to deliver the message.") }).passthrough();
var JQ = external_exports.object({ method: external_exports.literal("ui/notifications/sandbox-proxy-ready"), params: external_exports.object({}) });
var Y = external_exports.object({ connectDomains: external_exports.array(external_exports.string()).optional().describe("Origins for network requests (fetch/XHR/WebSocket).\n\n- Maps to CSP `connect-src` directive\n- Empty or omitted → no network connections (secure default)"), resourceDomains: external_exports.array(external_exports.string()).optional().describe("Origins for static resources (images, scripts, stylesheets, fonts, media).\n\n- Maps to CSP `img-src`, `script-src`, `style-src`, `font-src`, `media-src` directives\n- Wildcard subdomains supported: `https://*.example.com`\n- Empty or omitted → no network resources (secure default)"), frameDomains: external_exports.array(external_exports.string()).optional().describe("Origins for nested iframes.\n\n- Maps to CSP `frame-src` directive\n- Empty or omitted → no nested iframes allowed (`frame-src 'none'`)"), baseUriDomains: external_exports.array(external_exports.string()).optional().describe("Allowed base URIs for the document.\n\n- Maps to CSP `base-uri` directive\n- Empty or omitted → only same origin allowed (`base-uri 'self'`)") });
var j = external_exports.object({ camera: external_exports.object({}).optional().describe("Request camera access.\n\nMaps to Permission Policy `camera` feature."), microphone: external_exports.object({}).optional().describe("Request microphone access.\n\nMaps to Permission Policy `microphone` feature."), geolocation: external_exports.object({}).optional().describe("Request geolocation access.\n\nMaps to Permission Policy `geolocation` feature."), clipboardWrite: external_exports.object({}).optional().describe("Request clipboard write access.\n\nMaps to Permission Policy `clipboard-write` feature.") });
var XQ = external_exports.object({ method: external_exports.literal("ui/notifications/size-changed"), params: external_exports.object({ width: external_exports.number().optional().describe("New width in pixels."), height: external_exports.number().optional().describe("New height in pixels.") }) });
var H = external_exports.object({ method: external_exports.literal("ui/notifications/tool-input"), params: external_exports.object({ arguments: external_exports.record(external_exports.string(), external_exports.unknown().describe("Complete tool call arguments as key-value pairs.")).optional().describe("Complete tool call arguments as key-value pairs.") }) });
var _ = external_exports.object({ method: external_exports.literal("ui/notifications/tool-input-partial"), params: external_exports.object({ arguments: external_exports.record(external_exports.string(), external_exports.unknown().describe("Partial tool call arguments (incomplete, may change).")).optional().describe("Partial tool call arguments (incomplete, may change).") }) });
var A = external_exports.object({ method: external_exports.literal("ui/notifications/tool-cancelled"), params: external_exports.object({ reason: external_exports.string().optional().describe('Optional reason for the cancellation (e.g., "user action", "timeout").') }) });
var f = external_exports.object({ fonts: external_exports.string().optional() });
var u = external_exports.object({ variables: ZQ.optional().describe("CSS variables for theming the app."), css: f.optional().describe("CSS blocks that apps can inject.") });
var E = external_exports.object({ method: external_exports.literal("ui/resource-teardown"), params: external_exports.object({}) });
var VQ = external_exports.record(external_exports.string(), external_exports.unknown());
var O = external_exports.object({ text: external_exports.object({}).optional().describe("Host supports text content blocks."), image: external_exports.object({}).optional().describe("Host supports image content blocks."), audio: external_exports.object({}).optional().describe("Host supports audio content blocks."), resource: external_exports.object({}).optional().describe("Host supports resource content blocks."), resourceLink: external_exports.object({}).optional().describe("Host supports resource link content blocks."), structuredContent: external_exports.object({}).optional().describe("Host supports structured content.") });
var DQ = external_exports.object({ method: external_exports.literal("ui/notifications/request-teardown"), params: external_exports.object({}).optional() });
var d = external_exports.object({ experimental: external_exports.object({}).optional().describe("Experimental features (structure TBD)."), openLinks: external_exports.object({}).optional().describe("Host supports opening external URLs."), downloadFile: external_exports.object({}).optional().describe("Host supports file downloads via ui/download-file."), serverTools: external_exports.object({ listChanged: external_exports.boolean().optional().describe("Host supports tools/list_changed notifications.") }).optional().describe("Host can proxy tool calls to the MCP server."), serverResources: external_exports.object({ listChanged: external_exports.boolean().optional().describe("Host supports resources/list_changed notifications.") }).optional().describe("Host can proxy resource reads to the MCP server."), logging: external_exports.object({}).optional().describe("Host accepts log messages."), sandbox: external_exports.object({ permissions: j.optional().describe("Permissions granted by the host (camera, microphone, geolocation)."), csp: Y.optional().describe("CSP domains approved by the host.") }).optional().describe("Sandbox configuration applied by the host."), updateModelContext: O.optional().describe("Host accepts context updates (ui/update-model-context) to be included in the model's context for future turns."), message: O.optional().describe("Host supports receiving content messages (ui/message) from the view."), sampling: external_exports.object({ tools: external_exports.object({}).optional().describe("Host supports tool use via `tools` and `toolChoice` parameters.") }).optional().describe("Host supports LLM sampling (sampling/createMessage) from the view.\nMirrors the MCP `ClientCapabilities.sampling` shape so hosts can pass it through.") });
var h = external_exports.object({ experimental: external_exports.object({}).optional().describe("Experimental features (structure TBD)."), tools: external_exports.object({ listChanged: external_exports.boolean().optional().describe("App supports tools/list_changed notifications.") }).optional().describe("App exposes MCP-style tools that the host can call."), availableDisplayModes: external_exports.array(K).optional().describe("Display modes the app supports.") });
var LQ = external_exports.object({ method: external_exports.literal("ui/notifications/initialized"), params: external_exports.object({}).optional() });
var WQ = external_exports.object({ csp: Y.optional().describe("Content Security Policy configuration for UI resources."), permissions: j.optional().describe("Sandbox permissions requested by the UI resource."), domain: external_exports.string().optional().describe("Dedicated origin for view sandbox.\n\nUseful when views need stable, dedicated origins for OAuth callbacks, CORS policies, or API key allowlists.\n\n**Host-dependent:** The format and validation rules for this field are determined by each host. Servers MUST consult host-specific documentation for the expected domain format. Common patterns include:\n- Hash-based subdomains (e.g., `{hash}.claudemcpcontent.com`)\n- URL-derived subdomains (e.g., `www-example-com.oaiusercontent.com`)\n\nIf omitted, host uses default sandbox origin (typically per-conversation)."), prefersBorder: external_exports.boolean().optional().describe("Visual boundary preference - true if view prefers a visible border.\n\nBoolean requesting whether a visible border and background is provided by the host. Specifying an explicit value for this is recommended because hosts' defaults may vary.\n\n- `true`: request visible border + background\n- `false`: request no visible border + background\n- omitted: host decides border") });
var BQ = external_exports.object({ method: external_exports.literal("ui/request-display-mode"), params: external_exports.object({ mode: K.describe("The display mode being requested.") }) });
var R = external_exports.object({ mode: K.describe("The display mode that was actually set. May differ from requested if not supported.") }).passthrough();
var m = external_exports.union([external_exports.literal("model"), external_exports.literal("app")]).describe("Tool visibility scope - who can access the tool.");
var GQ = external_exports.object({ resourceUri: external_exports.string().optional(), visibility: external_exports.array(m).optional().describe('Who can access this tool. Default: ["model", "app"]\n- "model": Tool visible to and callable by the agent\n- "app": Tool callable by the app from this server only'), csp: external_exports.never().optional(), permissions: external_exports.never().optional() });
var dQ = external_exports.object({ mimeTypes: external_exports.array(external_exports.string()).optional().describe('Array of supported MIME types for UI resources.\nMust include `"text/html;profile=mcp-app"` for MCP Apps support.') });
var KQ = external_exports.object({ method: external_exports.literal("ui/download-file"), params: external_exports.object({ contents: external_exports.array(external_exports.union([EmbeddedResourceSchema, ResourceLinkSchema])).describe("Resource contents to download — embedded (inline data) or linked (host fetches). Uses standard MCP resource types.") }) });
var NQ = external_exports.object({ method: external_exports.literal("ui/message"), params: external_exports.object({ role: external_exports.literal("user").describe('Message role, currently only "user" is supported.'), content: external_exports.array(ContentBlockSchema).describe("Message content blocks (text, image, etc.).") }) });
var YQ = external_exports.object({ method: external_exports.literal("ui/notifications/sandbox-resource-ready"), params: external_exports.object({ html: external_exports.string().describe("HTML content to load into the inner iframe."), sandbox: external_exports.string().optional().describe("Optional override for the inner iframe's sandbox attribute."), csp: Y.optional().describe("CSP configuration from resource metadata."), permissions: j.optional().describe("Sandbox permissions from resource metadata.") }) });
var U = external_exports.object({ method: external_exports.literal("ui/notifications/tool-result"), params: CallToolResultSchema.describe("Standard MCP tool execution result.") });
var T = external_exports.object({ toolInfo: external_exports.object({ id: RequestIdSchema.optional().describe("JSON-RPC id of the tools/call request."), tool: ToolSchema.describe("Tool definition including name, inputSchema, etc.") }).optional().describe("Metadata of the tool call that instantiated this App."), theme: v.optional().describe("Current color theme preference."), styles: u.optional().describe("Style configuration for theming the app."), displayMode: K.optional().describe("How the UI is currently displayed."), availableDisplayModes: external_exports.array(K).optional().describe("Display modes the host supports."), containerDimensions: external_exports.union([external_exports.object({ height: external_exports.number().describe("Fixed container height in pixels.") }), external_exports.object({ maxHeight: external_exports.union([external_exports.number(), external_exports.undefined()]).optional().describe("Maximum container height in pixels.") })]).and(external_exports.union([external_exports.object({ width: external_exports.number().describe("Fixed container width in pixels.") }), external_exports.object({ maxWidth: external_exports.union([external_exports.number(), external_exports.undefined()]).optional().describe("Maximum container width in pixels.") })])).optional().describe("Container dimensions. Represents the dimensions of the iframe or other\ncontainer holding the app. Specify either width or maxWidth, and either height or maxHeight."), locale: external_exports.string().optional().describe("User's language and region preference in BCP 47 format."), timeZone: external_exports.string().optional().describe("User's timezone in IANA format."), userAgent: external_exports.string().optional().describe("Host application identifier."), platform: external_exports.union([external_exports.literal("web"), external_exports.literal("desktop"), external_exports.literal("mobile")]).optional().describe("Platform type for responsive design decisions."), deviceCapabilities: external_exports.object({ touch: external_exports.boolean().optional().describe("Whether the device supports touch input."), hover: external_exports.boolean().optional().describe("Whether the device supports hover interactions.") }).optional().describe("Device input capabilities."), safeAreaInsets: external_exports.object({ top: external_exports.number().describe("Top safe area inset in pixels."), right: external_exports.number().describe("Right safe area inset in pixels."), bottom: external_exports.number().describe("Bottom safe area inset in pixels."), left: external_exports.number().describe("Left safe area inset in pixels.") }).optional().describe("Mobile safe area boundaries in pixels.") }).passthrough();
var k = external_exports.object({ method: external_exports.literal("ui/notifications/host-context-changed"), params: T.describe("Partial context update containing only changed fields.") });
var jQ = external_exports.object({ method: external_exports.literal("ui/update-model-context"), params: external_exports.object({ content: external_exports.array(ContentBlockSchema).optional().describe("Context content blocks (text, image, etc.)."), structuredContent: external_exports.record(external_exports.string(), external_exports.unknown().describe("Structured content for machine-readable context data.")).optional().describe("Structured content for machine-readable context data.") }) });
var FQ = external_exports.object({ method: external_exports.literal("ui/initialize"), params: external_exports.object({ appInfo: ImplementationSchema.describe("App identification (name and version)."), appCapabilities: h.describe("Features and capabilities this app provides."), protocolVersion: external_exports.string().describe("Protocol version this app supports.") }) });
var M = external_exports.object({ protocolVersion: external_exports.string().describe('Negotiated protocol version string (e.g., "2025-11-21").'), hostInfo: ImplementationSchema.describe("Host application identification and version."), hostCapabilities: d.describe("Features and capabilities provided by the host."), hostContext: T.describe("Rich context about the host environment.") }).passthrough();
var p = "text/html;profile=mcp-app";

// node_modules/fflate/esm/index.mjs
import { createRequire } from "module";
var require2 = createRequire("/");
var _a3;
var Worker;
var isMarkedAsUntransferable;
try {
  _a3 = require2("worker_threads"), Worker = _a3.Worker, isMarkedAsUntransferable = _a3.isMarkedAsUntransferable;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i2 = 0; i2 < 31; ++i2) {
    b[i2] = start += 1 << eb[i2 - 1];
  }
  var r2 = new i32(b[30]);
  for (var i2 = 1; i2 < 30; ++i2) {
    for (var j2 = b[i2]; j2 < b[i2 + 1]; ++j2) {
      r2[j2] = j2 - b[i2] << 5 | i2;
    }
  }
  return { b, r: r2 };
};
var _a3 = freb(fleb, 2);
var fl = _a3.b;
var revfl = _a3.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r2) {
  var s = cd.length;
  var i2 = 0;
  var l = new u16(mb);
  for (; i2 < s; ++i2) {
    if (cd[i2])
      ++l[cd[i2] - 1];
  }
  var le = new u16(mb);
  for (i2 = 1; i2 < mb; ++i2) {
    le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
  }
  var co;
  if (r2) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        var sv = i2 << 4 | cd[i2];
        var r_1 = mb - cd[i2];
        var v2 = le[cd[i2] - 1]++ << r_1;
        for (var m2 = v2 | (1 << r_1) - 1; v2 <= m2; ++v2) {
          co[rev[v2] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var shft = function(p2) {
  return (p2 + 7) / 8 | 0;
};
var slc = function(v2, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v2.length)
    e = v2.length;
  return new u8(v2.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var wbits = function(d2, p2, v2) {
  v2 <<= p2 & 7;
  var o = p2 / 8 | 0;
  d2[o] |= v2;
  d2[o + 1] |= v2 >> 8;
};
var wbits16 = function(d2, p2, v2) {
  v2 <<= p2 & 7;
  var o = p2 / 8 | 0;
  d2[o] |= v2;
  d2[o + 1] |= v2 >> 8;
  d2[o + 2] |= v2 >> 16;
};
var hTree = function(d2, mb) {
  var t = [];
  for (var i2 = 0; i2 < d2.length; ++i2) {
    if (d2[i2])
      t.push({ s: i2, f: d2[i2] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v2 = new u8(t[0].s + 1);
    v2[t[0].s] = 1;
    return { t: v2, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r2 = t[1], i0 = 0, i1 = 1, i22 = 2;
  t[0] = { s: -1, f: l.f + r2.f, l, r: r2 };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i22].f ? i0++ : i22++];
    r2 = t[i0 != i1 && t[i0].f < t[i22].f ? i0++ : i22++];
    t[i1++] = { s: -1, f: l.f + r2.f, l, r: r2 };
  }
  var maxSym = t2[0].s;
  for (var i2 = 1; i2 < s; ++i2) {
    if (t2[i2].s > maxSym)
      maxSym = t2[i2].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i2 = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i2 < s; ++i2) {
      var i2_1 = t2[i2].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i2].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i2;
    }
    for (; i2 >= 0 && dt; --i2) {
      var i2_3 = t2[i2].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d2) {
  return n.s == -1 ? Math.max(ln(n.l, l, d2 + 1), ln(n.r, l, d2 + 1)) : l[n.s] = d2;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w2 = function(v2) {
    cl[cli++] = v2;
  };
  for (var i2 = 1; i2 <= s; ++i2) {
    if (c[i2] == cln && i2 != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w2(32754);
        if (cls > 2) {
          w2(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w2(cln), --cls;
        for (; cls > 6; cls -= 6)
          w2(8304);
        if (cls > 2)
          w2(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w2(cln);
      cls = 1;
      cln = c[i2];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i2 = 0; i2 < cl.length; ++i2)
    l += cf[i2] * cl[i2];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i2 = 0; i2 < s; ++i2)
    out[o + i2 + 4] = dat[i2];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p2) {
  wbits(out, p2++, final);
  ++lf[256];
  var _a4 = hTree(lf, 15), dlt = _a4.t, mlb = _a4.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i2 = 0; i2 < lclt.length; ++i2)
    ++lcfreq[lclt[i2] & 31];
  for (var i2 = 0; i2 < lcdt.length; ++i2)
    ++lcfreq[lcdt[i2] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p2, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p2, 1 + (dtlen < ftlen)), p2 += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p2, nlc - 257);
    wbits(out, p2 + 5, ndc - 1);
    wbits(out, p2 + 10, nlcc - 4);
    p2 += 14;
    for (var i2 = 0; i2 < nlcc; ++i2)
      wbits(out, p2 + 3 * i2, lct[clim[i2]]);
    p2 += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i2 = 0; i2 < clct.length; ++i2) {
        var len = clct[i2] & 31;
        wbits(out, p2, llm[len]), p2 += lct[len];
        if (len > 15)
          wbits(out, p2, clct[i2] >> 5 & 127), p2 += clct[i2] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i2 = 0; i2 < li; ++i2) {
    var sym = syms[i2];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p2, lm[len + 257]), p2 += ll[len + 257];
      if (len > 7)
        wbits(out, p2, sym >> 23 & 31), p2 += fleb[len];
      var dst = sym & 31;
      wbits16(out, p2, dm[dst]), p2 += dl[dst];
      if (dst > 3)
        wbits16(out, p2, sym >> 5 & 8191), p2 += fdeb[dst];
    } else {
      wbits16(out, p2, lm[sym]), p2 += ll[sym];
    }
  }
  wbits16(out, p2, lm[256]);
  return p2 + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w2 = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w2[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i3) {
      return (dat[i3] ^ dat[i3 + 1] << bs1_1 ^ dat[i3 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i2 = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i2 + 2 < s; ++i2) {
      var hv = hsh(i2);
      var imod = i2 & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i2) {
        var rem = s - i2;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w2, 0, syms, lf, df, eb, li, bs, i2 - bs, pos);
          li = lc_1 = eb = 0, bs = i2;
          for (var j2 = 0; j2 < 286; ++j2)
            lf[j2] = 0;
          for (var j2 = 0; j2 < 30; ++j2)
            df[j2] = 0;
        }
        var l = 2, d2 = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i2 - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i2);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i2 + l] == dat[i2 + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i2 + nl] == dat[i2 + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d2 = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j2 = 0; j2 < mmd; ++j2) {
                  var ti = i2 - dif + j2 & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d2) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d2];
          var lin = revfl[l] & 31, din = revfd[d2] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i2 + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i2];
          ++lf[dat[i2]];
        }
      }
    }
    for (i2 = Math.max(i2, wi); i2 < s; ++i2) {
      syms[li++] = dat[i2];
      ++lf[dat[i2]];
    }
    pos = wblk(dat, w2, lst, syms, lf, df, eb, li, bs, i2 - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w2[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i2, st.w = wi;
    }
  } else {
    for (var i2 = st.w || 0; i2 < s + lst; i2 += 65535) {
      var e = i2 + 65535;
      if (e >= s) {
        w2[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w2, pos + 1, dat.subarray(i2, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ (function() {
  var t = new Int32Array(256);
  for (var i2 = 0; i2 < 256; ++i2) {
    var c = i2, k2 = 9;
    while (--k2)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i2] = c;
  }
  return t;
})();
var crc = function() {
  var c = -1;
  return {
    p: function(d2) {
      var cr = c;
      for (var i2 = 0; i2 < d2.length; ++i2)
        cr = crct[cr & 255 ^ d2[i2]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k2 in a)
    o[k2] = a[k2];
  for (var k2 in b)
    o[k2] = b[k2];
  return o;
};
var wbytes = function(d2, b, v2) {
  for (; v2; ++b)
    d2[b] = v2, v2 >>>= 8;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
var fltn = function(d2, p2, t, o) {
  for (var k2 in d2) {
    var val = d2[k2], n = p2 + k2, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (ArrayBuffer.isView(val))
      t[n] = [val, op];
    else {
      t[n += "/"] = [new u8(0), op];
      fltn(val, n, t, o);
    }
  }
};
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i2 = 0; i2 < str.length; ++i2)
      ar_1[i2] = str.charCodeAt(i2);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w2 = function(v2) {
    ar[ai++] = v2;
  };
  for (var i2 = 0; i2 < l; ++i2) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i2 << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i2);
    if (c < 128 || latin1)
      w2(c);
    else if (c < 2048)
      w2(192 | c >> 6), w2(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i2) & 1023, w2(240 | c >> 18), w2(128 | c >> 12 & 63), w2(128 | c >> 6 & 63), w2(128 | c & 63);
    else
      w2(224 | c >> 12), w2(128 | c >> 6 & 63), w2(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k2 in ex) {
      var l = ex[k2].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d2, b, f2, fn, u2, c, ce, co) {
  var fl2 = fn.length, ex = f2.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d2, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d2[b++] = 20, d2[b++] = f2.os;
  d2[b] = 20, b += 2;
  d2[b++] = f2.flag << 1 | (c < 0 && 8), d2[b++] = u2 && 8;
  d2[b++] = f2.compression & 255, d2[b++] = f2.compression >> 8;
  var dt = new Date(f2.mtime == null ? Date.now() : f2.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d2, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d2, b, f2.crc);
    wbytes(d2, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d2, b + 8, f2.size);
  }
  wbytes(d2, b + 12, fl2);
  wbytes(d2, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d2, b, col);
    wbytes(d2, b + 6, f2.attrs);
    wbytes(d2, b + 10, ce), b += 14;
  }
  d2.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k2 in ex) {
      var exf = ex[k2], l = exf.length;
      wbytes(d2, b, +k2);
      wbytes(d2, b + 2, l);
      d2.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d2.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d2, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d2);
  wbytes(o, b + 16, e);
};
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r2 = {};
  var files = [];
  fltn(data, "", r2, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r2) {
    var _a4 = r2[fn], file2 = _a4[0], p2 = _a4[1];
    var compression = p2.level == 0 ? 0 : 8;
    var f2 = strToU8(fn), s = f2.length;
    var com = p2.comment, m2 = com && strToU8(com), ms = m2 && m2.length;
    var exl = exfl(p2.extra);
    if (s > 65535)
      err(11);
    var d2 = compression ? deflateSync(file2, p2) : file2, l = d2.length;
    var c = crc();
    c.p(file2);
    files.push(mrg(p2, {
      size: file2.length,
      crc: c.d(),
      c: d2,
      f: f2,
      m: m2,
      u: s != fn.length || m2 && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i2 = 0; i2 < files.length; ++i2) {
    var f2 = files[i2];
    wzh(out, f2.o, f2, f2.f, f2.u, f2.c.length);
    var badd = 30 + f2.f.length + exfl(f2.extra);
    out.set(f2.c, f2.o + badd);
    wzh(out, o, f2, f2.f, f2.u, f2.c.length, f2.o, f2.m), o += 16 + badd + (f2.m ? f2.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}

// mcp/server.source.mjs
var SERVER_NAME = "canvasight";
var SERVER_VERSION = "0.4.14";
var DEFAULT_PROTOCOL_VERSION = "2024-11-05";
var CANVASIGHT_WIDGET_URI = "ui://widget/canvasight/canvas.html";
var DEFAULT_MCP_LIFECYCLE_LOG_MAX_BYTES = 5 * 1024 * 1024;
var DAEMON_START_LOCK_STALE_MS = 15e3;
var DAEMON_START_LOCK_WAIT_MS = 12e3;
var DAEMON_START_LOCK_UNREADABLE_STALE_MS = 1e3;
var MAX_JSON_BODY_BYTES = 100 * 1024 * 1024;
var MAX_RECENT_PROJECTS = 12;
var MAX_NODE_TEMPLATES = 200;
var MAX_SKILL_SUMMARIES = 200;
var MAX_DOCUMENT_MUTATION_RECEIPTS = 200;
var MAX_GRAPH_CONTEXTS_PER_PROJECT = 64;
var GRAPH_CONTEXT_TTL_MS = 60 * 60 * 1e3;
var TEMPLATE_BODY_PREVIEW_CHARS = 240;
var VALID_LANGUAGES = /* @__PURE__ */ new Set(["zh", "en"]);
var VALID_EFFORT = /* @__PURE__ */ new Set(["low", "medium", "high", "xhigh"]);
var VALID_RUN_MODES = /* @__PURE__ */ new Set(["flow", "node"]);
var VALID_GRAPH_WRITE_MODES = /* @__PURE__ */ new Set(["append-page", "merge-active-page", "replace-active-page", "replace-document"]);
var VALID_GRAPH_LAYOUT_POLICIES = /* @__PURE__ */ new Set(["auto", "preserve-explicit"]);
var VALID_SEMANTIC_RELATIONSHIP_TYPES = /* @__PURE__ */ new Set(["dependency", "sequence", "containment", "evidence", "decision", "navigation", "flow"]);
var VALID_GRAPH_TYPES = /* @__PURE__ */ new Set(["software-product", "article-outline", "codebase-structure", "task-plan", "general"]);
var VALID_FRAMEWORK_INTENTS = /* @__PURE__ */ new Set(["create", "analyze", "organize", "refine", "decide", "execute"]);
var VALID_FRAMEWORK_DOMAINS = /* @__PURE__ */ new Set(["software-product", "ux-design", "codebase", "article", "research", "task-execution"]);
var VALID_FRAMEWORK_MATURITY = /* @__PURE__ */ new Set(["explore", "define", "decide", "deliver"]);
var VALID_FRAMEWORK_OUTPUTS = /* @__PURE__ */ new Set(["exploration-map", "structured-outline", "system-map", "decision-map", "execution-plan"]);
var FRAMEWORK_DOMAIN_COVERAGE = {
  "software-product": [
    "product.goal",
    "product.users",
    "product.value",
    "product.capabilities",
    "product.scope",
    "product.journey",
    "product.informationArchitecture",
    "product.rules",
    "product.design",
    "product.success",
    "product.risks",
    "product.technicalConstraints",
    "product.testingRelease",
    "product.deliverables"
  ],
  "ux-design": [
    "ux.goal",
    "ux.context",
    "ux.taskFlow",
    "ux.informationArchitecture",
    "ux.pageHierarchy",
    "ux.components",
    "ux.states",
    "ux.feedbackRecovery",
    "ux.visualDirection",
    "ux.accessibilityResponsive",
    "ux.acceptance"
  ],
  codebase: [
    "codebase.purposeEntry",
    "codebase.directories",
    "codebase.modulesEvidence",
    "codebase.executionFlow",
    "codebase.dataState",
    "codebase.dependenciesInterfaces",
    "codebase.tooling",
    "codebase.extensionPoints",
    "codebase.risksDebt",
    "codebase.epistemicStatus",
    "codebase.relevantFiles"
  ],
  article: [
    "article.purpose",
    "article.audience",
    "article.thesis",
    "article.narrative",
    "article.sections",
    "article.evidence",
    "article.objections",
    "article.openingClosing",
    "article.gaps"
  ],
  research: [
    "research.question",
    "research.scope",
    "research.factsSources",
    "research.dimensions",
    "research.hypotheses",
    "research.evidenceCounterevidence",
    "research.uncertainty",
    "research.patterns",
    "research.conclusions",
    "research.implications"
  ],
  "task-execution": [
    "task.goalDone",
    "task.currentEvidence",
    "task.constraints",
    "task.workDependencies",
    "task.parallelWork",
    "task.deliverables",
    "task.risksRecovery",
    "task.stageVerification",
    "task.acceptanceDelivery"
  ]
};
var FRAMEWORK_MATURITY_COVERAGE = {
  explore: ["maturity.explore.boundary", "maturity.explore.knownUnknown", "maturity.explore.directions", "maturity.explore.nextQuestions"],
  define: ["maturity.define.definitions", "maturity.define.rules", "maturity.define.flows", "maturity.define.boundaries", "maturity.define.acceptance"],
  decide: ["maturity.decide.question", "maturity.decide.criteria", "maturity.decide.options", "maturity.decide.tradeoffs", "maturity.decide.result", "maturity.decide.rejected"],
  deliver: ["maturity.deliver.steps", "maturity.deliver.deliverables", "maturity.deliver.acceptance", "maturity.deliver.risks", "maturity.deliver.ownership", "maturity.deliver.handoff"]
};
var GRAPH_NODE_WIDTH = 400;
var GRAPH_NODE_HEIGHT = 220;
var GRAPH_LAYER_GAP = 280;
var GRAPH_ROW_GAP = 160;
var GRAPH_GRID_COLUMNS = 3;
var IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([".apng", ".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);
var DEFAULT_CODEX_APP_BIN = "/Applications/Codex.app/Contents/Resources/codex";
var DEFAULT_CHATGPT_APP_BIN = "/Applications/ChatGPT.app/Contents/Resources/codex";
var DEFAULT_CANVASIGHT_HOME = path.join(os.homedir(), ".canvasight");
var CODEX_APP_SERVER_TURN_CONFIRMATION_METHODS = /* @__PURE__ */ new Set(["turn/started", "item/started", "turn/completed"]);
var AGENT_TEAM_ROLE_IDS = /* @__PURE__ */ new Set([
  "product-agent",
  "design-agent",
  "design-standards-agent",
  "development-agent",
  "development-standards-agent",
  "test-supervisor-agent",
  "customer-support-agent",
  "project-management-agent",
  "skill-expert-agent"
]);
var AGENT_TEAM_ROLE_NAMES = {
  "product-agent": "Product Agent",
  "design-agent": "Design Agent",
  "design-standards-agent": "Design Standards Expert",
  "development-agent": "Development Agent",
  "development-standards-agent": "Development Standards Lead",
  "test-supervisor-agent": "Test Supervisor Agent",
  "customer-support-agent": "Customer Support Agent",
  "project-management-agent": "Project Management Agent",
  "skill-expert-agent": "Skill Expert Agent"
};
var AGENT_TEAM_STATUS_FLOW = ["open", "assigned", "blocked", "resolved", "archived"];
var AGENT_TEAM_AGENTS_MD_START = "<!-- canvasight-agent-team:start -->";
var AGENT_TEAM_AGENTS_MD_END = "<!-- canvasight-agent-team:end -->";
var AGENT_TEAM_AGENTS_MD_BLOCK = "".concat(AGENT_TEAM_AGENTS_MD_START, "\n## Canvasight Agent Team\n\nWhen Canvasight Agent Team mode is enabled, Codex should use role seats that survive thread recreation without treating a transient subagent process as durable state.\n\n### Fixed Roles\n\n- Product Agent: keeps work aligned with product goals and scope.\n- Design Agent: checks UI direction, interaction quality, and design consistency.\n- Development Agent: implements code, persistence, runtime, and integration changes.\n- Test Supervisor Agent: verifies builds, smoke tests, regressions, and browser-visible behavior.\n- Customer Support Agent: decides whether user-facing README documentation needs updates.\n- Design Standards Expert: maintains `design.md` when product UI rules change.\n- Development Standards Lead: maintains `AGENTS.md` and project working rules.\n- Project Management Agent: manages git status, staging scope, and conventional Chinese commit messages.\n- Skill Expert Agent: maintains Canvasight and Codex skill instructions when skill behavior changes.\n\n### Agent Reports\n\nRead `ROSTER.md` before restoring a role. Report files are authoritative for issue ownership, state, dependencies, and validation evidence; the roster is authoritative only for role-seat/runtime mapping; `agent-reports/QUEUE.md` is a derived index.\n\n- Use versioned report filenames: `issue-<kebab-slug>.md`, `solution-<kebab-slug>.md`, and `integration-summary-<kebab-slug>.md`.\n- Each issue has one scalar owner. Re-read its owner, status, and version before write; write report -> roster -> queue, with RFC 3339 UTC timestamps and verification evidence.\n- Use the packaged `canvasight-agent-team/references/agent-team-schema.json` contract and run its validator before delivery.\n\n### Operating Rules\n\n- Reuse a current runtime role only when it matches the roster mapping; otherwise mark the needed seat rebuilding and recreate only that seat.\n- Create only the roles needed for the current task. Do not create duplicate seats or use ad hoc role names.\n- Preserve existing project rules in this file; target project rules take precedence over Canvasight defaults.\n- Resolve a report/roster conflict in favor of the report, then regenerate the queue from the report.\n- The main thread owns integration, conflict handling, final verification, and git delivery.\n").concat(AGENT_TEAM_AGENTS_MD_END);
var SOFTWARE_PRODUCT_GUIDANCE_FILES = [
  {
    canonicalName: "AGENTS.md",
    candidates: ["AGENTS.md", "agents.md", "Agents.md"],
    aliases: ["agents.md", "agents-md", "agents md"],
    nodeId: "project-guidance-agents-md",
    title: "补充 AGENTS.md",
    body: "当前项目缺少 AGENTS.md。请创建该文件，写清项目上下文、工作规则、Agent Team 分工、实现标准、设计标准、验证命令和 git 提交规则。已有约定应从项目文件和当前需求中归纳，不要写成空模板。"
  },
  {
    canonicalName: "design.md",
    candidates: ["design.md", "DESIGN.md", "Design.md"],
    aliases: ["design.md", "design-md", "design md"],
    nodeId: "project-guidance-design-md",
    title: "补充 design.md",
    body: "当前项目缺少 design.md。请创建该文件，沉淀产品定位、信息架构、布局规则、组件语言、交互状态、视觉约束和后续设计决策。需要基于当前产品目标，而不是复制通用设计系统。"
  }
];
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var pluginRoot = path.resolve(__dirname, "..");
var distRoot = path.join(pluginRoot, "dist");
var isDaemonMode = process.argv.includes("--daemon");
var isStopDaemonMode = process.argv.includes("--stop-daemon");
var sessions = /* @__PURE__ */ new Map();
var projectThreadClaims = /* @__PURE__ */ new Map();
var projectDocumentRevisions = /* @__PURE__ */ new Map();
var projectRevisionStates = /* @__PURE__ */ new Map();
var projectWriteLocks = /* @__PURE__ */ new Map();
var projectGraphContexts = /* @__PURE__ */ new Map();
var globalRunWaiters = [];
var httpState = null;
var inputBuffer = Buffer.alloc(0);
var useContentLengthTransport = false;
var daemonAuthToken = process.env.CANVASIGHT_DAEMON_TOKEN || "";
var daemonStartedAt = nowIso();
var mcpInFlight = 0;
var mcpStdinEnded = false;
var mcpExitTimer = null;
var mcpExitCode = 0;
var mcpStdoutClosed = false;
var HttpError = class extends Error {
  constructor(statusCode, message, code = "") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
};
function projectRevisionKey(projectPath) {
  return path.resolve(projectPath);
}
function projectDocumentRevision(projectPath) {
  return projectDocumentRevisions.get(projectRevisionKey(projectPath)) || 0;
}
function setProjectDocumentRevision(projectPath, revision) {
  projectDocumentRevisions.set(projectRevisionKey(projectPath), Math.max(0, Math.floor(toNumber(revision, 0))));
}
async function withProjectWriteLock(projectPath, operation) {
  const key = projectRevisionKey(projectPath);
  const previous = projectWriteLocks.get(key) || Promise.resolve();
  let release = () => {
  };
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const current = previous.catch(() => {
  }).then(() => gate);
  projectWriteLocks.set(key, current);
  await previous.catch(() => {
  });
  try {
    return await operation();
  } finally {
    release();
    if (projectWriteLocks.get(key) === current) projectWriteLocks.delete(key);
  }
}
function assertCurrentDocumentRevision(projectPath, expectedRevision) {
  if (typeof expectedRevision !== "number" || !Number.isFinite(expectedRevision)) {
    throw new HttpError(409, "Canvasight document revision is required. Reload required.", "stale_document");
  }
  if (expectedRevision !== projectDocumentRevision(projectPath)) {
    throw new HttpError(409, "Canvasight document changed outside this session. Reload required.", "stale_document");
  }
}
function isObject2(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function serializeError(error51) {
  return {
    name: error51?.name || "Error",
    message: error51?.message || String(error51 || "Unknown error"),
    stack: typeof error51?.stack === "string" ? error51.stack : ""
  };
}
function appendMcpLifecycle(event, data = {}) {
  if (isDaemonMode || isStopDaemonMode) return;
  try {
    fs.mkdirSync(canvasightHome(), { recursive: true });
    const logPath = canvasightMcpLifecycleLogPath();
    const configuredMaxBytes = Number(process.env.CANVASIGHT_MCP_LIFECYCLE_LOG_MAX_BYTES);
    const maxBytes = Number.isFinite(configuredMaxBytes) && configuredMaxBytes >= 1024 ? configuredMaxBytes : DEFAULT_MCP_LIFECYCLE_LOG_MAX_BYTES;
    let rotatedBytes = 0;
    try {
      const size = fs.statSync(logPath).size;
      if (size >= maxBytes) {
        rotatedBytes = size;
        fs.truncateSync(logPath, 0);
      }
    } catch (error51) {
      if (error51?.code !== "ENOENT") throw error51;
    }
    fs.appendFileSync(
      logPath,
      "".concat(JSON.stringify({
        ts: nowIso(),
        pid: process.pid,
        version: SERVER_VERSION,
        pluginRoot,
        event,
        ...rotatedBytes ? { rotatedBytes } : {},
        ...data
      }), "\n"),
      "utf8"
    );
  } catch {
  }
}
function appendOpenAttemptLifecycle(event, data = {}) {
  try {
    fs.mkdirSync(canvasightHome(), { recursive: true });
    fs.appendFileSync(
      canvasightMcpLifecycleLogPath(),
      "".concat(JSON.stringify({ ts: nowIso(), pid: process.pid, version: SERVER_VERSION, pluginRoot, event, ...data }), "\n"),
      "utf8"
    );
  } catch {
  }
}
function toNumber(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function normalizeLanguage(value) {
  return VALID_LANGUAGES.has(value) ? value : "zh";
}
function normalizeEffort(value) {
  return VALID_EFFORT.has(value) ? value : "xhigh";
}
function normalizeRunMode(value) {
  return VALID_RUN_MODES.has(value) ? value : "flow";
}
function normalizeGraphWriteMode(value) {
  return VALID_GRAPH_WRITE_MODES.has(value) ? value : "append-page";
}
function normalizeGraphLayout(value) {
  return "horizontal";
}
function normalizeGraphLayoutPolicy(value) {
  return VALID_GRAPH_LAYOUT_POLICIES.has(value) ? value : "auto";
}
function normalizeGraphType(value) {
  return VALID_GRAPH_TYPES.has(value) ? value : "general";
}
function defaultGraphLayoutForType(graphType) {
  return "horizontal";
}
function deprecatedGraphLayoutAdvisories(args) {
  const requested = [
    { path: "layout", value: args?.layout },
    ...Array.isArray(args?.pages) ? args.pages.map((page, index) => ({ path: "pages[".concat(index, "].layout"), value: page?.layout })) : []
  ];
  return requested.filter(({ value }) => value === "vertical" || value === "grid").map(({ path: path2, value }) => ({
    code: "deprecated_graph_layout",
    path: path2,
    message: "Graph layout ".concat(value, " is deprecated for AI writes and was normalized to horizontal.")
  }));
}
function normalizeCodexMode() {
  return "chat";
}
function optionalThreadId(threadId) {
  if (typeof threadId !== "string" || !threadId.trim()) return null;
  return threadId.trim();
}
function requiredNativeThreadId(threadId) {
  const resolved = optionalThreadId(threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  if (resolved) return resolved;
  throw new HttpError(
    400,
    "Canvasight native open requires the current Codex thread id. Read CODEX_THREAD_ID in the active Codex task and pass it as threadId.",
    { code: "current_thread_id_required" }
  );
}
function nativeCodexEnabled() {
  const value = String(process.env.CANVASIGHT_CODEX_NATIVE || "").trim().toLowerCase();
  if (!value) return true;
  return value !== "0" && value !== "false" && value !== "off" && value !== "no";
}
function nativeCodexTimeoutMs() {
  return Math.max(1e3, Math.min(toNumber(Number(process.env.CANVASIGHT_CODEX_NATIVE_TIMEOUT_MS), 3e4), 12e4));
}
function nativeCodexConfirmationTimeoutMs() {
  return Math.max(250, Math.min(toNumber(Number(process.env.CANVASIGHT_CODEX_NATIVE_CONFIRMATION_TIMEOUT_MS), 1500), 1e4));
}
function configuredExecutable(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function codexAppRuntime() {
  const explicitBin = configuredExecutable("CANVASIGHT_CODEX_BIN");
  if (explicitBin) return { bin: explicitBin, source: "explicit_override", isDesktop: false };
  const codexDesktopBin = configuredExecutable("CANVASIGHT_CODEX_APP_BIN") || DEFAULT_CODEX_APP_BIN;
  if (fs.existsSync(codexDesktopBin)) return { bin: codexDesktopBin, source: "codex_desktop", isDesktop: true };
  const chatGptDesktopBin = configuredExecutable("CANVASIGHT_CHATGPT_APP_BIN") || DEFAULT_CHATGPT_APP_BIN;
  if (fs.existsSync(chatGptDesktopBin)) return { bin: chatGptDesktopBin, source: "chatgpt_desktop", isDesktop: true };
  return { bin: "codex", source: "path_fallback", isDesktop: false };
}
function codexAppServerArgs() {
  const rawArgs = String(process.env.CANVASIGHT_CODEX_APP_SERVER_ARGS || "").trim();
  if (rawArgs) return rawArgs.split(/\s+/).filter(Boolean);
  return ["app-server", "--listen", "stdio://"];
}
function codexAppServerTransports() {
  return [{ kind: "stdio_fallback", args: codexAppServerArgs() }];
}
function normalizeProjectPath(projectPath) {
  if (typeof projectPath !== "string" || !projectPath.trim()) {
    throw new HttpError(400, "projectPath is required");
  }
  return path.resolve(projectPath);
}
function optionalProjectPath(projectPath) {
  if (typeof projectPath !== "string" || !projectPath.trim()) return null;
  return path.resolve(projectPath);
}
function defaultProjectPath() {
  const envNames = [
    "CANVASIGHT_DEFAULT_PROJECT_PATH",
    "CANVASIGHT_PROJECT_PATH",
    "CODEX_WORKSPACE_DIR",
    "CODEX_WORKSPACE",
    "WORKSPACE",
    "INIT_CWD",
    "PWD"
  ];
  for (const envName of envNames) {
    const candidate = optionalProjectPath(process.env[envName]);
    if (candidate && candidate !== pluginRoot) return candidate;
  }
  if (path.basename(path.dirname(pluginRoot)) === "plugins") {
    return path.resolve(pluginRoot, "../..");
  }
  return path.join(os.homedir(), "Canvasight");
}
function isPluginInternalPath(candidate) {
  if (!candidate) return false;
  const resolved = path.resolve(candidate);
  return resolved === pluginRoot || resolved.startsWith("".concat(pluginRoot).concat(path.sep));
}
async function codexThreadProjectPath(threadId) {
  const resolvedThreadId = optionalThreadId(threadId);
  if (!resolvedThreadId) return null;
  try {
    const result = await appServerRequest("thread/resume", { threadId: resolvedThreadId });
    const cwd = optionalProjectPath(result?.cwd);
    if (!cwd || isPluginInternalPath(cwd)) return null;
    return cwd;
  } catch {
    return null;
  }
}
async function resolveSessionProjectPath(projectPath, threadId, options = {}) {
  const explicitProjectPath = optionalProjectPath(projectPath);
  if (explicitProjectPath) return explicitProjectPath;
  const threadProjectPath = await codexThreadProjectPath(threadId);
  if (threadProjectPath) return threadProjectPath;
  if (options.requireThreadProject === true && optionalThreadId(threadId)) {
    throw new HttpError(
      409,
      "Canvasight could not resolve the current Codex task's project folder. Reopen from a healthy project task or pass projectPath explicitly; Canvasight did not fall back to another project's .scatter workspace.",
      "current_thread_project_unavailable"
    );
  }
  return defaultProjectPath();
}
function projectNameFromPath(projectPath) {
  return path.basename(projectPath) || projectPath;
}
function canvasightHome() {
  const configured = process.env.CANVASIGHT_HOME;
  return path.resolve(typeof configured === "string" && configured.trim() ? configured : DEFAULT_CANVASIGHT_HOME);
}
function canvasightStatePath() {
  return path.join(canvasightHome(), "state.json");
}
function canvasightDaemonStatePath() {
  return path.join(canvasightHome(), "daemon.json");
}
function canvasightDaemonStartLockPath() {
  return path.join(canvasightHome(), "daemon-start.lock");
}
function canvasightMcpLifecycleLogPath() {
  return path.join(canvasightHome(), "mcp-lifecycle.log");
}
function canvasightTemplatesPath() {
  return path.join(canvasightHome(), "templates.json");
}
function canvasightPreferencesPath() {
  return path.join(canvasightHome(), "preferences.json");
}
function canvasightTemplateAssetsDir() {
  return path.join(canvasightHome(), "template-assets");
}
function scatterDir(projectPath) {
  return path.join(projectPath, ".scatter");
}
function scatterPath(projectPath) {
  return path.join(scatterDir(projectPath), "scatter.json");
}
function scatterRevisionStatePath(projectPath) {
  return path.join(scatterDir(projectPath), "revision-state.json");
}
function scatterAssetsDir(projectPath) {
  return path.join(scatterDir(projectPath), "assets");
}
function toRelativeProjectPath(projectPath, targetPath) {
  return path.relative(projectPath, targetPath).split(path.sep).join("/");
}
function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}
function base64UrlDecode(value) {
  try {
    return Buffer.from(String(value || ""), "base64url").toString("utf8");
  } catch {
    throw new HttpError(400, "Invalid asset path");
  }
}
function assetUrlForPath(filePath) {
  const tokenQuery = daemonAuthToken ? "&token=".concat(encodeURIComponent(daemonAuthToken)) : "";
  return "/api/asset?path=".concat(encodeURIComponent(base64UrlEncode(filePath))).concat(tokenQuery);
}
function daemonSessionUrl(state, sessionIdValue) {
  const url2 = new URL(state.origin);
  url2.searchParams.set("sessionId", sessionIdValue);
  if (state.token) url2.searchParams.set("token", state.token);
  return url2.toString();
}
function isScatterAssetPath(filePath) {
  return filePath.includes("".concat(path.sep, ".scatter").concat(path.sep, "assets").concat(path.sep));
}
function isTemplateAssetPath(filePath) {
  const root = "".concat(path.resolve(canvasightTemplateAssetsDir())).concat(path.sep);
  return path.resolve(filePath).startsWith(root);
}
function safeFileName(name) {
  const base = path.basename(typeof name === "string" && name.trim() ? name : "attachment");
  const sanitized = base.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").replace(/\s+/g, " ").trim();
  return sanitized.slice(0, 140) || "attachment";
}
function exportFileStem(value) {
  const stem = safeFileName(value || "scatter-prompt").replace(/^[. ]+|[. ]+$/g, "");
  return stem || "scatter-prompt";
}
function uniqueAssetExportName(originalName, usedNames) {
  const safeName = safeFileName(originalName || "attachment");
  const extension = path.extname(safeName);
  const stem = extension ? safeName.slice(0, -extension.length) : safeName;
  let candidate = safeName;
  let serial = 2;
  while (usedNames.has(candidate.toLocaleLowerCase())) {
    candidate = "".concat(stem, "-").concat(serial).concat(extension);
    serial += 1;
  }
  usedNames.add(candidate.toLocaleLowerCase());
  return candidate;
}
function isPathInside(targetPath, parentPath) {
  const relative = path.relative(parentPath, targetPath);
  return relative !== "" && !relative.startsWith("..".concat(path.sep)) && relative !== ".." && !path.isAbsolute(relative);
}
function archiveExportMarkdown(markdown, assetPaths, attachments) {
  let result = markdown;
  for (const attachment of attachments) {
    const assetPath = assetPaths.get(attachment.id);
    if (!assetPath) continue;
    if (attachment.storedPath) {
      result = result.split("\n").filter((line) => !line.includes(attachment.storedPath)).join("\n");
    }
    if (attachment.relativePath) result = result.split(attachment.relativePath).join(assetPath);
  }
  return result;
}
async function uniqueDownloadPath(directory, stem, extension) {
  for (let serial = 1; serial < 1e4; serial += 1) {
    const suffix = serial === 1 ? "" : "-".concat(serial);
    const candidate = path.join(directory, "".concat(stem).concat(suffix).concat(extension));
    try {
      await fsp.access(candidate);
    } catch (error51) {
      if (error51?.code === "ENOENT") return candidate;
      throw error51;
    }
  }
  throw new HttpError(409, "Could not choose a unique export file name.", "export_name_conflict");
}
async function exportMarkdownToDownloads(session, input) {
  if (!session.projectPath) throw new HttpError(409, "Canvasight project is not open.", "project_not_open");
  if (typeof input?.markdown !== "string") throw new HttpError(400, "markdown must be a string", "invalid_export_markdown");
  if (!Array.isArray(input?.attachments)) throw new HttpError(400, "attachments must be an array", "invalid_export_attachments");
  const projectPath = normalizeProjectPath(session.projectPath);
  const assetsDirectory = path.resolve(scatterAssetsDir(projectPath));
  const templateAssetsDirectory = path.resolve(canvasightTemplateAssetsDir());
  const attachments = input.attachments.map(normalizeAttachment);
  const files = {};
  const usedAssetNames = /* @__PURE__ */ new Set();
  const assetPaths = /* @__PURE__ */ new Map();
  for (const attachment of attachments) {
    const storedPath = path.resolve(attachment.storedPath);
    if (!attachment.storedPath || !isPathInside(storedPath, assetsDirectory) && !isPathInside(storedPath, templateAssetsDirectory)) {
      throw new HttpError(400, "Attachment is not a Canvasight project asset: ".concat(attachment.originalName), "invalid_export_attachment_path");
    }
    let stat;
    try {
      stat = await fsp.lstat(storedPath);
    } catch {
      throw new HttpError(404, "Attachment is unavailable: ".concat(attachment.originalName), "export_attachment_missing");
    }
    if (!stat.isFile() || stat.isSymbolicLink()) throw new HttpError(400, "Attachment is not a regular file: ".concat(attachment.originalName), "invalid_export_attachment_path");
    const archivePath = "assets/".concat(uniqueAssetExportName(attachment.originalName, usedAssetNames));
    files[archivePath] = await fsp.readFile(storedPath);
    assetPaths.set(attachment.id, archivePath);
  }
  const stem = exportFileStem(typeof input?.title === "string" ? input.title : "scatter-prompt");
  const markdown = attachments.length ? archiveExportMarkdown(input.markdown, assetPaths, attachments) : input.markdown;
  const extension = attachments.length ? ".zip" : ".md";
  if (attachments.length) files["".concat(stem, ".md")] = strToU8(markdown);
  const bytes = attachments.length ? zipSync(files) : Buffer.from(markdown, "utf8");
  const downloadsDirectory = path.resolve(process.env.CANVASIGHT_EXPORT_DIR || path.join(os.homedir(), "Downloads"));
  await fsp.mkdir(downloadsDirectory, { recursive: true });
  const targetPath = await uniqueDownloadPath(downloadsDirectory, stem, extension);
  const temporaryPath = path.join(downloadsDirectory, ".".concat(path.basename(targetPath), ".").concat(crypto.randomUUID(), ".tmp"));
  try {
    await fsp.writeFile(temporaryPath, bytes);
    await fsp.rename(temporaryPath, targetPath);
  } catch (error51) {
    await fsp.rm(temporaryPath, { force: true }).catch(() => void 0);
    throw error51;
  }
  return {
    fileName: path.basename(targetPath),
    targetPath
  };
}
function extensionFromName(name) {
  return path.extname(name || "").toLowerCase();
}
function mimeFromPath(filePath) {
  const ext = extensionFromName(filePath);
  const map2 = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".wasm": "application/wasm",
    ".webp": "image/webp"
  };
  return map2[ext] || "application/octet-stream";
}
function attachmentKind(name, mime) {
  if (typeof mime === "string" && mime.toLowerCase().startsWith("image/")) return "image";
  return IMAGE_EXTENSIONS.has(extensionFromName(name)) ? "image" : "file";
}
function defaultScatterDocument(projectPath) {
  const now = nowIso();
  const page = defaultScatterPage();
  return {
    version: 1,
    projectName: projectNameFromPath(projectPath),
    updatedAt: now,
    activePageId: page.id,
    pages: [page],
    viewport: page.viewport,
    nodes: page.nodes,
    edges: page.edges
  };
}
function defaultScatterPage(index = 0) {
  const now = nowIso();
  return {
    id: "page-".concat(crypto.randomBytes(5).toString("hex")),
    name: "Page ".concat(index + 1),
    createdAt: now,
    updatedAt: now,
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: []
  };
}
function normalizeRecentLimit(value) {
  return Math.max(1, Math.min(Math.floor(toNumber(Number(value), MAX_RECENT_PROJECTS)), 50));
}
function emptyUserState() {
  return {
    version: 1,
    updatedAt: nowIso(),
    lastProjectPath: null,
    recentProjects: []
  };
}
function normalizeRecentProject(value) {
  if (!isObject2(value) || typeof value.path !== "string" || !value.path.trim()) return null;
  const projectPath = path.resolve(value.path);
  return {
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : projectNameFromPath(projectPath),
    path: projectPath,
    updatedAt: typeof value.updatedAt === "string" && value.updatedAt ? value.updatedAt : null,
    lastOpenedAt: typeof value.lastOpenedAt === "string" && value.lastOpenedAt ? value.lastOpenedAt : null
  };
}
async function readUserState() {
  try {
    const raw = await fsp.readFile(canvasightStatePath(), "utf8");
    const parsed = JSON.parse(raw);
    const recentProjects2 = Array.isArray(parsed?.recentProjects) ? parsed.recentProjects.map(normalizeRecentProject).filter(Boolean) : [];
    return {
      version: 1,
      updatedAt: typeof parsed?.updatedAt === "string" && parsed.updatedAt ? parsed.updatedAt : nowIso(),
      lastProjectPath: typeof parsed?.lastProjectPath === "string" && parsed.lastProjectPath.trim() ? path.resolve(parsed.lastProjectPath) : recentProjects2[0]?.path || null,
      recentProjects: recentProjects2
    };
  } catch (error51) {
    if (error51?.code === "ENOENT" || error51 instanceof SyntaxError) return emptyUserState();
    throw error51;
  }
}
async function writeUserState(state) {
  const normalizedRecentProjects = Array.isArray(state.recentProjects) ? state.recentProjects.map(normalizeRecentProject).filter(Boolean).slice(0, MAX_RECENT_PROJECTS) : [];
  const normalizedState = {
    version: 1,
    updatedAt: nowIso(),
    lastProjectPath: normalizedRecentProjects[0]?.path || null,
    recentProjects: normalizedRecentProjects
  };
  await fsp.mkdir(canvasightHome(), { recursive: true });
  await fsp.writeFile(canvasightStatePath(), "".concat(JSON.stringify(normalizedState, null, 2), "\n"), "utf8");
  return normalizedState;
}
function defaultPreferences() {
  return {
    aiSkillAssignmentEnabled: false
  };
}
function normalizePreferences(value) {
  return {
    aiSkillAssignmentEnabled: value?.aiSkillAssignmentEnabled === true
  };
}
async function readPreferences() {
  try {
    const raw = await fsp.readFile(canvasightPreferencesPath(), "utf8");
    return normalizePreferences(JSON.parse(raw));
  } catch (error51) {
    if (error51?.code === "ENOENT" || error51 instanceof SyntaxError) return defaultPreferences();
    throw error51;
  }
}
async function writePreferences(value) {
  const preferences = normalizePreferences(value);
  await fsp.mkdir(canvasightHome(), { recursive: true });
  const targetPath = canvasightPreferencesPath();
  const temporaryPath = "".concat(targetPath, ".").concat(process.pid, ".").concat(crypto.randomBytes(4).toString("hex"), ".tmp");
  try {
    await fsp.writeFile(temporaryPath, "".concat(JSON.stringify(preferences, null, 2), "\n"), "utf8");
    await fsp.rename(temporaryPath, targetPath);
  } catch (error51) {
    await fsp.rm(temporaryPath, { force: true }).catch(() => void 0);
    throw error51;
  }
  return preferences;
}
function normalizeNodeTemplate(value) {
  if (!isObject2(value) || typeof value.body !== "string" || !value.body.trim()) return null;
  const now = nowIso();
  const body = value.body.trim();
  return {
    id: typeof value.id === "string" && value.id ? value.id : "template-".concat(crypto.randomBytes(8).toString("hex")),
    title: typeof value.title === "string" && value.title.trim() ? value.title.trim() : body.slice(0, 40),
    body,
    attachments: Array.isArray(value.attachments) ? value.attachments.map(normalizeAttachment) : [],
    createdAt: typeof value.createdAt === "string" && value.createdAt ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" && value.updatedAt ? value.updatedAt : now
  };
}
async function copyTemplateAttachments(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) return [];
  await fsp.mkdir(canvasightTemplateAssetsDir(), { recursive: true });
  const copied = [];
  for (const value of attachments) {
    const attachment = normalizeAttachment(value);
    const sourcePath = typeof value?.storedPath === "string" && value.storedPath ? path.resolve(value.storedPath) : "";
    if (!sourcePath) continue;
    let bytes;
    try {
      bytes = await fsp.readFile(sourcePath);
    } catch {
      continue;
    }
    const originalName = safeFileName(attachment.originalName);
    const uniqueName = "".concat(Date.now(), "-").concat(crypto.randomBytes(4).toString("hex"), "-").concat(originalName);
    const storedPath = path.join(canvasightTemplateAssetsDir(), uniqueName);
    await fsp.writeFile(storedPath, bytes);
    copied.push({
      ...attachment,
      id: crypto.randomUUID(),
      originalName,
      storedPath,
      relativePath: "template-assets/".concat(uniqueName),
      fileUrl: assetUrlForPath(storedPath),
      size: bytes.length,
      createdAt: nowIso()
    });
  }
  return copied;
}
async function readNodeTemplates() {
  try {
    const raw = await fsp.readFile(canvasightTemplatesPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeNodeTemplate).filter(Boolean);
  } catch (error51) {
    if (error51?.code === "ENOENT" || error51 instanceof SyntaxError) return [];
    throw error51;
  }
}
async function writeNodeTemplates(templates) {
  const normalized = Array.isArray(templates) ? templates.map(normalizeNodeTemplate).filter(Boolean) : [];
  await fsp.mkdir(canvasightHome(), { recursive: true });
  await fsp.writeFile(canvasightTemplatesPath(), "".concat(JSON.stringify(normalized, null, 2), "\n"), "utf8");
  return normalized;
}
async function createNodeTemplate(input, options = {}) {
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!body) throw new HttpError(400, "Template body is required");
  const existingTemplates = await readNodeTemplates();
  const replaceOldest = Boolean(options?.replaceOldest);
  if (existingTemplates.length >= MAX_NODE_TEMPLATES && !replaceOldest) {
    throw new HttpError(409, "Template limit reached (".concat(MAX_NODE_TEMPLATES, ")"), "template_limit_reached");
  }
  const attachments = await copyTemplateAttachments(input?.attachments);
  const template = normalizeNodeTemplate({
    ...input,
    body,
    attachments,
    id: "template-".concat(crypto.randomBytes(8).toString("hex")),
    createdAt: nowIso(),
    updatedAt: nowIso()
  });
  if (!template) throw new HttpError(400, "template body is required");
  const templates = replaceOldest ? [template, ...existingTemplates.slice(0, Math.max(0, existingTemplates.length - 1))] : [template, ...existingTemplates];
  await writeNodeTemplates(templates);
  return template;
}
async function deleteTemplateAssets(template) {
  if (!template || !Array.isArray(template.attachments)) return;
  await Promise.all(
    template.attachments.map(async (attachment) => {
      const storedPath = typeof attachment.storedPath === "string" ? path.resolve(attachment.storedPath) : "";
      if (!storedPath || !isTemplateAssetPath(storedPath)) return;
      try {
        await fsp.unlink(storedPath);
      } catch {
      }
    })
  );
}
async function deleteNodeTemplate(templateId) {
  const templates = await readNodeTemplates();
  const template = templates.find((item) => item.id === templateId);
  if (!template) throw new HttpError(404, "Template not found", "template_not_found");
  await writeNodeTemplates(templates.filter((item) => item.id !== templateId));
  await deleteTemplateAssets(template);
  return { status: "deleted", templateId };
}
function getNodeTemplate(templates, templateId) {
  const template = templates.find((item) => item.id === templateId);
  if (!template) throw new HttpError(404, "Template not found", "template_not_found");
  return template;
}
function templateBodyPreview(body) {
  const normalized = String(body || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= TEMPLATE_BODY_PREVIEW_CHARS) return normalized;
  return "".concat(normalized.slice(0, TEMPLATE_BODY_PREVIEW_CHARS).trimEnd(), "...");
}
function summarizeNodeTemplate(template) {
  return {
    id: template.id,
    title: template.title,
    bodyPreview: templateBodyPreview(template.body),
    bodyLength: template.body.length,
    attachmentCount: template.attachments.length,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  };
}
function normalizeTemplateQuery(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}
function templateSearchText(template) {
  return normalizeTemplateQuery("".concat(template.title, " ").concat(template.body));
}
function templateMatchesQuery(template, query) {
  const normalizedQuery = normalizeTemplateQuery(query);
  if (!normalizedQuery) return true;
  const searchText = templateSearchText(template);
  return normalizedQuery.split(" ").filter(Boolean).every((token) => searchText.includes(token));
}
function normalizeTemplateListLimit(value) {
  return Math.max(1, Math.min(Math.floor(toNumber(Number(value), 20)), MAX_NODE_TEMPLATES));
}
function findTemplateByQuery(templates, query) {
  const normalizedQuery = normalizeTemplateQuery(query);
  if (!normalizedQuery) return null;
  const titleMatch = templates.find((template) => normalizeTemplateQuery(template.title) === normalizedQuery);
  if (titleMatch) return titleMatch;
  return templates.find((template) => templateMatchesQuery(template, normalizedQuery)) || null;
}
function normalizeDaemonState(value) {
  if (!isObject2(value) || typeof value.origin !== "string" || !value.origin.startsWith("http://127.0.0.1:")) return null;
  return {
    version: 1,
    pid: Number.isFinite(Number(value.pid)) ? Number(value.pid) : null,
    origin: value.origin,
    port: Number.isFinite(Number(value.port)) ? Number(value.port) : null,
    token: typeof value.token === "string" ? value.token : "",
    pluginRoot: typeof value.pluginRoot === "string" ? value.pluginRoot : "",
    serverVersion: typeof value.serverVersion === "string" ? value.serverVersion : "",
    startedAt: typeof value.startedAt === "string" ? value.startedAt : ""
  };
}
async function readDaemonState() {
  try {
    const raw = await fsp.readFile(canvasightDaemonStatePath(), "utf8");
    return normalizeDaemonState(JSON.parse(raw));
  } catch (error51) {
    if (error51?.code === "ENOENT" || error51 instanceof SyntaxError) return null;
    throw error51;
  }
}
function readDaemonStateSync() {
  try {
    const raw = fs.readFileSync(canvasightDaemonStatePath(), "utf8");
    return normalizeDaemonState(JSON.parse(raw));
  } catch (error51) {
    if (error51?.code === "ENOENT" || error51 instanceof SyntaxError) return null;
    throw error51;
  }
}
async function writeDaemonState(state) {
  const normalized = normalizeDaemonState(state);
  if (!normalized) throw new Error("Invalid Canvasight daemon state");
  await fsp.mkdir(canvasightHome(), { recursive: true });
  await fsp.writeFile(canvasightDaemonStatePath(), "".concat(JSON.stringify(normalized, null, 2), "\n"), "utf8");
  return normalized;
}
async function removeDaemonState() {
  await fsp.rm(canvasightDaemonStatePath(), { force: true });
}
async function removeOwnedDaemonState() {
  const state = await readDaemonState();
  if (state?.pid !== process.pid || state.token !== daemonAuthToken) return false;
  await removeDaemonState();
  return true;
}
function daemonHeaders(state, headers = {}) {
  return {
    ...state?.token ? { "x-canvasight-token": state.token } : {},
    ...headers
  };
}
async function daemonJson(state, route, init = {}) {
  const url2 = new URL(route, state.origin);
  const response = await fetch(url2, {
    ...init,
    headers: daemonHeaders(state, {
      ...init.body ? { "content-type": "application/json" } : {},
      ...init.headers || {}
    })
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || "Canvasight daemon request failed: ".concat(response.status));
  }
  return text ? JSON.parse(text) : null;
}
async function healthyDaemonState(state) {
  if (!state) return null;
  try {
    const health = await daemonJson({ ...state, token: "" }, "/api/health");
    if (health?.status !== "ok") return null;
    if (health.pluginRoot !== pluginRoot || health.serverVersion !== SERVER_VERSION) return null;
    return {
      ...state,
      origin: health.origin || state.origin,
      port: health.port || state.port,
      pid: health.pid || state.pid
    };
  } catch {
    return null;
  }
}
function processIsAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
async function canvasightDaemonPidsForPluginRoot() {
  if (process.platform === "win32") return [];
  try {
    const output = await new Promise((resolve) => {
      const ps = spawn("ps", ["-axo", "pid=,command="], {
        stdio: ["ignore", "pipe", "ignore"]
      });
      let text = "";
      ps.stdout.setEncoding("utf8");
      ps.stdout.on("data", (chunk) => {
        text += chunk;
      });
      ps.on("error", () => resolve(""));
      ps.on("exit", () => resolve(text));
    });
    return String(output).split("\n").map((line) => {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      if (!match) return null;
      return {
        pid: Number(match[1]),
        command: match[2]
      };
    }).filter((entry) => {
      if (!entry || entry.pid === process.pid) return false;
      if (!entry.command.includes("mcp/server.mjs") || !entry.command.includes("--daemon")) return false;
      const currentScript = path.join(pluginRoot, "mcp", "server.mjs");
      const isCurrentCheckout = entry.command.includes(currentScript);
      const isCanvasightCache = /\/\.codex\/plugins\/cache\/canvasight-local\/canvasight\/[^/]+\/mcp\/server\.mjs/.test(entry.command);
      const isCanvasightPluginCheckout = /\/plugins\/canvasight\/mcp\/server\.mjs/.test(entry.command);
      if (!isCurrentCheckout && !isCanvasightCache && !isCanvasightPluginCheckout) return false;
      const homeArg = "--canvasight-home=".concat(canvasightHome());
      if (entry.command.includes(homeArg)) return true;
      return canvasightHome() === path.resolve(DEFAULT_CANVASIGHT_HOME) && !entry.command.includes("--canvasight-home=");
    }).map((entry) => entry.pid);
  } catch {
    return [];
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function waitForProcessExit(pid, timeoutMs = 1200) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!processIsAlive(pid)) return true;
    await sleep(80);
  }
  return !processIsAlive(pid);
}
async function stopDaemonStateProcess(state, reason = "stale") {
  if (!state || state.pluginRoot !== pluginRoot) return false;
  const pid = Number(state.pid);
  const shouldStop = Number.isFinite(pid) && pid > 0 && state.serverVersion && state.serverVersion !== SERVER_VERSION && processIsAlive(pid);
  if (!shouldStop) {
    await removeDaemonState();
    return false;
  }
  appendMcpLifecycle("daemon_stop_stale", {
    reason,
    stalePid: pid,
    staleVersion: state.serverVersion,
    expectedVersion: SERVER_VERSION
  });
  try {
    process.kill(pid, "SIGTERM");
    await waitForProcessExit(pid);
  } catch {
  }
  await removeDaemonState();
  return true;
}
async function stopOrphanDaemonProcesses(keepPid = 0, reason = "orphan") {
  const pids = await canvasightDaemonPidsForPluginRoot();
  const stopped = [];
  for (const pid of pids) {
    if (pid === keepPid) continue;
    try {
      process.kill(pid, "SIGTERM");
      stopped.push(pid);
    } catch {
    }
  }
  if (stopped.length) {
    appendMcpLifecycle("daemon_stop_orphans", { reason, pids: stopped });
    await Promise.all(stopped.map((pid) => waitForProcessExit(pid, 1200)));
  }
  return stopped;
}
async function waitForReachableUrl(url2, label = "Canvasight URL") {
  const deadline = Date.now() + 5e3;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url2);
      await response.arrayBuffer();
      if (response.ok) return;
      lastError = new Error("".concat(label, " returned ").concat(response.status));
    } catch (error51) {
      lastError = error51;
    }
    await sleep(100);
  }
  throw new Error("".concat(label, " was not reachable: ").concat(lastError?.message || "unknown error"));
}
async function waitForDaemon(token) {
  const deadline = Date.now() + 8e3;
  while (Date.now() < deadline) {
    const state = await readDaemonState();
    if (state && (!token || state.token === token)) {
      const healthy = await healthyDaemonState(state);
      if (healthy) return healthy;
    }
    await sleep(120);
  }
  throw new Error("Canvasight daemon did not start in time");
}
function daemonNodeExecutableCandidates() {
  const candidates = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (executable, source) => {
    if (typeof executable !== "string" || !executable.trim()) return;
    const normalized = executable.trim();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push({ executable: normalized, source });
  };
  add(process.env.CANVASIGHT_NODE_BIN, "configured");
  add("node", "path");
  add(process.env.npm_node_execpath, "npm_node_execpath");
  add(process.execPath, "process_exec_path");
  return candidates;
}
function daemonSpawnErrorDetails(error51) {
  return {
    code: typeof error51?.code === "string" ? error51.code : "",
    message: error51?.message || String(error51 || "Unknown daemon spawn error")
  };
}
async function spawnDaemonWithNodeFallback(token) {
  const candidates = daemonNodeExecutableCandidates();
  const attempts = [];
  const daemonArgs = [__filename, "--daemon", "--canvasight-home=".concat(canvasightHome())];
  for (const candidate of candidates) {
    appendMcpLifecycle("daemon_spawn_attempt", {
      executable: candidate.executable,
      source: candidate.source
    });
    const launched = await new Promise((resolve) => {
      let child;
      try {
        child = spawn(candidate.executable, daemonArgs, {
          cwd: pluginRoot,
          detached: true,
          stdio: "ignore",
          env: {
            ...process.env,
            CANVASIGHT_DAEMON_TOKEN: token
          }
        });
      } catch (error51) {
        resolve({ error: error51 });
        return;
      }
      child.once("spawn", () => resolve({ child }));
      child.once("error", (error51) => resolve({ error: error51 }));
    });
    if (launched.child) {
      launched.child.unref();
      appendMcpLifecycle("daemon_spawned", {
        executable: candidate.executable,
        source: candidate.source,
        daemonPid: launched.child.pid
      });
      return {
        executable: candidate.executable,
        source: candidate.source,
        attempts
      };
    }
    const failure = daemonSpawnErrorDetails(launched.error);
    attempts.push({ ...candidate, ...failure });
    appendMcpLifecycle("daemon_spawn_failure", {
      executable: candidate.executable,
      source: candidate.source,
      ...failure
    });
  }
  const summary = attempts.map((attempt) => "".concat(attempt.source, "=").concat(attempt.executable).concat(attempt.code ? " (".concat(attempt.code, ")") : "")).join(", ");
  appendMcpLifecycle("daemon_spawn_exhausted", { attempts });
  throw new Error("Canvasight daemon could not launch a Node process. Tried: ".concat(summary || "no Node executable candidates"));
}
async function readDaemonStartLock() {
  try {
    const raw = await fsp.readFile(canvasightDaemonStartLockPath(), "utf8");
    return JSON.parse(raw);
  } catch (error51) {
    if (error51?.code === "ENOENT" || error51 instanceof SyntaxError) return null;
    throw error51;
  }
}
async function acquireDaemonStartLock() {
  await fsp.mkdir(canvasightHome(), { recursive: true });
  const deadline = Date.now() + DAEMON_START_LOCK_WAIT_MS;
  while (Date.now() < deadline) {
    const token = crypto.randomBytes(12).toString("base64url");
    try {
      await fsp.writeFile(
        canvasightDaemonStartLockPath(),
        "".concat(JSON.stringify({ pid: process.pid, token, serverVersion: SERVER_VERSION, pluginRoot, createdAt: nowIso() }), "\n"),
        { encoding: "utf8", flag: "wx" }
      );
      return { acquired: true, token, existing: null };
    } catch (error51) {
      if (error51?.code !== "EEXIST") throw error51;
    }
    const existing = await healthyDaemonState(await readDaemonState());
    if (existing) return { handle: null, token: "", existing };
    const lock = await readDaemonStartLock();
    const createdAt = Date.parse(lock?.createdAt || "");
    let unreadableLockAgeMs = null;
    if (!lock) {
      try {
        const stat = await fsp.stat(canvasightDaemonStartLockPath());
        unreadableLockAgeMs = Math.max(0, Date.now() - stat.mtimeMs);
      } catch (error51) {
        if (error51?.code !== "ENOENT") throw error51;
      }
    }
    const stale = lock ? !processIsAlive(Number(lock.pid)) || Number.isFinite(createdAt) && Date.now() - createdAt >= DAEMON_START_LOCK_STALE_MS : unreadableLockAgeMs !== null && unreadableLockAgeMs >= DAEMON_START_LOCK_UNREADABLE_STALE_MS;
    if (stale) {
      await fsp.rm(canvasightDaemonStartLockPath(), { force: true });
      continue;
    }
    await sleep(100);
  }
  throw new Error("Canvasight daemon start lock timed out");
}
async function releaseDaemonStartLock(lock) {
  if (!lock?.acquired) return;
  const current = await readDaemonStartLock();
  if (current?.token === lock.token) await fsp.rm(canvasightDaemonStartLockPath(), { force: true });
}
async function ensureDaemonServer() {
  const initialState = await readDaemonState();
  const existing = await healthyDaemonState(initialState);
  if (existing) {
    await stopOrphanDaemonProcesses(Number(existing.pid), "healthy_state_found");
    return existing;
  }
  const lock = await acquireDaemonStartLock();
  if (lock.existing) {
    await stopOrphanDaemonProcesses(Number(lock.existing.pid), "healthy_state_while_waiting");
    return lock.existing;
  }
  try {
    const state = await readDaemonState();
    const lockedExisting = await healthyDaemonState(state);
    if (lockedExisting) {
      await stopOrphanDaemonProcesses(Number(lockedExisting.pid), "healthy_state_after_lock");
      return lockedExisting;
    }
    const hasCurrentVersionState = state?.pluginRoot === pluginRoot && state.serverVersion === SERVER_VERSION;
    if (state?.pluginRoot === pluginRoot && state.serverVersion && state.serverVersion !== SERVER_VERSION) {
      await stopDaemonStateProcess(state, "version_mismatch_before_spawn");
    }
    if (!hasCurrentVersionState) {
      await stopOrphanDaemonProcesses(0, "before_spawn");
    }
    const token = crypto.randomBytes(24).toString("base64url");
    const launch = await spawnDaemonWithNodeFallback(token);
    try {
      return await waitForDaemon(token);
    } catch (error51) {
      const state2 = await readDaemonState();
      appendMcpLifecycle("daemon_start_timeout", {
        executable: launch.executable,
        source: launch.source,
        daemonPid: state2?.pid || null,
        stateVersion: state2?.serverVersion || "",
        statePluginRoot: state2?.pluginRoot || ""
      });
      throw new Error(
        "".concat(error51 instanceof Error ? error51.message : String(error51), " (spawned with ").concat(launch.source, ": ").concat(launch.executable, "; inspect ").concat(canvasightMcpLifecycleLogPath(), " for daemon spawn diagnostics)")
      );
    }
  } finally {
    await releaseDaemonStartLock(lock);
  }
}
async function stopDaemonFromState() {
  const state = await readDaemonState();
  if (!state) return false;
  const healthy = await healthyDaemonState(state);
  if (!healthy?.pid) {
    if (await stopDaemonStateProcess(state, "stop_daemon_unhealthy_state")) return true;
    await removeDaemonState();
    return false;
  }
  try {
    process.kill(healthy.pid, "SIGTERM");
  } catch {
    await removeDaemonState();
    return false;
  }
  return true;
}
async function rememberProject(projectPath, project) {
  if (typeof projectPath !== "string" || !projectPath.trim()) return null;
  const resolvedProjectPath = path.resolve(projectPath);
  const state = await readUserState();
  const now = nowIso();
  const entry = {
    name: typeof project?.name === "string" && project.name.trim() ? project.name.trim() : typeof project?.projectName === "string" && project.projectName.trim() ? project.projectName.trim() : projectNameFromPath(resolvedProjectPath),
    path: resolvedProjectPath,
    updatedAt: typeof project?.updatedAt === "string" && project.updatedAt ? project.updatedAt : now,
    lastOpenedAt: now
  };
  const rest = state.recentProjects.filter((item) => item.path !== resolvedProjectPath);
  await writeUserState({
    ...state,
    recentProjects: [entry, ...rest]
  });
  return entry;
}
async function rememberProjectBestEffort(projectPath, project) {
  try {
    return await rememberProject(projectPath, project);
  } catch {
    return null;
  }
}
async function recentProjects(limit) {
  const state = await readUserState();
  return state.recentProjects.slice(0, normalizeRecentLimit(limit)).map((project) => ({
    ...project,
    exists: fs.existsSync(project.path),
    hasScatter: fs.existsSync(scatterPath(project.path))
  }));
}
function normalizeAttachment(value) {
  const source = ["upload", "drop", "paste", "clipboard"].includes(value?.source) ? value.source : "upload";
  const storedPath = typeof value?.storedPath === "string" ? value.storedPath : "";
  return {
    id: typeof value?.id === "string" && value.id ? value.id : crypto.randomUUID(),
    kind: value?.kind === "image" ? "image" : "file",
    source,
    originalName: typeof value?.originalName === "string" ? value.originalName : "attachment",
    storedPath,
    relativePath: typeof value?.relativePath === "string" ? value.relativePath : "",
    fileUrl: storedPath ? assetUrlForPath(storedPath) : typeof value?.fileUrl === "string" ? value.fileUrl : "",
    mime: typeof value?.mime === "string" ? value.mime : "application/octet-stream",
    size: toNumber(value?.size, 0),
    createdAt: typeof value?.createdAt === "string" ? value.createdAt : nowIso()
  };
}
function normalizeScatterNode(value, index) {
  const node = isObject2(value) ? value : {};
  const rawData = isObject2(node.data) ? node.data : {};
  const { codexMode: _codexMode, planMode: _planMode, ...data } = rawData;
  return {
    ...node,
    id: typeof node.id === "string" && node.id ? node.id : "node-".concat(index + 1),
    type: "task",
    position: {
      x: toNumber(node.position?.x, index * 460),
      y: toNumber(node.position?.y, 0)
    },
    data: {
      ...data,
      title: typeof data.title === "string" ? data.title : "",
      body: typeof data.body === "string" ? data.body : "",
      attachments: Array.isArray(data.attachments) ? data.attachments.map(normalizeAttachment) : [],
      effort: normalizeEffort(data.effort),
      runMode: normalizeRunMode(data.runMode)
    }
  };
}
function normalizeScatterEdge(value, index) {
  const edge = isObject2(value) ? value : {};
  return {
    ...edge,
    id: typeof edge.id === "string" && edge.id ? edge.id : "edge-".concat(index + 1),
    source: typeof edge.source === "string" ? edge.source : "",
    target: typeof edge.target === "string" ? edge.target : ""
  };
}
function normalizeScatterViewport(value) {
  const viewport = isObject2(value) ? value : {};
  return {
    x: toNumber(viewport.x, 0),
    y: toNumber(viewport.y, 0),
    zoom: toNumber(viewport.zoom, 1)
  };
}
function normalizeScatterPage(value, index, fallback) {
  const page = isObject2(value) ? value : {};
  const now = nowIso();
  return {
    ...page,
    id: typeof page.id === "string" && page.id ? page.id : "page-".concat(index + 1),
    name: typeof page.name === "string" && page.name.trim() ? page.name.trim() : "Page ".concat(index + 1),
    createdAt: typeof page.createdAt === "string" && page.createdAt ? page.createdAt : now,
    updatedAt: typeof page.updatedAt === "string" && page.updatedAt ? page.updatedAt : typeof fallback?.updatedAt === "string" ? fallback.updatedAt : now,
    viewport: normalizeScatterViewport(page.viewport || fallback?.viewport),
    nodes: Array.isArray(page.nodes) ? page.nodes.map(normalizeScatterNode) : Array.isArray(fallback?.nodes) ? fallback.nodes.map(normalizeScatterNode) : [],
    edges: Array.isArray(page.edges) ? page.edges.map(normalizeScatterEdge) : Array.isArray(fallback?.edges) ? fallback.edges.map(normalizeScatterEdge) : []
  };
}
function normalizeScatterDocument(value, projectPath) {
  if (!isObject2(value)) {
    throw new HttpError(400, "document must be an object");
  }
  if (value.version !== 1) {
    throw new HttpError(400, "Only .scatter/scatter.json version 1 is supported");
  }
  const legacyFallback = {
    updatedAt: value.updatedAt,
    viewport: value.viewport,
    nodes: value.nodes,
    edges: value.edges
  };
  const rawPages = Array.isArray(value.pages) && value.pages.length > 0 ? value.pages : [legacyFallback];
  const pages = rawPages.map((page, index) => normalizeScatterPage(page, index, index === 0 ? legacyFallback : void 0));
  const activePageId = typeof value.activePageId === "string" && pages.some((page) => page.id === value.activePageId) ? value.activePageId : pages[0].id;
  const activePage = pages.find((page) => page.id === activePageId) || pages[0];
  const { codexThreadId, threadId, threadClaimedAt, ...documentFields } = value;
  return {
    ...documentFields,
    version: 1,
    projectName: typeof value.projectName === "string" && value.projectName ? value.projectName : projectNameFromPath(projectPath),
    updatedAt: typeof value.updatedAt === "string" && value.updatedAt ? value.updatedAt : nowIso(),
    activePageId,
    pages,
    viewport: activePage.viewport,
    nodes: activePage.nodes,
    edges: activePage.edges
  };
}
async function ensureScatterLayout(projectPath) {
  await fsp.mkdir(projectPath, { recursive: true });
  await fsp.mkdir(scatterAssetsDir(projectPath), { recursive: true });
}
async function readScatterDocument(projectPath) {
  await ensureScatterLayout(projectPath);
  const target = scatterPath(projectPath);
  try {
    const raw = await fsp.readFile(target, "utf8");
    const document2 = normalizeScatterDocument(JSON.parse(raw), projectPath);
    await ensureProjectRevisionState(projectPath, document2);
    return document2;
  } catch (error51) {
    if (error51?.code === "ENOENT") {
      const document2 = defaultScatterDocument(projectPath);
      await writeScatterDocument(projectPath, document2);
      await ensureProjectRevisionState(projectPath, document2);
      return document2;
    }
    if (error51 instanceof SyntaxError) {
      throw new HttpError(400, "Invalid .scatter/scatter.json");
    }
    throw error51;
  }
}
async function writeScatterDocument(projectPath, document2) {
  await ensureScatterLayout(projectPath);
  const normalized = normalizeScatterDocument(document2, projectPath);
  await writeJsonAtomic(scatterPath(projectPath), normalized);
  return normalized;
}
function documentFingerprint(document2) {
  return crypto.createHash("sha256").update(JSON.stringify(document2)).digest("hex");
}
async function writeJsonAtomic(targetPath, value) {
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  const temporaryPath = path.join(path.dirname(targetPath), ".".concat(path.basename(targetPath), ".").concat(process.pid, ".").concat(crypto.randomUUID(), ".tmp"));
  try {
    await fsp.writeFile(temporaryPath, "".concat(JSON.stringify(value, null, 2), "\n"), "utf8");
    await fsp.rename(temporaryPath, targetPath);
  } catch (error51) {
    await fsp.rm(temporaryPath, { force: true }).catch(() => void 0);
    throw error51;
  }
}
function normalizeRevisionState(value) {
  const receipts = Array.isArray(value?.receipts) ? value.receipts.filter((receipt) => isObject2(receipt) && typeof receipt.clientMutationId === "string").slice(-MAX_DOCUMENT_MUTATION_RECEIPTS) : [];
  return {
    version: 1,
    revision: Math.max(0, Math.floor(toNumber(value?.revision, 0))),
    documentVersion: typeof value?.documentVersion === "string" ? value.documentVersion : "",
    history: Array.isArray(value?.history) ? value.history.filter((entry) => isObject2(entry) && typeof entry.revision === "number" && typeof entry.documentVersion === "string").slice(-MAX_DOCUMENT_MUTATION_RECEIPTS) : [],
    objectWriters: isObject2(value?.objectWriters) ? { ...value.objectWriters } : {},
    lastSource: value?.lastSource === "ai" ? "ai" : "manual",
    receipts
  };
}
async function ensureProjectRevisionState(projectPath, document2) {
  const key = projectRevisionKey(projectPath);
  const fingerprint = documentFingerprint(document2);
  const cached2 = projectRevisionStates.get(key);
  if (cached2?.documentVersion === fingerprint) {
    setProjectDocumentRevision(projectPath, cached2.revision);
    return cached2;
  }
  let state;
  try {
    state = normalizeRevisionState(JSON.parse(await fsp.readFile(scatterRevisionStatePath(projectPath), "utf8")));
  } catch (error51) {
    if (error51?.code !== "ENOENT" && !(error51 instanceof SyntaxError)) throw error51;
    state = normalizeRevisionState(null);
  }
  if (state.documentVersion && state.documentVersion !== fingerprint) {
    state.revision += 1;
    state.receipts = [];
  }
  state.documentVersion = fingerprint;
  if (!state.history.some((entry) => entry.revision === state.revision && entry.documentVersion === fingerprint)) {
    state.history = [...state.history, { revision: state.revision, documentVersion: fingerprint }].slice(-MAX_DOCUMENT_MUTATION_RECEIPTS);
  }
  projectRevisionStates.set(key, state);
  setProjectDocumentRevision(projectPath, state.revision);
  await writeJsonAtomic(scatterRevisionStatePath(projectPath), state);
  return state;
}
async function persistProjectRevisionState(projectPath, state) {
  const normalized = normalizeRevisionState(state);
  if (!normalized.history.some((entry) => entry.revision === normalized.revision && entry.documentVersion === normalized.documentVersion)) {
    normalized.history = [...normalized.history, { revision: normalized.revision, documentVersion: normalized.documentVersion }].slice(-MAX_DOCUMENT_MUTATION_RECEIPTS);
  }
  projectRevisionStates.set(projectRevisionKey(projectPath), normalized);
  setProjectDocumentRevision(projectPath, normalized.revision);
  await writeJsonAtomic(scatterRevisionStatePath(projectPath), normalized);
  return normalized;
}
function comparableNode(node) {
  if (!node) return null;
  const { selected: _selected, data, ...rest } = node;
  const { lastRunAt: _lastRunAt, ...dataRest } = isObject2(data) ? data : {};
  return { ...rest, data: dataRest };
}
function comparableNodeSemantic(node) {
  if (!node) return null;
  const { position: _position, ...semantic } = comparableNode(node);
  return semantic;
}
function documentObjectWriters(previousWriters, beforeDocument, afterDocument, source) {
  const writers = { ...isObject2(previousWriters) ? previousWriters : {} };
  const beforePages = itemMap(beforeDocument?.pages);
  const afterPages = itemMap(afterDocument?.pages);
  for (const pageId of /* @__PURE__ */ new Set([...beforePages.keys(), ...afterPages.keys()])) {
    const beforePage = beforePages.get(pageId);
    const afterPage = afterPages.get(pageId);
    if (!beforePage || !afterPage || beforePage.name !== afterPage.name) writers["page:".concat(pageId)] = source;
    const beforeNodes = itemMap(beforePage?.nodes);
    const afterNodes = itemMap(afterPage?.nodes);
    for (const nodeId of /* @__PURE__ */ new Set([...beforeNodes.keys(), ...afterNodes.keys()])) {
      if (!sameValue(comparableNodeSemantic(beforeNodes.get(nodeId)), comparableNodeSemantic(afterNodes.get(nodeId)))) {
        writers["node:".concat(pageId, ":").concat(nodeId)] = source;
      }
    }
    const beforeEdges = itemMap(beforePage?.edges);
    const afterEdges = itemMap(afterPage?.edges);
    for (const edgeId of /* @__PURE__ */ new Set([...beforeEdges.keys(), ...afterEdges.keys()])) {
      if (!sameValue(beforeEdges.get(edgeId), afterEdges.get(edgeId))) writers["edge:".concat(pageId, ":").concat(edgeId)] = source;
    }
  }
  return writers;
}
function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function changedFromBase(base, value, comparable = (item) => item) {
  return !sameValue(comparable(base), comparable(value));
}
function itemMap(items) {
  return new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
}
function mergeAtomicItems(baseItems, currentItems, localItems, comparable, kind, reasons, conflictWinner = "none") {
  const base = itemMap(baseItems);
  const current = itemMap(currentItems);
  const local = itemMap(localItems);
  const result = [];
  const ids = [.../* @__PURE__ */ new Set([...base.keys(), ...current.keys(), ...local.keys()])];
  for (const id of ids) {
    const baseItem = base.get(id);
    const currentItem = current.get(id);
    const localItem = local.get(id);
    const currentChanged = changedFromBase(baseItem, currentItem, comparable);
    const localChanged = changedFromBase(baseItem, localItem, comparable);
    if (currentChanged && localChanged && !sameValue(comparable(currentItem), comparable(localItem))) {
      reasons.push("".concat(kind, ":").concat(id));
      const winner = conflictWinner === "current" ? currentItem : conflictWinner === "local" ? localItem : null;
      if (winner) result.push(winner);
      continue;
    }
    const chosen = localChanged ? localItem : currentItem;
    if (chosen) result.push(chosen);
  }
  return result;
}
function pageContentChanged(basePage, page) {
  if (!basePage || !page) return basePage !== page;
  if (basePage.name !== page.name) return true;
  if (changedFromBase(basePage.nodes, page.nodes, (items) => (items || []).map(comparableNode))) return true;
  return changedFromBase(basePage.edges, page.edges);
}
function comparablePage(page) {
  if (!page) return null;
  return {
    id: page.id,
    name: page.name,
    createdAt: page.createdAt,
    nodes: page.nodes.map(comparableNode),
    edges: page.edges
  };
}
function documentsContentEqual(left, right) {
  if (!left || !right || left.projectName !== right.projectName) return false;
  return sameValue(left.pages.map(comparablePage), right.pages.map(comparablePage));
}
function documentWithCurrentNavigation(currentDocument, localDocument, projectPath) {
  const currentPages = itemMap(currentDocument.pages);
  const pages = localDocument.pages.map((page) => {
    const currentPage = currentPages.get(page.id);
    return currentPage ? { ...page, viewport: currentPage.viewport } : page;
  });
  return rebuildDocumentMirrors({
    ...localDocument,
    activePageId: currentDocument.activePageId,
    pages
  }, projectPath);
}
function edgeIncidentConflict(basePage, currentPage, localPage, reasons) {
  const baseNodes = itemMap(basePage?.nodes);
  const currentNodes = itemMap(currentPage?.nodes);
  const localNodes = itemMap(localPage?.nodes);
  const currentEdges = Array.isArray(currentPage?.edges) ? currentPage.edges : [];
  const localEdges = Array.isArray(localPage?.edges) ? localPage.edges : [];
  for (const [nodeId, baseNode] of baseNodes) {
    const currentDeleted = !currentNodes.has(nodeId);
    const localDeleted = !localNodes.has(nodeId);
    if (currentDeleted && localEdges.some((edge) => (edge.source === nodeId || edge.target === nodeId) && !sameValue(itemMap(basePage.edges).get(edge.id), edge))) {
      reasons.push("node-edge:".concat(nodeId));
    }
    if (localDeleted && currentEdges.some((edge) => (edge.source === nodeId || edge.target === nodeId) && !sameValue(itemMap(basePage.edges).get(edge.id), edge))) {
      reasons.push("node-edge:".concat(nodeId));
    }
    void baseNode;
  }
}
function conflictCopyName(sourceName, language, createdAt, existingNames, copyKind = "manual") {
  const stamp = new Intl.DateTimeFormat(language === "en" ? "en-CA" : "zh-CN", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(createdAt)).replace(/\//g, "-").replace(",", "");
  const label = copyKind === "recovery" ? language === "en" ? "AI recovery copy" : "AI 恢复副本" : copyKind === "conflict" ? language === "en" ? "AI conflict copy" : "AI 冲突副本" : language === "en" ? "Conflict copy" : "冲突副本";
  const base = "".concat(sourceName, " · ").concat(label, " · ").concat(stamp);
  let candidate = base;
  let serial = 2;
  while (existingNames.has(candidate)) candidate = "".concat(base, " (").concat(serial++, ")");
  existingNames.add(candidate);
  return candidate;
}
function deterministicUniqueId(prefix, mutationId, sourceId, usedIds) {
  const digest = crypto.createHash("sha256").update("".concat(mutationId, ":").concat(sourceId)).digest("hex").slice(0, 12);
  const safeSource = String(sourceId || "item").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 48);
  let candidate = "".concat(prefix, "-").concat(safeSource, "-").concat(digest);
  let serial = 2;
  while (usedIds.has(candidate)) candidate = "".concat(prefix, "-").concat(safeSource, "-").concat(digest, "-").concat(serial++);
  usedIds.add(candidate);
  return candidate;
}
function createConflictPage(sourcePage, options) {
  const { baseRevision, clientMutationId, copyKind = "manual", createdAt, existingNames, incomingIntent, language, priorRevision, reasons, usedEdgeIds, usedNodeIds, usedPageIds } = options;
  const pageId = deterministicUniqueId("conflict-page", clientMutationId, sourcePage.id, usedPageIds);
  const nodeIds = /* @__PURE__ */ new Map();
  const nodes = sourcePage.nodes.map((node) => {
    const id = deterministicUniqueId("conflict-node", clientMutationId, "".concat(sourcePage.id, ":").concat(node.id), usedNodeIds);
    nodeIds.set(node.id, id);
    return { ...node, id, selected: false };
  });
  const edges = sourcePage.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)).map((edge) => ({
    ...edge,
    id: deterministicUniqueId("conflict-edge", clientMutationId, "".concat(sourcePage.id, ":").concat(edge.id), usedEdgeIds),
    source: nodeIds.get(edge.source),
    target: nodeIds.get(edge.target)
  }));
  const page = {
    ...sourcePage,
    id: pageId,
    name: conflictCopyName(sourcePage.name, language, createdAt, existingNames, copyKind),
    createdAt,
    updatedAt: createdAt,
    nodes,
    edges,
    conflict: {
      sourcePageId: sourcePage.id,
      baseRevision,
      priorRevision,
      reasons: [...new Set(reasons)],
      incomingIntent,
      ...copyKind === "manual" ? {} : { copyKind },
      createdAt,
      incomingFingerprint: documentFingerprint(sourcePage)
    }
  };
  return {
    page,
    nodeIdMap: Object.fromEntries(nodeIds),
    edgeIdMap: Object.fromEntries(sourcePage.edges.map((edge, index) => [edge.id, edges[index]?.id]).filter((entry) => entry[1]))
  };
}
function rebuildDocumentMirrors(document2, projectPath) {
  const pages = document2.pages;
  const activePageId = pages.some((page) => page.id === document2.activePageId) ? document2.activePageId : pages[0].id;
  const activePage = pages.find((page) => page.id === activePageId) || pages[0];
  return normalizeScatterDocument({
    ...document2,
    projectName: document2.projectName || projectNameFromPath(projectPath),
    activePageId,
    viewport: activePage.viewport,
    nodes: activePage.nodes,
    edges: activePage.edges
  }, projectPath);
}
function mergeConcurrentDocuments({ baseDocument, currentDocument, deletedPageSnapshots, localDocument, baseRevision, priorRevision, clientMutationId, language, objectWriters, projectPath }) {
  const basePages = itemMap(baseDocument.pages);
  const currentPages = itemMap(currentDocument.pages);
  const localPages = itemMap(localDocument.pages);
  const deletedSnapshots = isObject2(deletedPageSnapshots) ? deletedPageSnapshots : {};
  const pageIds = [.../* @__PURE__ */ new Set([...basePages.keys(), ...currentPages.keys(), ...localPages.keys()])];
  const pages = [];
  const conflictCopies = [];
  const mergedPageIds = [];
  const createdAt = nowIso();
  const usedPageIds = new Set(currentDocument.pages.map((page) => page.id));
  const usedNodeIds = new Set(currentDocument.pages.flatMap((page) => page.nodes.map((node) => node.id)));
  const usedEdgeIds = new Set(currentDocument.pages.flatMap((page) => page.edges.map((edge) => edge.id)));
  const existingNames = new Set(currentDocument.pages.map((page) => page.name));
  let localActivePageId = localDocument.activePageId;
  for (const pageId of pageIds) {
    const basePage = basePages.get(pageId);
    const currentPage = currentPages.get(pageId);
    const localPage = localPages.get(pageId);
    const currentChanged = pageContentChanged(basePage, currentPage);
    const localChanged = pageContentChanged(basePage, localPage);
    if (!basePage) {
      if (currentPage && localPage && !sameValue(currentPage, localPage)) {
        pages.push(currentPage);
        const reasons2 = ["page-add:".concat(pageId)];
        const copy = createConflictPage(localPage, { baseRevision, clientMutationId, createdAt, existingNames, incomingIntent: "edit", language, priorRevision, reasons: reasons2, usedEdgeIds, usedNodeIds, usedPageIds });
        pages.push(copy.page);
        conflictCopies.push({ sourcePageId: pageId, conflictPageId: copy.page.id, originalPageId: pageId, originalPageAvailable: true, incomingIntent: "edit", reasons: reasons2, nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap });
        localActivePageId = copy.page.id;
      } else if (localPage) pages.push(localPage);
      else if (currentPage) pages.push(currentPage);
      continue;
    }
    if (!localPage && !currentPage) continue;
    if (!localPage) {
      if (!currentChanged) continue;
      pages.push(currentPage);
      const snapshot = deletedSnapshots[pageId] ? normalizeScatterPage(deletedSnapshots[pageId], 0, basePage) : basePage;
      const reasons2 = ["page-delete-edit:".concat(pageId)];
      const copy = createConflictPage(snapshot, { baseRevision, clientMutationId, createdAt, existingNames, incomingIntent: "delete", language, priorRevision, reasons: reasons2, usedEdgeIds, usedNodeIds, usedPageIds });
      pages.push(copy.page);
      conflictCopies.push({ sourcePageId: pageId, conflictPageId: copy.page.id, originalPageId: pageId, originalPageAvailable: true, incomingIntent: "delete", reasons: reasons2, nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap });
      localActivePageId = copy.page.id;
      continue;
    }
    if (!currentPage) {
      if (!localChanged) continue;
      const reasons2 = ["page-delete-edit:".concat(pageId)];
      const copy = createConflictPage(localPage, { baseRevision, clientMutationId, createdAt, existingNames, incomingIntent: "edit", language, priorRevision, reasons: reasons2, usedEdgeIds, usedNodeIds, usedPageIds });
      pages.push(copy.page);
      conflictCopies.push({ sourcePageId: pageId, conflictPageId: copy.page.id, originalPageId: pageId, originalPageAvailable: false, incomingIntent: "edit", reasons: reasons2, nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap });
      localActivePageId = copy.page.id;
      continue;
    }
    if (!localChanged) {
      pages.push(currentPage);
      continue;
    }
    if (!currentChanged) {
      pages.push({ ...localPage, viewport: currentPage.viewport });
      continue;
    }
    if (!pageContentChanged(currentPage, localPage)) {
      pages.push(currentPage);
      continue;
    }
    const reasons = [];
    if (basePage.name !== currentPage.name && basePage.name !== localPage.name && currentPage.name !== localPage.name) reasons.push("page-name:".concat(pageId));
    const mergedNodes = mergeAtomicItems(basePage.nodes, currentPage.nodes, localPage.nodes, comparableNode, "node", reasons);
    const mergedEdges = mergeAtomicItems(basePage.edges, currentPage.edges, localPage.edges, (edge) => edge, "edge", reasons);
    edgeIncidentConflict(basePage, currentPage, localPage, reasons);
    const mergedNodeIds = new Set(mergedNodes.map((node) => node.id));
    if (mergedEdges.some((edge) => !mergedNodeIds.has(edge.source) || !mergedNodeIds.has(edge.target))) reasons.push("dangling-edge:".concat(pageId));
    if (reasons.length) {
      const directConflictReasons = reasons.filter((reason) => /^(node|edge|page-name):/.test(reason));
      const conflictOwnedByAi = directConflictReasons.length > 0 && directConflictReasons.every((reason) => {
        const [kind, id] = reason.split(":");
        if (kind === "node") return objectWriters?.["node:".concat(pageId, ":").concat(id)] === "ai";
        if (kind === "edge") return objectWriters?.["edge:".concat(pageId, ":").concat(id)] === "ai";
        if (kind === "page-name") return objectWriters?.["page:".concat(pageId)] === "ai";
        return false;
      });
      if (conflictOwnedByAi) {
        const humanReasons = [];
        const humanNodes = mergeAtomicItems(basePage.nodes, localPage.nodes, currentPage.nodes, comparableNode, "node", humanReasons, "current");
        const humanEdges = mergeAtomicItems(basePage.edges, localPage.edges, currentPage.edges, (edge) => edge, "edge", humanReasons, "current");
        const humanNodeIds = new Set(humanNodes.map((node) => node.id));
        const validHumanEdges = humanEdges.filter((edge) => humanNodeIds.has(edge.source) && humanNodeIds.has(edge.target));
        pages.push({
          ...currentPage,
          name: localPage.name !== basePage.name ? localPage.name : currentPage.name,
          viewport: localPage.viewport,
          updatedAt: createdAt,
          nodes: humanNodes,
          edges: validHumanEdges
        });
        const humanPositions = itemMap(localPage.nodes);
        const aiCandidate = {
          ...currentPage,
          nodes: currentPage.nodes.map((node) => humanPositions.has(node.id) ? { ...node, position: humanPositions.get(node.id).position } : node)
        };
        const copy2 = createConflictPage(aiCandidate, {
          baseRevision,
          clientMutationId,
          copyKind: "conflict",
          createdAt,
          existingNames,
          incomingIntent: "edit",
          language,
          priorRevision,
          reasons,
          usedEdgeIds,
          usedNodeIds,
          usedPageIds
        });
        copy2.page.conflict.source = "ai";
        pages.push(copy2.page);
        conflictCopies.push({ sourcePageId: pageId, conflictPageId: copy2.page.id, originalPageId: pageId, originalPageAvailable: true, incomingIntent: "edit", source: "ai", reasons: [...new Set(reasons)], nodeIdMap: copy2.nodeIdMap, edgeIdMap: copy2.edgeIdMap });
        continue;
      }
      pages.push(currentPage);
      const copy = createConflictPage(localPage, { baseRevision, clientMutationId, createdAt, existingNames, incomingIntent: "edit", language, priorRevision, reasons, usedEdgeIds, usedNodeIds, usedPageIds });
      pages.push(copy.page);
      conflictCopies.push({ sourcePageId: pageId, conflictPageId: copy.page.id, originalPageId: pageId, originalPageAvailable: true, incomingIntent: "edit", reasons: [...new Set(reasons)], nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap });
      if (localDocument.activePageId === pageId) localActivePageId = copy.page.id;
      continue;
    }
    pages.push({
      ...currentPage,
      name: localPage.name !== basePage.name ? localPage.name : currentPage.name,
      updatedAt: createdAt,
      nodes: mergedNodes,
      edges: mergedEdges
    });
    mergedPageIds.push(pageId);
  }
  if (!pages.length) pages.push(defaultScatterPage());
  const document2 = sameValue(pages, currentDocument.pages) ? currentDocument : rebuildDocumentMirrors({
    ...currentDocument,
    updatedAt: createdAt,
    pages
  }, projectPath);
  return { document: document2, conflictCopies, mergedPageIds, localActivePageId };
}
function optionalDimension(value) {
  const number4 = Number(value);
  return Number.isFinite(number4) && number4 > 0 ? number4 : null;
}
function generatedGraphId(prefix, index, usedIds) {
  let id = "".concat(prefix, "-").concat(index + 1);
  let suffix = 2;
  while (usedIds.has(id)) {
    id = "".concat(prefix, "-").concat(index + 1, "-").concat(suffix);
    suffix += 1;
  }
  return id;
}
function graphNodeFieldText(value, field) {
  const node = isObject2(value) ? value : {};
  const data = isObject2(node.data) ? node.data : {};
  return normalizeTemplateQuery(typeof node[field] === "string" ? node[field] : typeof data[field] === "string" ? data[field] : "");
}
function graphHasGuidanceIntent(title, guidanceFile) {
  if (!title) return false;
  const aliases = guidanceFile.aliases.map((alias) => normalizeTemplateQuery(alias));
  const directTitles = [normalizeTemplateQuery(guidanceFile.title), normalizeTemplateQuery("补充 ".concat(guidanceFile.canonicalName))];
  if (directTitles.includes(title)) return true;
  return aliases.some(
    (alias) => [
      "补充 ".concat(alias),
      "创建 ".concat(alias),
      "起草 ".concat(alias),
      "新增 ".concat(alias),
      "draft ".concat(alias),
      "create ".concat(alias),
      "add ".concat(alias)
    ].some((pattern) => title.includes(pattern))
  );
}
function graphHasGuidanceNode(rawNodes, guidanceFile) {
  const canonicalName = normalizeTemplateQuery(guidanceFile.canonicalName);
  const nodeId = normalizeTemplateQuery(guidanceFile.nodeId);
  return rawNodes.some((node) => {
    const data = isObject2(node?.data) ? node.data : {};
    const id = graphNodeFieldText(node, "id");
    const title = graphNodeFieldText(node, "title");
    const projectGuidanceFile = normalizeTemplateQuery(data.projectGuidanceFile);
    return id === nodeId || projectGuidanceFile === canonicalName || graphHasGuidanceIntent(title, guidanceFile);
  });
}
function projectHasGuidanceFile(projectPath, guidanceFile) {
  return guidanceFile.candidates.some((candidate) => fs.existsSync(path.join(projectPath, candidate)));
}
function projectGuidanceNodeId(baseId, usedIds) {
  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = "".concat(baseId, "-").concat(suffix);
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}
function projectGuidanceEdgeId(index, usedIds) {
  const baseId = "project-guidance-edge-".concat(index + 1);
  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = "".concat(baseId, "-").concat(suffix);
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}
function guidanceInputNodeIds(rawNodes) {
  const usedIds = /* @__PURE__ */ new Set();
  rawNodes.forEach((node, index) => {
    const explicitId = typeof node?.id === "string" && node.id.trim() ? node.id.trim() : "";
    usedIds.add(explicitId || "node-".concat(index + 1));
  });
  return usedIds;
}
function requiresSoftwareProductGuidance(args) {
  if (Object.prototype.hasOwnProperty.call(args || {}, "frameworkManifest")) {
    const manifest = isObject2(args?.frameworkManifest) ? args.frameworkManifest : null;
    if (manifest?.contentMode === "skill-led") return false;
    return manifest?.primaryDomain === "software-product" && manifest.intent !== "refine";
  }
  return normalizeGraphType(args?.graphType) === "software-product";
}
function softwareProductGuidanceNodes(projectPath, args, pageIndex, rawNodes) {
  if (!requiresSoftwareProductGuidance(args) || pageIndex !== 0 || !projectPath) return [];
  const usedIds = guidanceInputNodeIds(rawNodes);
  return SOFTWARE_PRODUCT_GUIDANCE_FILES.filter((guidanceFile) => !projectHasGuidanceFile(projectPath, guidanceFile)).filter((guidanceFile) => !graphHasGuidanceNode(rawNodes, guidanceFile)).map((guidanceFile) => ({
    id: projectGuidanceNodeId(guidanceFile.nodeId, usedIds),
    title: guidanceFile.title,
    body: guidanceFile.body,
    codexMode: "chat",
    runMode: "flow",
    data: {
      projectGuidanceFile: guidanceFile.canonicalName
    }
  }));
}
function normalizeGraphNodePosition(node, index, layout) {
  const column = layout === "vertical" ? 0 : layout === "grid" ? index % GRAPH_GRID_COLUMNS : index;
  const row = layout === "horizontal" ? 0 : layout === "grid" ? Math.floor(index / GRAPH_GRID_COLUMNS) : index;
  const fallback = {
    x: column * (GRAPH_NODE_WIDTH + GRAPH_LAYER_GAP),
    y: row * (GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP)
  };
  const position = isObject2(node.position) ? node.position : {};
  return {
    x: coerceGraphCoordinate(position.x ?? node.x, fallback.x),
    y: coerceGraphCoordinate(position.y ?? node.y, fallback.y)
  };
}
function hasGraphCoordinate(value) {
  if (typeof value === "string" && !value.trim()) return false;
  return Number.isFinite(Number(value));
}
function coerceGraphCoordinate(value, fallback) {
  return hasGraphCoordinate(value) ? Number(value) : fallback;
}
function graphNodePositionAxes(value) {
  const position = isObject2(value?.position) ? value.position : {};
  return {
    x: hasGraphCoordinate(position.x ?? value?.x),
    y: hasGraphCoordinate(position.y ?? value?.y)
  };
}
function fallbackGraphNodePosition(index, layout) {
  const stepX = GRAPH_NODE_WIDTH + GRAPH_LAYER_GAP;
  const stepY = GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP;
  if (layout === "vertical") {
    return { x: 0, y: index * stepY };
  }
  if (layout === "grid") {
    return {
      x: index % GRAPH_GRID_COLUMNS * stepX,
      y: Math.floor(index / GRAPH_GRID_COLUMNS) * stepY
    };
  }
  return { x: index * stepX, y: 0 };
}
function edgeAwareGraphNodePositions(nodes, edges, layout) {
  if (!edges.length) return new Map(nodes.map((node, index) => [node.id, fallbackGraphNodePosition(index, layout)]));
  const connectedIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  const connectedNodes = nodes.filter((node) => connectedIds.has(node.id));
  const isolatedNodes = nodes.filter((node) => !connectedIds.has(node.id));
  const nodeIndex = new Map(nodes.map((node, index) => [node.id, index]));
  const children = new Map(connectedNodes.map((node) => [node.id, []]));
  const parentIds = /* @__PURE__ */ new Set();
  edges.forEach((edge) => {
    if (!children.has(edge.source) || !children.has(edge.target)) return;
    children.get(edge.source).push(edge.target);
    parentIds.add(edge.target);
  });
  children.forEach((ids) => ids.sort((a, b) => (nodeIndex.get(a) || 0) - (nodeIndex.get(b) || 0)));
  const roots = connectedNodes.filter((node) => !parentIds.has(node.id));
  const positions = /* @__PURE__ */ new Map();
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const vertical = layout === "vertical";
  const crossGap = vertical ? GRAPH_LAYER_GAP : GRAPH_ROW_GAP;
  const mainGap = vertical ? GRAPH_ROW_GAP : GRAPH_LAYER_GAP;
  const crossSize = (nodeId) => {
    const node = nodeById.get(nodeId);
    return vertical ? optionalDimension(node?.width) || GRAPH_NODE_WIDTH : optionalDimension(node?.height) || GRAPH_NODE_HEIGHT;
  };
  const mainSize = (nodeId) => {
    const node = nodeById.get(nodeId);
    return vertical ? optionalDimension(node?.height) || GRAPH_NODE_HEIGHT : optionalDimension(node?.width) || GRAPH_NODE_WIDTH;
  };
  const spans = /* @__PURE__ */ new Map();
  const measuring = /* @__PURE__ */ new Set();
  const measure = (nodeId) => {
    if (spans.has(nodeId)) return spans.get(nodeId);
    if (measuring.has(nodeId)) return crossSize(nodeId);
    measuring.add(nodeId);
    const childSpans = (children.get(nodeId) || []).map(measure);
    const childrenSpan = childSpans.length ? childSpans.reduce((sum, span2) => sum + span2, 0) + crossGap * (childSpans.length - 1) : 0;
    const span = Math.max(crossSize(nodeId), childrenSpan);
    measuring.delete(nodeId);
    spans.set(nodeId, span);
    return span;
  };
  const depths = /* @__PURE__ */ new Map();
  const placed = /* @__PURE__ */ new Set();
  const place = (nodeId, depth, start) => {
    if (placed.has(nodeId)) return;
    placed.add(nodeId);
    depths.set(nodeId, depth);
    const span = measure(nodeId);
    const size = crossSize(nodeId);
    const crossPosition = start + (span - size) / 2;
    positions.set(nodeId, vertical ? { x: crossPosition, y: 0 } : { x: 0, y: crossPosition });
    const childIds = children.get(nodeId) || [];
    const childTotal = childIds.length ? childIds.reduce((sum, childId) => sum + measure(childId), 0) + crossGap * (childIds.length - 1) : 0;
    let childStart = start + (span - childTotal) / 2;
    childIds.forEach((childId) => {
      place(childId, depth + 1, childStart);
      childStart += measure(childId) + crossGap;
    });
  };
  let forestStart = 0;
  [...roots, ...connectedNodes.filter((node) => !roots.includes(node))].forEach((node) => {
    if (placed.has(node.id)) return;
    place(node.id, 0, forestStart);
    forestStart += measure(node.id) + crossGap;
  });
  const layerSizes = /* @__PURE__ */ new Map();
  depths.forEach((depth, nodeId) => layerSizes.set(depth, Math.max(layerSizes.get(depth) || 0, mainSize(nodeId))));
  const layerOffsets = /* @__PURE__ */ new Map();
  let mainOffset = 0;
  [...layerSizes.keys()].sort((a, b) => a - b).forEach((depth) => {
    layerOffsets.set(depth, mainOffset);
    mainOffset += layerSizes.get(depth) + mainGap;
  });
  positions.forEach((position, nodeId) => {
    const mainPosition = layerOffsets.get(depths.get(nodeId)) || 0;
    positions.set(nodeId, vertical ? { ...position, y: mainPosition } : { ...position, x: mainPosition });
  });
  if (isolatedNodes.length) {
    const positionedNodes = [...positions.keys()].map((nodeId) => ({ node: nodeById.get(nodeId), position: positions.get(nodeId) }));
    const isolatedStart = positionedNodes.length ? Math.max(...positionedNodes.map(({ node, position }) => vertical ? position.x + (optionalDimension(node?.width) || GRAPH_NODE_WIDTH) : position.y + (optionalDimension(node?.height) || GRAPH_NODE_HEIGHT))) + crossGap : 0;
    let isolatedCursor = isolatedStart;
    isolatedNodes.forEach((node) => {
      const size = vertical ? optionalDimension(node.width) || GRAPH_NODE_WIDTH : optionalDimension(node.height) || GRAPH_NODE_HEIGHT;
      positions.set(node.id, vertical ? { x: isolatedCursor, y: 0 } : { x: 0, y: isolatedCursor });
      isolatedCursor += size + crossGap;
    });
  }
  return positions;
}
function applyGraphAutoLayout(nodes, edges, layout, positionAxesByNodeId) {
  const autoPositions = edgeAwareGraphNodePositions(nodes, edges, layout);
  return nodes.map((node) => {
    const axes = positionAxesByNodeId.get(node.id) || { x: false, y: false };
    const autoPosition = autoPositions.get(node.id);
    if (!autoPosition || axes.x && axes.y) return node;
    return {
      ...node,
      position: {
        x: axes.x ? node.position.x : autoPosition.x,
        y: axes.y ? node.position.y : autoPosition.y
      }
    };
  });
}
function relayoutGraphPage(page, layout, layoutPolicy = "auto") {
  const preserveExplicit = normalizeGraphLayoutPolicy(layoutPolicy) === "preserve-explicit";
  const positionAxes = new Map(page.nodes.map((node) => [node.id, preserveExplicit ? { x: true, y: true } : { x: false, y: false }]));
  return {
    ...page,
    nodes: applyGraphAutoLayout(page.nodes, page.edges, layout, positionAxes)
  };
}
function graphNodeTemplateRequest(value, data) {
  const templateId = typeof value.templateId === "string" && value.templateId.trim() ? value.templateId.trim() : typeof data.templateId === "string" ? data.templateId.trim() : "";
  const templateQuery = typeof value.templateQuery === "string" && value.templateQuery.trim() ? value.templateQuery.trim() : typeof data.templateQuery === "string" && data.templateQuery.trim() ? data.templateQuery.trim() : typeof value.templateTitle === "string" && value.templateTitle.trim() ? value.templateTitle.trim() : typeof data.templateTitle === "string" && data.templateTitle.trim() ? data.templateTitle.trim() : "";
  return { templateId, templateQuery };
}
function findTemplateForGraphNode(value, data, templates, index) {
  if (!Array.isArray(templates) || templates.length === 0) return { template: null, match: "" };
  const { templateId, templateQuery } = graphNodeTemplateRequest(value, data);
  if (templateId) {
    const template2 = templates.find((item) => item.id === templateId);
    if (!template2) throw new HttpError(400, "nodes[".concat(index, "].templateId does not match a saved node template"));
    return { template: template2, match: "templateId" };
  }
  if (templateQuery) {
    const template2 = findTemplateByQuery(templates, templateQuery);
    return { template: template2, match: template2 ? "templateQuery" : "" };
  }
  const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : typeof data.title === "string" && data.title.trim() ? data.title.trim() : "";
  const template = title ? templates.find((item) => normalizeTemplateQuery(item.title) === normalizeTemplateQuery(title)) : null;
  return { template: template || null, match: template ? "title" : "" };
}
function normalizeGraphNode(value, index, layout, usedNodeIds, templates = [], reusedTemplates = []) {
  if (!isObject2(value)) throw new HttpError(400, "nodes[".concat(index, "] must be an object"));
  const explicitId = typeof value.id === "string" && value.id.trim() ? value.id.trim() : "";
  const id = explicitId || generatedGraphId("node", index, usedNodeIds);
  if (usedNodeIds.has(id)) throw new HttpError(400, "Duplicate node id: ".concat(id));
  usedNodeIds.add(id);
  const rawData = isObject2(value.data) ? value.data : {};
  const { codexMode: _codexMode, planMode: _planMode, ...data } = rawData;
  const { template, match } = findTemplateForGraphNode(value, data, templates, index);
  const width = optionalDimension(value.width);
  const height = optionalDimension(value.height);
  const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : typeof data.title === "string" && data.title.trim() ? data.title.trim() : template?.title || "";
  const body = typeof value.body === "string" && value.body.trim() ? value.body : typeof data.body === "string" && data.body.trim() ? data.body : template?.body || "";
  const attachments = Array.isArray(value.attachments) ? value.attachments.map(normalizeAttachment) : Array.isArray(data.attachments) ? data.attachments.map(normalizeAttachment) : template ? template.attachments.map(normalizeAttachment) : [];
  if (template) {
    reusedTemplates.push({
      nodeId: id,
      templateId: template.id,
      templateTitle: template.title,
      match
    });
  }
  return {
    id,
    type: "task",
    position: normalizeGraphNodePosition(value, index, layout),
    ...width ? { width } : {},
    ...height ? { height } : {},
    data: {
      ...data,
      ...template ? {
        templateId: template.id,
        templateTitle: template.title
      } : {},
      title,
      body,
      attachments,
      effort: normalizeEffort(value.effort || data.effort),
      runMode: normalizeRunMode(value.runMode || data.runMode)
    }
  };
}
function normalizeGraphEdge(value, index, nodeIds, usedEdgeIds, usedTargetIds, usedConnectionPairs) {
  if (!isObject2(value)) throw new HttpError(400, "edges[".concat(index, "] must be an object"));
  const source = typeof value.source === "string" ? value.source.trim() : "";
  const target = typeof value.target === "string" ? value.target.trim() : "";
  if (!source || !nodeIds.has(source)) throw new HttpError(400, "edges[".concat(index, "].source must reference an existing node id"));
  if (!target || !nodeIds.has(target)) throw new HttpError(400, "edges[".concat(index, "].target must reference an existing node id"));
  if (source === target) throw new HttpError(400, "edges[".concat(index, "] cannot connect a node to itself"));
  const connectionPair = "".concat(source, "\0").concat(target);
  if (usedConnectionPairs.has(connectionPair)) throw new HttpError(400, "Duplicate edge connection: ".concat(source, " -> ").concat(target));
  if (usedTargetIds.has(target)) throw new HttpError(400, "Node already has a parent edge: ".concat(target));
  const id = typeof value.id === "string" && value.id.trim() ? value.id.trim() : generatedGraphId("edge", index, usedEdgeIds);
  if (usedEdgeIds.has(id)) throw new HttpError(400, "Duplicate edge id: ".concat(id));
  usedEdgeIds.add(id);
  usedTargetIds.add(target);
  usedConnectionPairs.add(connectionPair);
  return {
    id,
    source,
    target,
    ...typeof value.label === "string" && value.label.trim() ? { label: value.label.trim() } : {}
  };
}
function graphPageInputs(args) {
  if (Array.isArray(args?.pages) && args.pages.length > 0) return args.pages;
  return [
    {
      id: args?.pageId,
      name: args?.pageName,
      viewport: args?.viewport,
      layout: args?.layout,
      nodes: args?.nodes,
      edges: args?.edges
    }
  ];
}
function buildScatterPageFromGraph(value, index, args, projectPath, templates = [], reusedTemplates = [], projectGuidanceNodes = []) {
  const page = isObject2(value) ? value : {};
  const now = nowIso();
  const graphType = normalizeGraphType(args?.graphType);
  const layout = normalizeGraphLayout(page.layout || args?.layout || defaultGraphLayoutForType(graphType));
  const layoutPolicy = normalizeGraphLayoutPolicy(page.layoutPolicy || args?.layoutPolicy);
  const rawNodes = Array.isArray(page.nodes) ? page.nodes : [];
  if (rawNodes.length === 0) throw new HttpError(400, "pages[".concat(index, "].nodes must contain at least one node"));
  const guidanceNodes = softwareProductGuidanceNodes(projectPath, args, index, rawNodes);
  const rawNodeInputs = [...rawNodes, ...guidanceNodes];
  const usedNodeIds = /* @__PURE__ */ new Set();
  const nodes = rawNodeInputs.map((node, nodeIndex) => normalizeGraphNode(node, nodeIndex, layout, usedNodeIds, templates, reusedTemplates));
  const positionAxesByNodeId = new Map(
    nodes.map((node, nodeIndex) => [
      node.id,
      layoutPolicy === "preserve-explicit" ? graphNodePositionAxes(rawNodeInputs[nodeIndex]) : { x: false, y: false }
    ])
  );
  const nodeIds = new Set(nodes.map((node) => node.id));
  const usedEdgeIds = /* @__PURE__ */ new Set();
  const usedTargetIds = /* @__PURE__ */ new Set();
  const usedConnectionPairs = /* @__PURE__ */ new Set();
  const rawEdges = Array.isArray(page.edges) ? page.edges : [];
  const autoEdgeIds = new Set(rawEdges.map((edge) => typeof edge?.id === "string" && edge.id.trim() ? edge.id.trim() : "").filter(Boolean));
  const autoGuidanceEdges = guidanceNodes.length && nodes.length > guidanceNodes.length ? guidanceNodes.map((node, guidanceIndex) => ({
    id: projectGuidanceEdgeId(guidanceIndex, autoEdgeIds),
    source: nodes[0].id,
    target: node.id
  })) : [];
  const edges = [...rawEdges, ...autoGuidanceEdges].map((edge, edgeIndex) => normalizeGraphEdge(edge, edgeIndex, nodeIds, usedEdgeIds, usedTargetIds, usedConnectionPairs));
  const layoutedNodes = applyGraphAutoLayout(nodes, edges, layout, positionAxesByNodeId);
  guidanceNodes.forEach((node) => {
    projectGuidanceNodes.push({
      pageIndex: index,
      nodeId: node.id,
      fileName: node.data.projectGuidanceFile
    });
  });
  return {
    id: typeof page.id === "string" && page.id.trim() ? page.id.trim() : "page-".concat(crypto.randomBytes(5).toString("hex")),
    name: typeof page.name === "string" && page.name.trim() ? page.name.trim() : typeof args?.pageName === "string" && args.pageName.trim() ? args.pageName.trim() : "AI Canvas ".concat(index + 1),
    createdAt: typeof page.createdAt === "string" && page.createdAt ? page.createdAt : now,
    updatedAt: now,
    viewport: normalizeScatterViewport(page.viewport || args?.viewport),
    nodes: layoutedNodes,
    edges
  };
}
function replaceActivePage(existingDocument, incomingPage) {
  const pages = existingDocument.pages.length ? existingDocument.pages : [defaultScatterPage()];
  const activePageId = existingDocument.activePageId && pages.some((page) => page.id === existingDocument.activePageId) ? existingDocument.activePageId : pages[0].id;
  return pages.map(
    (page) => page.id === activePageId ? {
      ...incomingPage,
      id: activePageId,
      name: incomingPage.name || page.name,
      createdAt: page.createdAt || incomingPage.createdAt
    } : page
  );
}
function graphViolation(code, pathValue, message, repair) {
  return {
    code,
    path: pathValue,
    message,
    repair
  };
}
function validationFailure(documentRevision, violations, advisories = []) {
  return {
    status: "validation_failed",
    written: false,
    documentRevision,
    validation: {
      passed: false,
      violations,
      advisories
    }
  };
}
function activeScatterPage(document2) {
  return document2.pages.find((page) => page.id === document2.activePageId) || document2.pages[0];
}
function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
function mergeGraphNodeChanges(node, changes) {
  const rawChanges = isObject2(changes) ? changes : {};
  const {
    id: _id,
    title,
    body,
    attachments,
    effort,
    runMode,
    codexMode: _codexMode,
    data: rawData,
    position: rawPosition,
    ...nodeChanges
  } = rawChanges;
  const dataChanges = isObject2(rawData) ? rawData : {};
  const { codexMode: _dataCodexMode, planMode: _planMode, ...safeDataChanges } = dataChanges;
  return {
    ...node,
    ...nodeChanges,
    ...isObject2(rawPosition) ? {
      position: {
        ...node.position,
        ...hasGraphCoordinate(rawPosition.x) ? { x: Number(rawPosition.x) } : {},
        ...hasGraphCoordinate(rawPosition.y) ? { y: Number(rawPosition.y) } : {}
      }
    } : {},
    data: {
      ...node.data,
      ...safeDataChanges,
      ...typeof title === "string" ? { title: title.trim() } : {},
      ...typeof body === "string" ? { body } : {},
      ...Array.isArray(attachments) ? { attachments: attachments.map(normalizeAttachment) } : {},
      ...effort !== void 0 ? { effort: normalizeEffort(effort) } : {},
      ...runMode !== void 0 ? { runMode: normalizeRunMode(runMode) } : {}
    }
  };
}
function mergeGraphEdgeChanges(edge, changes) {
  const rawChanges = isObject2(changes) ? changes : {};
  const { id: _id, ...safeChanges } = rawChanges;
  return {
    ...edge,
    ...safeChanges,
    ...typeof safeChanges.source === "string" ? { source: safeChanges.source.trim() } : {},
    ...typeof safeChanges.target === "string" ? { target: safeChanges.target.trim() } : {},
    ...typeof safeChanges.label === "string" ? { label: safeChanges.label.trim() } : {}
  };
}
function nextMergedNodePosition(page, nodeId, addedNodeIds, explicitPositionIds, layout = "horizontal") {
  if (explicitPositionIds.has(nodeId)) return null;
  const incoming = page.edges.find((edge) => edge.target === nodeId);
  const parent = incoming ? page.nodes.find((node) => node.id === incoming.source) : null;
  const occupied = page.nodes.filter((node) => node.id !== nodeId).map((node) => node.position || { x: 0, y: 0 });
  const vertical = layout === "vertical";
  const maxX = occupied.length ? Math.max(...occupied.map((position) => toNumber(position.x, 0))) : 0;
  const maxY = occupied.length ? Math.max(...occupied.map((position) => toNumber(position.y, 0))) : 0;
  const base = parent?.position ? vertical ? { x: toNumber(parent.position.x, 0), y: toNumber(parent.position.y, 0) + GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP } : { x: toNumber(parent.position.x, 0) + GRAPH_NODE_WIDTH + GRAPH_LAYER_GAP, y: toNumber(parent.position.y, 0) } : vertical ? { x: 0, y: maxY + GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP } : { x: maxX + GRAPH_NODE_WIDTH + GRAPH_LAYER_GAP, y: 0 };
  let candidate = base;
  let row = 0;
  const collides = (position) => occupied.some(
    (other) => Math.abs(toNumber(other.x, 0) - position.x) < GRAPH_NODE_WIDTH && Math.abs(toNumber(other.y, 0) - position.y) < GRAPH_NODE_HEIGHT
  );
  while (collides(candidate)) {
    row += 1;
    candidate = vertical ? { x: base.x + row * (GRAPH_NODE_WIDTH + GRAPH_LAYER_GAP), y: base.y } : { x: base.x, y: base.y + row * (GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP) };
  }
  addedNodeIds.delete(nodeId);
  return candidate;
}
function applyMergeOperations(existingPage, args, templates, reusedTemplates) {
  const page = cloneJson(existingPage);
  const operations = Array.isArray(args?.operations) ? args.operations : [];
  const violations = [];
  const addedNodeIds = /* @__PURE__ */ new Set();
  const explicitPositionIds = /* @__PURE__ */ new Set();
  const removedNodeIds = [];
  const removedEdgeIds = [];
  let relayoutRequested = false;
  const summary = {
    addedNodeIds: [],
    updatedNodeIds: [],
    removedNodeIds,
    addedEdgeIds: [],
    updatedEdgeIds: [],
    removedEdgeIds,
    relayoutApplied: false
  };
  if (operations.length === 0) {
    violations.push(graphViolation("operations_required", "operations", "merge-active-page requires at least one operation.", "Add explicit node or edge operations."));
    return { page, violations, summary };
  }
  operations.forEach((operation, index) => {
    const opPath = "operations[".concat(index, "]");
    if (!isObject2(operation) || typeof operation.op !== "string") {
      violations.push(graphViolation("invalid_operation", opPath, "Operation must be an object with an op field.", "Use add/update/remove node or edge operations."));
      return;
    }
    const nodeIndex = typeof operation.nodeId === "string" ? page.nodes.findIndex((node) => node.id === operation.nodeId.trim()) : -1;
    const edgeIndex = typeof operation.edgeId === "string" ? page.edges.findIndex((edge) => edge.id === operation.edgeId.trim()) : -1;
    try {
      if (operation.op === "relayout-page") {
        relayoutRequested = true;
        return;
      }
      if (operation.op === "add-node") {
        if (!isObject2(operation.node)) {
          violations.push(graphViolation("node_required", "".concat(opPath, ".node"), "add-node requires a node object.", "Provide the node to add."));
          return;
        }
        const usedIds = new Set(page.nodes.map((node2) => node2.id));
        const node = normalizeGraphNode(operation.node, page.nodes.length, normalizeGraphLayout(args?.layout), usedIds, templates, reusedTemplates);
        page.nodes.push(node);
        addedNodeIds.add(node.id);
        if (graphNodePositionAxes(operation.node).x && graphNodePositionAxes(operation.node).y) explicitPositionIds.add(node.id);
        summary.addedNodeIds.push(node.id);
        return;
      }
      if (operation.op === "update-node") {
        if (typeof operation.nodeId !== "string" || nodeIndex < 0) {
          violations.push(graphViolation("node_not_found", "".concat(opPath, ".nodeId"), "update-node target does not exist.", "Re-read graph context and use an existing node id."));
          return;
        }
        if (!isObject2(operation.changes)) {
          violations.push(graphViolation("changes_required", "".concat(opPath, ".changes"), "update-node requires a changes object.", "Provide the node fields to update."));
          return;
        }
        if (Object.prototype.hasOwnProperty.call(operation.changes, "id")) {
          violations.push(graphViolation("immutable_id", "".concat(opPath, ".changes.id"), "Node ids cannot be changed.", "Remove id from changes and target the node with nodeId."));
          return;
        }
        page.nodes[nodeIndex] = mergeGraphNodeChanges(page.nodes[nodeIndex], operation.changes);
        summary.updatedNodeIds.push(page.nodes[nodeIndex].id);
        return;
      }
      if (operation.op === "remove-node") {
        if (typeof operation.nodeId !== "string" || nodeIndex < 0) {
          violations.push(graphViolation("node_not_found", "".concat(opPath, ".nodeId"), "remove-node target does not exist.", "Re-read graph context and use an existing node id."));
          return;
        }
        const [removed] = page.nodes.splice(nodeIndex, 1);
        removedNodeIds.push(removed.id);
        page.edges = page.edges.filter((edge) => {
          if (edge.source !== removed.id && edge.target !== removed.id) return true;
          removedEdgeIds.push(edge.id);
          return false;
        });
        return;
      }
      if (operation.op === "add-edge") {
        if (!isObject2(operation.edge)) {
          violations.push(graphViolation("edge_required", "".concat(opPath, ".edge"), "add-edge requires an edge object.", "Provide the edge to add."));
          return;
        }
        const edge = {
          ...operation.edge,
          id: typeof operation.edge.id === "string" && operation.edge.id.trim() ? operation.edge.id.trim() : generatedGraphId("edge", page.edges.length, new Set(page.edges.map((item) => item.id))),
          source: typeof operation.edge.source === "string" ? operation.edge.source.trim() : "",
          target: typeof operation.edge.target === "string" ? operation.edge.target.trim() : ""
        };
        if (page.edges.some((item) => item.id === edge.id)) {
          violations.push(graphViolation("duplicate_edge_id", "".concat(opPath, ".edge.id"), "Duplicate edge id: ".concat(edge.id), "Choose a unique edge id."));
          return;
        }
        page.edges.push(edge);
        summary.addedEdgeIds.push(edge.id);
        return;
      }
      if (operation.op === "update-edge") {
        if (typeof operation.edgeId !== "string" || edgeIndex < 0) {
          violations.push(graphViolation("edge_not_found", "".concat(opPath, ".edgeId"), "update-edge target does not exist.", "Re-read graph context and use an existing edge id."));
          return;
        }
        if (!isObject2(operation.changes)) {
          violations.push(graphViolation("changes_required", "".concat(opPath, ".changes"), "update-edge requires a changes object.", "Provide the edge fields to update."));
          return;
        }
        if (Object.prototype.hasOwnProperty.call(operation.changes, "id")) {
          violations.push(graphViolation("immutable_id", "".concat(opPath, ".changes.id"), "Edge ids cannot be changed.", "Remove id from changes and target the edge with edgeId."));
          return;
        }
        page.edges[edgeIndex] = mergeGraphEdgeChanges(page.edges[edgeIndex], operation.changes);
        summary.updatedEdgeIds.push(page.edges[edgeIndex].id);
        return;
      }
      if (operation.op === "remove-edge") {
        if (typeof operation.edgeId !== "string" || edgeIndex < 0) {
          violations.push(graphViolation("edge_not_found", "".concat(opPath, ".edgeId"), "remove-edge target does not exist.", "Re-read graph context and use an existing edge id."));
          return;
        }
        const [removed] = page.edges.splice(edgeIndex, 1);
        removedEdgeIds.push(removed.id);
        return;
      }
      violations.push(graphViolation("unsupported_operation", "".concat(opPath, ".op"), "Unsupported operation: ".concat(operation.op), "Use add/update/remove node or edge operations."));
    } catch (error51) {
      violations.push(graphViolation("invalid_operation", opPath, error51?.message || "Invalid graph operation.", "Correct this operation using the latest graph context."));
    }
  });
  page.nodes = page.nodes.map((node) => {
    if (!addedNodeIds.has(node.id)) return node;
    const position = nextMergedNodePosition(page, node.id, addedNodeIds, explicitPositionIds, normalizeGraphLayout(args?.layout));
    return position ? { ...node, position } : node;
  });
  if (relayoutRequested) {
    const layout = normalizeGraphLayout(args?.layout || "horizontal");
    const relayouted = relayoutGraphPage(page, layout, args?.layoutPolicy);
    page.nodes = relayouted.nodes;
    summary.relayoutApplied = true;
  }
  page.updatedAt = nowIso();
  return { page, violations, summary };
}
function mergeMutationSummaries(primary, secondary) {
  return {
    addedNodeIds: [...primary.addedNodeIds, ...secondary.addedNodeIds],
    updatedNodeIds: [...primary.updatedNodeIds, ...secondary.updatedNodeIds],
    removedNodeIds: [...primary.removedNodeIds, ...secondary.removedNodeIds],
    addedEdgeIds: [...primary.addedEdgeIds, ...secondary.addedEdgeIds],
    updatedEdgeIds: [...primary.updatedEdgeIds, ...secondary.updatedEdgeIds],
    removedEdgeIds: [...primary.removedEdgeIds, ...secondary.removedEdgeIds],
    relayoutApplied: primary.relayoutApplied || secondary.relayoutApplied
  };
}
function ensureMergedSoftwareProductGuidance(page, args, projectPath, templates, reusedTemplates) {
  const guidanceNodes = softwareProductGuidanceNodes(projectPath, args, 0, page.nodes);
  if (guidanceNodes.length === 0) return { page, violations: [], summary: null, projectGuidanceNodes: [] };
  const usedEdgeIds = new Set(page.edges.map((edge) => edge.id));
  const sourceNode = page.nodes[0];
  const operations = [];
  guidanceNodes.forEach((node, index) => {
    operations.push({ op: "add-node", node });
    if (sourceNode) {
      operations.push({
        op: "add-edge",
        edge: {
          id: projectGuidanceEdgeId(index, usedEdgeIds),
          source: sourceNode.id,
          target: node.id
        }
      });
    }
  });
  if (Array.isArray(args?.operations) && args.operations.some((operation) => operation?.op === "relayout-page")) {
    operations.push({ op: "relayout-page" });
  }
  const merged = applyMergeOperations(page, { ...args, operations }, templates, reusedTemplates);
  return {
    ...merged,
    projectGuidanceNodes: guidanceNodes.map((node) => ({
      pageIndex: 0,
      nodeId: node.id,
      fileName: node.data.projectGuidanceFile
    }))
  };
}
function graphNodeBounds(node) {
  const x2 = toNumber(node?.position?.x, 0);
  const y = toNumber(node?.position?.y, 0);
  const width = optionalDimension(node?.width) || GRAPH_NODE_WIDTH;
  const height = optionalDimension(node?.height) || GRAPH_NODE_HEIGHT;
  return { x: x2, y, width, height, right: x2 + width, bottom: y + height };
}
function validateGraphStructure(page, layout = "horizontal") {
  const violations = [];
  const nodeIds = /* @__PURE__ */ new Set();
  page.nodes.forEach((node, index) => {
    if (!node.id || nodeIds.has(node.id)) {
      violations.push(graphViolation("duplicate_node_id", "nodes[".concat(index, "].id"), "Duplicate or empty node id: ".concat(node.id || "(empty)"), "Assign every node a unique non-empty id."));
    }
    nodeIds.add(node.id);
  });
  const edgeIds = /* @__PURE__ */ new Set();
  const pairs = /* @__PURE__ */ new Set();
  const parentTargets = /* @__PURE__ */ new Set();
  const adjacency = new Map(page.nodes.map((node) => [node.id, []]));
  page.edges.forEach((edge, index) => {
    if (!edge.id || edgeIds.has(edge.id)) violations.push(graphViolation("duplicate_edge_id", "edges[".concat(index, "].id"), "Duplicate or empty edge id: ".concat(edge.id || "(empty)"), "Assign every edge a unique non-empty id."));
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source)) violations.push(graphViolation("missing_edge_source", "edges[".concat(index, "].source"), "Edge source does not exist: ".concat(edge.source), "Use an existing node id."));
    if (!nodeIds.has(edge.target)) violations.push(graphViolation("missing_edge_target", "edges[".concat(index, "].target"), "Edge target does not exist: ".concat(edge.target), "Use an existing node id."));
    if (edge.source === edge.target) violations.push(graphViolation("self_edge", "edges[".concat(index, "]"), "An edge cannot connect a node to itself.", "Connect two different nodes or remove the edge."));
    const pair = "".concat(edge.source, "\0").concat(edge.target);
    if (pairs.has(pair)) violations.push(graphViolation("duplicate_connection", "edges[".concat(index, "]"), "Duplicate connection: ".concat(edge.source, " -> ").concat(edge.target), "Keep only one edge for this source-target pair."));
    pairs.add(pair);
    if (parentTargets.has(edge.target)) violations.push(graphViolation("multiple_parents", "edges[".concat(index, "].target"), "Node already has a parent edge: ".concat(edge.target), "Keep one parent edge for each node."));
    parentTargets.add(edge.target);
    adjacency.get(edge.source)?.push(edge.target);
  });
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit = (nodeId) => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    if ((adjacency.get(nodeId) || []).some(visit)) return true;
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };
  if (page.nodes.some((node) => visit(node.id))) {
    violations.push(graphViolation("cycle_detected", "edges", "Graph dependencies contain a cycle.", "Remove or reverse an edge so every dependency has a forward direction."));
  }
  page.nodes.forEach((node, index) => {
    const bounds = graphNodeBounds(node);
    page.nodes.slice(index + 1).forEach((other) => {
      const otherBounds = graphNodeBounds(other);
      const overlaps = bounds.x < otherBounds.right && bounds.right > otherBounds.x && bounds.y < otherBounds.bottom && bounds.bottom > otherBounds.y;
      if (overlaps) {
        violations.push(graphViolation("node_bounds_overlap", "nodes.".concat(node.id), "Node bounds overlap: ".concat(node.id, " and ").concat(other.id, "."), "Use automatic layout or move the nodes so their full rectangles do not intersect."));
      }
    });
  });
  const vertical = normalizeGraphLayout(layout) === "vertical";
  page.edges.forEach((edge, index) => {
    const source = page.nodes.find((node) => node.id === edge.source);
    const target = page.nodes.find((node) => node.id === edge.target);
    if (!source || !target) return;
    const sourceBounds = graphNodeBounds(source);
    const targetBounds = graphNodeBounds(target);
    const forward = vertical ? targetBounds.y >= sourceBounds.bottom : targetBounds.x >= sourceBounds.right;
    if (!forward) {
      violations.push(graphViolation("layout_direction_invalid", "edges[".concat(index, "]"), "Dependency is not ".concat(vertical ? "top-to-bottom" : "left-to-right", ": ").concat(edge.source, " -> ").concat(edge.target, "."), "Use automatic layout or move the target after its source along the selected layout direction."));
    }
  });
  return violations;
}
function meaningfulFrameworkNode(node) {
  const title = typeof node?.data?.title === "string" ? node.data.title.trim() : "";
  const body = typeof node?.data?.body === "string" ? node.data.body.trim() : "";
  const combined = "".concat(title, " ").concat(body).trim().toLowerCase();
  if (!title || !body) return false;
  return !/^(todo|tbd|待补充|待完善|占位|placeholder|保持一致|简洁现代)[。.!！\s]*$/i.test(combined);
}
function escapeRegularExpression(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function nodeBodyHasSkillToken(node, skillName) {
  const body = typeof node?.data?.body === "string" ? node.data.body : "";
  if (!body || typeof skillName !== "string" || !skillName) return false;
  return new RegExp("(^|\\s)\\$".concat(escapeRegularExpression(skillName), "(?=$|\\s|[.,!?;，。！？；])"), "m").test(body);
}
function validateFrameworkManifest(page, manifest, projectPath, options = {}) {
  if (manifest === void 0 || manifest === null) return { violations: [], advisories: [] };
  const violations = [];
  const advisories = [];
  if (!isObject2(manifest)) {
    return {
      violations: [graphViolation("invalid_framework_manifest", "frameworkManifest", "frameworkManifest must be an object.", "Provide intent, primaryDomain, maturity, output, and coverage.")],
      advisories
    };
  }
  if (!VALID_FRAMEWORK_INTENTS.has(manifest.intent)) violations.push(graphViolation("invalid_framework_intent", "frameworkManifest.intent", "Unsupported intent: ".concat(manifest.intent || "(empty)"), "Use a supported intent reference."));
  if (!VALID_FRAMEWORK_DOMAINS.has(manifest.primaryDomain)) violations.push(graphViolation("invalid_primary_domain", "frameworkManifest.primaryDomain", "Unsupported primary domain: ".concat(manifest.primaryDomain || "(empty)"), "Use a supported primary domain reference."));
  if (!VALID_FRAMEWORK_MATURITY.has(manifest.maturity)) violations.push(graphViolation("invalid_framework_maturity", "frameworkManifest.maturity", "Unsupported maturity: ".concat(manifest.maturity || "(empty)"), "Use explore, define, decide, or deliver."));
  if (!VALID_FRAMEWORK_OUTPUTS.has(manifest.output)) violations.push(graphViolation("invalid_framework_output", "frameworkManifest.output", "Unsupported output: ".concat(manifest.output || "(empty)"), "Use a supported output topology."));
  const contentMode = manifest.contentMode === void 0 ? "canvasight-default" : manifest.contentMode;
  const skillLed = contentMode === "skill-led";
  if (contentMode !== "canvasight-default" && !skillLed) {
    violations.push(graphViolation("invalid_content_mode", "frameworkManifest.contentMode", "Unsupported content mode: ".concat(contentMode || "(empty)"), "Use canvasight-default or skill-led."));
  }
  const contentSkills = Array.isArray(manifest.contentSkills) ? manifest.contentSkills : [];
  if (manifest.contentSkills !== void 0 && !Array.isArray(manifest.contentSkills)) {
    violations.push(graphViolation("invalid_content_skills", "frameworkManifest.contentSkills", "contentSkills must be an array.", "Provide one primary Skill and optional augment Skills."));
  }
  const contentSkillNames = /* @__PURE__ */ new Set();
  contentSkills.forEach((skill, index) => {
    const skillPath = "frameworkManifest.contentSkills[".concat(index, "]");
    if (!isObject2(skill) || typeof skill.name !== "string" || !skill.name.trim()) {
      violations.push(graphViolation("invalid_content_skill", "".concat(skillPath, ".name"), "Content Skill name is required.", "Use an enabled Codex Skill name."));
    } else if (contentSkillNames.has(skill.name.trim())) {
      violations.push(graphViolation("duplicate_content_skill", "".concat(skillPath, ".name"), "Content Skill is duplicated: ".concat(skill.name.trim()), "Keep one entry per content Skill."));
    } else {
      contentSkillNames.add(skill.name.trim());
    }
    if (!isObject2(skill) || skill.role !== "primary" && skill.role !== "augment") {
      violations.push(graphViolation("invalid_content_skill_role", "".concat(skillPath, ".role"), "Unsupported content Skill role: ".concat(skill?.role || "(empty)"), "Use primary or augment."));
    }
  });
  if (skillLed && contentSkills.filter((skill) => isObject2(skill) && skill.role === "primary").length !== 1) {
    violations.push(graphViolation("primary_content_skill_required", "frameworkManifest.contentSkills", "skill-led content requires exactly one primary Skill.", "Choose one primary Skill and mark any other compatible Skills as augment."));
  }
  const secondaryDomains = Array.isArray(manifest.secondaryDomains) ? manifest.secondaryDomains : [];
  secondaryDomains.forEach((domain2, index) => {
    if (!VALID_FRAMEWORK_DOMAINS.has(domain2) || domain2 === manifest.primaryDomain) {
      violations.push(graphViolation("invalid_secondary_domain", "frameworkManifest.secondaryDomains[".concat(index, "]"), "Invalid secondary domain: ".concat(domain2), "Use a supported domain different from primaryDomain."));
    }
  });
  const coverage = isObject2(manifest.coverage) ? manifest.coverage : {};
  if (!isObject2(manifest.coverage)) violations.push(graphViolation("coverage_required", "frameworkManifest.coverage", "frameworkManifest.coverage must map contract keys to node id arrays.", "Add coverage for every primary-domain and maturity contract key."));
  const nodeById = new Map(page.nodes.map((node) => [node.id, node]));
  const skillAssignments = manifest.skillAssignments === void 0 ? {} : manifest.skillAssignments;
  if (!isObject2(skillAssignments)) {
    violations.push(graphViolation("invalid_skill_assignments", "frameworkManifest.skillAssignments", "skillAssignments must map final node ids to assignment arrays.", "Key assignments by final candidate node id."));
  } else {
    Object.entries(skillAssignments).forEach(([nodeId, assignments]) => {
      const node = nodeById.get(nodeId);
      if (!node) {
        violations.push(graphViolation("skill_assignment_node_not_found", "frameworkManifest.skillAssignments.".concat(nodeId), "Skill assignment references a missing node: ".concat(nodeId), "Use a node id from the final candidate page."));
        return;
      }
      if (!Array.isArray(assignments) || assignments.length === 0) {
        violations.push(graphViolation("invalid_skill_assignments", "frameworkManifest.skillAssignments.".concat(nodeId), "Node Skill assignments must be a non-empty array.", "Remove the empty mapping or add a valid assignment."));
        return;
      }
      const assignedNames = /* @__PURE__ */ new Set();
      assignments.forEach((assignment, index) => {
        const assignmentPath = "frameworkManifest.skillAssignments.".concat(nodeId, "[").concat(index, "]");
        const name = typeof assignment?.name === "string" ? assignment.name.trim() : "";
        if (!name) {
          violations.push(graphViolation("skill_assignment_name_required", "".concat(assignmentPath, ".name"), "Skill assignment name is required.", "Use the exact Codex Skill name."));
        } else if (assignedNames.has(name)) {
          violations.push(graphViolation("duplicate_skill_assignment", "".concat(assignmentPath, ".name"), "Skill assignment is duplicated for ".concat(nodeId, ": ").concat(name), "Keep one assignment per Skill on a node."));
        } else {
          assignedNames.add(name);
          if (!nodeBodyHasSkillToken(node, name)) {
            violations.push(graphViolation("skill_assignment_body_mismatch", "".concat(assignmentPath, ".name"), "Node ".concat(nodeId, " does not contain the visible $").concat(name, " token."), "Add $".concat(name, " to the node body or remove the manifest assignment.")));
          }
        }
        if (assignment?.source !== "user-explicit" && assignment?.source !== "ai-selected") {
          violations.push(graphViolation("invalid_skill_assignment_source", "".concat(assignmentPath, ".source"), "Unsupported Skill assignment source: ".concat(assignment?.source || "(empty)"), "Use user-explicit or ai-selected."));
        }
        if (assignment?.source === "ai-selected") {
          if (options.preferences?.aiSkillAssignmentEnabled !== true) {
            violations.push(graphViolation("ai_skill_assignment_disabled", assignmentPath, "AI-selected Skill assignment is disabled for node ".concat(nodeId, "."), "Remove ai-selected assignments or enable the global Canvasight preference."));
          }
          if (typeof assignment.rationale !== "string" || !assignment.rationale.trim()) {
            violations.push(graphViolation("ai_skill_assignment_rationale_required", "".concat(assignmentPath, ".rationale"), "AI-selected Skill assignment lacks a responsibility-to-description rationale for node ".concat(nodeId, "."), "Explain the clear match between this node responsibility and the Skill description."));
          }
        }
      });
    });
  }
  const validateCoverageKey = (key, required2 = true) => {
    const ids = coverage[key];
    if (!Array.isArray(ids) || ids.length === 0) {
      if (required2) violations.push(graphViolation("missing_coverage", "frameworkManifest.coverage.".concat(key), "Required coverage is missing: ".concat(key), "Add or update a node that satisfies ".concat(key, ", then map its id here.")));
      return false;
    }
    ids.forEach((nodeId, index) => {
      const node = typeof nodeId === "string" ? nodeById.get(nodeId) : null;
      if (!node) {
        violations.push(graphViolation("coverage_node_not_found", "frameworkManifest.coverage.".concat(key, "[").concat(index, "]"), "Coverage references a missing node: ".concat(String(nodeId)), "Use a node id from the final candidate page."));
      } else if (!meaningfulFrameworkNode(node)) {
        violations.push(graphViolation("coverage_content_incomplete", "frameworkManifest.coverage.".concat(key, "[").concat(index, "]"), "Coverage node is empty or placeholder-only: ".concat(node.id), "Give ".concat(node.id, " a specific title and substantive body before retrying.")));
      }
    });
    return true;
  };
  const primaryDomainKeys = FRAMEWORK_DOMAIN_COVERAGE[manifest.primaryDomain] || [];
  const maturityKeys = FRAMEWORK_MATURITY_COVERAGE[manifest.maturity] || [];
  if (skillLed) {
    Object.keys(coverage).forEach((key) => validateCoverageKey(key, false));
    const coveredNodeIds2 = new Set(Object.values(coverage).flatMap((ids) => Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : []));
    const requiredCoverageNodeIds = Array.isArray(options.requiredCoverageNodeIds) ? options.requiredCoverageNodeIds : [];
    requiredCoverageNodeIds.forEach((nodeId) => {
      if (!coveredNodeIds2.has(nodeId)) {
        violations.push(graphViolation("skill_led_node_coverage_missing", "frameworkManifest.coverage", "Skill-led graph write does not cover new or updated node: ".concat(nodeId), "Map ".concat(nodeId, " to a professional content responsibility in coverage.")));
      }
    });
  } else if (manifest.intent === "refine") {
    const suppliedPrimaryKeys = primaryDomainKeys.filter((key) => Array.isArray(coverage[key]) && coverage[key].length > 0);
    const suppliedMaturityKeys = maturityKeys.filter((key) => Array.isArray(coverage[key]) && coverage[key].length > 0);
    if (suppliedPrimaryKeys.length === 0) {
      violations.push(graphViolation("missing_coverage", "frameworkManifest.coverage", "Refine requires at least one ".concat(manifest.primaryDomain, " coverage key."), "Map the refined content to one canonical ".concat(manifest.primaryDomain, " contract key.")));
    }
    if (suppliedMaturityKeys.length === 0) {
      violations.push(graphViolation("missing_coverage", "frameworkManifest.coverage", "Refine requires at least one ".concat(manifest.maturity, " maturity coverage key."), "Map the refined content to one canonical ".concat(manifest.maturity, " maturity key.")));
    }
    const knownCoverageKeys = /* @__PURE__ */ new Set([
      ...Object.values(FRAMEWORK_DOMAIN_COVERAGE).flat(),
      ...Object.values(FRAMEWORK_MATURITY_COVERAGE).flat()
    ]);
    Object.keys(coverage).forEach((key) => {
      if (knownCoverageKeys.has(key)) validateCoverageKey(key, false);
    });
    primaryDomainKeys.filter((key) => !suppliedPrimaryKeys.includes(key)).forEach((key) => {
      advisories.push({ code: "refine_contract_omitted", path: "frameworkManifest.coverage.".concat(key), message: "Refine did not touch primary-domain contract key: ".concat(key) });
    });
    maturityKeys.filter((key) => !suppliedMaturityKeys.includes(key)).forEach((key) => {
      advisories.push({ code: "refine_contract_omitted", path: "frameworkManifest.coverage.".concat(key), message: "Refine did not touch maturity contract key: ".concat(key) });
    });
  } else {
    primaryDomainKeys.forEach((key) => validateCoverageKey(key));
    maturityKeys.forEach((key) => validateCoverageKey(key));
  }
  if (!skillLed) {
    secondaryDomains.forEach((domain2) => {
      const keys = FRAMEWORK_DOMAIN_COVERAGE[domain2] || [];
      if (!keys.some((key) => Array.isArray(coverage[key]) && coverage[key].length > 0)) {
        violations.push(graphViolation("secondary_domain_coverage_missing", "frameworkManifest.coverage", "Secondary domain has no relevant coverage: ".concat(domain2), "Map at least one ".concat(domain2, " contract key to a substantive node.")));
      }
    });
    Object.entries(coverage).forEach(([key]) => {
      const known = Object.values(FRAMEWORK_DOMAIN_COVERAGE).some((keys) => keys.includes(key)) || Object.values(FRAMEWORK_MATURITY_COVERAGE).some((keys) => keys.includes(key));
      if (!known) advisories.push({ code: "unknown_coverage_key", path: "frameworkManifest.coverage.".concat(key), message: "Coverage key is not part of the current framework contracts: ".concat(key) });
    });
  }
  const semanticStructure = isObject2(manifest.semanticStructure) ? manifest.semanticStructure : null;
  const semanticRelationships = isObject2(manifest.semanticRelationships) ? manifest.semanticRelationships : null;
  const coveredNodeIds = new Set(Object.values(coverage).flatMap((ids) => Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : []));
  if (!semanticStructure) {
    violations.push(
      graphViolation(
        "mixed_responsibilities",
        "frameworkManifest.semanticStructure",
        "Semantic responsibility review is required for framework graph writes.",
        "Describe each covered node's single responsibility and why its content is inseparable without using quantity-based thresholds."
      )
    );
  } else {
    coveredNodeIds.forEach((nodeId) => {
      const assessment = semanticStructure[nodeId];
      if (!isObject2(assessment) || typeof assessment.responsibility !== "string" || !assessment.responsibility.trim()) {
        violations.push(graphViolation("mixed_responsibilities", "frameworkManifest.semanticStructure.".concat(nodeId, ".responsibility"), "Covered node lacks one clear responsibility: ".concat(nodeId, "."), "State one responsibility, or split independently executable, decidable, verifiable, or deliverable content into child nodes."));
      }
      if (!isObject2(assessment) || typeof assessment.inseparableReason !== "string" || !assessment.inseparableReason.trim()) {
        violations.push(graphViolation("hidden_submodules", "frameworkManifest.semanticStructure.".concat(nodeId, ".inseparableReason"), "Covered node has no semantic cohesion explanation: ".concat(nodeId, "."), "Explain why the node's content must remain together, or expose independent content as related child nodes."));
      }
    });
    Object.keys(semanticStructure).forEach((nodeId) => {
      if (!nodeById.has(nodeId)) {
        violations.push(graphViolation("relationship_missing", "frameworkManifest.semanticStructure.".concat(nodeId), "Semantic structure references a missing node: ".concat(nodeId, "."), "Use a final candidate node id and connect split modules with explicit edges."));
      }
    });
    page.edges.forEach((edge) => {
      const parentBody = String(nodeById.get(edge.source)?.data?.body || "").trim();
      const childBody = String(nodeById.get(edge.target)?.data?.body || "").trim();
      if (parentBody && childBody && parentBody !== childBody && parentBody.includes(childBody)) {
        violations.push(graphViolation("parent_duplicates_children", "nodes.".concat(edge.source, ".body"), "Parent ".concat(edge.source, " duplicates the full body of child ").concat(edge.target, "."), "Keep the parent as a summary and move detailed content to the child."));
      }
    });
  }
  if (!semanticRelationships) {
    violations.push(
      graphViolation(
        "semantic_relationships_required",
        "frameworkManifest.semanticRelationships",
        "Semantic relationship review is required for framework graph writes.",
        "Describe each relationship between covered responsibilities by final edge id, type, and rationale."
      )
    );
  } else {
    const edgeById = new Map(page.edges.map((edge) => [edge.id, edge]));
    Object.entries(semanticRelationships).forEach(([edgeId, assessment]) => {
      if (!edgeById.has(edgeId)) {
        violations.push(graphViolation("semantic_relationship_edge_not_found", "frameworkManifest.semanticRelationships.".concat(edgeId), "Semantic relationship references a missing edge: ".concat(edgeId, "."), "Use a final candidate edge id or remove the stale relationship review."));
        return;
      }
      if (!isObject2(assessment) || !VALID_SEMANTIC_RELATIONSHIP_TYPES.has(assessment.type)) {
        violations.push(graphViolation("invalid_semantic_relationship_type", "frameworkManifest.semanticRelationships.".concat(edgeId, ".type"), "Semantic relationship has an unsupported type: ".concat(assessment?.type || "(empty)", "."), "Use dependency, sequence, containment, evidence, decision, navigation, or flow."));
      }
      if (!isObject2(assessment) || typeof assessment.rationale !== "string" || !assessment.rationale.trim()) {
        violations.push(graphViolation("semantic_relationship_rationale_required", "frameworkManifest.semanticRelationships.".concat(edgeId, ".rationale"), "Semantic relationship lacks a rationale: ".concat(edgeId, "."), "Explain why these two responsibilities have this relationship, or remove the edge."));
      }
    });
    const coveredEdges = page.edges.filter((edge) => coveredNodeIds.has(edge.source) && coveredNodeIds.has(edge.target));
    coveredEdges.forEach((edge) => {
      if (!isObject2(semanticRelationships[edge.id])) {
        violations.push(graphViolation("semantic_relationship_missing", "frameworkManifest.semanticRelationships.".concat(edge.id), "Covered responsibilities have an unreviewed relationship: ".concat(edge.source, " -> ").concat(edge.target, "."), "Add the final edge id with a semantic type and rationale, or repair the graph topology."));
      }
    });
    const indegree = new Map([...coveredNodeIds].map((id) => [id, 0]));
    const outdegree = new Map([...coveredNodeIds].map((id) => [id, 0]));
    const undirected = new Map([...coveredNodeIds].map((id) => [id, []]));
    coveredEdges.forEach((edge) => {
      indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
      outdegree.set(edge.source, (outdegree.get(edge.source) || 0) + 1);
      undirected.get(edge.source)?.push(edge.target);
      undirected.get(edge.target)?.push(edge.source);
    });
    const connected = /* @__PURE__ */ new Set();
    const firstCovered = coveredNodeIds.values().next().value;
    if (firstCovered) {
      const pending = [firstCovered];
      while (pending.length) {
        const nodeId = pending.pop();
        if (connected.has(nodeId)) continue;
        connected.add(nodeId);
        pending.push(...undirected.get(nodeId) || []);
      }
    }
    const isSinglePath = coveredEdges.length > 0 && connected.size === coveredNodeIds.size && coveredEdges.length === coveredNodeIds.size - 1 && [...coveredNodeIds].every((id) => (indegree.get(id) || 0) <= 1 && (outdegree.get(id) || 0) <= 1);
    if (isSinglePath) {
      const relationshipTypes = coveredEdges.map((edge) => semanticRelationships[edge.id]?.type);
      const allowedTypes = manifest.output === "execution-plan" ? /* @__PURE__ */ new Set(["dependency", "sequence"]) : manifest.output === "system-map" ? /* @__PURE__ */ new Set(["dependency", "flow", "navigation"]) : null;
      const pathIsSemanticallyAllowed = allowedTypes && relationshipTypes.every((type) => allowedTypes.has(type));
      if (!pathIsSemanticallyAllowed) {
        violations.push(
          graphViolation(
            "mechanical_single_path",
            "edges",
            "The ".concat(manifest.output || "selected", " output collapses all covered responsibilities into one mechanical path."),
            "Group peer responsibilities under a meaningful parent or create evidence, decision, containment, or parallel branches that match the semantic relationship review."
          )
        );
      }
    }
  }
  if (!skillLed && manifest.primaryDomain === "software-product" && manifest.intent !== "refine") {
    SOFTWARE_PRODUCT_GUIDANCE_FILES.forEach((guidanceFile) => {
      if (!projectHasGuidanceFile(projectPath, guidanceFile) && !graphHasGuidanceNode(page.nodes, guidanceFile)) {
        violations.push(graphViolation("project_guidance_missing", "frameworkManifest.coverage.product.deliverables", "Project requires a delivery node for missing ".concat(guidanceFile.canonicalName, "."), "Add a node that explicitly creates ".concat(guidanceFile.canonicalName, ".")));
      }
    });
  }
  return { violations, advisories };
}
function validateGraphCandidate(page, args, projectPath, options = {}) {
  const layout = normalizeGraphLayout(args?.layout || defaultGraphLayoutForType(normalizeGraphType(args?.graphType)));
  const structureViolations = validateGraphStructure(page, layout);
  const framework = validateFrameworkManifest(page, args?.frameworkManifest, projectPath, options);
  return {
    passed: structureViolations.length === 0 && framework.violations.length === 0,
    violations: [...structureViolations, ...framework.violations],
    advisories: framework.advisories
  };
}
function graphContextProjectKey(projectPath) {
  return path.resolve(projectPath);
}
function rememberGraphContext(projectPath, document2, revisionState) {
  const projectKey = graphContextProjectKey(projectPath);
  const createdAt = Date.now();
  const activePage = cloneJson(activeScatterPage(document2));
  const context = {
    id: "graph-context-".concat(crypto.randomUUID()),
    projectKey,
    pageId: activePage.id,
    page: activePage,
    documentRevision: revisionState.revision,
    documentVersion: revisionState.documentVersion,
    createdAt,
    expiresAt: createdAt + GRAPH_CONTEXT_TTL_MS
  };
  const contexts = (projectGraphContexts.get(projectKey) || []).filter((item) => item.expiresAt > createdAt);
  contexts.push(context);
  projectGraphContexts.set(projectKey, contexts.slice(-MAX_GRAPH_CONTEXTS_PER_PROJECT));
  return context;
}
function readGraphContextSnapshot(projectPath, contextId) {
  const projectKey = graphContextProjectKey(projectPath);
  const now = Date.now();
  const contexts = (projectGraphContexts.get(projectKey) || []).filter((item) => item.expiresAt > now);
  projectGraphContexts.set(projectKey, contexts);
  return contexts.find((item) => item.id === contextId) || null;
}
function remapAiAdditionCollisions(basePage, currentPage, candidatePage, clientMutationId) {
  const baseNodes = itemMap(basePage.nodes);
  const currentNodes = itemMap(currentPage.nodes);
  const baseEdges = itemMap(basePage.edges);
  const currentEdges = itemMap(currentPage.edges);
  const usedNodeIds = new Set(currentPage.nodes.map((node) => node.id));
  const usedEdgeIds = new Set(currentPage.edges.map((edge) => edge.id));
  const nodeIdMap = {};
  const edgeIdMap = {};
  const nodes = candidatePage.nodes.map((node) => {
    if (baseNodes.has(node.id) || !currentNodes.has(node.id) || sameValue(comparableNodeSemantic(currentNodes.get(node.id)), comparableNodeSemantic(node))) return node;
    const id = deterministicUniqueId("ai-node", clientMutationId, "".concat(basePage.id, ":").concat(node.id), usedNodeIds);
    nodeIdMap[node.id] = id;
    return { ...node, id };
  });
  const edges = candidatePage.edges.map((edge) => {
    const remapped = {
      ...edge,
      source: nodeIdMap[edge.source] || edge.source,
      target: nodeIdMap[edge.target] || edge.target
    };
    if (baseEdges.has(edge.id) || !currentEdges.has(edge.id) || sameValue(currentEdges.get(edge.id), remapped)) return remapped;
    const id = deterministicUniqueId("ai-edge", clientMutationId, "".concat(basePage.id, ":").concat(edge.id), usedEdgeIds);
    edgeIdMap[edge.id] = id;
    return { ...remapped, id };
  });
  return { page: { ...candidatePage, nodes, edges }, nodeIdMap, edgeIdMap };
}
function mergeAiGraphCandidate({ basePage, currentPage, candidatePage, clientMutationId }) {
  const collision = remapAiAdditionCollisions(basePage, currentPage, candidatePage, clientMutationId);
  const aiPage = collision.page;
  const reasons = [];
  const baseNodes = itemMap(basePage.nodes);
  const currentNodes = itemMap(currentPage.nodes);
  const aiNodes = itemMap(aiPage.nodes);
  const nodes = [];
  for (const id of /* @__PURE__ */ new Set([...baseNodes.keys(), ...currentNodes.keys(), ...aiNodes.keys()])) {
    const baseNode = baseNodes.get(id);
    const currentNode = currentNodes.get(id);
    const aiNode = aiNodes.get(id);
    if (!baseNode) {
      if (currentNode) nodes.push(currentNode);
      if (aiNode && (!currentNode || !sameValue(comparableNodeSemantic(currentNode), comparableNodeSemantic(aiNode)))) nodes.push(aiNode);
      continue;
    }
    const currentChanged = changedFromBase(baseNode, currentNode, comparableNodeSemantic);
    const aiChanged = changedFromBase(baseNode, aiNode, comparableNodeSemantic);
    if (currentChanged && aiChanged && !sameValue(comparableNodeSemantic(currentNode), comparableNodeSemantic(aiNode))) {
      reasons.push("node:".concat(id));
      if (currentNode) nodes.push(currentNode);
      continue;
    }
    const chosen = aiChanged ? aiNode : currentNode;
    if (chosen) nodes.push(currentNode ? { ...chosen, position: currentNode.position } : chosen);
  }
  const baseEdges = itemMap(basePage.edges);
  const currentEdges = itemMap(currentPage.edges);
  const aiEdges = itemMap(aiPage.edges);
  const edges = [];
  for (const id of /* @__PURE__ */ new Set([...baseEdges.keys(), ...currentEdges.keys(), ...aiEdges.keys()])) {
    const baseEdge = baseEdges.get(id);
    const currentEdge = currentEdges.get(id);
    const aiEdge = aiEdges.get(id);
    if (!baseEdge) {
      if (currentEdge) edges.push(currentEdge);
      if (aiEdge && (!currentEdge || !sameValue(currentEdge, aiEdge))) edges.push(aiEdge);
      continue;
    }
    const currentChanged = changedFromBase(baseEdge, currentEdge);
    const aiChanged = changedFromBase(baseEdge, aiEdge);
    if (currentChanged && aiChanged && !sameValue(currentEdge, aiEdge)) {
      reasons.push("edge:".concat(id));
      if (currentEdge) edges.push(currentEdge);
      continue;
    }
    const chosen = aiChanged ? aiEdge : currentEdge;
    if (chosen) edges.push(chosen);
  }
  const nodeIds = new Set(nodes.map((node) => node.id));
  const validEdges = edges.filter((edge) => {
    const valid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
    if (!valid) reasons.push("dangling-edge:".concat(edge.id));
    return valid;
  });
  let name = currentPage.name;
  const currentNameChanged = currentPage.name !== basePage.name;
  const aiNameChanged = aiPage.name !== basePage.name;
  if (currentNameChanged && aiNameChanged && currentPage.name !== aiPage.name) reasons.push("page-name:".concat(basePage.id));
  else if (aiNameChanged) name = aiPage.name;
  const now = nowIso();
  const page = { ...currentPage, name, updatedAt: now, nodes, edges: validEdges };
  const candidateForCopy = {
    ...aiPage,
    nodes: aiPage.nodes.map((node) => {
      const currentNode = currentNodes.get(node.id);
      return baseNodes.has(node.id) && currentNode ? { ...node, position: currentNode.position } : node;
    })
  };
  return {
    page,
    candidateForCopy,
    reasons: [...new Set(reasons)],
    nodeIdMap: collision.nodeIdMap,
    edgeIdMap: collision.edgeIdMap
  };
}
async function writeScatterGraph(projectPath, args) {
  return withProjectWriteLock(projectPath, async () => {
    const mode = normalizeGraphWriteMode(args?.mode);
    const existingDocument = await readScatterDocument(projectPath);
    const revisionState = await ensureProjectRevisionState(projectPath, existingDocument);
    const currentRevision = revisionState.revision;
    const reusedTemplates = [];
    const projectGuidanceNodes = [];
    const templates = args?.reuseTemplates === false ? [] : await readNodeTemplates();
    const preferences = await readPreferences();
    const now = nowIso();
    let pages;
    let activePageId;
    let mutationSummary = null;
    const validationAdvisories = deprecatedGraphLayoutAdvisories(args);
    let graphWriteStatus = "written";
    let targetPageId = null;
    let rebasedFromRevision = null;
    let idMappings = { nodeIds: {}, edgeIds: {} };
    let conflictCopies = [];
    let graphRequestFingerprint = null;
    let graphClientMutationId = null;
    if (mode === "merge-active-page") {
      const hasContextContract = typeof args?.contextId === "string" && args.contextId.trim();
      if (!hasContextContract && (typeof args?.expectedRevision !== "number" || !Number.isFinite(args.expectedRevision) || args.expectedRevision !== currentRevision)) {
        return validationFailure(currentRevision, [
          graphViolation("stale_document", "expectedRevision", "Canvasight document revision is missing or stale.", "Call get_canvasight_graph_context again and rebuild the patch against its documentRevision.")
        ]);
      }
      if (hasContextContract && (typeof args?.clientMutationId !== "string" || !args.clientMutationId.trim())) {
        return validationFailure(currentRevision, [
          graphViolation("client_mutation_id_required", "clientMutationId", "Context-bound graph writes require a stable clientMutationId.", "Generate one mutation id and reuse it for retries of this exact write.")
        ]);
      }
      const context = hasContextContract ? readGraphContextSnapshot(projectPath, args.contextId.trim()) : null;
      graphClientMutationId = hasContextContract ? args.clientMutationId.trim() : null;
      graphRequestFingerprint = hasContextContract ? documentFingerprint({ contextId: args.contextId.trim(), args: { ...args, clientMutationId: void 0 } }) : null;
      const priorReceipt = graphClientMutationId ? revisionState.receipts.find((receipt) => receipt.clientMutationId === graphClientMutationId) : null;
      if (priorReceipt) {
        if (priorReceipt.requestFingerprint !== graphRequestFingerprint) {
          return validationFailure(currentRevision, [
            graphViolation("mutation_id_reused", "clientMutationId", "Canvasight mutation id was reused for a different graph payload.", "Use a new mutation id for a different write.")
          ]);
        }
        return { ...priorReceipt.result, replayed: true, written: false, document: existingDocument, documentRevision: currentRevision, documentVersion: revisionState.documentVersion };
      }
      if (hasContextContract && !context) {
        return validationFailure(currentRevision, [
          graphViolation("context_expired", "contextId", "Canvasight graph context expired or belongs to a prior daemon process.", "Call get_canvasight_graph_context again and rebuild the write once.")
        ]);
      }
      if (hasContextContract && (typeof args?.expectedRevision !== "number" || args.expectedRevision !== context.documentRevision)) {
        return validationFailure(currentRevision, [
          graphViolation("context_revision_mismatch", "expectedRevision", "expectedRevision does not match the bound graph context.", "Use the exact revision returned with this contextId.")
        ]);
      }
      const basePage = hasContextContract ? context.page : activeScatterPage(existingDocument);
      targetPageId = basePage.id;
      rebasedFromRevision = hasContextContract ? context.documentRevision : null;
      const merged = applyMergeOperations(basePage, args, templates, reusedTemplates);
      if (merged.violations.length > 0) return validationFailure(currentRevision, merged.violations);
      const guided = ensureMergedSoftwareProductGuidance(merged.page, args, projectPath, templates, reusedTemplates);
      if (guided.violations.length > 0) return validationFailure(currentRevision, guided.violations);
      projectGuidanceNodes.push(...guided.projectGuidanceNodes);
      const candidatePage = guided.page;
      const combinedSummary = guided.summary ? mergeMutationSummaries(merged.summary, guided.summary) : merged.summary;
      const validation = validateGraphCandidate(candidatePage, args, projectPath, {
        preferences,
        requiredCoverageNodeIds: [...combinedSummary.addedNodeIds, ...combinedSummary.updatedNodeIds]
      });
      if (!validation.passed) return validationFailure(currentRevision, validation.violations, validation.advisories);
      validationAdvisories.push(...validation.advisories);
      const currentPage = existingDocument.pages.find((page) => page.id === basePage.id);
      if (!currentPage) {
        const createdAt = nowIso();
        const usedPageIds = new Set(existingDocument.pages.map((page) => page.id));
        const usedNodeIds = new Set(existingDocument.pages.flatMap((page) => page.nodes.map((node) => node.id)));
        const usedEdgeIds = new Set(existingDocument.pages.flatMap((page) => page.edges.map((edge) => edge.id)));
        const copy = createConflictPage(candidatePage, {
          baseRevision: context.documentRevision,
          priorRevision: currentRevision,
          clientMutationId: graphClientMutationId,
          copyKind: "recovery",
          createdAt,
          existingNames: new Set(existingDocument.pages.map((page) => page.name)),
          incomingIntent: "edit",
          language: args?.language === "en" ? "en" : "zh",
          reasons: ["page-deleted:".concat(basePage.id)],
          usedEdgeIds,
          usedNodeIds,
          usedPageIds
        });
        copy.page.conflict.source = "ai";
        pages = [...existingDocument.pages, copy.page];
        graphWriteStatus = "conflict-copy";
        idMappings = { nodeIds: copy.nodeIdMap, edgeIds: copy.edgeIdMap };
        conflictCopies = [{ sourcePageId: basePage.id, conflictPageId: copy.page.id, originalPageId: basePage.id, originalPageAvailable: false, copyKind: "recovery", source: "ai", reasons: ["page-deleted:".concat(basePage.id)], nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap }];
      } else if (hasContextContract && currentRevision !== context.documentRevision) {
        const rebased = mergeAiGraphCandidate({ basePage, currentPage, candidatePage, clientMutationId: graphClientMutationId });
        pages = existingDocument.pages.map((page) => page.id === currentPage.id ? rebased.page : page);
        idMappings = { nodeIds: rebased.nodeIdMap, edgeIds: rebased.edgeIdMap };
        graphWriteStatus = rebased.reasons.length ? "conflict-copy" : "merged";
        if (rebased.reasons.length) {
          const createdAt = nowIso();
          const usedPageIds = new Set(pages.map((page) => page.id));
          const usedNodeIds = new Set(pages.flatMap((page) => page.nodes.map((node) => node.id)));
          const usedEdgeIds = new Set(pages.flatMap((page) => page.edges.map((edge) => edge.id)));
          const copy = createConflictPage(rebased.candidateForCopy, {
            baseRevision: context.documentRevision,
            priorRevision: currentRevision,
            clientMutationId: graphClientMutationId,
            copyKind: "conflict",
            createdAt,
            existingNames: new Set(pages.map((page) => page.name)),
            incomingIntent: "edit",
            language: args?.language === "en" ? "en" : "zh",
            reasons: rebased.reasons,
            usedEdgeIds,
            usedNodeIds,
            usedPageIds
          });
          copy.page.conflict.source = "ai";
          pages.push(copy.page);
          conflictCopies = [{ sourcePageId: basePage.id, conflictPageId: copy.page.id, originalPageId: basePage.id, originalPageAvailable: true, copyKind: "conflict", source: "ai", reasons: rebased.reasons, nodeIdMap: copy.nodeIdMap, edgeIdMap: copy.edgeIdMap }];
        }
      } else {
        pages = existingDocument.pages.map((page) => page.id === basePage.id ? candidatePage : page);
      }
      activePageId = existingDocument.activePageId;
      mutationSummary = combinedSummary;
    } else {
      const incomingPages = graphPageInputs(args).map(
        (page, index) => buildScatterPageFromGraph(page, index, args, projectPath, templates, reusedTemplates, projectGuidanceNodes)
      );
      for (let index = 0; index < incomingPages.length; index += 1) {
        const validation = validateGraphCandidate(incomingPages[index], args, projectPath, {
          preferences,
          requiredCoverageNodeIds: incomingPages[index].nodes.map((node) => node.id)
        });
        if (!validation.passed) return validationFailure(currentRevision, validation.violations, validation.advisories);
        validationAdvisories.push(...validation.advisories);
      }
      if (mode === "replace-document") {
        pages = incomingPages;
        activePageId = typeof args?.activePageId === "string" && incomingPages.some((page) => page.id === args.activePageId) ? args.activePageId : incomingPages[0].id;
      } else if (mode === "replace-active-page") {
        pages = replaceActivePage(existingDocument, incomingPages[0]);
        activePageId = existingDocument.activePageId && pages.some((page) => page.id === existingDocument.activePageId) ? existingDocument.activePageId : pages[0].id;
      } else {
        pages = [...existingDocument.pages, ...incomingPages];
        activePageId = incomingPages[incomingPages.length - 1].id;
      }
    }
    const activePage = pages.find((page) => page.id === activePageId) || pages[0];
    const document2 = await writeScatterDocument(projectPath, {
      version: 1,
      projectName: typeof args?.projectName === "string" && args.projectName.trim() ? args.projectName.trim() : existingDocument.projectName || projectNameFromPath(projectPath),
      updatedAt: now,
      activePageId: activePage.id,
      pages: pages.map((page) => ({
        ...page,
        updatedAt: page.id === activePage.id ? now : page.updatedAt
      })),
      viewport: activePage.viewport,
      nodes: activePage.nodes,
      edges: activePage.edges
    });
    const documentRevision = currentRevision + 1;
    const documentVersion = documentFingerprint(document2);
    const resultSummary = {
      status: graphWriteStatus,
      written: true,
      documentRevision,
      documentVersion,
      targetPageId: targetPageId || activePage.id,
      rebasedFromRevision,
      idMappings,
      conflictCopies,
      reusedTemplates,
      projectGuidanceNodes,
      mutationSummary,
      validation: { passed: true, violations: [], advisories: validationAdvisories }
    };
    const receipts = graphClientMutationId ? [...revisionState.receipts, { clientMutationId: graphClientMutationId, requestFingerprint: graphRequestFingerprint, result: resultSummary, createdAt: nowIso(), source: "ai-graph" }].slice(-MAX_DOCUMENT_MUTATION_RECEIPTS) : revisionState.receipts;
    await persistProjectRevisionState(projectPath, {
      ...revisionState,
      revision: documentRevision,
      documentVersion,
      receipts,
      lastSource: "ai",
      objectWriters: documentObjectWriters(revisionState.objectWriters, existingDocument, document2, "ai")
    });
    await rememberProjectBestEffort(projectPath, {
      name: document2.projectName,
      updatedAt: document2.updatedAt
    });
    return { ...resultSummary, document: document2 };
  });
}
async function openProject(projectPath) {
  const document2 = await readScatterDocument(projectPath);
  const revisionState = await ensureProjectRevisionState(projectPath, document2);
  return {
    project: {
      name: projectNameFromPath(projectPath),
      path: projectPath,
      updatedAt: document2.updatedAt
    },
    document: document2,
    documentVersion: revisionState.documentVersion
  };
}
function summarizeGraphContextNode(node) {
  const body = typeof node?.data?.body === "string" ? node.data.body : "";
  return {
    id: node.id,
    title: typeof node?.data?.title === "string" ? node.data.title : "",
    bodyPreview: body.length > TEMPLATE_BODY_PREVIEW_CHARS ? "".concat(body.slice(0, TEMPLATE_BODY_PREVIEW_CHARS - 1), "…") : body,
    position: {
      x: toNumber(node?.position?.x, 0),
      y: toNumber(node?.position?.y, 0)
    }
  };
}
function graphContext(projectPath, document2, preferences = defaultPreferences(), revisionState = null) {
  const activePage = activeScatterPage(document2);
  const resolvedRevisionState = revisionState || projectRevisionStates.get(projectRevisionKey(projectPath)) || {
    revision: projectDocumentRevision(projectPath),
    documentVersion: documentFingerprint(document2)
  };
  const context = rememberGraphContext(projectPath, document2, resolvedRevisionState);
  const nodes = activePage.nodes.map(summarizeGraphContextNode);
  const edges = activePage.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...typeof edge.label === "string" && edge.label ? { label: edge.label } : {}
  }));
  return {
    status: "ok",
    projectPath,
    scatterPath: scatterPath(projectPath),
    contextId: context.id,
    documentRevision: context.documentRevision,
    documentVersion: context.documentVersion,
    preferences: normalizePreferences(preferences),
    activePage: {
      id: activePage.id,
      name: activePage.name,
      viewport: activePage.viewport,
      nodes,
      edges
    },
    nodes,
    edges,
    pages: document2.pages.map((page) => ({
      id: page.id,
      name: page.name,
      nodeCount: page.nodes.length,
      edgeCount: page.edges.length,
      active: page.id === activePage.id
    }))
  };
}
function sessionId() {
  return "session-".concat(Date.now().toString(36), "-").concat(crypto.randomBytes(4).toString("hex"));
}
function openAttemptId() {
  return "open-".concat(Date.now().toString(36), "-").concat(crypto.randomBytes(6).toString("hex"));
}
var lastWidgetBindingIssuedAt = 0;
function nextWidgetBindingIssuedAt() {
  lastWidgetBindingIssuedAt = Math.max(Date.now(), lastWidgetBindingIssuedAt + 1);
  return lastWidgetBindingIssuedAt;
}
var STARTUP_STAGE_RANK = /* @__PURE__ */ new Map([
  ["starting", 0],
  ["connecting_bridge", 1],
  ["connecting_session", 2],
  ["hydrating_project", 3],
  ["ready", 4],
  ["failed", 5]
]);
function normalizeStartupStage(value, fallback = "starting") {
  return typeof value === "string" && STARTUP_STAGE_RANK.has(value) ? value : fallback;
}
function newOpenAttempt(session, targetDisplayMode = "fullscreen") {
  const attempt = {
    id: openAttemptId(),
    sessionId: session.id,
    threadId: session.codexThreadId || null,
    targetDisplayMode,
    status: "opening",
    stage: "starting",
    bindingIssuedAt: nextWidgetBindingIssuedAt(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    instances: /* @__PURE__ */ new Map(),
    waiters: []
  };
  session.openAttempts.set(attempt.id, attempt);
  session.currentOpenAttemptId = attempt.id;
  appendOpenAttemptLifecycle("canvasight_open_attempt_created", {
    openAttemptId: attempt.id,
    sessionId: session.id,
    threadId: attempt.threadId,
    targetDisplayMode
  });
  return attempt;
}
async function createSession({ projectPath, language, threadId, targetDisplayMode = null }) {
  const id = sessionId();
  const resolvedThreadId = optionalThreadId(threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  const resolvedProjectPath = await resolveSessionProjectPath(projectPath, resolvedThreadId, {
    // Native widgets must never silently open the daemon's default project
    // when Codex cannot read the active task. That fallback caused unrelated
    // project windows to show and run the same .scatter workspace.
    requireThreadProject: targetDisplayMode === "fullscreen"
  });
  const session = {
    id,
    projectPath: resolvedProjectPath,
    language: normalizeLanguage(language),
    codexThreadId: resolvedThreadId,
    documentRevision: projectDocumentRevision(resolvedProjectPath),
    createdAt: nowIso(),
    runQueue: [],
    waiters: [],
    openAttempts: /* @__PURE__ */ new Map(),
    currentOpenAttemptId: null
  };
  sessions.set(id, session);
  if (session.codexThreadId) rememberThreadClaim(session, session.codexThreadId);
  if (targetDisplayMode) newOpenAttempt(session, targetDisplayMode);
  return session;
}
function summarizeOpenAttempt(attempt) {
  if (!attempt) return null;
  return {
    openAttemptId: attempt.id,
    sessionId: attempt.sessionId,
    threadId: attempt.threadId,
    targetDisplayMode: attempt.targetDisplayMode,
    status: attempt.status,
    stage: attempt.stage,
    bindingIssuedAt: attempt.bindingIssuedAt,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
    instances: Array.from(attempt.instances.values()).map((instance) => ({ ...instance }))
  };
}
function sessionInfo(session) {
  const revisionState = session.projectPath ? projectRevisionStates.get(projectRevisionKey(session.projectPath)) : null;
  return {
    codexThreadId: session.codexThreadId,
    threadClaimedAt: session.threadClaimedAt || null,
    documentRevision: projectDocumentRevision(session.projectPath),
    documentVersion: revisionState?.documentVersion || null,
    language: session.language,
    projectPath: session.projectPath,
    sessionId: session.id,
    openAttempt: summarizeOpenAttempt(session.openAttempts.get(session.currentOpenAttemptId))
  };
}
function openAttemptResult(session, attempt, instance, value = {}) {
  const status = value.status === "failed" ? "failed" : value.status === "timeout" ? "timeout" : "ready";
  return {
    status,
    verified: status === "ready",
    openAttemptId: attempt?.id || value.openAttemptId || "",
    bindingIssuedAt: attempt?.bindingIssuedAt || value.bindingIssuedAt || null,
    sessionId: session.id,
    threadId: attempt?.threadId || session.codexThreadId || null,
    projectPath: session.projectPath,
    widgetInstanceId: instance?.widgetInstanceId || value.widgetInstanceId || null,
    displayMode: instance?.displayMode || value.displayMode || null,
    stage: normalizeStartupStage(value.stage, status === "ready" ? "ready" : "failed"),
    reactMounted: instance?.reactMounted === true || value.reactMounted === true,
    projectHydrated: instance?.projectHydrated === true || value.projectHydrated === true,
    canvasRendered: instance?.canvasRendered === true || value.canvasRendered === true,
    canvasVisible: instance?.canvasVisible === true || value.canvasVisible === true,
    canvasWidth: instance?.canvasWidth || value.canvasWidth || 0,
    canvasHeight: instance?.canvasHeight || value.canvasHeight || 0,
    error: (status === "failed" || status === "timeout") && typeof value.error === "string" ? value.error : null,
    reportedAt: value.reportedAt || instance?.reportedAt || nowIso()
  };
}
function completeOpenAttemptWaiter(waiter, result) {
  clearTimeout(waiter.timer);
  if (waiter.abortSignal && waiter.abortHandler) {
    waiter.abortSignal.removeEventListener("abort", waiter.abortHandler);
  }
  waiter.resolve(result);
}
function detachOpenAttemptWaiter(attempt, waiter) {
  clearTimeout(waiter.timer);
  if (waiter.abortSignal && waiter.abortHandler) {
    waiter.abortSignal.removeEventListener("abort", waiter.abortHandler);
  }
  const index = attempt.waiters.indexOf(waiter);
  if (index >= 0) attempt.waiters.splice(index, 1);
}
function requireOpenAttempt(session, attemptId) {
  const attempt = session.openAttempts.get(typeof attemptId === "string" ? attemptId : "");
  if (!attempt) throw new HttpError(409, "Canvasight open attempt does not match this session.", "open_attempt_mismatch");
  if (attempt.sessionId !== session.id) throw new HttpError(409, "Canvasight open attempt session mismatch.", "open_attempt_session_mismatch");
  return attempt;
}
function registerOpenAttemptInstance(session, identity = {}) {
  const attempt = requireOpenAttempt(session, identity.openAttemptId);
  const widgetInstanceId = typeof identity.widgetInstanceId === "string" ? identity.widgetInstanceId.trim() : "";
  if (!widgetInstanceId) throw new HttpError(400, "widgetInstanceId is required.", "missing_widget_instance_id");
  if (attempt.threadId && identity.threadId && identity.threadId !== attempt.threadId) {
    throw new HttpError(409, "Canvasight widget belongs to a different Codex task.", "widget_thread_mismatch");
  }
  const incomingStage = normalizeStartupStage(identity.startupStage);
  const existing = attempt.instances.get(widgetInstanceId);
  if (existing && STARTUP_STAGE_RANK.get(incomingStage) < STARTUP_STAGE_RANK.get(existing.stage)) return { attempt, instance: existing };
  if (existing?.stage === "failed" || existing?.stage === "ready") return { attempt, instance: existing };
  const instance = {
    widgetInstanceId,
    displayMode: typeof identity.displayMode === "string" ? identity.displayMode : existing?.displayMode || "unknown",
    stage: incomingStage,
    reactMounted: identity.reactMounted === true || existing?.reactMounted === true,
    projectHydrated: identity.projectHydrated === true || existing?.projectHydrated === true,
    canvasRendered: identity.canvasRendered === true || existing?.canvasRendered === true,
    canvasVisible: identity.canvasVisible === true || existing?.canvasVisible === true,
    canvasWidth: Math.max(0, toNumber(identity.canvasWidth, existing?.canvasWidth || 0)),
    canvasHeight: Math.max(0, toNumber(identity.canvasHeight, existing?.canvasHeight || 0)),
    registeredAt: existing?.registeredAt || nowIso(),
    reportedAt: nowIso(),
    error: typeof identity.error === "string" ? identity.error : existing?.error || null
  };
  attempt.instances.set(widgetInstanceId, instance);
  if (STARTUP_STAGE_RANK.get(instance.stage) >= STARTUP_STAGE_RANK.get(attempt.stage)) attempt.stage = instance.stage;
  attempt.updatedAt = nowIso();
  appendOpenAttemptLifecycle("canvasight_widget_instance_stage", {
    openAttemptId: attempt.id,
    sessionId: session.id,
    threadId: attempt.threadId,
    widgetInstanceId,
    displayMode: instance.displayMode,
    stage: instance.stage
  });
  return { attempt, instance };
}
function assertVerifiedFullscreenInstance(attempt, instance) {
  if (instance.displayMode !== attempt.targetDisplayMode || instance.displayMode !== "fullscreen") {
    throw new HttpError(409, "Only the fullscreen Canvasight instance can become ready or Run.", "fullscreen_instance_required");
  }
  if (!instance.reactMounted || !instance.projectHydrated || !instance.canvasRendered || !instance.canvasVisible || instance.canvasWidth <= 0 || instance.canvasHeight <= 0) {
    throw new HttpError(409, "Canvasight fullscreen instance is missing required ready evidence.", "widget_ready_evidence_incomplete");
  }
}
function setOpenAttemptReady(session, value) {
  const { attempt, instance } = registerOpenAttemptInstance(session, {
    ...value,
    startupStage: value.status === "ready" ? "hydrating_project" : "failed"
  });
  if (value.status === "ready") {
    assertVerifiedFullscreenInstance(attempt, instance);
    instance.stage = "ready";
    attempt.status = "ready";
    attempt.stage = "ready";
  } else {
    instance.stage = "failed";
    instance.error = typeof value.error === "string" ? value.error : "Canvasight widget failed to start.";
    if (instance.displayMode === "fullscreen") {
      attempt.status = "failed";
      attempt.stage = "failed";
    }
  }
  instance.reportedAt = nowIso();
  attempt.updatedAt = instance.reportedAt;
  const result = openAttemptResult(session, attempt, instance, value);
  if (instance.displayMode === "fullscreen") {
    const matched = attempt.waiters.filter((waiter) => !waiter.widgetInstanceId || waiter.widgetInstanceId === instance.widgetInstanceId);
    attempt.waiters = attempt.waiters.filter((waiter) => !matched.includes(waiter));
    for (const waiter of matched) completeOpenAttemptWaiter(waiter, result);
  }
  appendOpenAttemptLifecycle("canvasight_open_attempt_".concat(result.status), result);
  return result;
}
function waitForOpenAttemptReady(sessionIdValue, openAttemptIdValue, timeoutMs, options = {}) {
  const session = sessions.get(sessionIdValue);
  const threadId = optionalThreadId(options.threadId);
  if (!session) {
    return Promise.resolve({
      status: "failed",
      verified: false,
      openAttemptId: openAttemptIdValue || "",
      sessionId: sessionIdValue || "",
      threadId,
      projectPath: null,
      stage: "failed",
      reactMounted: false,
      error: "Canvasight session not found.",
      reportedAt: nowIso()
    });
  }
  const attempt = session.openAttempts.get(openAttemptIdValue);
  if (!attempt) {
    return Promise.resolve(openAttemptResult(session, null, null, {
      status: "failed",
      openAttemptId: openAttemptIdValue,
      stage: "failed",
      error: "Canvasight open attempt not found."
    }));
  }
  if (threadId && session.codexThreadId && threadId !== session.codexThreadId) {
    return Promise.resolve(openAttemptResult(session, attempt, null, { status: "failed", stage: "failed", error: "Canvasight widget belongs to a different Codex task." }));
  }
  if (attempt.threadId && threadId !== attempt.threadId) {
    return Promise.resolve(openAttemptResult(session, attempt, null, { status: "failed", stage: "failed", error: "Canvasight open attempt belongs to a different Codex task." }));
  }
  const requestedInstanceId = typeof options.widgetInstanceId === "string" ? options.widgetInstanceId.trim() : "";
  const readyInstance = Array.from(attempt.instances.values()).find(
    (instance) => instance.stage === "ready" && instance.displayMode === "fullscreen" && (!requestedInstanceId || instance.widgetInstanceId === requestedInstanceId)
  );
  if (readyInstance) return Promise.resolve(openAttemptResult(session, attempt, readyInstance));
  if (attempt.status === "failed") {
    const failedInstance = Array.from(attempt.instances.values()).find((instance) => instance.displayMode === "fullscreen" && instance.stage === "failed");
    return Promise.resolve(openAttemptResult(session, attempt, failedInstance, { status: "failed", error: failedInstance?.error || "Canvasight fullscreen instance failed." }));
  }
  const timeout = Math.max(1, Math.min(toNumber(timeoutMs, 3e4), 3e5));
  return new Promise((resolve) => {
    const waiter = {
      resolve,
      timer: setTimeout(() => {
        detachOpenAttemptWaiter(attempt, waiter);
        const lastInstance = Array.from(attempt.instances.values()).filter((instance) => instance.displayMode === "fullscreen").sort((left, right) => String(right.reportedAt).localeCompare(String(left.reportedAt)))[0] || null;
        resolve(openAttemptResult(session, attempt, lastInstance, { status: "timeout", stage: lastInstance?.stage || attempt.stage, error: "Canvasight fullscreen widget did not report ready within ".concat(timeout, "ms.") }));
      }, timeout)
    };
    if (options.abortSignal) {
      waiter.abortSignal = options.abortSignal;
      waiter.abortHandler = () => {
        detachOpenAttemptWaiter(attempt, waiter);
        resolve(openAttemptResult(session, attempt, null, { status: "failed", stage: attempt.stage, error: "Canvasight widget ready wait was cancelled." }));
      };
      options.abortSignal.addEventListener("abort", waiter.abortHandler, { once: true });
    }
    waiter.widgetInstanceId = requestedInstanceId || null;
    attempt.waiters.push(waiter);
  });
}
function getSession(id) {
  const session = sessions.get(id);
  if (!session) throw new HttpError(404, "Session not found");
  return session;
}
function projectThreadClaimKey(projectPath) {
  return path.resolve(projectPath);
}
function sessionsForProject(projectPath) {
  const resolved = path.resolve(projectPath);
  return Array.from(sessions.values()).filter((session) => path.resolve(session.projectPath) === resolved);
}
function sessionSortTime(session) {
  return Date.parse(session.threadClaimedAt || session.createdAt || "") || 0;
}
function newestSessionForProject(projectPath) {
  return sessionsForProject(projectPath).sort((a, b) => sessionSortTime(b) - sessionSortTime(a))[0] || null;
}
function rememberThreadClaim(session, threadId) {
  const claimedAt = nowIso();
  session.codexThreadId = threadId;
  session.threadClaimedAt = claimedAt;
  projectThreadClaims.set(projectThreadClaimKey(session.projectPath), {
    projectPath: session.projectPath,
    sessionId: session.id,
    threadId,
    claimedAt
  });
  return claimedAt;
}
function resolvedThreadClaim(projectPath) {
  const claim = projectThreadClaims.get(projectThreadClaimKey(projectPath));
  if (claim) {
    const session = sessions.get(claim.sessionId);
    if (session && path.resolve(session.projectPath) === path.resolve(projectPath) && session.codexThreadId === claim.threadId) {
      return {
        claim,
        session
      };
    }
  }
  const newestClaimed = sessionsForProject(projectPath).filter((session) => session.codexThreadId).sort((a, b) => sessionSortTime(b) - sessionSortTime(a))[0];
  if (!newestClaimed) return null;
  return {
    claim: {
      projectPath: newestClaimed.projectPath,
      sessionId: newestClaimed.id,
      threadId: newestClaimed.codexThreadId,
      claimedAt: newestClaimed.threadClaimedAt || newestClaimed.createdAt
    },
    session: newestClaimed
  };
}
async function claimThreadForProject({ projectPath, sessionId: sessionId2, language, threadId }) {
  const resolvedThreadId = optionalThreadId(threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  if (!resolvedThreadId) {
    throw new HttpError(400, "Cannot claim Canvasight without a current Codex thread id.", "missing_thread_id");
  }
  let targetSession = sessionId2 ? getSession(sessionId2) : null;
  const resolvedProjectPath = optionalProjectPath(projectPath) || targetSession?.projectPath || await resolveSessionProjectPath(null, resolvedThreadId, { requireThreadProject: Boolean(resolvedThreadId) });
  if (targetSession && path.resolve(targetSession.projectPath) !== path.resolve(resolvedProjectPath)) {
    targetSession = null;
  }
  const projectSessions = sessionsForProject(resolvedProjectPath);
  if (!targetSession) targetSession = newestSessionForProject(resolvedProjectPath);
  if (!targetSession) {
    targetSession = await createSession({
      projectPath: resolvedProjectPath,
      language,
      threadId: resolvedThreadId
    });
    projectSessions.push(targetSession);
  }
  const claimedSessionIds = [];
  for (const session of projectSessions) {
    if (path.resolve(session.projectPath) !== path.resolve(resolvedProjectPath)) continue;
    rememberThreadClaim(session, resolvedThreadId);
    claimedSessionIds.push(session.id);
  }
  if (!claimedSessionIds.includes(targetSession.id)) {
    rememberThreadClaim(targetSession, resolvedThreadId);
    claimedSessionIds.push(targetSession.id);
  }
  const claim = projectThreadClaims.get(projectThreadClaimKey(targetSession.projectPath));
  return {
    status: "claimed",
    projectPath: targetSession.projectPath,
    sessionId: targetSession.id,
    claimedSessionIds,
    codexThreadId: resolvedThreadId,
    claimedAt: claim?.claimedAt || targetSession.threadClaimedAt || nowIso(),
    session: sessionInfo(targetSession)
  };
}
function normalizeAgentTeamPayload(value) {
  const agentTeam = isObject2(value) ? value : {};
  const enabled = agentTeam.enabled === true;
  const recommendedRoles = Array.isArray(agentTeam.recommendedRoles) ? agentTeam.recommendedRoles.filter((role) => isObject2(role)).map((role) => ({
    id: typeof role.id === "string" && AGENT_TEAM_ROLE_IDS.has(role.id) ? role.id : "",
    label: typeof role.label === "string" ? role.label : "",
    reason: typeof role.reason === "string" ? role.reason : ""
  })).filter((role) => role.id && role.label) : [];
  return {
    enabled,
    skillName: "canvasight-agent-team",
    recommendedRoles: enabled ? recommendedRoles : [],
    reportProtocol: {
      root: "agent-reports",
      roster: "ROSTER.md",
      schema: "references/agent-team-schema.json",
      statuses: AGENT_TEAM_STATUS_FLOW
    }
  };
}
function disabledAgentTeamAgentsMdResult(projectPath, reason) {
  return {
    status: "skipped",
    reason,
    path: projectPath ? path.join(projectPath, "AGENTS.md") : null
  };
}
function agentTeamTimestamp() {
  return nowIso().replace(/\.\d{3}Z$/, "Z");
}
function initialAgentTeamRoster(agentTeam) {
  const timestamp = agentTeamTimestamp();
  const roleNames = Array.from(
    new Set(agentTeam.recommendedRoles.map((role) => AGENT_TEAM_ROLE_NAMES[role.id]).filter(Boolean))
  );
  const roles = (roleNames.length ? roleNames : ["Product Agent"]).map((role) => [
    "  - role: ".concat(role),
    "    status: missing",
    "    agent_id: null",
    "    thread_id: null",
    "    created_at: ".concat(timestamp),
    "    last_seen: ".concat(timestamp),
    "    handoff_source: AGENTS.md",
    "    last_report: AGENTS.md",
    "    rebuild_on_new_thread: true",
    "    replaced_by: null",
    "    notes: Created by Canvasight; assign only when this role is needed."
  ].join("\n"));
  return "# Canvasight Agent Team Roster\n\nThis registry stores role-seat runtime mappings. Issue reports remain authoritative for issue ownership.\n\n```yaml\nschema_version: 1\nroles:\n".concat(roles.join("\n"), "\n```\n");
}
async function ensureAgentTeamRoster(projectPath, agentTeam, agentsMd) {
  const rosterPath = path.join(projectPath, "ROSTER.md");
  if (!agentTeam.enabled) return { status: "skipped", reason: "agent_team_disabled", path: rosterPath };
  if (agentsMd.status === "skipped" || agentsMd.status === "failed") {
    return { status: "skipped", reason: "agents_md_unavailable", path: rosterPath };
  }
  try {
    await fsp.access(rosterPath);
    return { status: "unchanged", reason: "existing_roster", path: rosterPath };
  } catch (error51) {
    if (error51?.code !== "ENOENT") return { status: "failed", reason: "read_failed", path: rosterPath, error: error51?.message || String(error51) };
  }
  try {
    await fsp.writeFile(rosterPath, initialAgentTeamRoster(agentTeam), "utf8");
    return { status: "created", reason: "missing_roster", path: rosterPath };
  } catch (error51) {
    return { status: "failed", reason: "write_failed", path: rosterPath, error: error51?.message || String(error51) };
  }
}
async function ensureAgentTeamAgentsMd(projectPath, agentTeam) {
  const agentsPath = path.join(projectPath, "AGENTS.md");
  if (!agentTeam.enabled) return disabledAgentTeamAgentsMdResult(projectPath, "agent_team_disabled");
  try {
    await fsp.mkdir(projectPath, { recursive: true });
    let existing = "";
    let existed = true;
    try {
      existing = await fsp.readFile(agentsPath, "utf8");
    } catch (error51) {
      if (error51?.code !== "ENOENT") throw error51;
      existed = false;
    }
    if (/canvasight-agent-team\s*:\s*(disable|disabled|off|false)/i.test(existing)) {
      return {
        status: "skipped",
        reason: "disabled_by_project",
        path: agentsPath
      };
    }
    const startIndex = existing.indexOf(AGENT_TEAM_AGENTS_MD_START);
    const endIndex = existing.indexOf(AGENT_TEAM_AGENTS_MD_END);
    if (startIndex >= 0 && endIndex > startIndex) {
      const before = existing.slice(0, startIndex).replace(/\s*$/, "");
      const after = existing.slice(endIndex + AGENT_TEAM_AGENTS_MD_END.length).replace(/^\s*/, "");
      const next2 = [before, AGENT_TEAM_AGENTS_MD_BLOCK, after].filter(Boolean).join("\n\n") + "\n";
      if (next2 !== existing) {
        await fsp.writeFile(agentsPath, next2, "utf8");
        return {
          status: "updated",
          reason: "managed_block_refreshed",
          path: agentsPath
        };
      }
      return {
        status: "unchanged",
        reason: "managed_block_present",
        path: agentsPath
      };
    }
    const next = existed && existing.trim() ? "".concat(existing.replace(/\s*$/, ""), "\n\n").concat(AGENT_TEAM_AGENTS_MD_BLOCK, "\n") : "".concat(AGENT_TEAM_AGENTS_MD_BLOCK, "\n");
    await fsp.writeFile(agentsPath, next, "utf8");
    return {
      status: existed ? "appended" : "created",
      reason: existed ? "missing_managed_block" : "missing_agents_md",
      path: agentsPath
    };
  } catch (error51) {
    return {
      status: "failed",
      reason: "write_failed",
      path: agentsPath,
      error: error51?.message || String(error51)
    };
  }
}
function normalizeRunPayload(session, value) {
  const payload = isObject2(value) ? value : {};
  const projectPath = typeof payload.projectPath === "string" && payload.projectPath ? path.resolve(payload.projectPath) : session.projectPath;
  const codexMode = normalizeCodexMode();
  return {
    status: "received",
    sessionId: session.id,
    threadName: typeof payload.threadName === "string" ? payload.threadName : "Canvasight Run",
    projectPath,
    markdown: typeof payload.markdown === "string" ? payload.markdown : "",
    imagePaths: Array.isArray(payload.imagePaths) ? payload.imagePaths.filter((item) => typeof item === "string") : [],
    codexMode,
    codexNative: {
      status: "pending",
      threadId: null,
      mode: codexMode
    },
    effort: normalizeEffort(payload.effort),
    runMode: normalizeRunMode(payload.runMode),
    agentTeam: normalizeAgentTeamPayload(payload.agentTeam),
    nodeIds: Array.isArray(payload.nodeIds) ? payload.nodeIds.filter((item) => typeof item === "string") : [],
    attachments: Array.isArray(payload.attachments) ? payload.attachments.map(normalizeAttachment) : []
  };
}
function completeWaiter(waiter, payload) {
  clearTimeout(waiter.timer);
  if (waiter.abortSignal && waiter.abortHandler) {
    waiter.abortSignal.removeEventListener("abort", waiter.abortHandler);
  }
  waiter.resolve(payload);
}
function waiterMatches(waiter, session, payload) {
  if (waiter.sessionId && waiter.sessionId !== session.id) return false;
  if (waiter.projectPath && path.resolve(waiter.projectPath) !== path.resolve(payload.projectPath || session.projectPath)) return false;
  if (waiter.threadId && session.codexThreadId && waiter.threadId !== session.codexThreadId) return false;
  return true;
}
function detachWaiter(waiter) {
  clearTimeout(waiter.timer);
  if (waiter.abortSignal && waiter.abortHandler) {
    waiter.abortSignal.removeEventListener("abort", waiter.abortHandler);
  }
  if (waiter.sessionId) {
    const session = sessions.get(waiter.sessionId);
    if (session) {
      const index2 = session.waiters.indexOf(waiter);
      if (index2 >= 0) session.waiters.splice(index2, 1);
    }
    return;
  }
  const index = globalRunWaiters.indexOf(waiter);
  if (index >= 0) globalRunWaiters.splice(index, 1);
}
function closedRunPayload(sessionIdValue, projectPath = null, threadId = null) {
  return {
    status: "closed",
    sessionId: sessionIdValue || "",
    threadName: "",
    projectPath,
    markdown: "",
    imagePaths: [],
    codexMode: "chat",
    codexNative: {
      status: "not_applicable",
      threadId,
      mode: "chat"
    },
    effort: "xhigh",
    runMode: "flow",
    nodeIds: [],
    attachments: []
  };
}
function timeoutRunPayload(sessionIdValue, projectPath = null, threadId = null) {
  return {
    status: "timeout",
    sessionId: sessionIdValue || "",
    threadName: "",
    projectPath,
    markdown: "",
    imagePaths: [],
    codexMode: "chat",
    codexNative: {
      status: "not_applicable",
      threadId,
      mode: "chat"
    },
    effort: "xhigh",
    runMode: "flow",
    nodeIds: [],
    attachments: []
  };
}
async function enqueueRun(session, payload) {
  const normalized = normalizeRunPayload(session, payload);
  normalized.agentTeam.agentsMd = await ensureAgentTeamAgentsMd(normalized.projectPath, normalized.agentTeam);
  normalized.agentTeam.roster = await ensureAgentTeamRoster(normalized.projectPath, normalized.agentTeam, normalized.agentTeam.agentsMd);
  const sessionWaiterIndex = session.waiters.findIndex((candidate) => waiterMatches(candidate, session, normalized));
  const sessionWaiter = sessionWaiterIndex >= 0 ? session.waiters.splice(sessionWaiterIndex, 1)[0] : null;
  const waiter = sessionWaiter || globalRunWaiters.find((candidate) => waiterMatches(candidate, session, normalized));
  if (waiter) {
    detachWaiter(waiter);
    normalized.delivery = {
      status: "awaited",
      via: "await_canvasight_run",
      threadId: null
    };
    completeWaiter(waiter, normalized);
  } else {
    normalized.codexNative = {
      status: "pending",
      reason: "await_canvasight_run_required",
      threadId: session.codexThreadId || null,
      mode: normalized.codexMode
    };
    normalized.codexTurn = {
      status: "skipped",
      reason: "browser_fallback_requires_await",
      threadId: session.codexThreadId || null,
      mode: normalized.codexMode
    };
    normalized.delivery = {
      status: "queued",
      reason: "browser_fallback_requires_await",
      via: "await_canvasight_run",
      threadId: session.codexThreadId || null,
      codexNative: normalized.codexNative,
      codexTurn: normalized.codexTurn
    };
    session.runQueue.push(normalized);
  }
  return normalized;
}
async function prepareWidgetRun(session, payload) {
  const normalized = normalizeRunPayload(session, payload);
  normalized.agentTeam.agentsMd = await ensureAgentTeamAgentsMd(normalized.projectPath, normalized.agentTeam);
  normalized.agentTeam.roster = await ensureAgentTeamRoster(normalized.projectPath, normalized.agentTeam, normalized.agentTeam.agentsMd);
  normalized.codexNative = await applyWidgetCodexMode(session, normalized);
  normalized.codexTurn = {
    status: "skipped",
    reason: "widget_bridge_sendMessage",
    threadId: normalized.codexNative.threadId || null,
    mode: normalized.codexMode
  };
  normalized.delivery = {
    status: "prepared",
    reason: "widget_bridge_mode_applied",
    via: "widget_bridge",
    threadId: normalized.codexNative.threadId || null,
    codexNative: normalized.codexNative,
    codexTurn: normalized.codexTurn
  };
  return normalized;
}
function queuedRunMatchesThread(run, threadId) {
  if (!threadId) return true;
  const runThreadId = run?.delivery?.threadId || run?.codexNative?.threadId || run?.codexTurn?.threadId || null;
  return !runThreadId || runThreadId === threadId;
}
function takeQueuedRun(sessionIdValue, projectPath, threadId = null) {
  if (sessionIdValue) {
    const session = sessions.get(sessionIdValue);
    if (!session) return null;
    if (projectPath) {
      const index2 = session.runQueue.findIndex(
        (run) => queuedRunMatchesThread(run, threadId) && path.resolve(run.projectPath || session.projectPath) === path.resolve(projectPath)
      );
      return index2 >= 0 ? session.runQueue.splice(index2, 1)[0] : null;
    }
    const index = session.runQueue.findIndex((run) => queuedRunMatchesThread(run, threadId));
    return index >= 0 ? session.runQueue.splice(index, 1)[0] : null;
  }
  const resolvedProjectPath = optionalProjectPath(projectPath);
  for (const session of sessions.values()) {
    const index = session.runQueue.findIndex((run) => {
      if (!queuedRunMatchesThread(run, threadId)) return false;
      if (!resolvedProjectPath) return true;
      return path.resolve(run.projectPath || session.projectPath) === resolvedProjectPath;
    });
    if (index >= 0) return session.runQueue.splice(index, 1)[0];
  }
  return null;
}
function waitForRun(sessionIdValue, timeoutMs, options = {}) {
  const timeout = Math.max(1, Math.min(toNumber(timeoutMs, 6e4), 3e5));
  const projectPath = optionalProjectPath(options.projectPath);
  const threadId = optionalThreadId(options.threadId);
  const session = sessions.get(sessionIdValue);
  if (sessionIdValue && !session) {
    return Promise.resolve(closedRunPayload(sessionIdValue, projectPath));
  }
  const queued = takeQueuedRun(sessionIdValue || null, projectPath, threadId);
  if (queued) return Promise.resolve(queued);
  return new Promise((resolve) => {
    const waiter = {
      sessionId: sessionIdValue || null,
      projectPath,
      threadId,
      resolve,
      timer: setTimeout(() => {
        detachWaiter(waiter);
        resolve(timeoutRunPayload(sessionIdValue, projectPath));
      }, timeout)
    };
    if (options.abortSignal) {
      waiter.abortSignal = options.abortSignal;
      waiter.abortHandler = () => {
        detachWaiter(waiter);
        resolve(closedRunPayload(sessionIdValue, projectPath));
      };
      options.abortSignal.addEventListener("abort", waiter.abortHandler, { once: true });
    }
    if (sessionIdValue) {
      session.waiters.push(waiter);
    } else {
      globalRunWaiters.push(waiter);
    }
  });
}
function closeSession(sessionIdValue) {
  const session = sessions.get(sessionIdValue);
  if (!session) return false;
  sessions.delete(sessionIdValue);
  const claimKey = projectThreadClaimKey(session.projectPath);
  const claim = projectThreadClaims.get(claimKey);
  if (claim?.sessionId === sessionIdValue) projectThreadClaims.delete(claimKey);
  while (session.waiters.length) {
    completeWaiter(session.waiters.shift(), {
      status: "closed",
      sessionId: sessionIdValue,
      threadName: "",
      projectPath: session.projectPath,
      markdown: "",
      imagePaths: [],
      codexMode: "chat",
      codexNative: {
        status: "not_applicable",
        threadId: session.codexThreadId,
        mode: "chat"
      },
      effort: "xhigh",
      runMode: "flow",
      nodeIds: [],
      attachments: []
    });
  }
  for (const attempt of session.openAttempts.values()) {
    while (attempt.waiters.length) {
      completeOpenAttemptWaiter(
        attempt.waiters.shift(),
        openAttemptResult(session, attempt, null, {
          status: "failed",
          stage: "failed",
          error: "Canvasight session closed before the fullscreen widget became ready."
        })
      );
    }
  }
  return true;
}
function responseHeaders(headers = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, x-canvasight-token, x-canvasight-open-attempt-id, x-canvasight-widget-instance-id, x-canvasight-startup-stage, x-canvasight-display-mode, x-canvasight-thread-id, x-canvasight-react-mounted",
    "access-control-allow-private-network": "true",
    ...headers
  };
}
function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, responseHeaders({
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  }));
  res.end(body);
}
function sendNoContent(res) {
  res.writeHead(204, responseHeaders());
  res.end();
}
function sendText(res, statusCode, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, responseHeaders({
    "content-type": contentType,
    "content-length": Buffer.byteLength(text)
  }));
  res.end(text);
}
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_JSON_BODY_BYTES) {
        reject(new HttpError(413, "Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
async function readJsonBody(req) {
  const raw = await readRequestBody(req);
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}
function assertMethod(req, expected) {
  if (req.method !== expected) {
    throw new HttpError(405, "Expected ".concat(expected));
  }
}
function requestAuthToken(req, url2) {
  const header = req.headers["x-canvasight-token"];
  if (typeof header === "string" && header) return header;
  if (Array.isArray(header) && header[0]) return header[0];
  return url2.searchParams.get("token") || "";
}
function assertDaemonAuthorized(req, url2) {
  if (!daemonAuthToken) return;
  if (requestAuthToken(req, url2) !== daemonAuthToken) {
    throw new HttpError(401, "Unauthorized Canvasight daemon request");
  }
}
async function saveAttachments(projectPath, files) {
  if (!Array.isArray(files)) throw new HttpError(400, "files must be an array");
  await ensureScatterLayout(projectPath);
  const assetsDir = scatterAssetsDir(projectPath);
  const saved = [];
  for (const input of files) {
    if (!isObject2(input)) throw new HttpError(400, "attachment input must be an object");
    const originalName = safeFileName(input.name);
    const mime = typeof input.mime === "string" && input.mime ? input.mime : mimeFromPath(originalName);
    const uniqueName = "".concat(Date.now(), "-").concat(crypto.randomBytes(4).toString("hex"), "-").concat(originalName);
    const storedPath = path.join(assetsDir, uniqueName);
    let bytes;
    if (typeof input.dataBase64 === "string") {
      bytes = Buffer.from(input.dataBase64, "base64");
    } else if (typeof input.path === "string" && input.path.trim()) {
      bytes = await fsp.readFile(path.resolve(input.path));
    } else {
      throw new HttpError(400, "attachment requires dataBase64 or path");
    }
    await fsp.writeFile(storedPath, bytes);
    saved.push({
      id: crypto.randomUUID(),
      kind: attachmentKind(originalName, mime),
      source: ["upload", "drop", "paste", "clipboard"].includes(input.source) ? input.source : "upload",
      originalName,
      storedPath,
      relativePath: toRelativeProjectPath(projectPath, storedPath),
      fileUrl: assetUrlForPath(storedPath),
      mime,
      size: bytes.length,
      createdAt: nowIso()
    });
  }
  return saved;
}
function revealPath(targetPath) {
  if (typeof targetPath !== "string" || !targetPath.trim()) return;
  const resolved = path.resolve(targetPath);
  let command;
  let args;
  if (process.platform === "darwin") {
    command = "open";
    args = ["-R", resolved];
  } else if (process.platform === "win32") {
    command = "explorer.exe";
    args = ["/select,", resolved];
  } else {
    command = "xdg-open";
    args = [fs.existsSync(resolved) && fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved)];
  }
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });
  child.on("error", () => void 0);
  child.unref();
}
function openExternalBrowser(url2) {
  const explicit = process.env.CANVASIGHT_OPEN_EXTERNAL_BROWSER || process.env.CANVASIGHT_OPEN_BROWSER;
  if (explicit !== "1" && String(explicit).toLowerCase() !== "true") {
    return {
      status: "skipped",
      reason: "codex_in_app_browser_default"
    };
  }
  let command;
  let args;
  if (process.platform === "darwin") {
    command = "open";
    args = [url2];
  } else if (process.platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", url2];
  } else {
    command = "xdg-open";
    args = [url2];
  }
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });
  child.on("error", () => void 0);
  child.unref();
  return {
    status: "opened",
    reason: "explicit_external_browser"
  };
}
var cachedInlineCanvasightApp = null;
function escapeInlineScript(source) {
  return source.replaceAll("</script", "<\\/script").replaceAll("</SCRIPT", "<\\/SCRIPT");
}
function escapeInlineStyle(source) {
  return source.replaceAll("</style", "<\\/style").replaceAll("</STYLE", "<\\/STYLE");
}
function inlineCanvasightApp() {
  if (cachedInlineCanvasightApp) return cachedInlineCanvasightApp;
  const indexPath = path.join(distRoot, "index.html");
  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const scriptMatch = indexHtml.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
  const styleMatch = indexHtml.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/);
  if (!scriptMatch) throw new Error("Could not find Canvasight app bundle in dist/index.html.");
  const scriptPath = path.join(distRoot, scriptMatch[1].replace(/^\//, ""));
  const stylePath = styleMatch ? path.join(distRoot, styleMatch[1].replace(/^\//, "")) : "";
  cachedInlineCanvasightApp = {
    script: fs.readFileSync(scriptPath, "utf8"),
    style: stylePath ? fs.readFileSync(stylePath, "utf8") : ""
  };
  return cachedInlineCanvasightApp;
}
function canvasightWidgetConnectDomains(extraOrigins = []) {
  const domains = /* @__PURE__ */ new Set();
  for (const origin of extraOrigins) {
    if (typeof origin === "string" && origin.startsWith("http://127.0.0.1:")) domains.add(origin);
    if (typeof origin === "string" && origin.startsWith("http://localhost:")) domains.add(origin);
  }
  if (httpState?.origin) domains.add(httpState.origin);
  const daemonState = readDaemonStateSync();
  if (daemonState?.origin) domains.add(daemonState.origin);
  domains.add("http://127.0.0.1:*");
  domains.add("http://localhost:*");
  return Array.from(domains);
}
function canvasightWidgetResourceMeta(extraOrigins = []) {
  const connectDomains = canvasightWidgetConnectDomains(extraOrigins);
  return {
    ui: {
      prefersBorder: false,
      csp: {
        connectDomains,
        frameDomains: connectDomains,
        resourceDomains: [...connectDomains, "data:", "blob:"]
      }
    },
    "openai/widgetDescription": "Canvasight native Codex widget shell for the project canvas.",
    "openai/widgetPrefersBorder": false,
    "openai/widgetCSP": {
      connect_domains: connectDomains,
      frame_domains: connectDomains,
      resource_domains: [...connectDomains, "data:", "blob:"]
    }
  };
}
function canvasightWidgetHtml() {
  const app = inlineCanvasightApp();
  const appScript = escapeInlineScript(app.script);
  const appStyle = escapeInlineStyle(app.style);
  return '<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Canvasight</title>\n  <style id="canvasightAppStyles">'.concat(appStyle, '</style>\n  <style>\n    html, body {\n      width: 100%;\n      height: 100%;\n      margin: 0;\n      overflow: hidden;\n      background: #f7f7f7;\n      color: #333;\n      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\n    }\n    #canvasight-widget-root {\n      position: fixed;\n      inset: 0;\n      min-width: 0;\n      min-height: 0;\n      background: #f7f7f7;\n    }\n    #root, #canvasight-frame {\n      position: absolute;\n      inset: 0;\n      width: 100%;\n      height: 100%;\n      border: 0;\n      background: #f7f7f7;\n    }\n    #canvasight-widget-status {\n      position: absolute;\n      left: 50%;\n      top: 18px;\n      z-index: 2;\n      max-width: min(560px, calc(100% - 48px));\n      transform: translateX(-50%);\n      padding: 8px 12px;\n      border: 1px solid rgba(0, 0, 0, 0.08);\n      border-radius: 12px;\n      background: rgba(255, 255, 255, 0.94);\n      color: #666;\n      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);\n      font-size: 13px;\n      line-height: 18px;\n      pointer-events: none;\n      opacity: 0;\n      transition: opacity 160ms ease;\n    }\n    #canvasight-widget-status:not(:empty) {\n      opacity: 1;\n    }\n    #canvasight-widget-status[data-tone="ok"] {\n      color: #146c2e;\n    }\n    #canvasight-widget-status[data-tone="error"] {\n      color: #a62626;\n    }\n  </style>\n  <script>\n    globalThis.__CANVASIGHT_WIDGET_SHELL__ = true;\n    globalThis.__CANVASIGHT_WIDGET_SERVER_VERSION__ = ').concat(JSON.stringify(SERVER_VERSION), ';\n  </script>\n</head>\n<body>\n  <div id="canvasight-widget-root">\n    <div id="root"></div>\n    <div id="canvasight-widget-status" role="status" aria-live="polite">Starting Canvasight...</div>\n  </div>\n  <script>\n    window.addEventListener("error", (event) => {\n      const status = document.getElementById("canvasight-widget-status");\n      if (!status) return;\n      status.textContent = event.error?.message || event.message || "Canvasight module failed to start.";\n      status.dataset.tone = "error";\n    });\n    window.addEventListener("unhandledrejection", (event) => {\n      const status = document.getElementById("canvasight-widget-status");\n      if (!status) return;\n      status.textContent = event.reason?.message || String(event.reason || "Canvasight startup promise failed.");\n      status.dataset.tone = "error";\n    });\n  </script>\n  <script id="canvasightAppModule" type="module">').concat(appScript, "</script>\n</body>\n</html>");
}
function messageField(value, keys) {
  if (!isObject2(value)) return null;
  for (const key of keys) {
    if (typeof value[key] === "string" && value[key]) return value[key];
  }
  return null;
}
function turnConfirmationFromNotification(message, expected = {}) {
  if (!isObject2(message) || Object.prototype.hasOwnProperty.call(message, "id")) return null;
  if (typeof message.method !== "string" || !CODEX_APP_SERVER_TURN_CONFIRMATION_METHODS.has(message.method)) return null;
  const params = isObject2(message.params) ? message.params : {};
  const turn = isObject2(params.turn) ? params.turn : null;
  const item = isObject2(params.item) ? params.item : null;
  const threadId = messageField(params, ["threadId", "thread_id"]) || messageField(turn, ["threadId", "thread_id"]) || messageField(item, ["threadId", "thread_id"]) || null;
  const turnId = messageField(params, ["turnId", "turn_id"]) || messageField(turn, ["id", "turnId", "turn_id"]) || messageField(item, ["turnId", "turn_id"]) || null;
  const clientUserMessageId = messageField(params, ["clientUserMessageId", "client_user_message_id"]) || messageField(turn, ["clientUserMessageId", "client_user_message_id"]) || messageField(item, ["clientUserMessageId", "client_user_message_id"]) || null;
  const expectedThreadId = expected.threadId || null;
  const expectedTurnId = expected.turnId || null;
  const expectedClientUserMessageId = expected.clientUserMessageId || null;
  const threadMatches = expectedThreadId && threadId === expectedThreadId;
  const turnMatches = expectedTurnId && turnId === expectedTurnId;
  const messageMatches = expectedClientUserMessageId && clientUserMessageId === expectedClientUserMessageId;
  if (expectedThreadId && threadId && threadId !== expectedThreadId) return null;
  if (expectedTurnId && turnId && turnId !== expectedTurnId) return null;
  if (expectedClientUserMessageId && clientUserMessageId && clientUserMessageId !== expectedClientUserMessageId) return null;
  if ((expectedThreadId || expectedTurnId || expectedClientUserMessageId) && !threadMatches && !turnMatches && !messageMatches) return null;
  return {
    method: message.method,
    threadId: threadId || expectedThreadId || null,
    turnId: turnId || expectedTurnId || null,
    clientUserMessageId: clientUserMessageId || expectedClientUserMessageId || null
  };
}
async function appServerRequestSequence(requests, options = {}) {
  const transports = codexAppServerTransports();
  const transport = transports[0];
  const runtime = codexAppRuntime();
  const results = await appServerRequestSequenceViaTransport(requests, options, transport, runtime);
  Object.defineProperty(results, "canvasightAppServerTransport", {
    value: transport.kind,
    enumerable: false
  });
  Object.defineProperty(results, "canvasightCodexRuntime", {
    value: results.canvasightCodexRuntime || runtime,
    enumerable: false
  });
  return results;
}
function appServerRequestSequenceViaTransport(requests, { experimentalApi = false } = {}, transport, runtime) {
  const bin = runtime.bin;
  const args = transport.args;
  const timeoutMs = nativeCodexTimeoutMs();
  const confirmationTimeoutMs = nativeCodexConfirmationTimeoutMs();
  const requestFactories = Array.isArray(requests) ? requests : [];
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let initialized = false;
    let runtimeVersion = null;
    let currentRequest = null;
    let confirmationTimer = null;
    const results = [];
    const turnConfirmations = [];
    let timer = null;
    let timeoutLabel = "initialize";
    function resetTimer(label) {
      timeoutLabel = label;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const error51 = new Error("Codex app-server ".concat(timeoutLabel, " timed out after ").concat(timeoutMs, "ms"));
        error51.canvasightAppServerMethod = timeoutLabel;
        finish(error51);
      }, timeoutMs);
    }
    function clearConfirmationTimer() {
      if (confirmationTimer) {
        clearTimeout(confirmationTimer);
        confirmationTimer = null;
      }
    }
    function decorateError(error51) {
      if (!error51 || typeof error51 !== "object") return error51;
      error51.canvasightAppServerArgs = args.join(" ");
      error51.canvasightAppServerTransport = transport.kind;
      error51.canvasightAppServerPhase = initialized ? "request" : "initialize";
      error51.canvasightCodexRuntimeBin = runtime.bin;
      error51.canvasightCodexRuntimeSource = runtime.source;
      error51.canvasightCodexRuntimeVersion = runtimeVersion;
      error51.canvasightCodexRuntimeIsDesktop = runtime.isDesktop;
      if (stderr) error51.canvasightAppServerStderr = stderr.slice(-4e3);
      if (!error51.canvasightAppServerMethod) error51.canvasightAppServerMethod = timeoutLabel;
      return error51;
    }
    function finish(error51, value) {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      clearConfirmationTimer();
      child.kill("SIGTERM");
      if (error51) {
        reject(decorateError(error51));
      } else {
        Object.defineProperty(value, "canvasightCodexRuntime", {
          value: { ...runtime, version: runtimeVersion },
          enumerable: false,
          configurable: true
        });
        resolve(value);
      }
    }
    function send(message) {
      child.stdin.write("".concat(JSON.stringify(message), "\n"));
    }
    function nextRequest() {
      if (results.length >= requestFactories.length) {
        finish(null, results);
        return;
      }
      const specFactory = requestFactories[results.length];
      let spec;
      try {
        spec = typeof specFactory === "function" ? specFactory(results) : specFactory;
      } catch (error51) {
        finish(error51);
        return;
      }
      if (!isObject2(spec) || typeof spec.method !== "string" || !spec.method) {
        finish(new Error("Invalid Codex app-server request sequence item"));
        return;
      }
      currentRequest = {
        id: results.length + 2,
        method: spec.method,
        confirmTurnStart: Boolean(spec.confirmTurnStart),
        threadId: typeof spec.threadId === "string" && spec.threadId ? spec.threadId : isObject2(spec.params) ? spec.params.threadId : null,
        clientUserMessageId: typeof spec.clientUserMessageId === "string" && spec.clientUserMessageId ? spec.clientUserMessageId : isObject2(spec.params) ? spec.params.clientUserMessageId : null,
        pendingResult: null,
        pendingTurnId: null
      };
      resetTimer(spec.method);
      send({
        jsonrpc: "2.0",
        id: currentRequest.id,
        method: spec.method,
        params: isObject2(spec.params) ? spec.params : {}
      });
    }
    function matchingConfirmation(request, turnId = null) {
      return turnConfirmations.find((confirmation) => {
        if (request.threadId && confirmation.threadId && confirmation.threadId !== request.threadId) return false;
        if (turnId && confirmation.turnId && confirmation.turnId !== turnId) return false;
        if (request.clientUserMessageId && confirmation.clientUserMessageId && confirmation.clientUserMessageId !== request.clientUserMessageId) return false;
        return Boolean(
          request.threadId && confirmation.threadId === request.threadId || turnId && confirmation.turnId === turnId || request.clientUserMessageId && confirmation.clientUserMessageId === request.clientUserMessageId
        );
      }) || null;
    }
    function completeCurrentRequest(result, confirmation = null) {
      const finalResult = confirmation ? { ...result, canvasightConfirmation: confirmation } : result;
      results.push(finalResult);
      currentRequest = null;
      nextRequest();
    }
    function waitForTurnConfirmation(result) {
      const request = currentRequest;
      if (!request) return;
      request.pendingResult = result;
      request.pendingTurnId = turnIdFromResult(result);
      const confirmation = matchingConfirmation(request, request.pendingTurnId);
      if (confirmation) {
        completeCurrentRequest(result, confirmation);
        return;
      }
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      clearConfirmationTimer();
      confirmationTimer = setTimeout(() => {
        completeCurrentRequest(result, null);
      }, confirmationTimeoutMs);
    }
    function handleMessage(message) {
      if (!isObject2(message)) return;
      if (!Object.prototype.hasOwnProperty.call(message, "id")) {
        const confirmation = turnConfirmationFromNotification(message, {
          threadId: currentRequest?.threadId || null,
          turnId: currentRequest?.pendingTurnId || null,
          clientUserMessageId: currentRequest?.clientUserMessageId || null
        });
        if (!confirmation) return;
        turnConfirmations.push(confirmation);
        if (currentRequest?.pendingResult) {
          const matched = matchingConfirmation(currentRequest, currentRequest.pendingTurnId);
          if (matched) {
            clearConfirmationTimer();
            completeCurrentRequest(currentRequest.pendingResult, matched);
          }
        }
        return;
      }
      if (message.id === 1) {
        if (message.error) {
          finish(new Error(message.error.message || "Codex app-server initialize failed"));
          return;
        }
        runtimeVersion = typeof message.result?.userAgent === "string" && message.result.userAgent.trim() ? message.result.userAgent.trim() : null;
        initialized = true;
        nextRequest();
        return;
      }
      if (currentRequest && message.id === currentRequest.id) {
        if (message.error) {
          const error51 = new Error(message.error.message || "Codex app-server ".concat(currentRequest.method, " failed"));
          error51.canvasightAppServerMethod = currentRequest.method;
          finish(error51);
        } else {
          const result = message.result || {};
          if (currentRequest.confirmTurnStart) {
            waitForTurnConfirmation(result);
          } else {
            completeCurrentRequest(result);
          }
        }
      }
    }
    function parseStdout() {
      while (stdout.includes("\n")) {
        const newline = stdout.indexOf("\n");
        const line = stdout.slice(0, newline).trim();
        stdout = stdout.slice(newline + 1);
        if (!line) continue;
        try {
          handleMessage(JSON.parse(line));
        } catch (error51) {
          finish(error51);
        }
      }
    }
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      parseStdout();
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", (error51) => finish(error51));
    child.once("exit", (code, signal) => {
      if (!settled) finish(new Error("Codex app-server exited early: code=".concat(code, " signal=").concat(signal, " stderr=").concat(stderr)));
    });
    resetTimer("initialize");
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        clientInfo: {
          name: "canvasight",
          version: SERVER_VERSION
        },
        capabilities: {
          ...experimentalApi ? { experimentalApi: true } : {}
        }
      }
    });
  });
}
function appServerRequest(method, params, { experimentalApi = false } = {}) {
  return appServerRequestSequence([{ method, params }], { experimentalApi }).then((results) => results[0] || {});
}
function normalizeSkillListLimit(value) {
  return Math.max(1, Math.min(Math.floor(toNumber(Number(value), 50)), MAX_SKILL_SUMMARIES));
}
function summarizeCodexSkill(value) {
  if (!isObject2(value) || value.enabled !== true || typeof value.name !== "string" || !value.name.trim()) return null;
  const interfaceMetadata = isObject2(value.interface) ? value.interface : {};
  const description = typeof value.description === "string" ? value.description.trim() : "";
  return {
    name: value.name.trim(),
    description,
    displayName: typeof interfaceMetadata.displayName === "string" && interfaceMetadata.displayName.trim() ? interfaceMetadata.displayName.trim() : value.name.trim(),
    scope: typeof value.scope === "string" && value.scope.trim() ? value.scope.trim() : "unknown"
  };
}
function skillSummaryMatchesQuery(skill, query) {
  const normalizedQuery = typeof query === "string" ? query.trim().toLocaleLowerCase() : "";
  if (!normalizedQuery) return true;
  return [skill.name, skill.displayName, skill.description, skill.scope].join("\n").toLocaleLowerCase().includes(normalizedQuery);
}
async function listResolvedCodexSkills(projectPath, options = {}) {
  const cwd = normalizeProjectPath(projectPath);
  const query = typeof options.query === "string" ? options.query.trim() : "";
  const limit = normalizeSkillListLimit(options.limit);
  try {
    const result = await appServerRequest("skills/list", {
      cwds: [cwd],
      forceReload: options.forceReload === true
    });
    const entries = Array.isArray(result?.data) ? result.data : [];
    const entry = entries.find((candidate) => optionalProjectPath(candidate?.cwd) === cwd) || (entries.length === 1 ? entries[0] : null);
    if (!entry) {
      return {
        status: "unavailable",
        query,
        count: 0,
        total: 0,
        skills: [],
        advisory: {
          code: "skills_unavailable",
          message: "Codex did not return the enabled Skill catalog for this project. Manual $skill-name input remains available."
        }
      };
    }
    const deduplicated = /* @__PURE__ */ new Map();
    (Array.isArray(entry.skills) ? entry.skills : []).forEach((skill) => {
      const summary = summarizeCodexSkill(skill);
      if (summary && !deduplicated.has(summary.name)) deduplicated.set(summary.name, summary);
    });
    const matched = [...deduplicated.values()].filter((skill) => skillSummaryMatchesQuery(skill, query)).sort((left, right) => left.name.localeCompare(right.name));
    return {
      status: "ok",
      query,
      count: Math.min(matched.length, limit),
      total: matched.length,
      skills: matched.slice(0, limit),
      ...Array.isArray(entry.errors) && entry.errors.length > 0 ? {
        advisory: {
          code: "skills_partially_available",
          message: "Some Codex Skills could not be resolved. The available enabled Skills are still listed."
        }
      } : {}
    };
  } catch {
    return {
      status: "unavailable",
      query,
      count: 0,
      total: 0,
      skills: [],
      advisory: {
        code: "skills_unavailable",
        message: "Codex Skill discovery is temporarily unavailable. Manual $skill-name input remains available, and AI should not select a Skill autonomously."
      }
    };
  }
}
function codexCollaborationMode(mode, model) {
  const settings = { model };
  if (mode === "plan") settings.reasoning_effort = "medium";
  return {
    mode,
    settings
  };
}
function isRetryableThreadResumeError(error51) {
  if (error51?.canvasightAppServerMethod !== "thread/resume") return false;
  const message = String(error51?.message || "");
  return /failed to read thread|rollout does not start with session metadata|thread-store internal error/i.test(message);
}
async function retryThreadResumeSequence(operation, attempts = 4) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error51) {
      lastError = error51;
      if (!isRetryableThreadResumeError(error51) || attempt === attempts) throw error51;
      await sleep(150 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}
async function setCodexChatMode(threadId) {
  return retryThreadResumeSequence(
    () => appServerRequestSequence(
      [
        { method: "thread/resume", params: { threadId } },
        ([resumeResult]) => {
          const model = typeof resumeResult?.model === "string" && resumeResult.model ? resumeResult.model : "";
          if (!model) throw new Error("Codex thread/resume did not return a model for settings update");
          return {
            method: "thread/settings/update",
            params: { threadId, collaborationMode: codexCollaborationMode("default", model) }
          };
        }
      ],
      { experimentalApi: true }
    ).then((results) => ({
      result: results[1] || {},
      transport: results.canvasightAppServerTransport || "stdio_fallback",
      model: typeof results[0]?.model === "string" ? results[0].model : "",
      runtime: results.canvasightCodexRuntime || null
    }))
  );
}
function turnIdFromResult(result) {
  if (isObject2(result?.turn) && typeof result.turn.id === "string") return result.turn.id;
  if (typeof result?.turnId === "string") return result.turnId;
  if (typeof result?.id === "string") return result.id;
  return null;
}
function codexRuntimeDiagnostics(runtime = {}) {
  return {
    runtimeBin: runtime.bin || runtime.path || null,
    runtimeSource: runtime.source || null,
    runtimeVersion: runtime.version || null,
    runtimeIsDesktop: runtime.isDesktop === true
  };
}
function codexNativeFailureDiagnostics(error51) {
  const message = error51?.message || "Codex native mode request failed";
  const runtime = {
    bin: error51?.canvasightCodexRuntimeBin || null,
    source: error51?.canvasightCodexRuntimeSource || null,
    version: error51?.canvasightCodexRuntimeVersion || null,
    isDesktop: error51?.canvasightCodexRuntimeIsDesktop === true
  };
  const threadStoreIncompatible = /failed to read thread|rollout does not start with session metadata|thread-store internal error/i.test(message);
  const desktopUnavailable = runtime.isDesktop && error51?.canvasightAppServerPhase === "initialize";
  const errorCode = threadStoreIncompatible ? "thread_archive_incompatible" : desktopUnavailable ? "desktop_runtime_unavailable" : "codex_native_mode_request_failed";
  const userMessage = errorCode === "thread_archive_incompatible" ? "Canvasight could not read the current Desktop task archive with the selected runtime. Reload or restart Codex Desktop, create a new task, then reopen Canvasight. Diagnostic: ".concat(message) : errorCode === "desktop_runtime_unavailable" ? "Canvasight could not start the selected Desktop runtime. Reload or restart Codex Desktop, then reopen Canvasight. Diagnostic: ".concat(message) : message;
  return { error: userMessage, rawError: message, errorCode, ...codexRuntimeDiagnostics(runtime) };
}
async function applyCodexNativeMode(session, payload) {
  if (!nativeCodexEnabled()) {
    return {
      status: "disabled",
      reason: "native_direct_disabled",
      threadId: session.codexThreadId,
      mode: payload.codexMode
    };
  }
  if (!session.codexThreadId) {
    return {
      status: "skipped",
      reason: "missing CODEX_THREAD_ID",
      threadId: null,
      mode: payload.codexMode
    };
  }
  try {
    const nativeResult = await setCodexChatMode(session.codexThreadId);
    return {
      status: "applied",
      action: "thread/settings/update",
      threadId: session.codexThreadId,
      mode: "chat",
      collaborationMode: "default",
      transport: nativeResult.transport,
      codexModel: nativeResult.model,
      ...codexRuntimeDiagnostics(nativeResult.runtime)
    };
  } catch (error51) {
    return {
      status: "failed",
      ...codexNativeFailureDiagnostics(error51),
      transport: error51?.canvasightAppServerTransport || null,
      transportPhase: error51?.canvasightAppServerPhase || null,
      threadId: session.codexThreadId,
      mode: payload.codexMode
    };
  }
}
function codexNativeModeApplied(status) {
  return status === "applied" || status === "applied_chat";
}
async function applyWidgetCodexMode(session, payload) {
  const codexNative = await applyCodexNativeMode(session, payload);
  if (codexNative.status !== "applied") {
    if (isRetryableThreadResumeError({
      canvasightAppServerMethod: "thread/resume",
      message: codexNative.error
    })) {
      return {
        ...codexNative,
        status: "preflight_degraded_chat",
        reason: "thread_store_preflight_unavailable"
      };
    }
    const reason = codexNative.error || codexNative.reason || "Codex native mode was not applied";
    throw new HttpError(502, "Canvasight Run blocked before sendMessage: ".concat(reason), {
      code: "codex_mode_not_applied",
      codexNative
    });
  }
  return {
    ...codexNative,
    status: "applied_chat"
  };
}
function staticTarget(urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const requested = decodedPath === "/" ? "/index.html" : decodedPath;
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const target = path.join(distRoot, normalized);
  const resolved = path.resolve(target);
  if (!resolved.startsWith(path.resolve(distRoot))) {
    throw new HttpError(403, "Forbidden");
  }
  return resolved;
}
async function serveStatic(req, res, url2) {
  let target = staticTarget(url2.pathname);
  try {
    const stat = await fsp.stat(target);
    if (stat.isDirectory()) target = path.join(target, "index.html");
  } catch {
    const indexPath = path.join(distRoot, "index.html");
    try {
      await fsp.access(indexPath);
      target = indexPath;
    } catch {
      sendText(res, 503, "Canvasight dist is not built. Run the plugin build before opening the UI.");
      return;
    }
  }
  try {
    const stat = await fsp.stat(target);
    if (!stat.isFile()) {
      sendText(res, 404, "Not found");
      return;
    }
    res.writeHead(200, responseHeaders({
      "content-type": mimeFromPath(target),
      "content-length": stat.size
    }));
    fs.createReadStream(target).pipe(res);
  } catch {
    sendText(res, 404, "Not found");
  }
}
async function serveAsset(req, res, url2) {
  assertMethod(req, "GET");
  const assetPath = path.resolve(base64UrlDecode(url2.searchParams.get("path")));
  if (!isScatterAssetPath(assetPath) && !isTemplateAssetPath(assetPath)) throw new HttpError(403, "Forbidden");
  const stat = await fsp.stat(assetPath);
  if (!stat.isFile()) throw new HttpError(404, "Asset not found");
  res.writeHead(200, responseHeaders({
    "content-type": mimeFromPath(assetPath),
    "content-length": stat.size
  }));
  fs.createReadStream(assetPath).pipe(res);
}
async function handleSessionApi(req, res, url2) {
  const match = url2.pathname.match(/^\/api\/sessions\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return false;
  const session = getSession(decodeURIComponent(match[1]));
  const action = match[2] || "";
  const requestIdentity = {
    openAttemptId: req.headers["x-canvasight-open-attempt-id"],
    widgetInstanceId: req.headers["x-canvasight-widget-instance-id"],
    startupStage: req.headers["x-canvasight-startup-stage"],
    displayMode: req.headers["x-canvasight-display-mode"],
    threadId: req.headers["x-canvasight-thread-id"],
    reactMounted: req.headers["x-canvasight-react-mounted"] === "true"
  };
  if (session.currentOpenAttemptId && requestIdentity.openAttemptId) {
    registerOpenAttemptInstance(session, requestIdentity);
  }
  if (!action) {
    assertMethod(req, "GET");
    sendJson(res, 200, sessionInfo(session));
    return true;
  }
  if (action === "widget-ready") {
    if (req.method === "GET") {
      const attempt = session.openAttempts.get(session.currentOpenAttemptId);
      const instance = attempt?.instances.get(String(requestIdentity.widgetInstanceId || ""));
      sendJson(res, 200, instance?.stage === "ready" ? openAttemptResult(session, attempt, instance) : {
        status: "pending",
        verified: false,
        openAttemptId: attempt?.id || "",
        sessionId: session.id,
        threadId: session.codexThreadId || null,
        projectPath: session.projectPath,
        widgetInstanceId: instance?.widgetInstanceId || null,
        displayMode: instance?.displayMode || null,
        stage: instance?.stage || "starting",
        reactMounted: instance?.reactMounted === true,
        projectHydrated: instance?.projectHydrated === true,
        canvasRendered: instance?.canvasRendered === true,
        canvasVisible: instance?.canvasVisible === true,
        error: null,
        reportedAt: null
      });
      return true;
    }
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    if (body?.status !== "ready" && body?.status !== "failed") {
      throw new HttpError(400, "Widget ready status must be ready or failed.", "invalid_widget_ready_status");
    }
    sendJson(res, 200, setOpenAttemptReady(session, { ...requestIdentity, ...body }));
    return true;
  }
  if (action === "open-project") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const projectPath = normalizeProjectPath(body.projectPath || session.projectPath);
    session.projectPath = projectPath;
    const openedProject = await openProject(projectPath);
    const documentRevision = projectDocumentRevision(projectPath);
    session.documentRevision = documentRevision;
    await rememberProjectBestEffort(projectPath, openedProject.project);
    sendJson(res, 200, {
      ...openedProject,
      documentRevision
    });
    return true;
  }
  if (action === "resolve-thread-project") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const threadId = optionalThreadId(body?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
    const explicitProjectPath = optionalProjectPath(body?.projectPath);
    const projectPath = explicitProjectPath || session.projectPath || await resolveSessionProjectPath(null, threadId, { requireThreadProject: Boolean(threadId) });
    session.projectPath = projectPath;
    if (threadId) rememberThreadClaim(session, threadId);
    const openedProject = await openProject(projectPath);
    const documentRevision = projectDocumentRevision(projectPath);
    session.documentRevision = documentRevision;
    await rememberProjectBestEffort(projectPath, openedProject.project);
    sendJson(res, 200, {
      ...openedProject,
      documentRevision,
      session: sessionInfo(session)
    });
    return true;
  }
  if (action === "document") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const projectPath = normalizeProjectPath(body.projectPath || session.projectPath);
    const result = await withProjectWriteLock(projectPath, async () => {
      const currentDocument = await readScatterDocument(projectPath);
      const currentState = await ensureProjectRevisionState(projectPath, currentDocument);
      const modernSave = isObject2(body.base) && typeof body.clientMutationId === "string" && body.clientMutationId.trim();
      if (!modernSave) {
        assertCurrentDocumentRevision(projectPath, body.expectedRevision);
        const savedDocument2 = await writeScatterDocument(projectPath, body.document);
        const documentRevision3 = currentState.revision + 1;
        const documentVersion2 = documentFingerprint(savedDocument2);
        await persistProjectRevisionState(projectPath, {
          ...currentState,
          revision: documentRevision3,
          documentVersion: documentVersion2,
          lastSource: "manual",
          objectWriters: documentObjectWriters(currentState.objectWriters, currentDocument, savedDocument2, "manual")
        });
        return { status: "written", written: true, document: savedDocument2, documentRevision: documentRevision3, documentVersion: documentVersion2 };
      }
      const clientMutationId = body.clientMutationId.trim();
      const requestFingerprint = documentFingerprint({
        base: body.base,
        document: body.document,
        deletedPageSnapshots: body.deletedPageSnapshots || {},
        language: body.language === "en" ? "en" : "zh"
      });
      const priorReceipt = currentState.receipts.find((receipt) => receipt.clientMutationId === clientMutationId);
      if (priorReceipt) {
        if (priorReceipt.requestFingerprint !== requestFingerprint) {
          throw new HttpError(409, "Canvasight mutation id was reused for a different save payload.", "mutation_id_reused");
        }
        return {
          ...priorReceipt.result,
          written: false,
          replayed: true,
          document: currentDocument,
          documentRevision: currentState.revision,
          documentVersion: currentState.documentVersion
        };
      }
      if (typeof body.base.revision !== "number" || !Number.isFinite(body.base.revision) || !isObject2(body.base.document)) {
        throw new HttpError(400, "Canvasight concurrent save requires base.revision and base.document.", "invalid_document_base");
      }
      const baseDocument = normalizeScatterDocument(body.base.document, projectPath);
      const localDocument = normalizeScatterDocument(body.document, projectPath);
      const baseVersion = documentFingerprint(baseDocument);
      if (typeof body.base.version === "string" && body.base.version && body.base.version !== baseVersion) {
        throw new HttpError(409, "Canvasight save base does not match its document version.", "invalid_document_base");
      }
      if (!currentState.history.some((entry) => entry.revision === body.base.revision && entry.documentVersion === baseVersion)) {
        throw new HttpError(409, "Canvasight save base revision is not present in the durable revision history.", "invalid_document_base");
      }
      let savedDocument;
      let status;
      let merge2 = {
        baseRevision: body.base.revision,
        priorRevision: currentState.revision,
        mergedPageIds: [],
        conflictCopies: [],
        localActivePageId: localDocument.activePageId,
        clientMutationId
      };
      if (body.base.revision === currentState.revision && baseVersion === currentState.documentVersion) {
        if (documentsContentEqual(localDocument, currentDocument)) {
          savedDocument = currentDocument;
          status = "unchanged";
        } else {
          savedDocument = documentWithCurrentNavigation(currentDocument, localDocument, projectPath);
          status = "written";
        }
      } else {
        const merged = mergeConcurrentDocuments({
          baseDocument,
          currentDocument,
          deletedPageSnapshots: body.deletedPageSnapshots,
          localDocument,
          baseRevision: body.base.revision,
          priorRevision: currentState.revision,
          clientMutationId,
          language: body.language === "en" ? "en" : "zh",
          objectWriters: currentState.objectWriters,
          projectPath
        });
        savedDocument = merged.document;
        merge2 = { ...merge2, ...merged, document: void 0 };
        delete merge2.document;
        status = merged.conflictCopies.length ? "conflict-copy" : merged.mergedPageIds.length ? "merged" : documentFingerprint(savedDocument) === currentState.documentVersion ? "unchanged" : "merged";
      }
      const written = status !== "unchanged";
      const documentRevision2 = written ? currentState.revision + 1 : currentState.revision;
      const documentVersion = written ? documentFingerprint(savedDocument) : currentState.documentVersion;
      if (written) await writeScatterDocument(projectPath, savedDocument);
      const resultSummary = { status, written, documentRevision: documentRevision2, documentVersion, merge: merge2 };
      const receipts = [...currentState.receipts, { clientMutationId, requestFingerprint, result: resultSummary, createdAt: nowIso() }].slice(-MAX_DOCUMENT_MUTATION_RECEIPTS);
      await persistProjectRevisionState(projectPath, {
        ...currentState,
        version: 1,
        revision: documentRevision2,
        documentVersion,
        receipts,
        lastSource: written ? "manual" : currentState.lastSource,
        objectWriters: written ? documentObjectWriters(currentState.objectWriters, currentDocument, savedDocument, "manual") : currentState.objectWriters
      });
      return { ...resultSummary, document: savedDocument };
    });
    const { document: document2, documentRevision } = result;
    session.projectPath = projectPath;
    session.documentRevision = documentRevision;
    await rememberProjectBestEffort(projectPath, {
      name: document2.projectName,
      updatedAt: document2.updatedAt
    });
    sendJson(res, 200, result);
    return true;
  }
  if (action === "attachments") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const projectPath = normalizeProjectPath(body.projectPath || session.projectPath);
    const attachments = await saveAttachments(projectPath, body.files);
    session.projectPath = projectPath;
    await rememberProjectBestEffort(projectPath);
    sendJson(res, 200, attachments);
    return true;
  }
  if (action === "export-markdown") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    const exported = await exportMarkdownToDownloads(session, body);
    sendJson(res, 200, exported);
    return true;
  }
  if (action === "run") {
    assertMethod(req, "POST");
    const body = await readJsonBody(req);
    if (body?.deliveryMode === "widget_bridge_prepare") {
      const attempt = requireOpenAttempt(session, requestIdentity.openAttemptId);
      const instance = attempt.instances.get(String(requestIdentity.widgetInstanceId || ""));
      if (!instance || instance.stage !== "ready" || attempt.status !== "ready") {
        throw new HttpError(409, "Canvasight Run requires the verified fullscreen widget instance.", "widget_instance_not_ready");
      }
      assertVerifiedFullscreenInstance(attempt, instance);
      const prepared = await prepareWidgetRun(session, body);
      sendJson(res, 200, {
        status: "prepared",
        delivery: prepared.delivery,
        codexNative: prepared.codexNative,
        codexTurn: prepared.codexTurn,
        agentTeam: prepared.agentTeam
      });
      return true;
    }
    const queued = await enqueueRun(session, body);
    sendJson(res, 200, {
      status: queued.delivery?.status === "sent" ? "sent" : "queued",
      delivery: queued.delivery,
      codexNative: queued.codexNative,
      codexTurn: queued.codexTurn,
      agentTeam: queued.agentTeam
    });
    return true;
  }
  if (action === "close") {
    assertMethod(req, "POST");
    const existed = closeSession(session.id);
    sendJson(res, 200, {
      status: "closed",
      sessionId: session.id,
      existed
    });
    return true;
  }
  throw new HttpError(404, "API route not found");
}
async function handleHttp(req, res) {
  try {
    const url2 = new URL(req.url || "/", "http://127.0.0.1");
    if (req.method === "OPTIONS") {
      sendNoContent(res);
      return;
    }
    if (url2.pathname === "/api/health") {
      assertMethod(req, "GET");
      sendJson(res, 200, {
        status: "ok",
        name: SERVER_NAME,
        serverVersion: SERVER_VERSION,
        codexNativeEnabled: nativeCodexEnabled(),
        pluginRoot,
        pid: process.pid,
        origin: httpState?.origin || null,
        port: httpState?.port || null,
        startedAt: daemonStartedAt
      });
      return;
    }
    if (url2.pathname === "/api/reveal") {
      assertDaemonAuthorized(req, url2);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      revealPath(body.targetPath);
      sendJson(res, 200, {});
      return;
    }
    if (url2.pathname === "/api/asset") {
      assertDaemonAuthorized(req, url2);
      await serveAsset(req, res, url2);
      return;
    }
    if (url2.pathname === "/api/skills") {
      assertDaemonAuthorized(req, url2);
      let input;
      if (req.method === "GET") {
        input = {
          projectPath: url2.searchParams.get("projectPath"),
          threadId: url2.searchParams.get("threadId"),
          query: url2.searchParams.get("query") || "",
          forceReload: url2.searchParams.get("forceReload") === "true",
          limit: url2.searchParams.get("limit")
        };
      } else if (req.method === "POST") {
        input = await readJsonBody(req);
      } else {
        throw new HttpError(405, "Expected GET or POST");
      }
      const threadId = optionalThreadId(input?.threadId);
      const projectPath = await resolveSessionProjectPath(input?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
      sendJson(
        res,
        200,
        await listResolvedCodexSkills(projectPath, {
          query: input?.query,
          forceReload: input?.forceReload === true,
          limit: input?.limit
        })
      );
      return;
    }
    if (url2.pathname === "/api/preferences") {
      assertDaemonAuthorized(req, url2);
      if (req.method === "GET") {
        sendJson(res, 200, await readPreferences());
        return;
      }
      if (req.method === "POST" || req.method === "PUT") {
        sendJson(res, 200, await writePreferences(await readJsonBody(req)));
        return;
      }
      throw new HttpError(405, "Expected GET, POST, or PUT");
    }
    if (url2.pathname === "/api/templates" || url2.pathname.startsWith("/api/templates/")) {
      assertDaemonAuthorized(req, url2);
      const templateId = url2.pathname.startsWith("/api/templates/") ? decodeURIComponent(url2.pathname.slice("/api/templates/".length)) : "";
      if (templateId) {
        if (req.method === "GET") {
          sendJson(res, 200, getNodeTemplate(await readNodeTemplates(), templateId));
          return;
        }
        if (req.method === "DELETE") {
          sendJson(res, 200, await deleteNodeTemplate(templateId));
          return;
        }
        throw new HttpError(405, "Expected GET or DELETE");
      }
      if (req.method === "GET") {
        sendJson(res, 200, await readNodeTemplates());
        return;
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req);
        const template = await createNodeTemplate(isObject2(body.template) ? body.template : body, {
          replaceOldest: Boolean(body.replaceOldest)
        });
        sendJson(res, 200, template);
        return;
      }
      throw new HttpError(405, "Expected GET or POST");
    }
    if (url2.pathname === "/api/graphs/context") {
      assertDaemonAuthorized(req, url2);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const threadId = optionalThreadId(body?.threadId);
      const projectPath = await resolveSessionProjectPath(body?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
      const document2 = await readScatterDocument(projectPath);
      const revisionState = await ensureProjectRevisionState(projectPath, document2);
      sendJson(res, 200, graphContext(projectPath, document2, await readPreferences(), revisionState));
      return;
    }
    if (url2.pathname === "/api/graphs/write") {
      assertDaemonAuthorized(req, url2);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const threadId = optionalThreadId(body?.threadId) || optionalThreadId(body?.args?.threadId);
      const projectPath = await resolveSessionProjectPath(body.projectPath || body?.args?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
      sendJson(res, 200, await writeScatterGraph(projectPath, body.args || body));
      return;
    }
    if (url2.pathname === "/api/sessions/claim") {
      assertDaemonAuthorized(req, url2);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const claimed = await claimThreadForProject({
        projectPath: body?.projectPath,
        sessionId: typeof body?.sessionId === "string" && body.sessionId ? body.sessionId : "",
        language: body?.language,
        threadId: body?.threadId
      });
      await rememberProjectBestEffort(claimed.projectPath);
      sendJson(res, 200, claimed);
      return;
    }
    if (url2.pathname === "/api/sessions/resolve") {
      assertDaemonAuthorized(req, url2);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const projectPath = normalizeProjectPath(body.projectPath || defaultProjectPath());
      const resolved = resolvedThreadClaim(projectPath);
      if (!resolved) {
        sendJson(res, 200, {
          status: "unbound",
          projectPath,
          session: null,
          claim: null
        });
        return;
      }
      sendJson(res, 200, {
        status: "resolved",
        projectPath,
        session: sessionInfo(resolved.session),
        claim: resolved.claim
      });
      return;
    }
    if (url2.pathname === "/api/sessions") {
      assertDaemonAuthorized(req, url2);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const session = await createSession({
        projectPath: typeof body?.projectPath === "string" && body.projectPath ? body.projectPath : null,
        language: body?.language,
        threadId: body?.threadId,
        targetDisplayMode: body?.targetDisplayMode === "fullscreen" ? "fullscreen" : null
      });
      const openedProject = await openProject(session.projectPath);
      session.documentRevision = projectDocumentRevision(session.projectPath);
      await rememberProjectBestEffort(session.projectPath, openedProject.project);
      sendJson(res, 200, {
        session: sessionInfo(session),
        project: openedProject.project,
        document: openedProject.document,
        documentRevision: session.documentRevision
      });
      return;
    }
    if (url2.pathname === "/api/runs/await") {
      assertDaemonAuthorized(req, url2);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const abortController = new AbortController();
      const abort = () => {
        if (!res.writableEnded) abortController.abort();
      };
      res.on("close", abort);
      const run = await waitForRun(
        typeof body?.sessionId === "string" && body.sessionId ? body.sessionId : "",
        body?.timeoutMs,
        {
          projectPath: body?.projectPath,
          threadId: body?.threadId,
          abortSignal: abortController.signal
        }
      );
      res.off("close", abort);
      if (res.destroyed) return;
      sendJson(res, 200, run);
      return;
    }
    if (url2.pathname === "/api/widget-ready/await") {
      assertDaemonAuthorized(req, url2);
      assertMethod(req, "POST");
      const body = await readJsonBody(req);
      const sessionIdValue = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
      if (!sessionIdValue) throw new HttpError(400, "sessionId is required", "missing_session_id");
      const abortController = new AbortController();
      const abort = () => {
        if (!res.writableEnded) abortController.abort();
      };
      res.on("close", abort);
      const openAttemptIdValue = typeof body?.openAttemptId === "string" ? body.openAttemptId.trim() : "";
      if (!openAttemptIdValue) throw new HttpError(400, "openAttemptId is required", "missing_open_attempt_id");
      const result = await waitForOpenAttemptReady(sessionIdValue, openAttemptIdValue, body?.timeoutMs, {
        threadId: body?.threadId,
        widgetInstanceId: body?.widgetInstanceId,
        abortSignal: abortController.signal
      });
      res.off("close", abort);
      if (res.destroyed) return;
      sendJson(res, 200, result);
      return;
    }
    if (url2.pathname === "/api/daemon/stop") {
      assertDaemonAuthorized(req, url2);
      assertMethod(req, "POST");
      sendJson(res, 200, { status: "stopping", pid: process.pid });
      setTimeout(() => {
        void shutdownDaemon().finally(() => process.exit(0));
      }, 20);
      return;
    }
    if (url2.pathname.startsWith("/api/sessions/")) {
      assertDaemonAuthorized(req, url2);
      if (!await handleSessionApi(req, res, url2)) {
        throw new HttpError(404, "API route not found");
      }
      return;
    }
    if (url2.pathname.startsWith("/api/")) {
      throw new HttpError(404, "API route not found");
    }
    await serveStatic(req, res, url2);
  } catch (error51) {
    if (res.headersSent) {
      res.destroy(error51);
      return;
    }
    const statusCode = error51 instanceof HttpError ? error51.statusCode : 500;
    sendJson(res, statusCode, {
      error: error51?.message || "Internal server error",
      ...error51 instanceof HttpError && error51.code ? { code: error51.code } : {}
    });
  }
}
async function ensureHttpServer() {
  if (httpState) return httpState;
  const server = http.createServer((req, res) => {
    void handleHttp(req, res);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  httpState = {
    server,
    port,
    origin: "http://127.0.0.1:".concat(port)
  };
  if (isDaemonMode) {
    await writeDaemonState({
      version: 1,
      pid: process.pid,
      origin: httpState.origin,
      port,
      token: daemonAuthToken,
      pluginRoot,
      serverVersion: SERVER_VERSION,
      startedAt: daemonStartedAt
    });
  }
  return httpState;
}
async function shutdownDaemon() {
  for (const id of Array.from(sessions.keys())) closeSession(id);
  while (globalRunWaiters.length) {
    const waiter = globalRunWaiters.shift();
    completeWaiter(waiter, closedRunPayload(waiter.sessionId, waiter.projectPath));
  }
  if (httpState) {
    await new Promise((resolve) => httpState.server.close(resolve));
    httpState = null;
  }
  if (isDaemonMode) await removeOwnedDaemonState();
}
function toolResult(structuredContent, text = "", meta3) {
  return {
    content: [
      {
        type: "text",
        text: text || structuredContent.markdown || ""
      }
    ],
    structuredContent,
    ...meta3 ? { _meta: meta3 } : {}
  };
}
function widgetResourceDescriptor() {
  return {
    uri: CANVASIGHT_WIDGET_URI,
    name: "canvasight-canvas-widget",
    title: "Canvasight",
    description: "Native Codex widget shell for the Canvasight project canvas.",
    mimeType: p,
    _meta: canvasightWidgetResourceMeta()
  };
}
function listCanvasightResources() {
  return {
    resources: [widgetResourceDescriptor()]
  };
}
async function readCanvasightResource(uri) {
  if (uri !== CANVASIGHT_WIDGET_URI) {
    throw new HttpError(404, "Unknown Canvasight resource: ".concat(uri), "resource_not_found");
  }
  const daemon = await ensureDaemonServer();
  const meta3 = canvasightWidgetResourceMeta([daemon.origin]);
  return {
    contents: [
      {
        uri: CANVASIGHT_WIDGET_URI,
        mimeType: p,
        text: canvasightWidgetHtml(),
        _meta: meta3
      }
    ]
  };
}
function canvasRoutingContext() {
  return {
    status: "active",
    activeCanvasContext: true,
    preferredTool: "write_canvasight_graph",
    preferredMode: "append-page",
    templateDiscoveryTool: "list_canvasight_node_templates",
    fullTemplateTool: "get_canvasight_node_template",
    templateLookup: "Call list_canvasight_node_templates with targeted queries before graph writing, then get_canvasight_node_template only for likely matches.",
    skillDiscoveryTool: "list_canvasight_skills",
    skillLookup: "Call list_canvasight_skills with the canvas or node responsibility before using skill-led content or an AI-selected node Skill. Manual and user-explicit $skill-name tokens remain available when discovery is unavailable.",
    preferCanvasFor: [
      "medium_or_large_multi_step_requests",
      "product_or_feature_planning",
      "codebase_architecture_analysis",
      "article_or_document_structure_mapping",
      "task_plans_with_dependencies_or_risks"
    ],
    bypassCanvasFor: [
      "small_direct_commands",
      "simple_questions_or_explanations",
      "canvasight_run_payloads",
      "requests_that_explicitly_ask_for_direct_execution",
      "requests_that_explicitly_disable_canvas_use"
    ],
    userFacingInstruction: "Canvasight is now active for this project. For later medium or complex work, prepare or update an editable canvas page first when breakdown would help. Keep small direct tasks, Run payloads, and explicit direct-execution requests on their normal path.",
    instruction: "Canvasight is active for this project. For later medium or complex requests that benefit from decomposition, prefer creating or updating the canvas with write_canvasight_graph before direct execution. Do not force Canvasight for small direct tasks, Run payloads, or requests that ask to execute immediately."
  };
}
async function createBrowserSession(args) {
  const daemon = await ensureDaemonServer();
  const opened = await daemonJson(daemon, "/api/sessions", {
    method: "POST",
    body: JSON.stringify({
      projectPath: typeof args?.projectPath === "string" && args.projectPath ? args.projectPath : null,
      language: args?.language,
      threadId: args?.threadId || process.env.CODEX_THREAD_ID || null,
      targetDisplayMode: args?.targetDisplayMode === "fullscreen" ? "fullscreen" : null
    })
  });
  const session = opened.session;
  const url2 = daemonSessionUrl(daemon, session.sessionId);
  await waitForReachableUrl(url2, "Canvasight browser session");
  return {
    daemon,
    opened,
    session,
    url: url2
  };
}
function widgetToolMeta(widgetData) {
  return { widgetData };
}
var openCanvasightWidgetOutputSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    openAttemptId: { type: "string" },
    sessionId: { type: "string" },
    targetDisplayMode: { type: "string" },
    rendering: { type: "string" },
    widget: { type: "string" },
    canvasightHost: { type: "string" },
    openTarget: { type: "string" },
    projectPath: { type: ["string", "null"] },
    codexThreadId: { type: ["string", "null"] }
  },
  additionalProperties: true
};
var openCanvasightBrowserFallbackOutputSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    sessionId: { type: "string" },
    url: { type: "string" },
    browserUrl: { type: "string" },
    openTarget: { type: "string" },
    origin: { type: "string" },
    projectPath: { type: ["string", "null"] },
    codexThreadId: { type: ["string", "null"] }
  },
  additionalProperties: true
};
var canvasightRunOutputSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    sessionId: { type: "string" },
    threadName: { type: "string" },
    projectPath: { type: ["string", "null"] },
    markdown: { type: "string" },
    delivery: {
      type: "object",
      additionalProperties: true
    },
    codexNative: {
      type: "object",
      additionalProperties: true
    },
    codexTurn: {
      type: "object",
      additionalProperties: true
    }
  },
  additionalProperties: true
};
var looseObjectOutputSchema = {
  type: "object",
  additionalProperties: true
};
var canvasightGraphContextOutputSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    projectPath: { type: "string" },
    scatterPath: { type: "string" },
    contextId: { type: "string" },
    documentRevision: { type: "integer" },
    documentVersion: { type: "string" },
    preferences: {
      type: "object",
      properties: {
        aiSkillAssignmentEnabled: { type: "boolean" }
      },
      required: ["aiSkillAssignmentEnabled"],
      additionalProperties: false
    },
    activePage: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        viewport: { type: "object", additionalProperties: true },
        nodes: { type: "array", items: { type: "object", additionalProperties: true } },
        edges: { type: "array", items: { type: "object", additionalProperties: true } }
      },
      additionalProperties: true
    },
    nodes: { type: "array", items: { type: "object", additionalProperties: true } },
    edges: { type: "array", items: { type: "object", additionalProperties: true } },
    pages: { type: "array", items: { type: "object", additionalProperties: true } }
  },
  required: ["status", "projectPath", "contextId", "documentRevision", "documentVersion", "preferences", "activePage", "nodes", "edges", "pages"],
  additionalProperties: true
};
function publicWidgetOpenResult(widgetData) {
  return {
    status: widgetData.status,
    openAttemptId: widgetData.openAttemptId,
    rendering: widgetData.rendering,
    widget: widgetData.widget,
    sessionId: widgetData.sessionId,
    targetDisplayMode: widgetData.targetDisplayMode,
    canvasightHost: widgetData.canvasightHost,
    projectPath: widgetData.projectPath,
    codexThreadId: widgetData.codexThreadId,
    project: widgetData.project,
    language: widgetData.language,
    activeCanvasContext: widgetData.activeCanvasContext,
    canvasRouting: widgetData.canvasRouting,
    activeCanvasRouting: widgetData.activeCanvasRouting,
    openTarget: "codex_native_widget"
  };
}
async function toolRenderCanvasightCanvasWidget(args) {
  const threadId = requiredNativeThreadId(args?.threadId);
  const { daemon, opened, session, url: url2 } = await createBrowserSession({
    ...args || {},
    threadId,
    targetDisplayMode: "fullscreen"
  });
  const canvasRouting = canvasRoutingContext();
  const widgetData = {
    status: "opening",
    rendering: "native-widget",
    widget: "canvasight-canvas-widget",
    sessionId: session.sessionId,
    openAttemptId: session.openAttempt?.openAttemptId,
    bindingIssuedAt: session.openAttempt?.bindingIssuedAt,
    targetDisplayMode: "fullscreen",
    apiBaseUrl: daemon.origin,
    canvasightHost: "widget",
    token: daemon.token || "",
    url: url2,
    browserUrl: url2,
    origin: daemon.origin,
    projectPath: session.projectPath,
    codexThreadId: session.codexThreadId,
    project: opened.project,
    language: session.language,
    activeCanvasContext: true,
    canvasRouting,
    activeCanvasRouting: canvasRouting
  };
  return toolResult(
    publicWidgetOpenResult(widgetData),
    [
      "Canvasight native widget session created for project: ".concat(session.projectPath, ". This provisional result does not prove that the canvas is open."),
      "sessionId: ".concat(widgetData.sessionId),
      "openAttemptId: ".concat(widgetData.openAttemptId),
      "Next: await_canvasight_widget_ready(".concat(JSON.stringify({
        sessionId: widgetData.sessionId,
        openAttemptId: widgetData.openAttemptId,
        threadId: widgetData.codexThreadId
      }), ")"),
      "Use these identifiers from this result. Do not call open_canvasight again to recover them.",
      canvasRouting.userFacingInstruction
    ].join("\n\n"),
    widgetToolMeta(widgetData)
  );
}
async function toolOpenCanvasight(args) {
  return toolRenderCanvasightCanvasWidget(args);
}
async function toolOpenCanvasightBrowserFallback(args) {
  const { daemon, opened, session, url: url2 } = await createBrowserSession(args);
  const externalBrowser = openExternalBrowser(url2);
  const canvasRouting = canvasRoutingContext();
  return toolResult(
    {
      status: "opened",
      sessionId: session.sessionId,
      url: url2,
      browserUrl: url2,
      openTarget: "codex_in_app_browser",
      externalBrowser,
      origin: daemon.origin,
      projectPath: session.projectPath,
      codexThreadId: session.codexThreadId,
      project: opened.project,
      language: session.language,
      activeCanvasContext: true,
      canvasRouting,
      activeCanvasRouting: canvasRouting
    },
    [
      "Canvasight browser fallback opened. Open this URL in the Codex in-app browser sidebar: ".concat(url2),
      canvasRouting.userFacingInstruction
    ].join("\n\n")
  );
}
async function toolListCanvasightRecentProjects(args) {
  const projects = await recentProjects(args?.limit);
  return toolResult(
    {
      status: "listed",
      count: projects.length,
      statePath: canvasightStatePath(),
      projects
    },
    projects.length ? projects.map((project, index) => "".concat(index + 1, ". ").concat(project.name, " — ").concat(project.path)).join("\n") : "No recent Canvasight projects."
  );
}
async function toolOpenCanvasightRecentProject(args) {
  const explicitProjectPath = optionalProjectPath(args?.projectPath);
  const index = Math.max(1, Math.floor(toNumber(Number(args?.index), 1)));
  const projects = explicitProjectPath ? [] : await recentProjects(Math.max(index, MAX_RECENT_PROJECTS));
  const projectPath = explicitProjectPath || projects[index - 1]?.path;
  if (!projectPath) {
    throw new Error("No recent Canvasight project is available. Call open_canvasight with a projectPath first.");
  }
  return toolOpenCanvasight({
    projectPath,
    language: args?.language,
    threadId: args?.threadId
  });
}
async function toolClaimCanvasightThread(args) {
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  let projectPath = optionalProjectPath(args?.projectPath);
  if (!projectPath && typeof args?.sessionId !== "string") {
    projectPath = await resolveSessionProjectPath(null, threadId, { requireThreadProject: Boolean(threadId) });
  }
  const daemon = await ensureDaemonServer();
  const claimed = await daemonJson(daemon, "/api/sessions/claim", {
    method: "POST",
    body: JSON.stringify({
      projectPath,
      sessionId: typeof args?.sessionId === "string" && args.sessionId ? args.sessionId : "",
      language: args?.language,
      threadId
    })
  });
  const canvasRouting = canvasRoutingContext();
  return toolResult(
    {
      ...claimed,
      activeCanvasContext: true,
      canvasRouting,
      activeCanvasRouting: canvasRouting
    },
    [
      "Canvasight project claimed by the current Codex thread: ".concat(claimed.projectPath),
      "Run target thread: ".concat(claimed.codexThreadId),
      canvasRouting.userFacingInstruction
    ].join("\n")
  );
}
async function toolListCanvasightNodeTemplates(args) {
  const templates = await readNodeTemplates();
  const query = typeof args?.query === "string" ? args.query : "";
  const limit = normalizeTemplateListLimit(args?.limit);
  const matchedTemplates = templates.filter((template) => templateMatchesQuery(template, query));
  const limitedTemplates = matchedTemplates.slice(0, limit);
  return toolResult(
    {
      status: "ok",
      query,
      resultMode: "summary",
      count: limitedTemplates.length,
      total: matchedTemplates.length,
      maxTemplates: MAX_NODE_TEMPLATES,
      templates: limitedTemplates.map(summarizeNodeTemplate)
    },
    limitedTemplates.length ? "Canvasight node templates: ".concat(limitedTemplates.length, "/").concat(matchedTemplates.length) : "No Canvasight node templates matched."
  );
}
async function toolGetCanvasightNodeTemplate(args) {
  const templateId = typeof args?.templateId === "string" ? args.templateId.trim() : "";
  if (!templateId) throw new HttpError(400, "templateId is required");
  const template = getNodeTemplate(await readNodeTemplates(), templateId);
  return toolResult(
    {
      status: "ok",
      template
    },
    "Canvasight node template: ".concat(template.title)
  );
}
async function toolListCanvasightSkills(args) {
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  const projectPath = await resolveSessionProjectPath(args?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
  const result = await listResolvedCodexSkills(projectPath, {
    query: args?.query,
    forceReload: args?.forceReload === true,
    limit: args?.limit
  });
  return toolResult(
    result,
    result.status === "ok" ? result.count > 0 ? "Canvasight Skills: ".concat(result.count, "/").concat(result.total) : "No enabled Codex Skills matched this node responsibility." : result.advisory?.message || "Codex Skill discovery is unavailable."
  );
}
async function toolGetCanvasightGraphContext(args) {
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  const projectPath = await resolveSessionProjectPath(args?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
  const daemon = await ensureDaemonServer();
  const context = await daemonJson(daemon, "/api/graphs/context", {
    method: "POST",
    body: JSON.stringify({ projectPath, threadId })
  });
  return toolResult(
    context,
    "Canvasight graph context: ".concat(context.activePage.name, " (").concat(context.nodes.length, " nodes, revision ").concat(context.documentRevision, ")")
  );
}
async function toolWriteCanvasightGraph(args) {
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  const projectPath = await resolveSessionProjectPath(args?.projectPath, threadId, { requireThreadProject: Boolean(threadId) });
  const daemon = await ensureDaemonServer();
  const result = await daemonJson(daemon, "/api/graphs/write", {
    method: "POST",
    body: JSON.stringify({
      projectPath,
      args: {
        ...args || {},
        projectPath
      }
    })
  });
  if (result?.status === "validation_failed") {
    return toolResult(
      {
        ...result,
        projectPath,
        scatterPath: scatterPath(projectPath),
        mode: normalizeGraphWriteMode(args?.mode),
        graphType: normalizeGraphType(args?.graphType)
      },
      "Canvasight candidate was not written. Repair the returned validation violations and retry against the latest document revision."
    );
  }
  const { document: document2, documentRevision, documentVersion, reusedTemplates, projectGuidanceNodes, mutationSummary, validation, written } = result;
  const activePage = document2.pages.find((page) => page.id === document2.activePageId) || document2.pages[0];
  const nodeIds = activePage.nodes.map((node) => node.id);
  const edgeIds = activePage.edges.map((edge) => edge.id);
  const graphType = normalizeGraphType(args?.graphType);
  const summary = [
    "Canvasight graph written: ".concat(scatterPath(projectPath)),
    "Graph type: ".concat(graphType),
    "Target page: ".concat(result.targetPageId || activePage.id),
    "Nodes: ".concat(nodeIds.length),
    "Edges: ".concat(edgeIds.length),
    "Templates reused: ".concat(reusedTemplates.length),
    "Project guidance nodes: ".concat(projectGuidanceNodes.length)
  ].join("\n");
  return toolResult(
    {
      status: result.status,
      written: written === true,
      projectPath,
      scatterPath: scatterPath(projectPath),
      mode: normalizeGraphWriteMode(args?.mode),
      graphType,
      activePageId: activePage.id,
      activePageName: activePage.name,
      documentRevision,
      documentVersion,
      targetPageId: result.targetPageId || activePage.id,
      rebasedFromRevision: result.rebasedFromRevision ?? null,
      idMappings: result.idMappings || { nodeIds: {}, edgeIds: {} },
      conflictCopies: result.conflictCopies || [],
      nodeIds,
      edgeIds,
      reusedTemplates,
      projectGuidanceNodes,
      mutationSummary,
      validation,
      document: document2
    },
    summary
  );
}
async function toolAwaitCanvasightRun(args) {
  const sessionIdValue = typeof args?.sessionId === "string" && args.sessionId ? args.sessionId : "";
  let projectPathValue = optionalProjectPath(args?.projectPath);
  const threadId = optionalThreadId(args?.threadId) || optionalThreadId(process.env.CODEX_THREAD_ID);
  if (!sessionIdValue && !projectPathValue) {
    projectPathValue = await resolveSessionProjectPath(null, threadId, { requireThreadProject: Boolean(threadId) });
  }
  const daemon = await ensureDaemonServer();
  const run = await daemonJson(daemon, "/api/runs/await", {
    method: "POST",
    body: JSON.stringify({
      sessionId: sessionIdValue,
      timeoutMs: args.timeoutMs,
      projectPath: projectPathValue,
      threadId
    })
  });
  if (run.status === "received" && !codexNativeModeApplied(run.codexNative?.status)) {
    run.codexNative = await applyCodexNativeMode(
      {
        codexThreadId: threadId
      },
      run
    );
  }
  const text = run.status === "received" ? run.markdown : "Canvasight run status: ".concat(run.status);
  return toolResult(run, text);
}
async function toolAwaitCanvasightWidgetReady(args) {
  const sessionIdValue = typeof args?.sessionId === "string" ? args.sessionId.trim() : "";
  if (!sessionIdValue) throw new Error("sessionId is required");
  const openAttemptIdValue = typeof args?.openAttemptId === "string" ? args.openAttemptId.trim() : "";
  if (!openAttemptIdValue) throw new Error("openAttemptId is required");
  const threadId = optionalThreadId(args?.threadId);
  if (!threadId) throw new Error("threadId is required");
  const daemon = await ensureDaemonServer();
  const result = await daemonJson(daemon, "/api/widget-ready/await", {
    method: "POST",
    body: JSON.stringify({
      sessionId: sessionIdValue,
      openAttemptId: openAttemptIdValue,
      threadId,
      widgetInstanceId: args?.widgetInstanceId,
      timeoutMs: args?.timeoutMs
    })
  });
  const text = result.status === "ready" ? "Canvasight widget ready: ".concat(result.sessionId) : "Canvasight widget ".concat(result.status, ": ").concat(result.error || result.stage || "unknown");
  return toolResult(result, text);
}
function widgetApiRoute(pathValue) {
  if (typeof pathValue !== "string" || !pathValue.startsWith("/api/")) {
    throw new Error("Canvasight widget API path must start with /api/.");
  }
  const parsed = new URL(pathValue, "http://canvasight.local");
  if (parsed.origin !== "http://canvasight.local" || parsed.hash || parsed.pathname.includes("..")) {
    throw new Error("Canvasight widget API path is invalid.");
  }
  const allowed = /^\/api\/sessions(?:\/|$)/.test(parsed.pathname) || /^\/api\/templates(?:\/|$)/.test(parsed.pathname) || parsed.pathname === "/api/skills" || parsed.pathname === "/api/preferences" || parsed.pathname === "/api/reveal";
  if (!allowed) throw new Error("Canvasight widget API path is not allowed.");
  if (parsed.search) {
    if (parsed.pathname !== "/api/skills") throw new Error("Canvasight widget API query parameters are not allowed for this path.");
    const allowedSkillQueryKeys = /* @__PURE__ */ new Set(["projectPath", "threadId", "query", "forceReload", "limit"]);
    for (const key of parsed.searchParams.keys()) {
      if (!allowedSkillQueryKeys.has(key) || parsed.searchParams.getAll(key).length !== 1) {
        throw new Error("Canvasight widget Skill API query parameters are invalid.");
      }
    }
  }
  return "".concat(parsed.pathname).concat(parsed.search);
}
async function toolCanvasightWidgetApi(args) {
  const route = widgetApiRoute(args?.path);
  const method = typeof args?.method === "string" ? args.method.toUpperCase() : "GET";
  if (!(/* @__PURE__ */ new Set(["GET", "POST", "PUT", "DELETE"])).has(method)) {
    throw new Error("Canvasight widget API method is not allowed: ".concat(method));
  }
  const openAttemptIdValue = typeof args?.openAttemptId === "string" ? args.openAttemptId.trim() : "";
  const widgetInstanceId = typeof args?.widgetInstanceId === "string" ? args.widgetInstanceId.trim() : "";
  const startupStage = normalizeStartupStage(args?.startupStage);
  if (!openAttemptIdValue || !widgetInstanceId) throw new Error("Canvasight widget API requires openAttemptId and widgetInstanceId.");
  const daemon = await ensureDaemonServer();
  const response = await fetch(new URL(route, daemon.origin), {
    method,
    headers: daemonHeaders(daemon, {
      ...args?.body === null || args?.body === void 0 ? {} : { "content-type": "application/json" },
      "x-canvasight-open-attempt-id": openAttemptIdValue,
      "x-canvasight-widget-instance-id": widgetInstanceId,
      "x-canvasight-startup-stage": startupStage,
      "x-canvasight-display-mode": typeof args?.displayMode === "string" ? args.displayMode : "unknown",
      "x-canvasight-thread-id": typeof args?.threadId === "string" ? args.threadId : "",
      "x-canvasight-react-mounted": args?.reactMounted === true ? "true" : "false"
    }),
    ...args?.body === null || args?.body === void 0 ? {} : { body: JSON.stringify(args.body) }
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text || null;
  }
  const error51 = response.ok ? null : payload && typeof payload === "object" && typeof payload.error === "string" ? payload.error : text || "Canvasight daemon request failed: ".concat(response.status);
  const code = payload && typeof payload === "object" && typeof payload.code === "string" ? payload.code : null;
  return toolResult(
    {
      ok: response.ok,
      status: response.status,
      data: response.ok ? payload : null,
      error: error51,
      code
    },
    response.ok ? "Canvasight widget API request completed." : error51
  );
}
async function toolCloseCanvasight(args) {
  if (typeof args?.sessionId !== "string" || !args.sessionId) {
    throw new Error("sessionId is required");
  }
  const daemon = await ensureDaemonServer();
  const closed = await daemonJson(daemon, "/api/sessions/".concat(encodeURIComponent(args.sessionId), "/close"), {
    method: "POST",
    body: JSON.stringify({})
  }).catch((error51) => {
    if (String(error51?.message || "").includes("Session not found")) {
      return {
        status: "closed",
        sessionId: args.sessionId,
        existed: false
      };
    }
    throw error51;
  });
  return toolResult(
    {
      status: "closed",
      sessionId: args.sessionId,
      existed: Boolean(closed.existed)
    },
    closed.existed ? "Canvasight session closed: ".concat(args.sessionId) : "Canvasight session already closed: ".concat(args.sessionId)
  );
}
var tools = [
  {
    name: "render_canvasight_canvas_widget",
    description: "Open Canvasight as a native Codex widget for the active project. Pass the active task's CODEX_THREAD_ID as threadId so Chat Run targets the same thread. Prefer this over localhost browser URLs for normal use because the widget has the Codex host bridge and Run buttons can send follow-up messages to the current thread.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional local project path to associate with the widget session."
        },
        language: {
          type: "string",
          enum: ["zh", "en"],
          description: "Optional UI and markdown language preference."
        },
        threadId: {
          type: "string",
          description: "Current Codex thread id. Read CODEX_THREAD_ID in the active task and pass it so native mode preflight targets the same thread."
        }
      },
      required: ["threadId"],
      additionalProperties: false
    },
    outputSchema: openCanvasightWidgetOutputSchema,
    _meta: {
      ui: {
        resourceUri: CANVASIGHT_WIDGET_URI,
        visibility: ["model", "app"]
      },
      "openai/toolInvocation/invoking": "Opening Canvasight widget...",
      "openai/toolInvocation/invoked": "Canvasight widget session created"
    }
  },
  {
    name: "open_canvasight",
    description: "Open Canvasight as the default native Codex widget for the active project. Pass the active task's CODEX_THREAD_ID as threadId so Chat Run targets the same thread. This is the normal path: the widget has the Codex host bridge, so Run buttons can send follow-up messages to the current thread.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional local project path to associate with the session."
        },
        language: {
          type: "string",
          enum: ["zh", "en"],
          description: "Optional UI and markdown language preference."
        },
        threadId: {
          type: "string",
          description: "Current Codex thread id. Read CODEX_THREAD_ID in the active task and pass it for native Chat Run."
        }
      },
      required: ["threadId"],
      additionalProperties: false
    },
    outputSchema: openCanvasightWidgetOutputSchema,
    _meta: {
      ui: {
        resourceUri: CANVASIGHT_WIDGET_URI,
        visibility: ["model", "app"]
      },
      "openai/toolInvocation/invoking": "Opening Canvasight widget...",
      "openai/toolInvocation/invoked": "Canvasight widget session created"
    }
  },
  {
    name: "open_canvasight_browser_fallback",
    description: "Open a Canvasight browser fallback URL in Codex's in-app browser/sidebar. Use only for debugging or when native widget rendering is unavailable; browser fallback pages queue Run payloads for await_canvasight_run instead of direct widget delivery.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional local project path to associate with the browser fallback session."
        },
        language: {
          type: "string",
          enum: ["zh", "en"],
          description: "Optional UI and markdown language preference."
        },
        threadId: {
          type: "string",
          description: "Optional Codex thread id for fallback queue filtering. Defaults to CODEX_THREAD_ID when available."
        }
      },
      additionalProperties: false
    },
    outputSchema: openCanvasightBrowserFallbackOutputSchema
  },
  {
    name: "list_canvasight_recent_projects",
    description: "List Canvasight projects remembered across Codex threads.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          minimum: 1,
          maximum: 50,
          description: "Maximum number of recent projects to return."
        }
      },
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "open_canvasight_recent_project",
    description: "Open the most recent remembered Canvasight project, or a chosen recent project path/index, as the default native Codex widget. Pass the active task's CODEX_THREAD_ID as threadId so Chat Run targets the same thread. The opened project becomes active Canvasight context for later graph-first handling of medium or complex requests.",
    inputSchema: {
      type: "object",
      properties: {
        index: {
          type: "number",
          minimum: 1,
          description: "1-based recent project index. Defaults to the most recent project."
        },
        projectPath: {
          type: "string",
          description: "Optional explicit project path. When provided, it is opened and remembered."
        },
        language: {
          type: "string",
          enum: ["zh", "en"],
          description: "Optional UI and markdown language preference."
        },
        threadId: {
          type: "string",
          description: "Current Codex thread id. Read CODEX_THREAD_ID in the active task and pass it for native Chat Run."
        }
      },
      required: ["threadId"],
      additionalProperties: false
    },
    outputSchema: openCanvasightWidgetOutputSchema,
    _meta: {
      ui: {
        resourceUri: CANVASIGHT_WIDGET_URI,
        visibility: ["model", "app"]
      },
      "openai/toolInvocation/invoking": "Opening Canvasight widget...",
      "openai/toolInvocation/invoked": "Canvasight widget session created"
    }
  },
  {
    name: "claim_canvasight_thread",
    description: "Claim an already-open Canvasight project or session for the current Codex thread without opening a new browser tab. Use this from a new thread when a Canvasight browser/daemon is already running and future Run clicks should go to this current thread.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional project path to claim. Defaults to the most recent Canvasight project when sessionId is omitted."
        },
        sessionId: {
          type: "string",
          description: "Optional existing Canvasight session id to claim. When omitted, Canvasight claims active sessions for the project."
        },
        language: {
          type: "string",
          enum: ["zh", "en"],
          description: "Optional UI and markdown language preference for a session created during claim."
        },
        threadId: {
          type: "string",
          description: "Optional current Codex thread id. Defaults to CODEX_THREAD_ID when available."
        }
      },
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "list_canvasight_node_templates",
    description: "List lightweight summaries of saved global Canvasight node templates so AI graph generation can choose reusable prompts without loading full template bodies.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Optional search text matched against template title and body."
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 200,
          description: "Maximum number of templates to return. Defaults to 20."
        }
      },
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "list_canvasight_skills",
    description: "List lightweight summaries of enabled Codex Skills resolved for the current project. Query by a canvas or node responsibility before choosing professional content Skills or assigning an AI-selected node Skill. Results never include Skill bodies or local paths.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional project cwd used by Codex Skill resolution. Defaults to the current Canvasight project."
        },
        threadId: {
          type: "string",
          description: "Optional current Codex thread id used to resolve its project cwd."
        },
        query: {
          type: "string",
          description: "Optional canvas or node responsibility matched against Skill name, display name, description, and scope."
        },
        forceReload: {
          type: "boolean",
          description: "Ask Codex to refresh its resolved Skill catalog before searching."
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 200,
          description: "Maximum Skill summaries to return. Defaults to 50."
        }
      },
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "get_canvasight_node_template",
    description: "Read one saved global Canvasight node template by id, including full prompt body and attachment metadata, after list_canvasight_node_templates identifies a useful match.",
    inputSchema: {
      type: "object",
      properties: {
        templateId: {
          type: "string",
          description: "Template id returned by list_canvasight_node_templates."
        }
      },
      required: ["templateId"],
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "get_canvasight_graph_context",
    description: "Read the active Canvasight page and current document revision before deciding whether to append, replace, or incrementally edit the graph. Use the returned ids and revision for merge-active-page operations.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Optional local project path. Defaults to the current Canvasight project."
        },
        threadId: {
          type: "string",
          description: "Optional current Codex thread id used to resolve its project."
        }
      },
      additionalProperties: false
    },
    outputSchema: canvasightGraphContextOutputSchema
  },
  {
    name: "write_canvasight_graph",
    description: "Write pages, task nodes, and edges into a project's .scatter/scatter.json so Codex or another AI can create an editable Canvasight graph. Prefer this when Canvasight is active and a later user request is medium, complex, multi-step, architectural, product-planning, article-mapping, or otherwise benefits from decomposition before direct execution. Can reuse saved global node templates through templateId or templateQuery.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Local project path. Defaults to Canvasight's default project path when omitted."
        },
        projectName: {
          type: "string",
          description: "Optional project name stored in .scatter/scatter.json."
        },
        mode: {
          type: "string",
          enum: ["append-page", "merge-active-page", "replace-active-page", "replace-document"],
          description: "Write behavior. Use merge-active-page with expectedRevision and operations to preserve and edit the active page."
        },
        expectedRevision: {
          type: "integer",
          description: "Exact revision returned with contextId. Legacy calls without contextId remain strict stale-write checked."
        },
        contextId: {
          type: "string",
          description: "Context id returned by get_canvasight_graph_context. Binds merge-active-page to that Page and enables safe automatic rebase."
        },
        clientMutationId: {
          type: "string",
          description: "Stable unique id for this exact context-bound graph mutation. Reuse it only when retrying the same payload."
        },
        graphType: {
          type: "string",
          enum: ["software-product", "article-outline", "codebase-structure", "task-plan", "general"],
          description: "Task generation strategy metadata. It affects how AI should organize nodes and default layout, but does not decide page creation or replacement."
        },
        pageId: {
          type: "string",
          description: "Optional id for the single page form."
        },
        pageName: {
          type: "string",
          description: "Optional name for the single page form."
        },
        activePageId: {
          type: "string",
          description: "Active page id when mode is replace-document."
        },
        layout: {
          type: "string",
          enum: ["horizontal"],
          description: "Horizontal dependency layout for AI writes. Legacy vertical and grid requests are accepted at runtime, normalized to horizontal, and reported as deprecated advisories."
        },
        layoutPolicy: {
          type: "string",
          enum: ["auto", "preserve-explicit"],
          description: "Coordinate policy for AI writes. auto is the default and recomputes the whole graph from topology; preserve-explicit keeps caller-provided axes for compatibility."
        },
        viewport: {
          type: "object",
          description: "Optional viewport for generated pages.",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            zoom: { type: "number" }
          },
          additionalProperties: true
        },
        reuseTemplates: {
          type: "boolean",
          description: "Whether to allow saved global node templates to be reused. Defaults to true."
        },
        operations: {
          type: "array",
          description: "Explicit incremental operations for merge-active-page: add/update/remove-node, add/update/remove-edge, and relayout-page.",
          items: {
            type: "object",
            properties: {
              op: {
                type: "string",
                enum: ["add-node", "update-node", "remove-node", "add-edge", "update-edge", "remove-edge", "relayout-page"]
              },
              node: { type: "object", additionalProperties: true },
              nodeId: { type: "string" },
              edge: { type: "object", additionalProperties: true },
              edgeId: { type: "string" },
              changes: { type: "object", additionalProperties: true }
            },
            required: ["op"],
            additionalProperties: false
          }
        },
        frameworkManifest: {
          type: "object",
          description: "Non-persisted framework, professional content Skill selection, node Skill assignment, and final-page coverage used for closed-loop validation before Canvasight performs the only graph write.",
          properties: {
            intent: { type: "string", enum: ["create", "analyze", "organize", "refine", "decide", "execute"] },
            primaryDomain: { type: "string", enum: ["software-product", "ux-design", "codebase", "article", "research", "task-execution"] },
            secondaryDomains: {
              type: "array",
              items: { type: "string", enum: ["software-product", "ux-design", "codebase", "article", "research", "task-execution"] }
            },
            maturity: { type: "string", enum: ["explore", "define", "decide", "deliver"] },
            output: { type: "string", enum: ["exploration-map", "structured-outline", "system-map", "decision-map", "execution-plan"] },
            contentMode: {
              type: "string",
              enum: ["canvasight-default", "skill-led"],
              description: "Defaults to canvasight-default. skill-led lets one primary professional Skill own content coverage while Canvasight keeps graph validation and horizontal layout."
            },
            contentSkills: {
              type: "array",
              description: "Professional content Skills for the whole canvas. skill-led requires exactly one primary Skill; compatible supporting Skills use augment.",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string", enum: ["primary", "augment"] }
                },
                required: ["name", "role"],
                additionalProperties: false
              }
            },
            skillAssignments: {
              type: "object",
              description: "Non-persisted mapping from final node id to visible $skill-name assignments already present in that node body.",
              additionalProperties: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    source: { type: "string", enum: ["user-explicit", "ai-selected"] },
                    rationale: { type: "string" }
                  },
                  required: ["name", "source"],
                  additionalProperties: false
                }
              }
            },
            coverage: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: { type: "string" },
                minItems: 1
              }
            },
            semanticStructure: {
              type: "object",
              description: "Non-persisted semantic cohesion review keyed by final node id. Use meaning and responsibility, never counts or text length, to decide decomposition.",
              additionalProperties: {
                type: "object",
                properties: {
                  responsibility: { type: "string" },
                  inseparableReason: { type: "string" }
                },
                required: ["responsibility", "inseparableReason"],
                additionalProperties: false
              }
            },
            semanticRelationships: {
              type: "object",
              description: "Semantic review keyed by final edge id for relationships between covered responsibilities.",
              additionalProperties: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["dependency", "sequence", "containment", "evidence", "decision", "navigation", "flow"] },
                  rationale: { type: "string" }
                },
                required: ["type", "rationale"],
                additionalProperties: false
              }
            }
          },
          required: ["intent", "primaryDomain", "maturity", "output", "coverage", "semanticStructure", "semanticRelationships"],
          additionalProperties: false
        },
        nodes: {
          type: "array",
          description: "Single page node list. Each node accepts id, title, body, x/y or position, runMode, effort, attachments, templateId, and templateQuery. Use templateId after calling list_canvasight_node_templates when a saved template should provide title, body, and attachments.",
          items: { type: "object", additionalProperties: true }
        },
        edges: {
          type: "array",
          description: "Single page edge list. source and target must reference node ids.",
          items: { type: "object", additionalProperties: true }
        },
        pages: {
          type: "array",
          description: "Optional multi-page graph input. When provided, top-level nodes/edges are ignored.",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              layout: { type: "string", enum: ["horizontal"] },
              viewport: { type: "object", additionalProperties: true },
              nodes: { type: "array", items: { type: "object", additionalProperties: true } },
              edges: { type: "array", items: { type: "object", additionalProperties: true } }
            },
            additionalProperties: true
          }
        }
      },
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "canvasight_widget_api",
    description: "Internal app-only proxy for Canvasight native widget session APIs. The widget uses this instead of fetching localhost directly.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        method: { type: "string", enum: ["GET", "POST", "DELETE"] },
        body: {},
        openAttemptId: { type: "string" },
        widgetInstanceId: { type: "string" },
        startupStage: { type: "string", enum: ["starting", "connecting_bridge", "connecting_session", "hydrating_project", "ready", "failed"] },
        displayMode: { type: "string", enum: ["inline", "fullscreen", "pip", "unknown"] },
        threadId: { type: "string" },
        reactMounted: { type: "boolean" }
      },
      required: ["path", "method", "openAttemptId", "widgetInstanceId", "startupStage", "displayMode"],
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema,
    _meta: {
      ui: { visibility: ["app"] }
    }
  },
  {
    name: "await_canvasight_widget_ready",
    description: "Wait for the real Canvasight native widget client to mount React, reach its daemon session API, and acknowledge ready. Call this after open_canvasight; only status=ready confirms that the canvas is visibly initialized.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session id returned by open_canvasight."
        },
        openAttemptId: {
          type: "string",
          description: "Open attempt id returned by open_canvasight."
        },
        threadId: {
          type: "string",
          description: "Current Codex task id used to reject readiness from a different task."
        },
        widgetInstanceId: {
          type: "string",
          description: "Optional exact fullscreen widget instance id when the caller already observed it."
        },
        timeoutMs: {
          type: "number",
          minimum: 1,
          maximum: 3e5,
          description: "Maximum wait in milliseconds. Defaults to 30000."
        }
      },
      required: ["sessionId", "openAttemptId", "threadId"],
      additionalProperties: false
    },
    outputSchema: looseObjectOutputSchema
  },
  {
    name: "await_canvasight_run",
    description: "Wait for a browser run payload from a Canvasight session. The current Codex thread receives and applies the run payload.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Optional session id. When omitted, Canvasight waits for the matching project queue."
        },
        projectPath: {
          type: "string",
          description: "Optional project path filter when attaching from another Codex thread. Defaults to the most recent Canvasight project when sessionId is omitted."
        },
        threadId: {
          type: "string",
          description: "Optional current Codex thread id for native Chat Run. Defaults to CODEX_THREAD_ID when available."
        },
        timeoutMs: {
          type: "number",
          minimum: 1
        }
      },
      additionalProperties: false
    },
    outputSchema: canvasightRunOutputSchema
  },
  {
    name: "close_canvasight",
    description: "Close a Canvasight session. This operation is idempotent.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string"
        }
      },
      required: ["sessionId"],
      additionalProperties: false
    }
  }
];
async function callTool(name, args) {
  if (name === "render_canvasight_canvas_widget") return toolRenderCanvasightCanvasWidget(args || {});
  if (name === "open_canvasight") return toolOpenCanvasight(args || {});
  if (name === "open_canvasight_browser_fallback") return toolOpenCanvasightBrowserFallback(args || {});
  if (name === "list_canvasight_recent_projects") return toolListCanvasightRecentProjects(args || {});
  if (name === "open_canvasight_recent_project") return toolOpenCanvasightRecentProject(args || {});
  if (name === "claim_canvasight_thread") return toolClaimCanvasightThread(args || {});
  if (name === "list_canvasight_node_templates") return toolListCanvasightNodeTemplates(args || {});
  if (name === "list_canvasight_skills") return toolListCanvasightSkills(args || {});
  if (name === "get_canvasight_node_template") return toolGetCanvasightNodeTemplate(args || {});
  if (name === "get_canvasight_graph_context") return toolGetCanvasightGraphContext(args || {});
  if (name === "write_canvasight_graph") return toolWriteCanvasightGraph(args || {});
  if (name === "canvasight_widget_api") return toolCanvasightWidgetApi(args || {});
  if (name === "await_canvasight_widget_ready") return toolAwaitCanvasightWidgetReady(args || {});
  if (name === "await_canvasight_run") return toolAwaitCanvasightRun(args || {});
  if (name === "close_canvasight") return toolCloseCanvasight(args || {});
  throw new Error("Unknown tool: ".concat(name));
}
function encodeJsonRpc(message) {
  const body = JSON.stringify(message);
  if (useContentLengthTransport) {
    return "Content-Length: ".concat(Buffer.byteLength(body, "utf8"), "\r\n\r\n").concat(body);
  }
  return "".concat(body, "\n");
}
function writeMessage(message) {
  if (mcpStdoutClosed || process.stdout.destroyed || !process.stdout.writable) return false;
  try {
    process.stdout.write(encodeJsonRpc(message));
    return true;
  } catch (error51) {
    markMcpStdoutClosed(error51);
    return false;
  }
}
function writeResult(id, result) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    result
  });
}
function writeError(id, code, message, data) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...data === void 0 ? {} : { data }
    }
  });
}
async function handleJsonRpc(message) {
  if (Array.isArray(message)) {
    await Promise.all(message.map(handleJsonRpc));
    return;
  }
  if (!isObject2(message)) return;
  const { id, method, params } = message;
  const hasId = Object.prototype.hasOwnProperty.call(message, "id");
  appendMcpLifecycle("request", {
    id: hasId ? id : null,
    method: typeof method === "string" ? method : "",
    toolName: method === "tools/call" ? params?.name || "" : ""
  });
  try {
    if (method === "initialize") {
      if (hasId) {
        writeResult(id, {
          protocolVersion: params?.protocolVersion || DEFAULT_PROTOCOL_VERSION,
          capabilities: {
            tools: {},
            resources: {}
          },
          serverInfo: {
            name: SERVER_NAME,
            version: SERVER_VERSION
          }
        });
      }
      return;
    }
    if (method === "notifications/initialized" || method === "initialized") {
      return;
    }
    if (method === "tools/list") {
      if (hasId) writeResult(id, { tools });
      return;
    }
    if (method === "resources/list") {
      if (hasId) writeResult(id, listCanvasightResources());
      return;
    }
    if (method === "resources/templates/list") {
      if (hasId) writeResult(id, { resourceTemplates: [] });
      return;
    }
    if (method === "resources/read") {
      if (hasId) writeResult(id, await readCanvasightResource(params?.uri));
      return;
    }
    if (method === "tools/call") {
      const name = params?.name;
      const args = params?.arguments || {};
      const result = await callTool(name, args);
      if (hasId) writeResult(id, result);
      return;
    }
    if (method === "ping") {
      if (hasId) writeResult(id, {});
      return;
    }
    if (hasId) writeError(id, -32601, "Method not found: ".concat(method));
  } catch (error51) {
    appendMcpLifecycle("request_error", {
      id: hasId ? id : null,
      method: typeof method === "string" ? method : "",
      toolName: method === "tools/call" ? params?.name || "" : "",
      error: serializeError(error51)
    });
    if (hasId) writeError(id, -32e3, error51?.message || "Tool call failed");
  } finally {
    appendMcpLifecycle("request_complete", {
      id: hasId ? id : null,
      method: typeof method === "string" ? method : "",
      toolName: method === "tools/call" ? params?.name || "" : ""
    });
  }
}
function maybeExitMcpStdio() {
  if (!mcpStdinEnded || mcpInFlight > 0 || isDaemonMode || isStopDaemonMode) return;
  if (mcpExitTimer) return;
  appendMcpLifecycle("stdio_exit_scheduled", { inFlight: mcpInFlight });
  mcpExitTimer = setTimeout(() => {
    appendMcpLifecycle("stdio_exit", { code: mcpExitCode });
    process.exit(mcpExitCode);
  }, 25);
}
function markMcpStdoutClosed(error51) {
  if (mcpStdoutClosed) return;
  mcpStdoutClosed = true;
  appendMcpLifecycle("stdout_closed", { error: serializeError(error51), inFlight: mcpInFlight });
  mcpStdinEnded = true;
  maybeExitMcpStdio();
}
function dispatchJsonRpc(message) {
  mcpInFlight += 1;
  Promise.resolve(handleJsonRpc(message)).catch((error51) => {
    appendMcpLifecycle("dispatch_error", { error: serializeError(error51) });
    try {
      writeError(isObject2(message) && Object.prototype.hasOwnProperty.call(message, "id") ? message.id : null, -32e3, error51?.message || "Tool call failed");
    } catch {
    }
  }).finally(() => {
    mcpInFlight = Math.max(0, mcpInFlight - 1);
    maybeExitMcpStdio();
  });
}
function consumeContentLengthMessage() {
  const headerEnd = inputBuffer.indexOf("\r\n\r\n");
  if (headerEnd < 0) return false;
  const header = inputBuffer.subarray(0, headerEnd).toString("ascii");
  const match = header.match(/content-length:\s*(\d+)/i);
  if (!match) {
    inputBuffer = inputBuffer.subarray(headerEnd + 4);
    return true;
  }
  const length = Number(match[1]);
  const start = headerEnd + 4;
  const end = start + length;
  if (inputBuffer.length < end) return false;
  const body = inputBuffer.subarray(start, end).toString("utf8");
  inputBuffer = inputBuffer.subarray(end);
  dispatchJsonRpc(JSON.parse(body));
  return true;
}
function drainInputBuffer() {
  while (inputBuffer.length) {
    if (/^\s*$/.test(inputBuffer.toString("utf8"))) {
      inputBuffer = Buffer.alloc(0);
      return;
    }
    if (/^content-length:/i.test(inputBuffer.subarray(0, Math.min(inputBuffer.length, 32)).toString("ascii"))) {
      useContentLengthTransport = true;
      if (!consumeContentLengthMessage()) return;
      continue;
    }
    const newline = inputBuffer.indexOf("\n");
    if (newline < 0) return;
    const line = inputBuffer.subarray(0, newline).toString("utf8").trim();
    inputBuffer = inputBuffer.subarray(newline + 1);
    if (!line) continue;
    dispatchJsonRpc(JSON.parse(line));
  }
}
async function runDaemon() {
  if (!daemonAuthToken) daemonAuthToken = crypto.randomBytes(24).toString("base64url");
  daemonStartedAt = nowIso();
  await ensureHttpServer();
}
function runMcpStdio() {
  appendMcpLifecycle("stdio_start", {
    argv: process.argv.slice(2),
    cwd: process.cwd(),
    canvasightHome: canvasightHome(),
    execPath: process.execPath,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    parentPid: process.ppid
  });
  process.stdin.on("data", (chunk) => {
    inputBuffer = Buffer.concat([inputBuffer, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
    try {
      drainInputBuffer();
    } catch (error51) {
      appendMcpLifecycle("parse_error", { error: serializeError(error51) });
      writeError(null, -32700, error51?.message || "Parse error");
      inputBuffer = Buffer.alloc(0);
    }
  });
  process.stdin.on("end", () => {
    mcpStdinEnded = true;
    appendMcpLifecycle("stdin_end", { inFlight: mcpInFlight });
    maybeExitMcpStdio();
  });
  process.stdin.on("error", (error51) => {
    appendMcpLifecycle("stdin_error", { error: serializeError(error51), inFlight: mcpInFlight });
    mcpStdinEnded = true;
    maybeExitMcpStdio();
  });
  process.stdin.resume();
}
async function handleProcessShutdown() {
  appendMcpLifecycle("process_shutdown", {
    isDaemonMode,
    isStopDaemonMode,
    inFlight: mcpInFlight
  });
  if (isDaemonMode) {
    await shutdownDaemon();
  }
}
process.on("SIGTERM", () => {
  appendMcpLifecycle("signal", { signal: "SIGTERM", inFlight: mcpInFlight });
  void handleProcessShutdown().finally(() => process.exit(0));
});
process.on("SIGINT", () => {
  appendMcpLifecycle("signal", { signal: "SIGINT", inFlight: mcpInFlight });
  void handleProcessShutdown().finally(() => process.exit(0));
});
process.on("uncaughtException", (error51) => {
  appendMcpLifecycle("uncaught_exception", { error: serializeError(error51), inFlight: mcpInFlight });
  if (isDaemonMode || isStopDaemonMode) {
    process.stderr.write("".concat(error51?.message || "Canvasight process failed", "\n"));
    process.exit(1);
    return;
  }
  if (error51?.code === "EPIPE") {
    markMcpStdoutClosed(error51);
    return;
  }
  mcpExitCode = 1;
  mcpStdinEnded = true;
  maybeExitMcpStdio();
});
process.on("unhandledRejection", (reason) => {
  appendMcpLifecycle("unhandled_rejection", { error: serializeError(reason), inFlight: mcpInFlight });
  if (!isDaemonMode && !isStopDaemonMode) {
    mcpExitCode = 1;
    mcpStdinEnded = true;
    maybeExitMcpStdio();
  }
});
process.stdout.on("error", (error51) => {
  markMcpStdoutClosed(error51);
});
process.on("exit", (code) => {
  appendMcpLifecycle("process_exit", {
    code,
    isDaemonMode,
    isStopDaemonMode,
    inFlight: mcpInFlight
  });
});
if (isStopDaemonMode) {
  stopDaemonFromState().then((stopped) => {
    process.stdout.write("".concat(stopped ? "Canvasight daemon stop requested" : "Canvasight daemon was not running", "\n"));
  }).catch((error51) => {
    process.stderr.write("".concat(error51?.message || "Failed to stop Canvasight daemon", "\n"));
    process.exitCode = 1;
  });
} else if (isDaemonMode) {
  runDaemon().catch((error51) => {
    process.stderr.write("".concat(error51?.message || "Canvasight daemon failed", "\n"));
    process.exitCode = 1;
  });
} else {
  runMcpStdio();
}
