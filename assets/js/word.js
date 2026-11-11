
        const DEFAULT_MARKDOWN = `# Welcome to Yoph Word

Click anywhere on this document page to edit text directly in your browser, Then print it out!

*Happy Writing!*
`;

        const state = {
            docTitle: 'Untitled Document',
            activeCell: null,
            pendingFileType: null
        };

        let turndownService;
        let activeSelectionRange = null;

        // DOM Elements
        const docTitleInput = document.getElementById('doc-title-input');
        const paperWrapper = document.getElementById('paper-wrapper');
        const modalOverwrite = document.getElementById('modal-overwrite');
        const modalLink = document.getElementById('modal-link');
        const modalTable = document.getElementById('modal-table');
        const fileInput = document.getElementById('file-input');
        const tableToolbar = document.getElementById('table-toolbar');
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-message');

        function showToast(msg) {
            toastMsg.textContent = msg;
            toast.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(() => {
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 3000);
        }

        function setCookie(name, value, days = 365) {
            let expires = "";
            if (days) {
                let date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
        }

        function getCookie(name) {
            let nameEQ = name + "=";
            let ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i].trim();
                if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
            }
            return null;
        }

        function autosave() {
            try {
                const markdownContent = getMarkdownContent();
                const docData = { docTitle: state.docTitle, content: markdownContent };
                setCookie('yoph_word_doc', JSON.stringify(docData), 365);
            } catch (e) {
                console.error("Autosave failed", e);
            }
        }

        function init() {
            if (typeof marked !== 'undefined') {
                marked.setOptions({ gfm: true, breaks: true });
            }
            if (typeof TurndownService !== 'undefined') {
                turndownService = new TurndownService({ headingStyle: 'atx' });
            }

            const savedDoc = getCookie('yoph_word_doc');
            let initialMarkdown = DEFAULT_MARKDOWN;

            if (savedDoc) {
                try {
                    const parsed = JSON.parse(savedDoc);
                    if (parsed && parsed.content) {
                        state.docTitle = parsed.docTitle || 'Untitled Document';
                        initialMarkdown = parsed.content;
                    }
                } catch (e) {
                    console.error("Failed to parse saved session", e);
                }
            }

            if (docTitleInput) {
                docTitleInput.value = state.docTitle;
            }

            loadMarkdownIntoPage(initialMarkdown);
            setupEventListeners();
            updateStats();
        }

        function createPageElement(pageNumber) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'word-page paper-shadow border border-slate-300 flex flex-col justify-between';
            pageDiv.dataset.page = pageNumber;

            const editorDiv = document.createElement('div');
            editorDiv.className = 'page-editor w-full outline-none';
            editorDiv.contentEditable = 'true';
            editorDiv.setAttribute('placeholder', 'Type directly into your document page...');

            const footerDiv = document.createElement('div');
            footerDiv.className = 'h-8 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 select-none pointer-events-none';
            footerDiv.innerHTML = `<span>Page ${pageNumber}</span><span>Yoph Word Document</span>`;

            pageDiv.appendChild(editorDiv);
            pageDiv.appendChild(footerDiv);

            return { pageDiv, editorDiv, footerDiv };
        }

        function loadMarkdownIntoPage(markdown) {
            paperWrapper.innerHTML = '';
            const html = marked.parse(markdown || '');

            const page = createPageElement(1);
            paperWrapper.appendChild(page.pageDiv);
            page.editorDiv.innerHTML = html;

            attachEditorListeners(page.editorDiv);
            repaginate();
        }

        function getSelectionCharacterOffsetWithin(element) {
            let start = 0, end = 0;
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                if (element.contains(range.startContainer)) {
                    const preCaretRange = range.cloneRange();
                    preCaretRange.selectNodeContents(element);
                    preCaretRange.setEnd(range.startContainer, range.startOffset);
                    start = preCaretRange.toString().length;
                    end = start + range.toString().length;
                }
            }
            return { start, end };
        }

        function restoreSelectionCharacterOffsetWithin(element, savedOffset) {
            if (!savedOffset) return;
            const sel = window.getSelection();
            let currentOffset = 0;
            let startNode = null, startNodeOffset = 0;
            let endNode = null, endNodeOffset = 0;

            function traverse(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const len = node.nodeValue.length;
                    if (!startNode && currentOffset + len >= savedOffset.start) {
                        startNode = node;
                        startNodeOffset = savedOffset.start - currentOffset;
                    }
                    if (!endNode && currentOffset + len >= savedOffset.end) {
                        endNode = node;
                        endNodeOffset = savedOffset.end - currentOffset;
                    }
                    currentOffset += len;
                } else {
                    for (let i = 0; i < node.childNodes.length; i++) {
                        traverse(node.childNodes[i]);
                        if (startNode && endNode) break;
                    }
                }
            }

            traverse(element);

            if (startNode && endNode) {
                try {
                    const range = document.createRange();
                    range.setStart(startNode, Math.min(startNodeOffset, startNode.nodeValue.length));
                    range.setEnd(endNode, Math.min(endNodeOffset, endNode.nodeValue.length));
                    sel.removeAllRanges();
                    sel.addRange(range);
                } catch (e) {
                    // Fallback handled safely
                }
            }
        }

        function repaginate() {
            let savedCaretOffset = null;
            const activeEl = document.activeElement;
            if (activeEl && activeEl.classList.contains('page-editor')) {
                savedCaretOffset = getSelectionCharacterOffsetWithin(paperWrapper);
            }

            const pages = Array.from(paperWrapper.querySelectorAll('.word-page'));
            if (pages.length === 0) return;

            let allElements = [];
            pages.forEach(p => {
                const ed = p.querySelector('.page-editor');
                if (ed) {
                    allElements.push(...Array.from(ed.children));
                }
            });

            let currentPageIdx = 0;
            let currentPage = pages[0];
            let currentEditor = currentPage.querySelector('.page-editor');

            pages.forEach((p, idx) => {
                const ed = p.querySelector('.page-editor');
                if (ed) ed.innerHTML = '';
                if (idx > 0) p.remove();
            });

            if (allElements.length === 0) {
                currentEditor.innerHTML = '<p><br></p>';
                updateStats();
                return;
            }

            allElements.forEach(el => {
                currentEditor.appendChild(el);
                if (currentEditor.scrollHeight > currentEditor.clientHeight) {
                    currentEditor.removeChild(el);

                    currentPageIdx++;
                    let nextPage = paperWrapper.querySelectorAll('.word-page')[currentPageIdx];
                    if (!nextPage) {
                        const newPageObj = createPageElement(currentPageIdx + 1);
                        paperWrapper.appendChild(newPageObj.pageDiv);
                        nextPage = newPageObj.pageDiv;
                        attachEditorListeners(newPageObj.editorDiv);
                    }
                    currentEditor = nextPage.querySelector('.page-editor');
                    currentEditor.appendChild(el);
                }
            });

            const firstEditor = paperWrapper.querySelector('.word-page[data-page="1"] .page-editor');
            if (firstEditor && (!firstEditor.children.length || firstEditor.innerHTML.trim() === '')) {
                firstEditor.innerHTML = '<p><br></p>';
            }

            const totalPages = paperWrapper.querySelectorAll('.word-page').length;
            paperWrapper.querySelectorAll('.word-page').forEach((p, idx) => {
                const footerSpan = p.querySelector('div:last-child span:first-child');
                if (footerSpan) footerSpan.textContent = `Page ${idx + 1} of ${totalPages}`;
            });

            updateStats();

            if (savedCaretOffset) {
                restoreSelectionCharacterOffsetWithin(paperWrapper, savedCaretOffset);
            }
        }

        function getMarkdownContent() {
            let fullHtml = '';
            paperWrapper.querySelectorAll('.page-editor').forEach(ed => {
                fullHtml += ed.innerHTML;
            });
            return turndownService ? turndownService.turndown(fullHtml) : fullHtml;
        }

        function updateStats() {
            let totalWords = 0;
            let totalChars = 0;

            paperWrapper.querySelectorAll('.page-editor').forEach(ed => {
                const text = ed.innerText || '';
                const clean = text.trim();
                const words = clean === '' ? 0 : clean.split(/\s+/).length;
                totalWords += words;
                totalChars += text.length;
            });

            const pageCount = paperWrapper.querySelectorAll('.word-page').length;

            document.getElementById('stat-pages').textContent = `Page 1 of ${pageCount}`;
            document.getElementById('stat-words').textContent = `${totalWords} Words`;
            document.getElementById('stat-chars').textContent = `${totalChars} Characters`;
        }

        function saveSelection() {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const parent = range.commonAncestorContainer.nodeType === 3
                    ? range.commonAncestorContainer.parentElement
                    : range.commonAncestorContainer;
                if (parent && parent.closest && parent.closest('.page-editor')) {
                    activeSelectionRange = range.cloneRange();
                }
            }
        }

        function restoreSelection() {
            if (activeSelectionRange) {
                const sel = window.getSelection();
                if (sel) {
                    sel.removeAllRanges();
                    sel.addRange(activeSelectionRange);
                }
            }
        }

        function executeFormat(command, value = null) {
            restoreSelection();
            document.execCommand(command, false, value);
            repaginate();
            autosave();
        }

        function attachEditorListeners(editor) {
            editor.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    const firstPageEditor = paperWrapper.querySelector('.word-page[data-page="1"] .page-editor');
                    if (editor === firstPageEditor) {
                        const offset = getSelectionCharacterOffsetWithin(firstPageEditor);
                        if (offset.start === 0 && offset.end === 0) {
                            e.preventDefault();
                            return;
                        }
                    }
                }
            });

            editor.addEventListener('input', () => {
                // Do not rebuild the editor while the browser is placing the caret.
                // Rebuilding here makes Enter insert a line but leaves the selection behind.
                autosave();
                updateStats();
            });

            editor.addEventListener('keyup', saveSelection);
            editor.addEventListener('blur', repaginate);
            editor.addEventListener('mouseup', saveSelection);
            editor.addEventListener('focus', saveSelection);

            editor.addEventListener('focusin', (e) => checkTableContext(e.target));
            editor.addEventListener('click', (e) => checkTableContext(e.target));
        }

        function checkTableContext(target) {
            if (!target) return;
            const cell = target.closest ? target.closest('td, th') : null;
            if (cell) {
                state.activeCell = cell;
                tableToolbar.classList.remove('hidden');
            } else {
                state.activeCell = null;
                tableToolbar.classList.add('hidden');
            }
        }

        function triggerDownload(filename, content) {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function setupEventListeners() {
            if (docTitleInput) {
                docTitleInput.addEventListener('input', (e) => {
                    state.docTitle = e.target.value;
                    autosave();
                });
            }

            const saveBtn = document.getElementById('btn-save-dropdown');
            const saveMenu = document.getElementById('save-menu');
            const loadBtn = document.getElementById('btn-load-dropdown');
            const loadMenu = document.getElementById('load-menu');

            if (saveBtn && saveMenu) {
                saveBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    saveMenu.classList.toggle('hidden');
                    if (loadMenu) loadMenu.classList.add('hidden');
                });
            }

            if (loadBtn && loadMenu) {
                loadBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loadMenu.classList.toggle('hidden');
                    if (saveMenu) saveMenu.classList.add('hidden');
                });
            }

            document.addEventListener('click', () => {
                if (saveMenu) saveMenu.classList.add('hidden');
                if (loadMenu) loadMenu.classList.add('hidden');
            });

            document.getElementById('btn-save-yoph').addEventListener('click', (e) => {
                e.preventDefault();
                const data = getMarkdownContent();
                const filename = (state.docTitle.trim() || 'Untitled Document') + '.yophdoc';
                triggerDownload(filename, data);
                showToast(`Saved as ${filename}`);
            });

            document.getElementById('btn-save-md').addEventListener('click', (e) => {
                e.preventDefault();
                const data = getMarkdownContent();
                const filename = (state.docTitle.trim() || 'Untitled Document') + '.md';
                triggerDownload(filename, data);
                showToast(`Saved as ${filename}`);
            });

            document.getElementById('btn-load-yoph').addEventListener('click', (e) => {
                e.preventDefault();
                state.pendingFileType = '.yophdoc';
                modalOverwrite.classList.remove('hidden');
            });

            document.getElementById('btn-load-md').addEventListener('click', (e) => {
                e.preventDefault();
                state.pendingFileType = '.md';
                modalOverwrite.classList.remove('hidden');
            });

            document.getElementById('btn-cancel-modal').addEventListener('click', (e) => {
                e.preventDefault();
                modalOverwrite.classList.add('hidden');
            });

            document.getElementById('btn-confirm-modal').addEventListener('click', (e) => {
                e.preventDefault();
                modalOverwrite.classList.add('hidden');
                fileInput.accept = state.pendingFileType === '.yophdoc' ? '.yophdoc' : '.md,.txt';
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    const content = evt.target.result;
                    const cleanName = file.name.replace(/\.[^/.]+$/, "");
                    state.docTitle = cleanName;
                    if (docTitleInput) docTitleInput.value = cleanName;

                    loadMarkdownIntoPage(content);
                    autosave();
                    showToast(`Loaded ${file.name}`);
                };
                reader.readAsText(file);
                fileInput.value = '';
            });

            document.getElementById('fmt-bold').addEventListener('click', (e) => { e.preventDefault(); executeFormat('bold'); });
            document.getElementById('fmt-italic').addEventListener('click', (e) => { e.preventDefault(); executeFormat('italic'); });
            document.getElementById('fmt-strike').addEventListener('click', (e) => { e.preventDefault(); executeFormat('strikeThrough'); });

            document.getElementById('fmt-p').addEventListener('click', (e) => { e.preventDefault(); executeFormat('formatBlock', '<p>'); });
            document.getElementById('fmt-h1').addEventListener('click', (e) => { e.preventDefault(); executeFormat('formatBlock', '<h1>'); });
            document.getElementById('fmt-h2').addEventListener('click', (e) => { e.preventDefault(); executeFormat('formatBlock', '<h2>'); });
            document.getElementById('fmt-h3').addEventListener('click', (e) => { e.preventDefault(); executeFormat('formatBlock', '<h3>'); });

            document.getElementById('fmt-ul').addEventListener('click', (e) => { e.preventDefault(); executeFormat('insertUnorderedList'); });
            document.getElementById('fmt-ol').addEventListener('click', (e) => { e.preventDefault(); executeFormat('insertOrderedList'); });
            document.getElementById('fmt-quote').addEventListener('click', (e) => { e.preventDefault(); executeFormat('formatBlock', '<blockquote>'); });
            document.getElementById('fmt-hr').addEventListener('click', (e) => { e.preventDefault(); executeFormat('insertHorizontalRule'); });

            const btnLink = document.getElementById('fmt-link');
            const inputLinkText = document.getElementById('input-link-text');
            const inputLinkUrl = document.getElementById('input-link-url');

            btnLink.addEventListener('click', (e) => {
                e.preventDefault();
                saveSelection();
                const sel = window.getSelection();
                if (inputLinkText) {
                    inputLinkText.value = sel ? sel.toString() : '';
                }
                modalLink.classList.remove('hidden');
            });

            document.getElementById('btn-cancel-link').addEventListener('click', (e) => {
                e.preventDefault();
                modalLink.classList.add('hidden');
            });

            document.getElementById('btn-confirm-link').addEventListener('click', (e) => {
                e.preventDefault();
                const text = inputLinkText.value || 'Link';
                const url = inputLinkUrl.value || 'https://';
                modalLink.classList.add('hidden');

                restoreSelection();
                executeFormat('insertHTML', `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
            });

            document.getElementById('fmt-table').addEventListener('click', (e) => {
                e.preventDefault();
                saveSelection();
                document.getElementById('input-table-rows').value = 2;
                document.getElementById('input-table-cols').value = 2;
                modalTable.classList.remove('hidden');
            });

            document.getElementById('btn-cancel-table').addEventListener('click', (e) => {
                e.preventDefault();
                modalTable.classList.add('hidden');
            });

            document.getElementById('btn-confirm-table').addEventListener('click', (e) => {
                e.preventDefault();
                const rowsCount = parseInt(document.getElementById('input-table-rows').value, 10) || 2;
                const colsCount = parseInt(document.getElementById('input-table-cols').value, 10) || 2;
                modalTable.classList.add('hidden');

                restoreSelection();

                let tableHtml = '<table><thead><tr>';
                for (let c = 1; c <= colsCount; c++) {
                    tableHtml += `<th>Header ${c}</th>`;
                }
                tableHtml += '</tr></thead><tbody>';

                for (let r = 1; r <= rowsCount; r++) {
                    tableHtml += '<tr>';
                    for (let c = 1; c <= colsCount; c++) {
                        tableHtml += `<td>Cell ${r},${c}</td>`;
                    }
                    tableHtml += '</tr>';
                }
                tableHtml += '</tbody></table><p></p>';

                executeFormat('insertHTML', tableHtml);
            });

            document.getElementById('tbl-row-above')?.addEventListener('click', (e) => {
                e.preventDefault();
                if (!state.activeCell) return;
                const row = state.activeCell.closest('tr');
                if (!row) return;
                const colCount = row.children.length;
                const newRow = document.createElement('tr');
                for (let i = 0; i < colCount; i++) {
                    const td = document.createElement('td');
                    td.innerHTML = 'New Cell';
                    newRow.appendChild(td);
                }
                row.parentNode.insertBefore(newRow, row);
                repaginate();
                autosave();
            });

            document.getElementById('tbl-row-below')?.addEventListener('click', (e) => {
                e.preventDefault();
                if (!state.activeCell) return;
                const row = state.activeCell.closest('tr');
                if (!row) return;
                const colCount = row.children.length;
                const newRow = document.createElement('tr');
                for (let i = 0; i < colCount; i++) {
                    const td = document.createElement('td');
                    td.innerHTML = 'New Cell';
                    newRow.appendChild(td);
                }
                if (row.nextSibling) {
                    row.parentNode.insertBefore(newRow, row.nextSibling);
                } else {
                    row.parentNode.appendChild(newRow);
                }
                repaginate();
                autosave();
            });

            document.getElementById('tbl-col-left')?.addEventListener('click', (e) => {
                e.preventDefault();
                if (!state.activeCell) return;
                const cellIndex = state.activeCell.cellIndex;
                const table = state.activeCell.closest('table');
                if (!table) return;
                Array.from(table.rows).forEach(row => {
                    const isHeader = row.parentNode.tagName.toLowerCase() === 'thead';
                    const newCell = document.createElement(isHeader ? 'th' : 'td');
                    newCell.innerHTML = isHeader ? 'Header' : 'New Cell';
                    row.insertBefore(newCell, row.cells[cellIndex]);
                });
                repaginate();
                autosave();
            });

            document.getElementById('tbl-col-right')?.addEventListener('click', (e) => {
                e.preventDefault();
                if (!state.activeCell) return;
                const cellIndex = state.activeCell.cellIndex;
                const table = state.activeCell.closest('table');
                if (!table) return;
                Array.from(table.rows).forEach(row => {
                    const isHeader = row.parentNode.tagName.toLowerCase() === 'thead';
                    const newCell = document.createElement(isHeader ? 'th' : 'td');
                    newCell.innerHTML = isHeader ? 'Header' : 'New Cell';
                    if (cellIndex + 1 < row.cells.length) {
                        row.insertBefore(newCell, row.cells[cellIndex + 1]);
                    } else {
                        row.appendChild(newCell);
                    }
                });
                repaginate();
                autosave();
            });

            document.getElementById('tbl-del-row')?.addEventListener('click', (e) => {
                e.preventDefault();
                if (!state.activeCell) return;
                const row = state.activeCell.closest('tr');
                const table = state.activeCell.closest('table');
                if (row) row.remove();
                if (table && table.rows.length === 0) table.remove();
                state.activeCell = null;
                tableToolbar.classList.add('hidden');
                repaginate();
                autosave();
            });

            document.getElementById('tbl-del-col')?.addEventListener('click', (e) => {
                e.preventDefault();
                if (!state.activeCell) return;
                const cellIndex = state.activeCell.cellIndex;
                const table = state.activeCell.closest('table');
                if (!table) return;
                Array.from(table.rows).forEach(row => {
                    if (row.cells[cellIndex]) row.cells[cellIndex].remove();
                });
                if (table.rows.length > 0 && table.rows[0].cells.length === 0) table.remove();
                state.activeCell = null;
                tableToolbar.classList.add('hidden');
                repaginate();
                autosave();
            });

            document.getElementById('tbl-del-table')?.addEventListener('click', (e) => {
                e.preventDefault();
                if (!state.activeCell) return;
                const table = state.activeCell.closest('table');
                if (table) table.remove();
                state.activeCell = null;
                tableToolbar.classList.add('hidden');
                repaginate();
                autosave();
            });
        }

        window.addEventListener('DOMContentLoaded', init);
    
