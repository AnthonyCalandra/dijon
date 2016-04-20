import { install } from 'source-map-support';
install();

import 'babel-polyfill';

// Store the class-level and method-level middlewares in a Symbol to prevent
// access from the outside.
const classMiddleware = Symbol('dijon.globalMiddleware');
const methodMiddleware = Symbol('dijon.methodMiddleware');
// Default middleware data structures.
const defaultClassMiddleware = () => new Set();
const defaultMethodMiddleware = () => new Map();
// TODO: need a better way to do this.
/* eslint-disable no-use-before-define */
const EXPORTS = {
  inject,
  frozenInject,
  injector,
  middleware,
};
/* eslint-enable no-use-before-define */

function getName(klass) {
  return klass.name.toString();
}

/* eslint-disable new-cap, no-param-reassign */
function dijon(dependencyName, dependency, args, props = {}) {
  return (target, name, descriptor) => {
    const isMethodTarget = typeof name !== 'undefined';
    const targetName = isMethodTarget ? name : getName(target);
    const instance = props.freeze ? Object.freeze(new dependency(...args)) :
      new dependency(...args);
    if (isMethodTarget) {
      // Bind the dependency name to the injected class method.
      if ('value' in descriptor) {
        const targetMethod = descriptor.value;
        descriptor.value = function value() {
          // The following code would be nice to have due to making a temporary `this`:
          // targetMethod.call(Object.assign({}, { [dependencyName]: instance }, this));
          // However for some reason methods cannot be called. So instead,
          // temporarily set the dependency instance on `this` then remove it manually.
          const ctx = Object.assign(this, { [dependencyName]: instance });
          const ret = targetMethod.call(ctx);
          delete this[dependencyName];
          return ret;
        };
      } else if ('get' in descriptor) {
        const targetMethod = descriptor.get;
        descriptor.get = function get() {
          // See comment about `ctx` above.
          const ctx = Object.assign(this, { [dependencyName]: instance });
          const ret = targetMethod.call(ctx);
          delete this[dependencyName];
          return ret;
        };
      }
    } else {
      // Check for potential name-clashes.
      const prop = target.prototype[dependencyName];
      if (typeof prop !== 'undefined') {
        throw new Error(
          `${dependencyName} method or property already defined on class ${targetName}.`
        );
      }

      // If there's no class-level or method-level middlewares defined yet, do it now.
      target[classMiddleware] = target[classMiddleware] || defaultClassMiddleware();
      // Create a non-writable, non-enumerable, and non-configurable dependency property
      // on the prototype so it's accessible through `this`.
      // FIXME: These class-level dependency properties are interfering with
      // method-level dependencies with the same dependency.
      Object.defineProperty(target.prototype, dependencyName, {
        get() {
          // Iterate through the dependency's class-level middlewares.
          for (const middleware of target[classMiddleware]) {
            if (middleware.dependencyName === dependencyName) {
              middleware.cb(instance);
            }
          }

          return instance;
        },
      });
    }
  };
}
/* eslint-enable new-cap, no-param-reassign */

export function inject(dependencyName, dependency, ...args) {
  return dijon(dependencyName, dependency, args);
}

export function frozenInject(dependencyName, dependency, ...args) {
  return dijon(dependencyName, dependency, args, {
    freeze: true,
  });
}

// FIXME
export function injector(fn) {
  return fn.call(undefined, EXPORTS);
}

/* eslint-disable no-param-reassign */
export function middleware(dependencyName, cb) {
  return (target, name) => {
    // If `name` is defined, it's a method-level middleware. `target` is a method
    // or class object respectively.
    if (name) {
      // If there's no method-level middlewares defined yet, do it now.
      target[methodMiddleware] = target[methodMiddleware] || defaultMethodMiddleware();
      target[methodMiddleware].add({ dependencyName, cb });
    } else {
      // If there's no class-level middlewares defined yet, do it now.
      target[classMiddleware] = target[classMiddleware] || defaultClassMiddleware();
      // Add the dependency and callback that will be used when accessing (get) the dependency.
      target[classMiddleware].add({ dependencyName, cb });
    }
  };
}
/* eslint-enable no-param-reassign */
