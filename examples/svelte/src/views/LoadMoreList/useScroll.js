import { onDestroy, onMount } from 'svelte';

const useScroll = (offset = 0) => {
  let isBottom = false;
  const handleScroll = e => {
    const target = e.target === document ? e.target.documentElement : e.target;
    const { scrollTop } = target;
    const windowHeight = target.clientHeight;
    const { scrollHeight } = target;
    isBottom = scrollTop + windowHeight + offset >= scrollHeight;
  };
  onMount(() => {
    window.addEventListener('scroll', handleScroll);
  });

  // Call the handleScroll function to set the initial state correctly
  onDestroy(() => {
    window.removeEventListener('scroll', handleScroll);
  });
  return { isBottom };
};

export default useScroll;
