<template>
  <div class="responsive">
    <nord-card>
      <div class="flex flex-row items-center justify-between mb-4">
        <nord-button
          :loading="adding"
          variant="primary"
          @click="createNote()">
          <!-- here mustn't pass event object, otherwise will throw error of maximum call stack -->
          <nord-icon name="interface-add"></nord-icon>
        </nord-button>
        <nord-button
          :loading="loading"
          @click="refreshNoteList(true)">
          <nord-icon name="arrow-refresh"></nord-icon>
        </nord-button>
      </div>
      <template v-if="noteList.length > 0">
        <div
          v-for="{ id, content, updateTime } in noteList"
          :key="id"
          class="grid gap-y-2 py-4 border-t-[1px] border-slate-200 cursor-pointer hover:bg-slate-50"
          @click="navigate(id)">
          <div class="flex flex-row items-start justify-between">
            <div color="text.secondary">{{ updateTime }}</div>
            <nord-button
              size="s"
              :loading="removing"
              @click.stop="removeSend(id)">
              <nord-icon name="interface-delete"></nord-icon>
            </nord-button>
          </div>
          <div v-html="content"></div>
        </div>
      </template>
      <div
        v-else
        class="py-10 text-2xl font-bold text-center text-gray-400">
        Empty
      </div>

      <nord-modal
        :open="editorVisible"
        @close="handleModalClose">
        <h3 slot="header">{{ selectedId ? 'Edit Item' : 'Add Item' }}</h3>
        <Editor
          v-if="editorVisible"
          :id="selectedId"
          :queue="queue"
          :networkMode="networkMode" />
      </nord-modal>
    </nord-card>
    <queue-console
      :queueName="queue"
      @modeChange="setNetworkMode"></queue-console>
  </div>
</template>

<script setup>
import { equals, filterSilentMethods, updateStateEffect, useSQRequest } from 'alova/client';
import { ref } from 'vue';
import { editNote, queryNotes, removeNote } from '../../api/methods';
import QueueConsole from '../../components/QueueConsole';
import Editor from './Editor';

// The `bootSilentFactory` has been called in `main.js`
const queue = 'note';
const networkMode = ref(0);
const editorVisible = ref(false);
const selectedId = ref();
const {
  data: noteList,
  loading,
  send: refreshNoteList
} = useSQRequest(queryNotes, {
  behavior: () => (networkMode.value === 0 ? 'queue' : 'static'),
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
  behavior: () => (networkMode.value === 0 ? 'silent' : 'static'),
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
  // setp1: update list data manually
  updateStateEffect(queryNotes(), noteList => {
    const index = noteList.findIndex(({ id }) => id === removedId);
    if (index >= 0) {
      noteList.splice(index, 1);
    }
    return noteList;
  });

  // step2: save the silent data to keyed `reviewData`, so that the data can be restored when network is restored.
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

// request of new note creation
const { loading: adding, send: createNote } = useSQRequest(() => editNote(''), {
  behavior: () => (networkMode.value === 0 ? 'silent' : 'static'),
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
  // 步骤1：手动更新列表数据
  updateStateEffect(queryNotes(), noteList => {
    noteList.unshift(newItem);
    return noteList;
  });

  // 步骤2：将静默数据存入reviewData中，以便在网络恢复刷新后获取断网时，手动补充到最新记录
  if (silentMethod) {
    // 开辟一个新的队列
    silentMethod.reviewData = {
      operate: 'add',
      data: newItem
    };
    silentMethod.save();
  }
  navigate(newId);
});

const handleModalClose = () => {
  editorVisible.value = false;
  refreshNoteList();
};

const navigate = id => {
  selectedId.value = id;
  editorVisible.value = true;
};

const setNetworkMode = value => {
  networkMode.value = value;
};
</script>
