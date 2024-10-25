<template>
  <div>
    <trix-editor
      @trix-change="handleEditorChange"
      ref="editorEl"></trix-editor>
    <nord-spinner
      v-if="editing"
      size="s" />
  </div>
</template>

<script setup>
import { setCache } from 'alova';
import { equals, getSilentMethod, onSilentSubmitSuccess, useSQRequest } from 'alova/client';
import 'trix';
import 'trix/dist/trix.css';
import { onMounted, onUnmounted, ref } from 'vue';
import { editNote, noteDetail, queryNotes } from '../../api/methods';

const props = defineProps({
  id: {
    type: [Number, Object],
    required: true
  },
  networkMode: {
    type: Number,
    required: true
  },
  queue: {
    type: String,
    required: true
  }
});

const methodNoteList = queryNotes();
const currentId = ref(props.id || 0);
onMounted(() => {
  const offEvent = onSilentSubmitSuccess(({ vDataResponse }) => {
    currentId.value = vDataResponse[currentId.value] || currentId.value;
  });
  onUnmounted(() => {
    offEvent();
  });
});

const editorEl = ref();
const { data: detail } = useSQRequest(() => noteDetail(currentId.value), {
  behavior: 'static',
  initialData: {
    content: ''
  }
}).onSuccess(({ data }) => {
  editorEl.value.editor.insertHTML(data.content);
});

const { loading: editing, send: submitNote } = useSQRequest(content => editNote(content, currentId.value), {
  immediate: false,
  behavior: () => (props.networkMode === 0 ? 'silent' : 'static'),
  queue: props.queue,
  retryError: /network error/,
  maxRetryTimes: 5,
  backoff: {
    delay: 2000,
    multiplier: 1.5,
    endQuiver: 0.5
  }
})
  .onBeforePushQueue(async event => {
    const prevSumbmitMethod = await getSilentMethod('methodEditNote' + currentId.value, props.queue);
    if (event.silentMethod && prevSumbmitMethod) {
      await prevSumbmitMethod.replace(event.silentMethod);
      return false;
    }
  })
  .onSuccess(async ({ silentMethod, args: [content] }) => {
    let editingItem = undefined;
    await setCache(methodNoteList, noteList => {
      if (!noteList || !currentId.value) {
        return;
      }

      editingItem = noteList.find(noteItem => equals(noteItem.id, currentId.value));
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

const handleEditorChange = ({ target }) => {
  submitNote(target.value);
  console.log(6667, target.value);
  // update({
  //   data: {
  //     ...detail.value,
  //     content: target.value
  //   }
  // });
};
</script>
