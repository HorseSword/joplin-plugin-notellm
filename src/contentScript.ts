import joplin from 'api';
import { lineNumbers  } from "@codemirror/view";
import { EditorView } from "@codemirror/view";
import {llmReplyStream} from './my_utils';

export default (_context: { contentScriptId: string, postMessage: any }) => {
    return {
        plugin: (codeMirrorWrapper: any) => {
            const view: EditorView = codeMirrorWrapper.editor;
            //
            /**
             * 获取当前选区信息
             *
             */
            function getSelectionInfo() {
                const editor = codeMirrorWrapper.editor;
                const state = editor.state;
                const selection = state.selection.main; // 获取主选区
                const doc = state.doc;

                // **获取选区的起始 & 结束字符索引**
                const from = selection.from;
                const to = selection.to;

                // **获取对应的行信息**
                const startLine = doc.lineAt(from);
                const endLine = doc.lineAt(to);

                // **计算列号**
                const startCol = from - startLine.from;
                const endCol = to - endLine.from;

                let is_selection_exists = false;
                let selectedText = doc.sliceString(from, to);
                if (!selectedText || selectedText.trim() === '') { // 如果没有选中内容
                    is_selection_exists = false;
                }
                else{
                    is_selection_exists = true;
                }
                // **返回选区信息**
                return {
                    isSelectionExists: is_selection_exists,
                    selectedText: selectedText, // 选中的文本
                    beforeText: doc.sliceString(0, from), // 选区前的文本
                    afterText: doc.sliceString(to), // 选区后的文本
                    startPosition: { line: startLine.number, column: startCol }, // 选区开始位置
                    endPosition: { line: endLine.number, column: endCol } // 选区结束位置
                };
            }
            /**
             * 滚动到光标所在位置
             */
            function scrollToCursor() {
                const shiftLines = -5
                const view: EditorView = codeMirrorWrapper.editor;
                const cursorPos = view.state.selection.main.head; // 获取光标位置
                view.dispatch({
                    effects: EditorView.scrollIntoView(cursorPos+shiftLines, { y: "center" }) // 
                    // end center
                });
            }
            /**
             * 移动光标到选区末尾
             * 
             */
            function moveCursorToSelectionEnd() {
                const state = view.state;
                const selection = state.selection.main;
                view.dispatch({
                    selection: { anchor: selection.to },
                    scrollIntoView: true // 确保光标可见
                });
            }
            /**
             * 修改范围内的内容
             * 
             */
            function replaceRange(fromPos, toPos, newStr='') {
                view.dispatch({
                    changes:{
                        from: fromPos,
                        to: toPos,
                        insert: newStr
                    },
                    // selection: { anchor: fromPos + newStr.length },
                });
            }
            /**
             * 移动光标位置
             * 
             */
            function moveCursorPosition(position) {
                view.dispatch({
                    selection: { anchor: position },
                    scrollIntoView: true // 确保光标可见
                });
            }
            /**
             * 获得当前行
             * 
             */
            function getCursorPos() {
                const editor = codeMirrorWrapper.editor;
                const state = editor.state;
                const selection = state.selection.main; // 获取主选区
                const doc = state.doc;

                // **获取选区的起始 & 结束字符索引**
                const from = selection.from;
                const to = selection.to;

                // **获取对应的行信息**
                const startLine = doc.lineAt(from);
                const endLine = doc.lineAt(to);

                // **计算列号**
                const startCol = from - startLine.from;
                const endCol = to - endLine.from;

                return {
                    startPosition: { line: startLine.number, column: startCol }, // 选区开始位置
                    startLine: startLine,
                    startCol: startCol,
                    endPosition: { line: endLine.number, column: endCol }, // 选区结束位置
                    endLine: endLine,
                    endCol: endCol
                };
            }
            /**
             * 输入文本。
             */
            function myInsertText(inp_str:string){
                const editor = codeMirrorWrapper.editor;
                const state = editor.state;
                const cursorPos = state.selection.main.head;
                editor.dispatch({
                    changes: { from: cursorPos, insert: inp_str } // 在光标位置插入文本
                });
            }
            /**
             * **注册 CodeMirror 命令**
             */
            codeMirrorWrapper.registerCommand("cm-getSelectionInfo", () => {
                const info = getSelectionInfo();
                console.log("选区信息:", info); // 在控制台打印
                return info; // 返回数据
            });
            codeMirrorWrapper.registerCommand("cm-scrollToCursor", () => {
                scrollToCursor();
            });
            codeMirrorWrapper.registerCommand("cm-moveCursorToSelectionEnd", () => {
                moveCursorToSelectionEnd();
            });
            codeMirrorWrapper.registerCommand("cm-moveCursorPosition", (position) => {
                moveCursorPosition(position);
            });
            codeMirrorWrapper.registerCommand("cm-getCursorPos", () => {
                let cursor_pos = getCursorPos();
                return cursor_pos;
            });
            codeMirrorWrapper.registerCommand("cm-myInsertText", (inp_str) => {
                myInsertText(inp_str);
            });
            codeMirrorWrapper.registerCommand("cm-replaceRange", (fromPos,toPos,newStr) => {
                replaceRange(fromPos,toPos,newStr);
            });
        },
    };
};