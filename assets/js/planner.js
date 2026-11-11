
        // Cookie Helper Functions
        function setCookie(name, value, days = 365) {
            let expires = "";
            if (days) {
                let date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
        }

        function getCookie(name) {
            let nameEQ = name + "=";
            let ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
            return null;
        }

        // Note Themes
        const NOTE_COLORS = {
            yellow: { bg: 'bg-amber-100', text: 'text-slate-900', headerBg: 'bg-amber-200', dot: 'bg-amber-400' },
            mint: { bg: 'bg-emerald-100', text: 'text-slate-900', headerBg: 'bg-emerald-200', dot: 'bg-emerald-400' },
            lavender: { bg: 'bg-purple-100', text: 'text-slate-900', headerBg: 'bg-purple-200', dot: 'bg-purple-400' },
            peach: { bg: 'bg-orange-100', text: 'text-slate-900', headerBg: 'bg-orange-200', dot: 'bg-orange-400' },
            sky: { bg: 'bg-sky-100', text: 'text-slate-900', headerBg: 'bg-sky-200', dot: 'bg-sky-400' },
            rose: { bg: 'bg-rose-100', text: 'text-slate-900', headerBg: 'bg-rose-200', dot: 'bg-rose-400' },
            gray: { bg: 'bg-slate-200', text: 'text-slate-900', headerBg: 'bg-slate-300', dot: 'bg-slate-400' }
        };

        // Application State
        let state = {
            boardTitle: 'Untitled Plan',
            panX: 0,
            panY: 0,
            scale: 1,
            notes: [
                {
                    id: 'note-welcome',
                    title: '📌 Welcome to Yoph Planner',
                    description: 'Edit notes, change their colors and plan ahead!',
                    color: 'yellow',
                    x: 0,
                    y: 0
                },
                {
                    id: 'note-features',
                    title: '🚀 Key Features',
                    description: 'Link notes together to create what you want to see, if you want better security be sure to save them to your computer. It all runs local, no fancy Chinese servers here!',
                    color: 'lavender',
                    x: 360,
                    y: 0
                }
            ],
            connections: [
                { id: 'conn-init', from: 'note-welcome', to: 'note-features' }
            ]
        };

        // Interaction State
        let isPanning = false;
        let panStartX = 0;
        let panStartY = 0;

        let draggedNoteId = null;
        let noteDragOffsetX = 0;
        let noteDragOffsetY = 0;

        let activeConnecting = null; // { fromNoteId, startX, startY, currentX, currentY }
        let pendingFileToLoad = null;

        // DOM elements
        const container = document.getElementById('canvas-container');
        const world = document.getElementById('world');
        const svgCanvas = document.getElementById('connections-svg');
        const zoomLevelEl = document.getElementById('zoom-level');
        const boardTitleInput = document.getElementById('board-title-input');
        const modalOverwrite = document.getElementById('modal-overwrite');

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/"/g, "&quot;")
                      .replace(/'/g, "&#039;");
        }

        function formatLinks(text) {
            if (!text) return '';
            const escaped = escapeHtml(text);
            const urlPattern = /(https?:\/\/[^\s]+)/g;
            return escaped.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800 pointer-events-auto" onclick="event.stopPropagation()">$1</a>');
        }

        function autosaveToCookie() {
            const saveData = {
                boardTitle: state.boardTitle,
                notes: state.notes,
                connections: state.connections
            };
            setCookie('yoph_board_state', JSON.stringify(saveData), 365);
        }

        function init() {
            // Attempt to load state from cookie
            const savedCookie = getCookie('yoph_board_state');
            if (savedCookie) {
                try {
                    const data = JSON.parse(savedCookie);
                    if (data.notes && Array.isArray(data.notes)) {
                        state.boardTitle = data.boardTitle || 'Untitled Plan';
                        state.notes = data.notes;
                        state.connections = data.connections || [];
                    }
                } catch (err) {
                    console.error("Failed to parse saved state cookie:", err);
                }
                state.panX = Math.round(window.innerWidth / 2 - 250);
                state.panY = Math.round(window.innerHeight / 2 - 100);
                state.scale = 1.0;
            } else {
                // Position default notes around center of viewport
                state.panX = Math.round(window.innerWidth / 2 - 250);
                state.panY = Math.round(window.innerHeight / 2 - 100);
                state.scale = 1.0;
                autosaveToCookie();
            }

            setupEventListeners();
            renderAll();
        }

        function renderAll() {
            boardTitleInput.value = state.boardTitle;
            updateTransform();
            renderNotes();
            renderConnections();
            zoomLevelEl.textContent = `${Math.round(state.scale * 100)}%`;
        }

        function updateTransform() {
            world.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
        }

        function renderNotes() {
            world.innerHTML = '';
            state.notes.forEach(note => {
                const colors = NOTE_COLORS[note.color] || NOTE_COLORS.yellow;

                const el = document.createElement('div');
                el.className = 
ote-card absolute pointer-events-auto w-72 rounded ${colors.bg} ${colors.text} flex flex-col border border-slate-300/60 shadow-sm overflow-visible`;
                el.style.left = `${note.x}px`;
                el.style.top = `${note.y}px`;
                el.dataset.id = note.id;

                // Palette dropdown options
                const colorOptions = Object.keys(NOTE_COLORS).map(cKey => `
                    <button class="btn-color-select w-4 h-4 rounded-full ${NOTE_COLORS[cKey].dot} border border-slate-400 hover:scale-110 transition-transform" data-color="${cKey}" title="${cKey}"></button>
                `).join('');

                el.innerHTML = `
                    <!-- Note Header / Drag Handle -->
                    <div class="note-header px-3 py-2 ${colors.headerBg} flex items-center justify-between cursor-move rounded-t">
                        <input type="text" value="${escapeHtml(note.title)}" placeholder="Note Title..." maxlength="50"
                            class="note-title-input bg-transparent font-semibold text-sm w-full outline-none focus:bg-white/50 px-1 py-0.5 rounded">
                        <div class="flex items-center gap-1 ml-1 flex-shrink-0">
                            <!-- 3 Dots Color Menu -->
                            <div class="relative group">
                                <button class="p-1 hover:bg-black/10 rounded transition-colors text-slate-700" title="Change Color">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                                </button>
                                <div class="hidden group-hover:flex group-focus-within:flex absolute right-0 top-full bg-white border border-slate-300 p-1.5 gap-1.5 z-30 shadow-md rounded">
                                    ${colorOptions}
                                </div>
                            </div>
                            <!-- Delete Note Button -->
                            <button class="btn-delete-note p-1 text-slate-600 hover:bg-black/10 rounded transition-colors" title="Delete Note">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>
                    <!-- Note Description -->
                    <div class="p-3 flex-1 relative note-body-container">
                        <div class="note-desc-display w-full h-28 text-sm overflow-y-auto whitespace-pre-wrap break-words p-1 outline-none font-sans cursor-text ${note.description ? '' : 'text-slate-400'}" title="Click to edit">${formatLinks(note.description) || 'Write your thoughts here...'}</div>
                        <textarea placeholder="Write your thoughts here..."
                            class="note-desc-input hidden w-full h-28 bg-transparent text-sm resize-none outline-none focus:bg-white/50 p-1 font-sans rounded">${escapeHtml(note.description)}</textarea>
                    </div>

                    <!-- Single Top Anchor Dot -->
                    <div class="anchor absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-800 border-2 border-white cursor-crosshair hover:scale-125 transition-transform z-20" title="Drag to connect to another note"></div>
                `;

                // Title editing
                const titleInput = el.querySelector('.note-title-input');
                titleInput.addEventListener('input', (e) => {
                    note.title = e.target.value;
                    autosaveToCookie();
                });

                // Description text/link switching
                const descDisplay = el.querySelector('.note-desc-display');
                const descInput = el.querySelector('.note-desc-input');

                descDisplay.addEventListener('click', (e) => {
                    if (e.target.tagName === 'A') return;
                    descDisplay.classList.add('hidden');
                    descInput.classList.remove('hidden');
                    descInput.focus();
                });

                descInput.addEventListener('blur', () => {
                    note.description = descInput.value;
                    descDisplay.innerHTML = formatLinks(note.description) || '<span class="text-slate-400">Write your thoughts here...</span>';
                    descInput.classList.add('hidden');
                    descDisplay.classList.remove('hidden');
                    autosaveToCookie();
                });

                descInput.addEventListener('input', (e) => {
                    note.description = e.target.value;
                    autosaveToCookie();
                });

                // Prevent note body scroll from triggering canvas zoom
                const noteBody = el.querySelector('.note-body-container');
                noteBody.addEventListener('wheel', (e) => {
                    e.stopPropagation();
                }, { passive: false });

                // Color selectors
                el.querySelectorAll('.btn-color-select').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        note.color = btn.dataset.color;
                        renderNotes();
                        autosaveToCookie();
                    });
                });

                // Delete note
                const deleteBtn = el.querySelector('.btn-delete-note');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                });

                // Note dragging handler
                const headerEl = el.querySelector('.note-header');
                headerEl.addEventListener('mousedown', (e) => {
                    if (e.target.tagName === 'INPUT' || e.target.closest('button') || e.target.closest('.group')) return;
                    draggedNoteId = note.id;
                    const rect = el.getBoundingClientRect();
                    noteDragOffsetX = (e.clientX - rect.left) / state.scale;
                    noteDragOffsetY = (e.clientY - rect.top) / state.scale;

                    // Bring note to front
                    state.notes = state.notes.filter(n => n.id !== note.id);
                    state.notes.push(note);
                    renderNotes();
                    e.stopPropagation();
                });

                // Pin anchor drag handler
                const anchorEl = el.querySelector('.anchor');
                anchorEl.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    const anchorCoords = getAnchorCoordinates(note, 'top');
                    activeConnecting = {
                        fromNoteId: note.id,
                        startX: anchorCoords.x,
                        startY: anchorCoords.y,
                        currentX: e.clientX,
                        currentY: e.clientY
                    };
                });

                world.appendChild(el);
            });
        }

        function getAnchorCoordinates(note, anchorType) {
            const width = 288;
            const el = world.querySelector(`[data-id="${note.id}"]`);
            const actualHeight = el ? el.offsetHeight : 150;

            switch(anchorType) {
                case 'top': return { x: note.x + width / 2, y: note.y };
                case 'right': return { x: note.x + width, y: note.y + actualHeight / 2 };
                case 'bottom': return { x: note.x + width / 2, y: note.y + actualHeight };
                case 'left': return { x: note.x, y: note.y + actualHeight / 2 };
                default: return { x: note.x + width / 2, y: note.y + actualHeight / 2 };
            }
        }

        // Automatic nearest-side calculation
        function getNearestAnchorsBetweenNotes(noteA, noteB) {
            const anchors = ['top', 'right', 'bottom', 'left'];
            let minDistance = Infinity;
            let bestPair = { p1: getAnchorCoordinates(noteA, 'bottom'), p2: getAnchorCoordinates(noteB, 'top') };

            anchors.forEach(a1 => {
                const p1 = getAnchorCoordinates(noteA, a1);
                anchors.forEach(a2 => {
                    const p2 = getAnchorCoordinates(noteB, a2);
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = dx * dx + dy * dy;
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestPair = { p1, p2 };
                    }
                });
            });

            return bestPair;
        }

        function deleteConnection(connId) {
            state.connections = state.connections.filter(c => c.id !== connId);
            renderConnections();
            autosaveToCookie();
            showToast('Connection removed');
        }

        function renderConnections() {
            let svgContent = '';

            state.connections.forEach(conn => {
                const fromNote = state.notes.find(n => n.id === conn.from);
                const toNote = state.notes.find(n => n.id === conn.to);
                if (!fromNote || !toNote) return;

                const { p1, p2 } = getNearestAnchorsBetweenNotes(fromNote, toNote);

                const screenP1 = worldToScreen(p1.x, p1.y);
                const screenP2 = worldToScreen(p2.x, p2.y);

                const midX = (screenP1.x + screenP2.x) / 2;
                const midY = (screenP1.y + screenP2.y) / 2;

                svgContent += `
                    <g class="group pointer-events-auto cursor-pointer" onclick="deleteConnection('${conn.id}')">
                        <!-- Hitbox line -->
                        <line x1="${screenP1.x}" y1="${screenP1.y}" x2="${screenP2.x}" y2="${screenP2.y}" stroke="transparent" stroke-width="20" />
                        <!-- Visible Straight Line -->
                        <line x1="${screenP1.x}" y1="${screenP1.y}" x2="${screenP2.x}" y2="${screenP2.y}" stroke="#475569" stroke-width="3" class="transition-colors group-hover:stroke-red-600" />
                        <!-- Midpoint Delete Button -->
                        <rect x="${midX - 9}" y="${midY - 9}" width="18" height="18" class="fill-slate-800 stroke-slate-600 group-hover:fill-red-600 group-hover:stroke-red-700 transition-colors" />
                        <path d="M ${midX - 4} ${midY - 4} L ${midX + 4} ${midY + 4} M ${midX + 4} ${midY - 4} L ${midX - 4} ${midY + 4}" stroke="#ffffff" stroke-width="2" class="pointer-events-none" />
                    </g>
                `;
            });

            if (activeConnecting) {
                const screenStart = worldToScreen(activeConnecting.startX, activeConnecting.startY);
                const targetScreen = { x: activeConnecting.currentX, y: activeConnecting.currentY };

                svgContent += `
                    <line x1="${screenStart.x}" y1="${screenStart.y}" x2="${targetScreen.x}" y2="${targetScreen.y}" stroke="#059669" stroke-width="3" stroke-dasharray="5 5" class="pointer-events-none" />
                `;
            }

            svgCanvas.innerHTML = svgContent;
        }

        function worldToScreen(wx, wy) {
            return {
                x: wx * state.scale + state.panX,
                y: wy * state.scale + state.panY
            };
        }

        function screenToWorld(sx, sy) {
            return {
                x: (sx - state.panX) / state.scale,
                y: (sy - state.panY) / state.scale
            };
        }

        function setupEventListeners() {
            boardTitleInput.addEventListener('input', (e) => {
                state.boardTitle = e.target.value;
                autosaveToCookie();
            });

            container.addEventListener('mousedown', (e) => {
                if (e.target === container || e.target === svgCanvas || e.target.id === 'world') {
                    isPanning = true;
                    panStartX = e.clientX - state.panX;
                    panStartY = e.clientY - state.panY;
                    container.classList.add('cursor-grabbing');
                }
            });

            window.addEventListener('mousemove', (e) => {
                if (isPanning) {
                    state.panX = e.clientX - panStartX;
                    state.panY = e.clientY - panStartY;
                    updateTransform();
                    renderConnections();
                } else if (draggedNoteId) {
                    const note = state.notes.find(n => n.id === draggedNoteId);
                    if (note) {
                        note.x = (e.clientX - state.panX) / state.scale - noteDragOffsetX;
                        note.y = (e.clientY - state.panY) / state.scale - noteDragOffsetY;
                        const el = world.querySelector(`[data-id="${note.id}"]`);
                        if (el) {
                            el.style.left = `${note.x}px`;
                            el.style.top = `${note.y}px`;
                        }
                        renderConnections();
                    }
                } else if (activeConnecting) {
                    activeConnecting.currentX = e.clientX;
                    activeConnecting.currentY = e.clientY;
                    renderConnections();
                }
            });

            window.addEventListener('mouseup', (e) => {
                if (isPanning) {
                    isPanning = false;
                    container.classList.remove('cursor-grabbing');
                }
                if (draggedNoteId) {
                    draggedNoteId = null;
                    autosaveToCookie();
                }
                if (activeConnecting) {
                    const hoverElement = document.elementFromPoint(e.clientX, e.clientY);
                    const targetNoteEl = hoverElement ? hoverElement.closest('.note-card') : null;

                    if (targetNoteEl) {
                        const targetNoteId = targetNoteEl.dataset.id;
                        if (targetNoteId && targetNoteId !== activeConnecting.fromNoteId) {
                            const exists = state.connections.some(c =>
                                (c.from === activeConnecting.fromNoteId && c.to === targetNoteId) ||
                                (c.from === targetNoteId && c.to === activeConnecting.fromNoteId)
                            );
                            if (!exists) {
                                state.connections.push({
                                    id: 'conn-' + Date.now(),
                                    from: activeConnecting.fromNoteId,
                                    to: targetNoteId
                                });
                                autosaveToCookie();
                                showToast('Notes connected');
                            }
                        }
                    }
                    activeConnecting = null;
                    renderConnections();
                }
            });

            container.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
                const newScale = Math.max(0.2, Math.min(3, state.scale * zoomFactor));

                const mouseX = e.clientX;
                const mouseY = e.clientY;

                state.panX = mouseX - (mouseX - state.panX) * (newScale / state.scale);
                state.panY = mouseY - (mouseY - state.panY) * (newScale / state.scale);
                state.scale = newScale;

                renderAll();
            }, { passive: false });

            document.getElementById('btn-new-note').addEventListener('click', createNewNote);
            document.getElementById('btn-zoom-in').addEventListener('click', () => zoomBy(1.2));
            document.getElementById('btn-zoom-out').addEventListener('click', () => zoomBy(0.8));
            document.getElementById('btn-reset-view').addEventListener('click', resetView);
            document.getElementById('btn-save').addEventListener('click', saveBoard);

            // File loading triggers warning modal
            document.getElementById('btn-load').addEventListener('click', () => document.getElementById('file-input').click());
            document.getElementById('file-input').addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    pendingFileToLoad = e.target.files[0];
                    modalOverwrite.classList.remove('hidden');
                }
            });

            document.getElementById('btn-cancel-load').addEventListener('click', () => {
                modalOverwrite.classList.add('hidden');
                pendingFileToLoad = null;
                document.getElementById('file-input').value = '';
            });

            document.getElementById('btn-confirm-load').addEventListener('click', () => {
                modalOverwrite.classList.add('hidden');
                if (pendingFileToLoad) {
                    executeLoadBoard(pendingFileToLoad);
                }
            });
        }

        function createNewNote() {
            const centerWorld = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
            const newNote = {
                id: 'note-' + Date.now(),
                title: 'New Yoph Note',
                description: '',
                color: Object.keys(NOTE_COLORS)[Math.floor(Math.random() * Object.keys(NOTE_COLORS).length)],
                x: Math.round(centerWorld.x - 144 + (Math.random() * 40 - 20)),
                y: Math.round(centerWorld.y - 75 + (Math.random() * 40 - 20))
            };

            state.notes.push(newNote);
            renderNotes();
            autosaveToCookie();
            showToast('New note created');
        }

        function deleteNote(id) {
            state.notes = state.notes.filter(n => n.id !== id);
            state.connections = state.connections.filter(c => c.from !== id && c.to !== id);
            renderAll();
            autosaveToCookie();
            showToast('Note deleted');
        }

        function zoomBy(factor) {
            const newScale = Math.max(0.2, Math.min(3, state.scale * factor));
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            state.panX = centerX - (centerX - state.panX) * (newScale / state.scale);
            state.panY = centerY - (centerY - state.panY) * (newScale / state.scale);
            state.scale = newScale;

            renderAll();
        }

        function resetView() {
            state.scale = 1.0;
            state.panX = Math.round(window.innerWidth / 2 - 250);
            state.panY = Math.round(window.innerHeight / 2 - 100);
            renderAll();
            showToast('View reset to 100%');
        }

        function saveBoard() {
            const saveData = {
                appName: 'Yoph Planner',
                version: '1.0',
                boardTitle: state.boardTitle || 'Untitled Plan',
                timestamp: new Date().toISOString(),
                notes: state.notes,
                connections: state.connections
            };

            const jsonStr = JSON.stringify(saveData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const filename = (state.boardTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') || 'yoph-plan') + '.yoph';

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Saved to .yoph file');
        }

        function executeLoadBoard(file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.notes && Array.isArray(data.notes)) {
                        state.boardTitle = data.boardTitle || 'Untitled Plan';
                        state.notes = data.notes;
                        state.connections = data.connections || [];
                        state.scale = 1.0;
                        state.panX = Math.round(window.innerWidth / 2 - 250);
                        state.panY = Math.round(window.innerHeight / 2 - 100);
                        renderAll();
                        autosaveToCookie();
                        showToast('Loaded .yoph file successfully');
                    } else {
                        showToast('Invalid .yoph file format');
                    }
                } catch (err) {
                    showToast('Error reading .yoph file');
                }
                document.getElementById('file-input').value = '';
                pendingFileToLoad = null;
            };
            reader.readAsText(file);
        }

        function showToast(message) {
            const toast = document.getElementById('toast');
            const toastMsg = document.getElementById('toast-message');

            toastMsg.textContent = message;
            toast.classList.remove('translate-y-20', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');

            setTimeout(() => {
                toast.classList.remove('translate-y-0', 'opacity-100');
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 2500);
        }

        window.onload = init;
    
