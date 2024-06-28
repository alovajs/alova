import { useRequest } from 'alova/client';
import PropTypes from 'prop-types';
import { imagePlain, imageWithControlledCache } from '../api/methods';

function View() {
  return (
    <div className="responsive">
      <Approach id="1"></Approach>
      <Approach id="2"></Approach>
    </div>
  );
}
export default View;

const ApproachMap = {
  1: {
    title: 'Custom `l2Cache` adapter',
    methodHandler: imagePlain
  },
  2: {
    title: 'Controlled cache',
    methodHandler: imageWithControlledCache
  }
};

function Approach({ id }) {
  const imageList = ['1.jpg', '2.jpg'];
  const {
    data,
    loading,
    error,
    send: showImage
  } = useRequest(fileName => ApproachMap[id].methodHandler(fileName), {
    immediate: false
  });

  return (
    <nord-card>
      <h3
        slot="header"
        className="text-xl">
        {ApproachMap[id].title}
      </h3>
      <div className="grid gap-y-2">
        <p>Please select an image</p>
        <nord-button-group>
          {imageList.map(img => (
            <nord-button
              key={img}
              onClick={() => showImage(img)}>
              {img}
            </nord-button>
          ))}
        </nord-button-group>

        {loading ? (
          <nord-spinner size="s" />
        ) : error ? (
          <span>{error.message}</span>
        ) : data ? (
          <img
            src={data}
            alt="Selected"
          />
        ) : null}
      </div>
    </nord-card>
  );
}
Approach.propTypes = {
  id: PropTypes.string.isRequired
};
