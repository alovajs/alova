import { onMounted, onUnmounted, ref } from 'vue';

const useScroll = (offset = 0) => {
  const isBottom = ref(false);
  const handleScroll = e => {
    const target = e.target === document ? e.target.documentElement : e.target;
    const scrollTop = target.scrollTop;
    const windowHeight = target.clientHeight;
    const scrollHeight = target.scrollHeight;
    isBottom.value = scrollTop + windowHeight + offset >= scrollHeight;
  };
  onMounted(() => {
    window.addEventListener('scroll', handleScroll);
  });

  // Call the handleScroll function to set the initial state correctly
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });
  return { isBottom };
};

export default useScroll;
