const bridgeObject = JSON.parse as any;
/**
 * Injects a reference object with `JSON.parse` so that it can be accessed in another module.
 * @param object injecting object
 */
export const provideReferingObject = (object: Record<string, any>) => {
  bridgeObject.bridgeData = object;
};

export const injectReferingObject = () => (bridgeObject.bridgeData || {}) as Record<string, any>;
