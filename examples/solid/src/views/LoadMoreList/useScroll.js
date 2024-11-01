import { createSignal, onMount } from 'solid-js';

const useScroll = (offset = 0) => {
  const [isBottom, setIsBottom] = createSignal(false);
  const handleScroll = e => {
    const target = e.target === document ? e.target.documentElement : e.target;
    const scrollTop = target.scrollTop;
    const windowHeight = target.clientHeight;
    const scrollHeight = target.scrollHeight;
    setIsBottom(scrollTop + windowHeight + offset >= scrollHeight);
  };
  onMount(() => {
    window.addEventListener('scroll', handleScroll);

    // Call the handleScroll function to set the initial state correctly
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });
  return { isBottom };
};

export default useScroll;
