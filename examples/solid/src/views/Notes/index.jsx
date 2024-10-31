import { equals, filterSilentMethods, updateStateEffect, useSQRequest } from 'alova/client';
import { createSignal, For, Show } from 'solid-js';
import { editNote, queryNotes, removeNote } from '../../api/methods';
import QueueConsole from '../../components/QueueConsole';
import Editor from './Editor';

const queue = 'note';
function View() {
  // `bootSilentFactory` is called in `main.js`
  const [networkMode, setNetworkMode] = createSignal(0);
  const [editorVisible, setEditorVisible] = createSignal(false);
  const [selectedId, setSelectedId] = createSignal();

  const {
    data: noteList,
    loading,
    send: refreshNoteList
  } = useSQRequest(queryNotes, {
    behavior: () => (networkMode() === 0 ? 'queue' : 'static'),
    queue,
    initialData: [],
    force: ({ args: [isForce] }) => !!isForce
  }).onSuccess(({ data: noteListRaw }) => {
    filterSilentMethods(undefined, queue).then(noteSilentMethods => {
      if (noteSilentMethods.length <= 0) return;

      noteSilentMethods.forEach(smItem => {
        if (!smItem.reviewData) return;
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
    behavior: () => (networkMode() === 0 ? 'silent' : 'static'),
    queue,
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: { delay: 2000, multiplier: 1.5, endQuiver: 0.5 },
    immediate: false
  }).onSuccess(({ silentMethod, args: [removedId] }) => {
    updateStateEffect(queryNotes(), noteList => {
      const index = noteList.findIndex(({ id }) => id === removedId);
      if (index >= 0) noteList.splice(index, 1);
      return noteList;
    });
    if (silentMethod) {
      silentMethod.reviewData = { operate: 'remove', data: { id: removedId } };
      silentMethod.save();
    }
  });

  const { loading: adding, send: createNote } = useSQRequest(() => editNote(''), {
    behavior: () => (networkMode() === 0 ? 'silent' : 'static'),
    queue,
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: { delay: 2000, multiplier: 1.5, endQuiver: 0.5 },
    immediate: false,
    silentDefaultResponse: () => ({ id: undefined })
  }).onSuccess(({ data, silentMethod }) => {
    const newId = data.id;
    if (newId === null) return;

    const newItem = { id: newId, content: '', updateTime: new Date().toISOString() };
    updateStateEffect(queryNotes(), noteList => {
      noteList.unshift(newItem);
      return noteList;
    });
    if (silentMethod) {
      silentMethod.reviewData = { operate: 'add', data: newItem };
      silentMethod.save();
    }
    navigate(newId);
  });

  const navigate = id => {
    setSelectedId(id);
    setEditorVisible(true);
  };

  return (
    <div class="responsive">
      <nord-card>
        <div class="flex flex-row items-center justify-between mb-4">
          <nord-button
            loading={adding() || undefined}
            variant="primary"
            onClick={() => createNote()}>
            <nord-icon name="interface-add" />
          </nord-button>
          <nord-button
            loading={loading() || undefined}
            onClick={() => refreshNoteList(true)}>
            <nord-icon name="arrow-refresh" />
          </nord-button>
        </div>
        <Show
          when={noteList.length > 0}
          fallback={<div class="py-10 text-2xl font-bold text-center text-gray-400">Empty</div>}>
          <For each={noteList}>
            {props => (
              <div
                class="grid gap-y-2 py-4 border-t-[1px] border-slate-200 cursor-pointer hover:bg-slate-50"
                onClick={() => navigate(props.id)}>
                <div class="flex flex-row items-start justify-between">
                  <div color="text.secondary">{props.updateTime}</div>
                  <nord-button
                    size="s"
                    loading={removing() || undefined}
                    onClick={event => {
                      event.stopPropagation();
                      removeSend(props.id);
                    }}>
                    <nord-icon name="interface-delete" />
                  </nord-button>
                </div>
                {/* eslint-disable-next-line */}
                <div innerHTML={props.content} />
              </div>
            )}
          </For>
        </Show>

        <nord-modal
          open={editorVisible() || undefined}
          onClose={() => {
            refreshNoteList();
            setEditorVisible(false);
          }}>
          <h3 slot="header">{selectedId() ? 'Edit Item' : 'Add Item'}</h3>
          <Show when={editorVisible()}>
            <Editor
              id={selectedId()}
              queue={queue}
              networkMode={networkMode()}
            />
          </Show>
        </nord-modal>
      </nord-card>
      <QueueConsole
        onModeChange={value => setNetworkMode(value)}
        queueName={queue}
      />
    </div>
  );
}

export default View;
