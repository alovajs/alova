import { setCache } from 'alova';
import { equals, getSilentMethod, onSilentSubmitSuccess, useSQRequest } from 'alova/client';
import { onCleanup } from 'solid-js';
import 'trix';
import 'trix/dist/trix.css';
import { editNote, noteDetail, queryNotes } from '../../api/methods';

// Set delay time of silent request in `bootSilentFactory`
const methodNoteList = queryNotes();

function Editor(props) {
  let currentId = props.id || 0;
  let editorEl;

  // Initialize silent submission listener to update `currentId`
  onCleanup(
    onSilentSubmitSuccess(({ vDataResponse }) => {
      currentId = vDataResponse[currentId] || currentId;
    })
  );

  const { data: detail, update } = useSQRequest(() => noteDetail(currentId), {
    behavior: 'static',
    initialData: { content: '' }
  }).onSuccess(({ data }) => {
    editorEl.editor.insertHTML(data.content);
  });

  const { loading: editing, send: submitNote } = useSQRequest(content => editNote(content, currentId), {
    immediate: false,
    behavior: () => (props.networkMode === 0 ? 'silent' : 'static'),
    queue: props.queue,
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: { delay: 2000, multiplier: 1.5, endQuiver: 0.5 }
  })
    .onBeforePushQueue(async event => {
      const prevSubmitMethod = await getSilentMethod('methodEditNote' + currentId, props.queue);
      if (event.silentMethod && prevSubmitMethod) {
        await prevSubmitMethod.replace(event.silentMethod);
        return false;
      }
    })
    .onSuccess(async ({ silentMethod, args: [content] }) => {
      let editingItem;
      await setCache(methodNoteList, noteList => {
        if (!noteList || !currentId) return;
        editingItem = noteList.find(noteItem => equals(noteItem.id, currentId));
        if (editingItem) {
          editingItem.content = content;
          editingItem.updateTime = new Date().toISOString();
        }
        return noteList;
      });

      if (silentMethod && editingItem) {
        silentMethod.reviewData = { operate: 'edit', data: editingItem };
        silentMethod.setUpdateState(methodNoteList);
        silentMethod.save();
      }
    });

  return (
    <div>
      <trix-editor
        ref={editorEl}
        onTrixChange={({ target }) => {
          submitNote(target.value);
          update({ data: { ...detail(), content: target.value } });
        }}
      />
      {editing && <nord-spinner size="s" />}
    </div>
  );
}

export default Editor;
