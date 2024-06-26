import { useEffect, useRef } from 'react';

export const useEvent = eventObject => {
  const ref = useRef();
  useEffect(() => {
    const { current } = ref;
    for (const eventName in eventObject) {
      current.addEventListener(eventName, eventObject[eventName]);
    }
    return () => {
      for (const eventName in eventObject) {
        current.removeEventListener(eventName, eventObject[eventName]);
      }
    };
  }, []);
  return { ref };
};
