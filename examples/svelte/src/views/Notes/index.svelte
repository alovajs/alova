<script>
  import { equals, filterSilentMethods, updateStateEffect, useSQRequest } from 'alova/client';
  import { editNote, queryNotes, removeNote } from '../../api/methods';
  import QueueConsole from '../../components/QueueConsole.svelte';
  import Editor from './Editor';

  // The `bootSilentFactory` has been called in `main.js`
  const queue = 'note';
  let networkMode = 0;
  let editorVisible = false;
  let selectedId;

  const {
    data: noteList,
    loading,
    send: refreshNoteList
  } = useSQRequest(queryNotes, {
    behavior: () => (networkMode === 0 ? 'queue' : 'static'),
    queue,
    initialData: [],
    force: ({ sendArgs: [isForce] }) => !!isForce
  }).onSuccess(({ data: noteListRaw }) => {
    filterSilentMethods(undefined, queue).then(noteSilentMethods => {
      console.log(noteSilentMethods);
      if (noteSilentMethods.length <= 0) {
        return;
      }

      noteSilentMethods.forEach(smItem => {
        if (!smItem.reviewData) {
          return;
        }
        const { operate, data } = smItem.reviewData;
        const index = noteListRaw.findIndex(({ id }) => equals(id, data.id));
        if ((operate === 'edit' || operate === 'remove') && index >= 0) {
          operate === 'edit' ? noteListRaw.splice(index, 1, data) : noteListRaw.splice(index, 1);
        } else if (operate === 'add' && index < 0) {
          noteListRaw.unshift(data);
        }
      });
      updateStateEffect(queryNotes(), () => noteListRaw);
    });
  });

  const { loading: removing, send: removeSend } = useSQRequest(id => removeNote(id), {
    behavior: () => (networkMode === 0 ? 'silent' : 'static'),
    queue,
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: {
      delay: 2000,
      multiplier: 1.5,
      endQuiver: 0.5
    },
    immediate: false
  }).onSuccess(({ silentMethod, sendArgs: [removedId] }) => {
    updateStateEffect(queryNotes(), noteList => {
      const index = noteList.findIndex(({ id }) => id === removedId);
      if (index >= 0) {
        noteList.splice(index, 1);
      }
      return noteList;
    });

    if (silentMethod) {
      silentMethod.reviewData = {
        operate: 'remove',
        data: {
          id: removedId
        }
      };
      silentMethod.save();
    }
  });

  const { loading: adding, send: createNote } = useSQRequest(() => editNote(''), {
    behavior: () => (networkMode === 0 ? 'silent' : 'static'),
    queue,
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: {
      delay: 2000,
      multiplier: 1.5,
      endQuiver: 0.5
    },
    immediate: false,
    silentDefaultResponse() {
      return {
        id: undefined
      };
    }
  }).onSuccess(({ data, silentMethod }) => {
    const newId = data.id;
    if (newId === null) {
      return;
    }

    const newItem = {
      id: newId,
      content: '',
      updateTime: new Date().toISOString()
    };
    updateStateEffect(queryNotes(), noteList => {
      noteList.unshift(newItem);
      return noteList;
    });

    if (silentMethod) {
      silentMethod.reviewData = {
        operate: 'add',
        data: newItem
      };
      silentMethod.save();
    }
    navigate(newId);
  });

  const handleModalClose = () => {
    editorVisible = false;
    refreshNoteList();
  };

  const navigate = id => {
    selectedId = id;
    editorVisible = true;
  };

  const setNetworkMode = value => {
    networkMode = value;
  };
</script>

<div class="responsive">
  <nord-card>
    <div class="flex flex-row items-center justify-between mb-4">
      <nord-button
        loading={$adding}
        variant="primary"
        on:click={() => createNote()}>
        <nord-icon name="interface-add"></nord-icon>
      </nord-button>
      <nord-button
        loading={$loading}
        on:click={() => refreshNoteList(true)}>
        <nord-icon name="arrow-refresh"></nord-icon>
      </nord-button>
    </div>
    {#if $noteList.length > 0}
      {#each $noteList as { id, content, updateTime } (id)}
        <div
          class="grid gap-y-2 py-4 border-t-[1px] border-slate-200 cursor-pointer hover:bg-slate-50"
          on:click={() => navigate(id)}>
          <div class="flex flex-row items-start justify-between">
            <div color="text.secondary">{updateTime}</div>
            <nord-button
              size="s"
              loading={$removing}
              on:click|stopPropagation={() => removeSend(id)}>
              <nord-icon name="interface-delete"></nord-icon>
            </nord-button>
          </div>
          <div>{@html content}</div>
        </div>
      {/each}
    {:else}
      <div class="py-10 text-2xl font-bold text-center text-gray-400">Empty</div>
    {/if}

    <nord-modal
      open={editorVisible}
      on:close={handleModalClose}>
      <h3 slot="header">{selectedId ? 'Edit Item' : 'Add Item'}</h3>
      {#if editorVisible}
        <Editor
          id={selectedId}
          {queue}
          {networkMode} />
      {/if}
    </nord-modal>
  </nord-card>
  <QueueConsole
    queueName={queue}
    on:modeChange={e => setNetworkMode(e.detail)}></QueueConsole>
</div>
