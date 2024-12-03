import { getData } from '../api';

// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;

/** @type {import('./$types').PageLoad} */
export async function load({ params,  fetch }) {
  // const res = await fetch('https://dummyjson.com/products?limit=10');
  // const { products } = await res.json();
  return {
    ary: getData()
  };
}