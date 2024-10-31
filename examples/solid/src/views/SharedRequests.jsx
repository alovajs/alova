import { useRequest } from 'alova/client';
import { getData } from '../api/methods';

function View() {
  const {
    loading: loading1,
    send: send1,
    data: data1
  } = useRequest(getData, {
    immediate: false,
    force: true
  });

  const {
    loading: loading2,
    send: send2,
    data: data2
  } = useRequest(getData, {
    immediate: false,
    force: true
  });

  const handleSend = () => {
    send1();
    setTimeout(() => {
      send2();
    }, 500);
  };

  return (
    <div class="grid gap-y-2">
      <nord-button onClick={handleSend}>send two request</nord-button>
      <nord-banner variant={loading1() ? 'warning' : 'success'}>
        {loading1() ? 'request1 is loading...' : `response1: ${JSON.stringify(data1())}`}
      </nord-banner>
      <nord-banner variant={loading2() ? 'warning' : 'success'}>
        {loading2() ? 'request2 is loading...' : `response2: ${JSON.stringify(data2())}`}
      </nord-banner>
    </div>
  );
}

export default View;
