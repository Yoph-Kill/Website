
        // Solid Flat Color Themes
        const COLORS = {
            emerald: { bg: 'bg-emerald-600', border: 'border-emerald-700', text: 'text-white' },
            sky: { bg: 'bg-sky-600', border: 'border-sky-700', text: 'text-white' },
            amber: { bg: 'bg-amber-600', border: 'border-amber-700', text: 'text-white' },
            purple: { bg: 'bg-purple-600', border: 'border-purple-700', text: 'text-white' },
            rose: { bg: 'bg-rose-600', border: 'border-rose-700', text: 'text-white' },
            slate: { bg: 'bg-slate-700', border: 'border-slate-800', text: 'text-white' }
        };

        // App State
        let state = {
            timelineTitle: 'Untitled Plan',
            // Viewport horizontal scroll center timestamp
            centerTimestamp: Date.now(),
            // Zoom factor: Pixels per Hour
            pxPerHour: 40,
            items: [
                {
                    id: 'item-1',
                    type: 'event',
                    title: '🚀 Move dates by dragging',
                    startTime: Date.now(),
                    color: 'emerald'
                },
                {
                    id: 'item-2',
                    type: 'period',
                    title: '📅 Periods display over time',
                    startTime: Date.now() - (24 * 3600 * 1000 * 2), // 2 days ago
                    endTime: Date.now() + (24 * 3600 * 1000 * 3),   // 3 days in future
                    color: 'sky'
                },
                {
                    id: 'item-3',
                    type: 'event',
                    title: '🎯 Save your timelines for later',
                    startTime: Date.now() + (24 * 3600 * 1000 * 1), // tomorrow
                    color: 'amber'
                }
            ]
        };

        // Interaction state variables
        let isPanning = false;
        let panStartX = 0;
        let panStartTimestamp = 0;

        let draggingItemId = null;
        let draggingType = null; // 'event', 'period-move', 'period-start', 'period-end'
        let dragOffsetMs = 0;

        let activeEditingId = null;
        let pendingFileToLoad = null;

        // DOM Elements
        const canvasContainer = document.getElementById('timeline-canvas');
        const rulerContainer = document.getElementById('timeline-ruler');
        const itemsLayer = document.getElementById('items-layer');
        const todayMarker = document.getElementById('today-marker');
        const zoomLevelEl = document.getElementById('zoom-level');
        const titleInput = document.getElementById('timeline-title-input');
        
        // Modals
        const editModal = document.getElementById('modal-edit');
        const editItemTitle = document.getElementById('edit-item-title');
        const editItemStart = document.getElementById('edit-item-start');
        const editItemEnd = document.getElementById('edit-item-end');
        const editEndContainer = document.getElementById('edit-end-container');
        const editStartLabel = document.getElementById('edit-start-label');
        const colorPickerGroup = document.getElementById('color-picker-group');
        const overwriteModal = document.getElementById('modal-overwrite');

        let selectedModalColor = 'emerald';

        function init() {
            setupEventListeners();
            renderAll();
        }

        function renderAll() {
            titleInput.value = state.timelineTitle;
            zoomLevelEl.textContent = `${Math.round((state.pxPerHour / 40) * 100)}%`;
            renderRuler();
            renderTodayMarker();
            renderItems();
        }

        // Convert Timestamp to Screen Canvas X Position
        function timeToX(timestamp) {
            const centerX = canvasContainer.clientWidth / 2;
            const diffHours = (timestamp - state.centerTimestamp) / (3600 * 1000);
            return centerX + diffHours * state.pxPerHour;
        }

        // Convert Screen Canvas X Position to Timestamp
        function xToTime(x) {
            const centerX = canvasContainer.clientWidth / 2;
            const diffHours = (x - centerX) / state.pxPerHour;
            return state.centerTimestamp + (diffHours * 3600 * 1000);
        }

        function renderTodayMarker() {
            const todayX = timeToX(Date.now());
            todayMarker.style.left = `${todayX}px`;
        }

        // Render Ruler Ticks along the top header bar
        function renderRuler() {
            rulerContainer.innerHTML = '';
            const width = rulerContainer.clientWidth;
            if (!width) return;

            const startTime = xToTime(0);
            const endTime = xToTime(width);

            // Determine tick scale interval based on zoom scale (supports macro year view)
            let hourInterval = 1;
            if (state.pxPerHour < 0.1) hourInterval = 24 * 365;       // 1 Year
            else if (state.pxPerHour < 0.5) hourInterval = 24 * 30;   // 1 Month
            else if (state.pxPerHour < 2) hourInterval = 24 * 7;      // 1 Week
            else if (state.pxPerHour < 8) hourInterval = 24;          // 1 Day
            else if (state.pxPerHour < 20) hourInterval = 6;          // 6 Hours
            else if (state.pxPerHour < 50) hourInterval = 2;          // 2 Hours

            const msInterval = hourInterval * 3600 * 1000;
            const firstTickTime = Math.floor(startTime / msInterval) * msInterval;

            for (let t = firstTickTime; t <= endTime; t += msInterval) {
                const x = timeToX(t);
                const d = new Date(t);

                const tickEl = document.createElement('div');
                tickEl.className = 'absolute top-0 bottom-0 border-l border-slate-300 flex flex-col justify-between py-1 text-[11px] text-slate-600 font-medium pl-1 pointer-events-none';
                tickEl.style.left = `${x}px`;

                let label = '';
                if (hourInterval >= 24 * 30) {
                    label = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
                } else if (hourInterval >= 24) {
                    label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } else {
                    label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    if (d.getHours() === 0) {
                        label += ` (${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
                    }
                }

                tickEl.innerHTML = `<span>${label}</span>`;
                rulerContainer.appendChild(tickEl);
            }
        }

        // Calculate stacking level for items so overlapping ones stack cleanly
        function computeStacking() {
            const events = state.items.filter(i => i.type === 'event').sort((a, b) => a.startTime - b.startTime);
            const periods = state.items.filter(i => i.type === 'period').sort((a, b) => a.startTime - b.startTime);

            // Stack events (sitting ABOVE central axis)
            const eventLevels = [];
            events.forEach(item => {
                const itemStart = item.startTime;
                const nominalDuration = (180 / Math.max(state.pxPerHour, 1)) * 3600 * 1000;
                const itemEnd = itemStart + nominalDuration;

                let level = 0;
                while (true) {
                    if (!eventLevels[level]) eventLevels[level] = [];
                    const hasOverlap = eventLevels[level].some(placed => {
                        const placedEnd = placed.startTime + nominalDuration;
                        return Math.max(itemStart, placed.startTime) < Math.min(itemEnd, placedEnd);
                    });

                    if (!hasOverlap) {
                        eventLevels[level].push(item);
                        item._level = level;
                        break;
                    }
                    level++;
                }
            });

            // Stack periods (sitting BELOW central axis)
            const periodLevels = [];
            periods.forEach(item => {
                const itemStart = item.startTime;
                const itemEnd = item.endTime;

                let level = 0;
                while (true) {
                    if (!periodLevels[level]) periodLevels[level] = [];
                    const hasOverlap = periodLevels[level].some(placed => {
                        return Math.max(itemStart, placed.startTime) < Math.min(itemEnd, placed.endTime);
                    });

                    if (!hasOverlap) {
                        periodLevels[level].push(item);
                        item._level = level;
                        break;
                    }
                    level++;
                }
            });
        }

        // Render all Yoph Events & Periods cleanly centered on screen
        function renderItems() {
            itemsLayer.innerHTML = '';
            computeStacking();

            const centerY = (canvasContainer.clientHeight || 400) / 2;
            const isMacroZoom = state.pxPerHour <= 10; // Zoom level 25% or less

            state.items.forEach(item => {
                const color = COLORS[item.color] || COLORS.emerald;
                const levelOffset = (item._level || 0) * (isMacroZoom ? 28 : 48);

                if (item.type === 'event') {
                    const x = timeToX(item.startTime);
                    const el = document.createElement('div');
                    
                    // Total height of line stem extending continuously down to central axis
                    const fullStemHeight = 16 + levelOffset;
                    
                    el.className = `absolute pointer-events-auto flex flex-col items-center cursor-grab active:cursor-grabbing z-30 group`;
                    el.style.left = `${x}px`;
                    el.style.top = `${centerY - fullStemHeight}px`;
                    el.style.transform = 'translate(-50%, -100%)';
                    el.dataset.id = item.id;

                    if (isMacroZoom) {
                        // Expanding Pill Card representation when zoomed out <= 25% (Square shape when collapsed, natural width on hover)
                        el.className = `absolute pointer-events-auto flex flex-col items-center cursor-grab active:cursor-grabbing z-30 hover:z-50 group`;
                        el.style.left = `${x}px`;
                        el.style.top = `${centerY - fullStemHeight}px`;
                        el.style.transform = 'translate(-50%, -100%)';
                        el.dataset.id = item.id;

                        el.innerHTML = `
                            <div class="compact-event-wrapper w-6 h-6 group-hover:w-auto group-hover:h-auto p-1 border ${color.bg} ${color.border} ${color.text} shadow-sm hover:ring-2 hover:ring-slate-400">
                                <div class="full-card-content flex items-center gap-2">
                                    <span class="text-xs font-bold whitespace-nowrap">${escapeHtml(item.title)}</span>
                                    <span class="text-[10px] opacity-80 whitespace-nowrap">${formatShortTime(item.startTime)}</span>
                                    <button class="btn-edit-item p-0.5 hover:bg-black/20 text-white ml-1 transition-colors flex-shrink-0" title="Edit Event">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <div class="w-[2px] bg-slate-400 pointer-events-none" style="height: ${fullStemHeight}px;"></div>
                        `;
                    } else {
                        // Normal Pill Card View
                        el.innerHTML = `
                            <div class="flex items-center gap-2 px-3 py-1.5 border ${color.bg} ${color.border} ${color.text} shadow-sm hover:ring-2 hover:ring-slate-400">
                                <span class="text-xs font-bold whitespace-nowrap">${escapeHtml(item.title)}</span>
                                <span class="text-[10px] opacity-80 whitespace-nowrap">${formatShortTime(item.startTime)}</span>
                                <button class="btn-edit-item p-0.5 hover:bg-black/20 text-white ml-1 transition-colors" title="Edit Event">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                </button>
                            </div>
                            <div class="w-[2px] bg-slate-400 pointer-events-none" style="height: ${fullStemHeight}px;"></div>
                            <div class="w-3 h-3 bg-slate-800 border-2 border-white -mt-1.5 pointer-events-none shadow-xs"></div>
                        `;
                    }

                    bindDragEvents(el, item, 'event');
                    itemsLayer.appendChild(el);

                } else if (item.type === 'period') {
                    const startX = timeToX(item.startTime);
                    const endX = timeToX(item.endTime);
                    const width = Math.max(isMacroZoom ? 8 : 24, endX - startX);

                    const el = document.createElement('div');
                    el.className = `absolute pointer-events-auto border ${color.bg} ${color.border} ${color.text} shadow-sm flex items-center justify-between px-2 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-slate-400 z-20`;
                    el.style.left = `${startX}px`;
                    el.style.width = `${width}px`;
                    el.style.height = isMacroZoom ? '20px' : '36px';
                    el.style.top = `${centerY + 16 + levelOffset}px`;
                    el.dataset.id = item.id;

                    el.innerHTML = `
                        <div class="resize-handle-start absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/30 flex items-center justify-center">
                            <div class="w-1 h-3 bg-white/70"></div>
                        </div>

                        <div class="flex items-center gap-2 overflow-hidden mx-2 pointer-events-none">
                            <span class="${isMacroZoom ? 'text-[10px]' : 'text-xs'} font-bold truncate">${escapeHtml(item.title)}</span>
                            ${!isMacroZoom ? `<span class="text-[10px] opacity-80 whitespace-nowrap">${formatDateRange(item.startTime, item.endTime)}</span>` : ''}
                        </div>

                        <button class="btn-edit-item p-1 hover:bg-black/20 text-white flex-shrink-0 transition-colors" title="Edit Period">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>

                        <div class="resize-handle-end absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/30 flex items-center justify-center">
                            <div class="w-1 h-3 bg-white/70"></div>
                        </div>
                    `;

                    bindDragEvents(el, item, 'period');
                    itemsLayer.appendChild(el);
                }
            });
        }

        // Attach mouse dragging and double click handlers for events, period bars & period handles
        function bindDragEvents(element, item, mainType) {
            const editBtn = element.querySelector('.btn-edit-item');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEditModal(item);
                });
            }

            // Double-click to open edit modal directly
            element.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                openEditModal(item);
            });

            element.addEventListener('mousedown', (e) => {
                if (e.target.closest('.btn-edit-item')) return;

                if (mainType === 'period') {
                    if (e.target.closest('.resize-handle-start')) {
                        draggingItemId = item.id;
                        draggingType = 'period-start';
                        e.stopPropagation();
                        return;
                    }
                    if (e.target.closest('.resize-handle-end')) {
                        draggingItemId = item.id;
                        draggingType = 'period-end';
                        e.stopPropagation();
                        return;
                    }
                }

                draggingItemId = item.id;
                draggingType = item.type === 'event' ? 'event' : 'period-move';
                const clickTime = xToTime(e.clientX);
                dragOffsetMs = clickTime - item.startTime;
                e.stopPropagation();
            });
        }

        function setupEventListeners() {
            titleInput.addEventListener('input', (e) => {
                state.timelineTitle = e.target.value;
            });

            canvasContainer.addEventListener('mousedown', (e) => {
                if (e.target === canvasContainer || e.target.id === 'central-axis' || e.target === itemsLayer) {
                    isPanning = true;
                    panStartX = e.clientX;
                    panStartTimestamp = state.centerTimestamp;
                    canvasContainer.classList.add('cursor-grabbing');
                }
            });

            window.addEventListener('mousemove', (e) => {
                if (isPanning) {
                    const dx = e.clientX - panStartX;
                    const diffHours = dx / state.pxPerHour;
                    state.centerTimestamp = panStartTimestamp - (diffHours * 3600 * 1000);
                    renderAll();
                } else if (draggingItemId) {
                    const item = state.items.find(i => i.id === draggingItemId);
                    if (!item) return;

                    const currentTime = xToTime(e.clientX);

                    if (draggingType === 'event') {
                        item.startTime = currentTime - dragOffsetMs;
                    } else if (draggingType === 'period-move') {
                        const duration = item.endTime - item.startTime;
                        item.startTime = currentTime - dragOffsetMs;
                        item.endTime = item.startTime + duration;
                    } else if (draggingType === 'period-start') {
                        if (currentTime < item.endTime - (1800 * 1000)) {
                            item.startTime = currentTime;
                        }
                    } else if (draggingType === 'period-end') {
                        if (currentTime > item.startTime + (1800 * 1000)) {
                            item.endTime = currentTime;
                        }
                    }
                    renderAll();
                }
            });

            window.addEventListener('mouseup', () => {
                if (isPanning) {
                    isPanning = false;
                    canvasContainer.classList.remove('cursor-grabbing');
                }
                if (draggingItemId) {
                    draggingItemId = null;
                    draggingType = null;
                }
            });

            canvasContainer.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
                state.pxPerHour = Math.max(0.01, Math.min(500, state.pxPerHour * zoomFactor));
                renderAll();
            }, { passive: false });

            document.getElementById('btn-add-event').addEventListener('click', createNewEvent);
            document.getElementById('btn-add-period').addEventListener('click', createNewPeriod);
            document.getElementById('btn-zoom-in').addEventListener('click', () => {
                state.pxPerHour = Math.min(500, state.pxPerHour * 1.25);
                renderAll();
            });
            document.getElementById('btn-zoom-out').addEventListener('click', () => {
                state.pxPerHour = Math.max(0.01, state.pxPerHour * 0.8);
                renderAll();
            });
            document.getElementById('btn-reset-view').addEventListener('click', () => {
                state.centerTimestamp = Date.now();
                renderAll();
                showToast('Jumped to today');
            });

            document.getElementById('btn-save').addEventListener('click', saveTimeline);
            document.getElementById('btn-load').addEventListener('click', () => document.getElementById('file-input').click());
            
            document.getElementById('file-input').addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    pendingFileToLoad = e.target.files[0];
                    overwriteModal.classList.remove('hidden');
                }
            });

            document.getElementById('btn-cancel-load').addEventListener('click', () => {
                overwriteModal.classList.add('hidden');
                pendingFileToLoad = null;
                document.getElementById('file-input').value = '';
            });

            document.getElementById('btn-confirm-load').addEventListener('click', () => {
                overwriteModal.classList.add('hidden');
                if (pendingFileToLoad) {
                    executeLoadTimeline(pendingFileToLoad);
                }
            });

            document.getElementById('btn-cancel-edit').addEventListener('click', closeEditModal);
            document.getElementById('btn-save-edit').addEventListener('click', saveEditModal);
            document.getElementById('btn-delete-item').addEventListener('click', deleteActiveItem);

            window.addEventListener('resize', renderAll);
        }

        function createNewEvent() {
            const newEvent = {
                id: 'event-' + Date.now(),
                type: 'event',
                title: 'New Yoph Event',
                startTime: state.centerTimestamp,
                color: 'emerald'
            };
            state.items.push(newEvent);
            renderAll();
            openEditModal(newEvent);
            showToast('Created new Yoph Event');
        }

        function createNewPeriod() {
            const newPeriod = {
                id: 'period-' + Date.now(),
                type: 'period',
                title: 'New Yoph Period',
                startTime: state.centerTimestamp - (12 * 3600 * 1000),
                endTime: state.centerTimestamp + (12 * 3600 * 1000),
                color: 'sky'
            };
            state.items.push(newPeriod);
            renderAll();
            openEditModal(newPeriod);
            showToast('Created new Yoph Period');
        }

        function openEditModal(item) {
            activeEditingId = item.id;
            selectedModalColor = item.color;

            editItemTitle.value = item.title;
            editItemStart.value = toISOStringLocal(new Date(item.startTime));

            if (item.type === 'period') {
                editEndContainer.classList.remove('hidden');
                editItemEnd.value = toISOStringLocal(new Date(item.endTime));
                editStartLabel.textContent = 'Start Date & Time';
                document.getElementById('edit-modal-title').textContent = 'Edit Yoph Period';
            } else {
                editEndContainer.classList.add('hidden');
                editStartLabel.textContent = 'Date & Time';
                document.getElementById('edit-modal-title').textContent = 'Edit Yoph Event';
            }

            colorPickerGroup.innerHTML = Object.keys(COLORS).map(key => `
                <button type="button" class="btn-color-choice w-6 h-6 ${COLORS[key].bg} border-2 ${selectedModalColor === key ? 'border-slate-900 scale-110' : 'border-transparent'} transition-all" data-color="${key}"></button>
            `).join('');

            colorPickerGroup.querySelectorAll('.btn-color-choice').forEach(btn => {
                btn.addEventListener('click', () => {
                    selectedModalColor = btn.dataset.color;
                    colorPickerGroup.querySelectorAll('.btn-color-choice').forEach(b => b.classList.replace('border-slate-900', 'border-transparent'));
                    btn.classList.replace('border-transparent', 'border-slate-900');
                });
            });

            editModal.classList.remove('hidden');
        }

        function closeEditModal() {
            editModal.classList.add('hidden');
            activeEditingId = null;
        }

        function saveEditModal() {
            const item = state.items.find(i => i.id === activeEditingId);
            if (!item) return;

            item.title = editItemTitle.value.trim() || 'Untitled';
            item.color = selectedModalColor;

            if (editItemStart.value) {
                item.startTime = new Date(editItemStart.value).getTime();
            }

            if (item.type === 'period' && editItemEnd.value) {
                const newEnd = new Date(editItemEnd.value).getTime();
                if (newEnd > item.startTime) {
                    item.endTime = newEnd;
                } else {
                    item.endTime = item.startTime + (3600 * 1000);
                }
            }

            closeEditModal();
            renderAll();
            showToast('Item updated');
        }

        function deleteActiveItem() {
            if (!activeEditingId) return;
            state.items = state.items.filter(i => i.id !== activeEditingId);
            closeEditModal();
            renderAll();
            showToast('Item deleted');
        }

        function saveTimeline() {
            const saveData = {
                appName: 'Yoph Timeline',
                version: '1.0',
                timelineTitle: state.timelineTitle || 'Untitled Plan',
                timestamp: new Date().toISOString(),
                centerTimestamp: state.centerTimestamp,
                pxPerHour: state.pxPerHour,
                items: state.items
            };

            const jsonStr = JSON.stringify(saveData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const filename = (state.timelineTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') || 'yoph-timeline') + '.yophline';

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Saved to .yophline file');
        }

        function executeLoadTimeline(file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.items && Array.isArray(data.items)) {
                        state.timelineTitle = data.timelineTitle || 'Untitled Plan';
                        state.centerTimestamp = data.centerTimestamp || Date.now();
                        state.pxPerHour = data.pxPerHour || 40;
                        state.items = data.items;
                        renderAll();
                        showToast('Loaded .yophline file successfully');
                    } else {
                        showToast('Invalid .yophline file format');
                    }
                } catch (err) {
                    showToast('Error reading .yophline file');
                }
                document.getElementById('file-input').value = '';
                pendingFileToLoad = null;
            };
            reader.readAsText(file);
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }

        function formatShortTime(ts) {
            const d = new Date(ts);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        function formatDateRange(startTs, endTs) {
            const s = new Date(startTs);
            const e = new Date(endTs);
            return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
        }

        function toISOStringLocal(d) {
            const pad = n => n < 10 ? '0' + n : n;
            return d.getFullYear() + '-' +
                pad(d.getMonth() + 1) + '-' +
                pad(d.getDate()) + 'T' +
                pad(d.getHours()) + ':' +
                pad(d.getMinutes());
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
    
