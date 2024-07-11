import { useState } from 'react';
import BrowserVisibility from './BrowserVisibility';
import Interval from './Interval';
import Network from './Network';
import PageFocus from './PageFocus';

function View() {
  const segmentGroup = {
    Interval: <Interval />,
    Network: <Network />,
    'Browser Visibility': <BrowserVisibility />,
    'Page Focus': <PageFocus />
  };
  const segmentKeys = Object.keys(segmentGroup);
  const [checkedSeg, setCheckedSeg] = useState(segmentKeys[0]);

  return (
    <div className="grid gap-y-4">
      <nord-segmented-control onInput={({ target }) => setCheckedSeg(target.value)}>
        {segmentKeys.map(item => (
          <nord-segmented-control-item
            key={item}
            label={item}
            name="group"
            value={item}
            checked={item === checkedSeg ? true : undefined}
          />
        ))}
      </nord-segmented-control>
      <nord-card>{segmentGroup[checkedSeg]}</nord-card>
    </div>
  );
}

export default View;
