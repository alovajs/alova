
export default (handler: any, config?: any) => {
  const states = useAsyncData((ctx) => typeof handler === 'function' ? handler(ctx).send() : handler.send());
  return {
    loading: states.pending,
    data: states.data,
    error: states.error,
    send: states.refresh
  }
}