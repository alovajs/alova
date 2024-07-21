import { equals, filterSilentMethods, updateStateEffect, useSQRequest } from 'alova/client';
import { useState } from 'react';
import { editNote, queryNotes, removeNote } from '../../api/methods';
import QueueConsole from '../../components/QueueConsole';
import { useEvent } from '../../helper';
import Editor from './Editor';

const queue = 'note';
function View() {
  // The `bootSilentFactory` has been called in `main.js`
  const [networkMode, setNetworkMode] = useState(0);
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedId, setSelectedId] = useState();

  const {
    data: noteList,
    loading,
    send: refreshNoteList
  } = useSQRequest(queryNotes, {
    behavior: () => (networkMode === 0 ? 'queue' : 'static'),
    queue,
    initialData: [],
    force: ({ args: [isForce] }) => !!isForce
  }).onSuccess(({ data: noteListRaw }) => {
    // 步骤3：将未提交的数据手动补充到列表，以便即使数据未提交也能展示最新状态
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
          // 在重新请求并命中缓存时将会有已添加的未提交项，这些需要过滤
          noteListRaw.unshift(data);
        }
      });
      updateStateEffect(queryNotes(), () => noteListRaw);
    });
  });

  // 移除笔记请求定义
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
  }).onSuccess(({ silentMethod, args: [removedId] }) => {
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

  const { ref: modalRef } = useEvent({
    close() {
      setEditorVisible(false);
      refreshNoteList();
    }
  });

  const navigate = id => {
    setSelectedId(id);
    setEditorVisible(true);
  };
  const noteListViews = noteList.map(({ id, content, updateTime }) => (
    <div
      className="grid gap-y-2 py-4 border-t-[1px] border-slate-200 cursor-pointer hover:bg-slate-50"
      key={id}
      onClick={() => navigate(id)}>
      <div className="flex flex-row items-start justify-between">
        <div color="text.secondary">{updateTime}</div>
        <nord-button
          size="s"
          loading={removing || undefined}
          onClick={event => {
            event.stopPropagation();
            removeSend(id);
          }}>
          <nord-icon name="interface-delete"></nord-icon>
        </nord-button>
      </div>
      <div
        className=""
        dangerouslySetInnerHTML={{ __html: content }}></div>
    </div>
  ));

  return (
    <div className="responsive">
      <nord-card>
        <div className="flex flex-row items-center justify-between mb-4">
          <nord-button
            loading={adding || undefined}
            variant="primary"
            // here mustn't pass event object, otherwise will throw error of maximum call stack
            onClick={() => createNote()}>
            <nord-icon name="interface-add"></nord-icon>
          </nord-button>
          <nord-button
            loading={loading || undefined}
            onClick={() => refreshNoteList(true)}>
            <nord-icon name="arrow-refresh"></nord-icon>
          </nord-button>
        </div>
        {noteList.length > 0 ? (
          noteListViews
        ) : (
          <div className="py-10 text-2xl font-bold text-center text-gray-400">Empty</div>
        )}

        <nord-modal
          open={editorVisible || undefined}
          ref={modalRef}>
          <h3 slot="header">{selectedId ? 'Edit Item' : 'Add Item'}</h3>
          {editorVisible ? (
            <Editor
              id={selectedId}
              queue={queue}
              networkMode={networkMode}
            />
          ) : null}
        </nord-modal>
      </nord-card>
      <QueueConsole
        onModeChange={value => setNetworkMode(value)}
        queueName={queue}></QueueConsole>
    </div>
  );
}

export default View;
