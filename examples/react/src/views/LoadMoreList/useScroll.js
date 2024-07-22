import { useEffect, useState } from 'react';

const useScroll = (offset = 0) => {
  const [isBottom, setIsBottom] = useState(false);
  useEffect(() => {
    const handleScroll = e => {
      const target = e.target === document ? e.target.documentElement : e.target;
      const scrollTop = target.scrollTop;
      const windowHeight = target.clientHeight;
      const scrollHeight = target.scrollHeight;
      if (scrollTop + windowHeight + offset >= scrollHeight) {
        setIsBottom(true);
      } else {
        setIsBottom(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Call the handleScroll function to set the initial state correctly
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { isBottom };
};

export default useScroll;
