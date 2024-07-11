<script>
  import BrowserVisibility from './BrowserVisibility.svelte';
  import Interval from './Interval.svelte';
  import Network from './Network.svelte';
  import PageFocus from './PageFocus.svelte';

  const segmentGroup = {
    Interval,
    Network,
    'Browser Visibility': BrowserVisibility,
    'Page Focus': PageFocus
  };
  const segmentKeys = Object.keys(segmentGroup);
  let checkedSeg = segmentKeys[0];

  const handleSegmentChange = event => {
    checkedSeg = event.target.value;
  };
</script>

<div class="grid gap-y-4">
  <nord-segmented-control on:input={handleSegmentChange}>
    {#each segmentKeys as item}
      <nord-segmented-control-item
        {item}
        name="group"
        value={item}
        checked={item === checkedSeg ? true : undefined}
        label={item} />
    {/each}
  </nord-segmented-control>
  <nord-card>
    <svelte:component this={segmentGroup[checkedSeg]} />
  </nord-card>
</div>
