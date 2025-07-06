import joplin from 'api';
import { lineNumbers  } from "@codemirror/view";
import { EditorView, DecorationSet, Decoration, WidgetType } from "@codemirror/view";
import { StateField, StateEffect  } from "@codemirror/state";
import {llmReplyStream} from './my_utils';

/*
用法：
await joplin.commands.execute('editor.execCommand', {
    name: 'cm-scrollToCursor' 
});
*/

export default (_context: { contentScriptId: string, postMessage: any }) => {
    return {
        plugin: (codeMirrorWrapper: any) => {
            const view: EditorView = codeMirrorWrapper.editor;  // CodeMirror6 
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
            codeMirrorWrapper.registerCommand("cm-getSelectionInfo", () => {
                const info = getSelectionInfo();
                console.log("选区信息:", info); // 在控制台打印
                return info; // 返回数据
            });

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
            codeMirrorWrapper.registerCommand("cm-scrollToCursor", () => {
                scrollToCursor();
            });
            
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
            codeMirrorWrapper.registerCommand("cm-moveCursorToSelectionEnd", () => {
                moveCursorToSelectionEnd();
            });

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
            codeMirrorWrapper.registerCommand("cm-replaceRange", (fromPos:number, toPos:number, newStr:string) => {
                replaceRange(fromPos, toPos, newStr);
            });

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
            codeMirrorWrapper.registerCommand("cm-moveCursorPosition", (position) => {
                moveCursorPosition(position);
            });

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
            codeMirrorWrapper.registerCommand("cm-getCursorPos", () => {
                let cursor_pos = getCursorPos();
                return cursor_pos;
            });

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
            codeMirrorWrapper.registerCommand("cm-myInsertText", (inp_str:string) => {
                myInsertText(inp_str);
            });
            //
            // ====== TEST ===== ======== =========== === ========= ======== 
            //            
            /**
             * 悬浮控件
             */
            // 1. 创建星星组件
            class StarWidget extends WidgetType {
                toDOM(): HTMLElement {
                    const star = document.createElement("span")
                    star.textContent = "★"
                    star.style.color = "red"
                    return star
                }
            }

            // 2. 定义两个操作：显示星星和隐藏星星
            const showStarEffect = StateEffect.define<number>() // 传入位置
            const hideStarEffect = StateEffect.define<number>() // 传入位置

            // 3. 创建状态管理器
            const starField = StateField.define<DecorationSet>({
                create() {
                    return Decoration.none // 初始状态：没有星星
                },
                
                update(decorations, tr) {
                    // 当文档变化时，更新星星位置
                    decorations = decorations.map(tr.changes)
                    
                    // 处理显示/隐藏操作
                    for (const effect of tr.effects) {
                    if (effect.is(showStarEffect)) {
                        const pos = effect.value
                        // 在指定位置添加星星
                        decorations = decorations.update({
                        add: [Decoration.widget({
                            widget: new StarWidget(),
                            side: 1
                        }).range(pos)]
                        })
                    }
                    
                    if (effect.is(hideStarEffect)) {
                        const pos = effect.value
                        // 移除指定位置的星星
                        decorations = decorations.update({
                        filter: (from, to) => from !== pos
                        })
                    }
                    }
                    
                    return decorations
                },
                
                provide: f => EditorView.decorations.from(f)
            })

            // 4. 导出扩展和操作函数
            const starExtension = starField

            function showStar(view: EditorView, pos: number) {
                view.dispatch({
                    effects: showStarEffect.of(pos)
                })
            }

            function hideStar(view: EditorView, pos: number) {
                view.dispatch({
                    effects: hideStarEffect.of(pos)
                })
            }
            //
            codeMirrorWrapper.registerCommand("cm-myAddDecoration", (pos:number) => {
                const view: EditorView = codeMirrorWrapper.editor;
                showStar(view, pos)
            });
            codeMirrorWrapper.registerCommand("cm-myRemoveDecoration", (pos:number) => {
                const view: EditorView = codeMirrorWrapper.editor;
                hideStar(view, pos)
            });
            //
            //
        },
    };
};