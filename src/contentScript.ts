console.info('>>> [LineWidget] contentScript.ts SCRIPT HAS BEEN LOADED AND IS EXECUTING <<<');

// import joplin from 'api';
import { lineNumbers  } from "@codemirror/view";
import { EditorView, DecorationSet, Decoration, WidgetType } from "@codemirror/view";
import { StateField, StateEffect  } from "@codemirror/state";
// import {llmReplyStream} from './my_utils';


/*
用法：
await joplin.commands.execute('editor.execCommand', {
    name: 'cm-scrollToCursor' 
});
*/
// context 参数由 Joplin 框架提供，包含了 contentScriptId 等信息
export default (_context: { contentScriptId: string, postMessage: any }) => {
    return {
        // 当 CodeMirror 实例准备好后，此函数会被调用
        plugin: (codeMirrorWrapper: any) => {
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
                console.info("选区信息:", info); // 在控制台打印
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
                const view: EditorView = codeMirrorWrapper.editor;  // CodeMirror6 
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
                const view: EditorView = codeMirrorWrapper.editor;  // CodeMirror6 
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
                const view: EditorView = codeMirrorWrapper.editor;  // CodeMirror6 
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
            // 1. 定义要插入的 Widget 的类
            class LineWidget extends WidgetType {
                // public widgetId:string;
                constructor(readonly element: HTMLElement, readonly widgetId:string) {
                    super();
                    console.info('LineWidget inited')
                    // this.widgetId = widgetId;
                }

                toDOM() {
                    console.info('toDOM called')
                    const wrap = document.createElement("div");
                    wrap.style.display = "block";
                    wrap.appendChild(this.element);
                    return wrap;
                    // 直接返回元素，不要额外包装
                    // return this.element;
                }

                ignoreEvent() {
                    return true;
                }

                // get estimatedHeight() {
                //     return 50; // 提供预估高度
                // }
            }

            // 2. 定义操作（Effects）
            const addLineWidgetEffect = StateEffect.define<{ line: number, element: HTMLElement, widgetId: string }>();
            const updateLineWidgetEffect = StateEffect.define<{ element: HTMLElement, widgetId: string }>();
            const removeLineWidgetEffect = StateEffect.define<{ widgetId: string }>();

            // 3. 创建状态管理器 (StateField)
            const lineWidgetField = StateField.define<DecorationSet>({
                create() {
                    return Decoration.none;
                },
                update(widgets, tr) {
                    widgets = widgets.map(tr.changes);

                    for (const effect of tr.effects) {
                        //
                        // 添加元素
                        if (effect.is(addLineWidgetEffect)) {
                            const { line, element, widgetId } = effect.value;
                            if (line >= 1 && line <= tr.state.doc.lines) {
                                const lineInfo = tr.state.doc.line(line);
                                const widget = Decoration.widget({
                                    widget: new LineWidget(element, widgetId),
                                    block: false,
                                    side: 1,
                                    // spec: { widgetId }
                                });
                                widgets = widgets.update({ add: [widget.range(lineInfo.to)] });
                            }
                        }
                        //
                        // 删除元素
                        else if (effect.is(removeLineWidgetEffect)) {
                            const { widgetId } = effect.value;
                            let posToRemove = -1;

                            widgets.between(0, tr.state.doc.length, (from, to, value) => {
                                // 这里使用类型断言
                                const widgetInstance = (value as any).widget;
                                if (widgetInstance && (widgetInstance as LineWidget).element.dataset.widgetId === widgetId) {
                                    posToRemove = from;
                                    return false;
                                }
                            });

                            if (posToRemove > -1) {
                                widgets = widgets.update({
                                    filter: (from) => from !== posToRemove
                                });
                            }
                        }
                        //
                        else if (effect.is(updateLineWidgetEffect)) {
                            const { element, widgetId } = effect.value;
                            let posOfOldWidget = -1;

                            widgets.between(0, tr.state.doc.length, (from, to, value) => {
                                // 使用 (value as any) 进行类型断言，以访问 .widget 属性
                                const widgetInstance = (value as any).widget;
                                if (widgetInstance && (widgetInstance as LineWidget).element.dataset.widgetId === widgetId) {
                                    posOfOldWidget = from;
                                    return false;
                                }
                            });

                            if (posOfOldWidget > -1) {
                                const newWidget = Decoration.widget({
                                    widget: new LineWidget(element, widgetId),
                                    block: true,
                                    side: 1,
                                });
                                widgets = widgets.update({
                                    filter: (from) => from !== posOfOldWidget,
                                    add: [newWidget.range(posOfOldWidget)]
                                });
                            }
                        }
                    }
                    return widgets;
                },
                provide: f => EditorView.decorations.from(f),
            });

            // 4. 创建辅助函数
            function addLineWidget(line: number, element: HTMLElement, widgetId: string) {
                const view: EditorView = codeMirrorWrapper.editor;  // CodeMirror6 
                view.dispatch({
                    effects: addLineWidgetEffect.of({ line, element, widgetId }),
                });
            }

            function removeLineWidget(widgetId: string) {
                const view: EditorView = codeMirrorWrapper.editor;  // CodeMirror6 
                view.dispatch({
                    effects: removeLineWidgetEffect.of({ widgetId }),
                });
            }
            //
            // 5. 注册命令，供 index.ts 调用
            codeMirrorWrapper.registerCommand("cm-addLineWidget", 
                ({ line, htmlString, widgetId }: { line: number, htmlString: string, widgetId: string }) => {
                console.info('cm-addLineWidget called.')
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlString;
                const element = tempDiv.firstChild as HTMLElement;
                if (element) {
                    element.dataset.widgetId = widgetId;
                    addLineWidget(line, element, widgetId);
                }
                return 'cm-addLineWidget called successfully';
            });

            codeMirrorWrapper.registerCommand("cm-removeLineWidget", ({ widgetId }: { widgetId: string }) => {
                console.info('cm-removeLineWidget called.')
                removeLineWidget(widgetId);
                return 'cm-removeLineWidget called successfully';
            });

            codeMirrorWrapper.registerCommand("cm-updateLineWidget", 
                (payload: { htmlString: string, widgetId: string }) => {
                    const { htmlString, widgetId } = payload;
                    const view: EditorView = codeMirrorWrapper.editor;
                    if (!view) return;

                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlString;
                    const element = tempDiv.firstChild as HTMLElement;

                    if (element) {
                        element.dataset.widgetId = widgetId;
                        view.dispatch({ effects: updateLineWidgetEffect.of({ element, widgetId }) });
                    }
            });

            //
            // 注册为扩展
            codeMirrorWrapper.addExtension(lineWidgetField);
            // codeMirrorWrapper.addExtension(lineNumbers());
            //
            // ================= ================ ==================
            // 测试悬浮物体
            /*
            用法：
            await joplin.commands.execute('editor.execCommand', {
                        name: 'cm-addFloatingObject',
                        args: [{ text: `Hello world` }]
                    });
            await joplin.commands.execute('editor.removeCommand', {
                        name: 'cm-addFloatingObject',
                    });
            */
            //
            const FLOATING_OBJECT_ID = 'notellm-floating-object';
            //
            codeMirrorWrapper.registerCommand("cm-addFloatingObject", 
                (payload: { text: string }) => {
                    const { text } = payload;

                    // 1. 检查悬浮对象是否已存在
                    let floatingEl = document.getElementById(FLOATING_OBJECT_ID);

                    // 2. 如果不存在，则创建它
                    if (!floatingEl) {
                        floatingEl = document.createElement('div');
                        floatingEl.id = FLOATING_OBJECT_ID;
                        
                        // 关键：使用 position: fixed 来实现窗口级悬浮
                        floatingEl.style.position = 'absolute';//'fixed';
                        // floatingEl.style.right = '20%';
                        // floatingEl.style.left = '20%';
                        floatingEl.style.right = '20px';
                        floatingEl.style.bottom = '20px';
                        // floatingEl.style.transform = 'translateX(-50%)';

                        // 设置一个较高的 z-index 确保它在 Joplin 其他 UI 之上
                        floatingEl.style.zIndex = '2048'; 
                        
                        // 添加一些样式让它更显眼
                        floatingEl.style.padding = '10px 15px';
                        floatingEl.style.boxShadow = '2px 2px 5px rgba(0, 0, 0, 0.2)';
                        floatingEl.style.backgroundColor = 'rgba(10, 100, 200, 0.9)';
                        floatingEl.style.color = 'white';
                        floatingEl.style.borderRadius = '8px';
                        floatingEl.style.fontFamily = 'sans-serif';
                        floatingEl.style.fontSize = '14px';
                        
                        // 将其添加到主文档的 body 中，而不是编辑器内部
                        document.body.appendChild(floatingEl);
                    }

                    // 3. 更新其内容
                    floatingEl.textContent = text;
            });

            codeMirrorWrapper.registerCommand("cm-removeFloatingObject", 
                () => {
                    const floatingEl = document.getElementById(FLOATING_OBJECT_ID);
                    if (floatingEl) {
                        floatingEl.remove();
                    }
            });
        },
    };
};