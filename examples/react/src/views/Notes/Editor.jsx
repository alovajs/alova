import { setCache } from 'alova';
import { equals, getSilentMethod, onSilentSubmitSuccess, useSQRequest } from 'alova/client';
import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import 'trix';
import 'trix/dist/trix.css';
import { editNote, noteDetail, queryNotes } from '../../api/methods';
import { useEvent } from '../../helper';

// set delay time of silent request in `bootSilentFactory`
const methodNoteList = queryNotes();
function Editor({ networkMode, queue, id }) {
  const currentId = useRef(id || 0);
  useEffect(() => {
    // 当新增时，currentId为虚拟数据，通过监听静默提交来更正此id
    return onSilentSubmitSuccess(({ vDataResponse }) => {
      currentId.current = vDataResponse[currentId.current] || currentId.current;
    });
  }, []);

  // 请求数据
  const { data: detail, update } = useSQRequest(() => noteDetail(currentId.current), {
    behavior: 'static',
    initialData: {
      content: ''
    }
  }).onSuccess(({ data }) => {
    editorEl.current.editor.insertHTML(data.content);
  });

  // 提交编辑的笔记数据
  const { loading: editing, send: submitNote } = useSQRequest(content => editNote(content, currentId.current), {
    immediate: false,
    behavior: () => (networkMode === 0 ? 'silent' : 'static'),
    queue,
    retryError: /network error/,
    maxRetryTimes: 5,
    backoff: {
      delay: 2000,
      multiplier: 1.5,
      endQuiver: 0.5
    }
  })
    .onBeforePushQueue(async event => {
      // 每次替换指定id的旧method，减少请求次数
      const prevSumbmitMethod = await getSilentMethod('methodEditNote' + currentId.current, queue);
      if (event.silentMethod && prevSumbmitMethod) {
        await prevSumbmitMethod.replace(event.silentMethod);
        return false;
      }
    })
    .onSuccess(async ({ silentMethod, args: [content] }) => {
      let editingItem = undefined;
      // 步骤1：手动更新列表数据
      await setCache(methodNoteList, noteList => {
        if (!noteList || !currentId.current) {
          return;
        }

        editingItem = noteList.find(noteItem => equals(noteItem.id, currentId.current));
        if (editingItem) {
          editingItem.content = content;
          editingItem.updateTime = new Date().toISOString();
        }
        return noteList;
      });

      // 步骤2：将静默数据存入reviewData中，以便在网络恢复刷新后获取断网时，手动补充到最新记录
      if (silentMethod && editingItem) {
        silentMethod.reviewData = {
          operate: 'edit',
          data: editingItem
        };
        silentMethod.setUpdateState(methodNoteList);
        silentMethod.save();
      }
    });

  const { ref: editorEl } = useEvent({
    'trix-change'({ target }) {
      submitNote(target.value);
      update({
        data: {
          ...detail,
          content: target.value
        }
      });
    }
  });

  return (
    <div>
      <trix-editor ref={editorEl}></trix-editor>
      {editing ? <nord-spinner size="s" /> : null}
    </div>
  );
}

Editor.propTypes = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object]).isRequired,
  networkMode: PropTypes.number.isRequired,
  queue: PropTypes.string.isRequired
};

export default Editor;
