<script>
  import { setCache } from 'alova';
  import { equals, getSilentMethod, onSilentSubmitSuccess, useSQRequest } from 'alova/client';
  import { onDestroy, onMount } from 'svelte';
  import 'trix';
  import 'trix/dist/trix.css';
  import { editNote, noteDetail, queryNotes } from '../../api/methods';

  export let id;
  export let networkMode;
  export let queue;

  let editorEl;
  let currentId = id || 0;
  let editing = false;

  const methodNoteList = queryNotes();
  let offEvent;
  onMount(() => {
    offEvent = onSilentSubmitSuccess(({ vDataResponse }) => {
      currentId = vDataResponse[currentId] || currentId;
    });
  });
  onDestroy(() => offEvent());

  const { data: detail } = useSQRequest(() => noteDetail(currentId), {
    behavior: 'static',
    initialData: {
      content: ''
    }
  }).onSuccess(({ data }) => {
    if (editorEl) {
      editorEl.editor.insertHTML(data.content);
    }
  });

  const { loading, send: submitNote } = useSQRequest(content => editNote(content, currentId), {
    immediate: false,
    behavior: () => (networkMode === 0 ? 'silent' : 'static'),
    queue: queue,
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: {
      delay: 2000,
      multiplier: 1.5,
      endQuiver: 0.5
    }
  })
    .onBeforePushQueue(async event => {
      const prevSumbmitMethod = await getSilentMethod('methodEditNote' + currentId, queue);
      if (event.silentMethod && prevSumbmitMethod) {
        await prevSumbmitMethod.replace(event.silentMethod);
        return false;
      }
    })
    .onSuccess(async ({ silentMethod, args: [content] }) => {
      let editingItem = undefined;
      await setCache(methodNoteList, noteList => {
        if (!noteList || !currentId) {
          return;
        }

        editingItem = noteList.find(noteItem => equals(noteItem.id, currentId));
        if (editingItem) {
          editingItem.content = content;
          editingItem.updateTime = new Date().toISOString();
        }
        return noteList;
      });

      if (silentMethod && editingItem) {
        silentMethod.reviewData = {
          operate: 'edit',
          data: editingItem
        };
        silentMethod.setUpdateState(methodNoteList);
        silentMethod.save();
      }
    });

  function handleEditorChange({ target }) {
    submitNote(target.value);
  }
</script>

<div>
  <trix-editor
    on:trix-change={handleEditorChange}
    bind:this={editorEl}></trix-editor>
  {#if editing}
    <nord-spinner size="s" />
  {/if}
</div>
