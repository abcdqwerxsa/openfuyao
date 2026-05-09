/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { basicSetup } from 'codemirror';
import { yaml } from '@codemirror/lang-yaml';
import { foldEffect } from '@codemirror/language';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useImperativeHandle,
} from 'openinula';
import '@/styles/components/codeMirrorEditor.less';
import { indentWithTab } from '@codemirror/commands';
import { findManagedFieldsFoldRange } from '@/tools/findManagedFieldsFoldRange';

function dispatchManagedFieldsFold(view, doc) {
  if (!view || doc == null) {
    return;
  }
  const range = findManagedFieldsFoldRange(typeof doc === 'string' ? doc : String(doc));
  if (!range || range.to <= range.from) {
    return;
  }
  queueMicrotask(() => {
    view.dispatch({ effects: foldEffect.of(range) });
  });
}

{
  /** yaml编辑器
  className 绑定类名
  yamlData 传递yaml数据
  changeYaml 编辑时回掉方法
  clearFn 重置回调
  isEdit 是否可编辑
*/
}
const CodeMirrorEditor = forwardRef(
  (
    {
      className = '',
      yamlData = '',
      isEdit = true,
      changeYaml = () => { },
      /** 上游 YAML 整体替换时递增（如 ResourceYaml 中 yamlProps 更新），用于重新折叠 managedFields；编辑过程勿递增 */
      yamlSourceRevision = 0,
    },
    ref,
  ) => {
    useImperativeHandle(ref, () => ({ resetCodeEditor }));
    const editorRef = useRef(null);
    const [viewRef, setViewRef] = useState(null);
    const editorViewInstanceRef = useRef(null);
    const editableCompartmentRef = useRef(new Compartment());
    const yamlDocRef = useRef(yamlData);
    yamlDocRef.current = yamlData;

    // 绘制 codeyaml
    const paintCanvas = useCallback(() => {
      if (!editorRef || !editorRef.current) {
        return;
      }
      // 初始状态
      const codeEditorStartState = EditorState.create({
        doc: yamlData,
        extensions: [
          keymap.of([indentWithTab]),
          basicSetup,
          onUpdate,
          yaml(),
          editableCompartmentRef.current.of(EditorView.editable.of(isEdit ? true : false)),
        ],
      });
      const codeEditorView = new EditorView({
        state: codeEditorStartState,
        parent: editorRef.current,
      });
      editorViewInstanceRef.current = codeEditorView;
      setViewRef(codeEditorView);
      dispatchManagedFieldsFold(codeEditorView, yamlData);
    }, [editorRef]);

    // 更改
    const handleEdit = useCallback(() => {
      if (viewRef) {
        viewRef.dispatch({
          effects: editableCompartmentRef.current.reconfigure(EditorView.editable.of(isEdit ? true : false)),
        });
      }
    }, [isEdit, viewRef]);

    const onUpdate = EditorView.updateListener.of((v) => {
      changeYaml(v.state.toJSON().doc); // 字符串string
    });

    // 重置
    const resetCodeEditor = (doc = '') => {
      if (viewRef) {
        viewRef.setState(
          EditorState.create({
            extensions: [basicSetup, yaml(), onUpdate, keymap.of([indentWithTab])],
            doc,
          })
        );
        dispatchManagedFieldsFold(viewRef, doc);
      }
    };

    useEffect(() => {
      if (!viewRef || yamlSourceRevision < 1) {
        return;
      }
      dispatchManagedFieldsFold(viewRef, yamlDocRef.current);
    }, [yamlSourceRevision, viewRef]);

    useEffect(() => {
      handleEdit();
    }, [handleEdit]);

    useLayoutEffect(() => {
      paintCanvas();
      return () => {
        if (editorViewInstanceRef.current) {
          editorViewInstanceRef.current.destroy();
          editorViewInstanceRef.current = null;
        }
      };
    }, [paintCanvas]);

    return (
      <div
        className={`code_mirror_box ${className}_mirror`}
        ref={editorRef}
      ></div>
    );
  }
);

export default CodeMirrorEditor;
