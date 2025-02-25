import createProxy, { PROXY_KEY } from '../proxy';
import { resetClassProxies } from '../proxy/createClassProxy';
import { isCompositeComponent, isReactClass } from '../internal/reactUtils';
import configuration from '../configuration';
import { incrementHotGeneration } from '../global/generation';

const merge = require('lodash/merge');

let signatures;
let proxiesByID;
let blackListedProxies;
let registeredComponents;
let idsByType;

let elementCount = 0;
let renderOptions = {};

let componentOptions;

const generateTypeId = () => `auto-${elementCount++}`;

export const getIdByType = type => idsByType.get(type);
export const isProxyType = type => type[PROXY_KEY];

export const getProxyById = id => proxiesByID[id];
export const getProxyByType = type => getProxyById(getIdByType(type));

export const registerComponent = type => registeredComponents.set(type, 1);
export const isRegisteredComponent = type => registeredComponents.has(type);

export const setStandInOptions = options => {
  renderOptions = options;
};

export const updateFunctionProxyById = (id, type, updater) => {
  // Remember the ID.
  idsByType.set(type, id);
  const proxy = proxiesByID[id];
  if (!proxy) {
    proxiesByID[id] = type;
  }
  updater(proxiesByID[id], type);
  // proxiesByID[id] = type; // keep the first ref

  return proxiesByID[id];
};

export const updateProxyById = (id, type, options = {}) => {
  if (!id) {
    return null;
  }
  // Remember the ID.
  idsByType.set(type, id);

  if (!proxiesByID[id]) {
    proxiesByID[id] = createProxy(
      type,
      id,
      merge({}, renderOptions, { proxy: componentOptions.get(type) || {} }, options),
    );
  } else {
    proxiesByID[id].update(type);
    // proxy could be registered again only in case of HMR
    incrementHotGeneration();
  }
  return proxiesByID[id];
};

export const createProxyForType = (type, options) =>
  getProxyByType(type) || updateProxyById(generateTypeId(), type, options);

export const isColdType = type => blackListedProxies.has(type);

export const isTypeBlacklisted = type =>
  isColdType(type) ||
  (isCompositeComponent(type) &&
    ((configuration.ignoreSFC && !isReactClass(type)) || (configuration.ignoreComponents && isReactClass(type))));
export const blacklistByType = type => blackListedProxies.set(type, true);

export const setComponentOptions = (component, options) => componentOptions.set(component, options);

export const addSignature = (type, signature) => signatures.set(type, signature);
export const getSignature = type => signatures.get(type);

export const resetProxies = () => {
  proxiesByID = {};
  idsByType = new WeakMap();
  blackListedProxies = new WeakMap();
  registeredComponents = new WeakMap();
  componentOptions = new WeakMap();
  signatures = new WeakMap();
  resetClassProxies();
};

resetProxies();
