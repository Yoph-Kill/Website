
        // Solid Flat Color Themes matching Yoph Suite
        const COLORS = {
            emerald: { bg: 'bg-emerald-600', border: 'border-emerald-700', text: 'text-white' },
            sky: { bg: 'bg-sky-600', border: 'border-sky-700', text: 'text-white' },
            amber: { bg: 'bg-amber-600', border: 'border-amber-700', text: 'text-white' },
            purple: { bg: 'bg-purple-600', border: 'border-purple-700', text: 'text-white' },
            rose: { bg: 'bg-rose-600', border: 'border-rose-700', text: 'text-white' },
            slate: { bg: 'bg-slate-700', border: 'border-slate-800', text: 'text-white' }
        };

        // Application State
        let state = {
            title: 'My Schedule',
            viewMode: 'month', // 'month' or 'week'
            currentDate: new Date(), // Reference date for Month or Week
            items: [
                {
                    id: 'item-1',
                    type: 'event',
                    title: '🚀 Events are a single time',
                    startTime: new Date().setHours(10, 0, 0, 0),
                    color: 'emerald'
                },
                {
                    id: 'item-2',
                    type: 'period',
                    title: '📅 Periods stretch over time',
                    startTime: new Date(Date.now() - 86400000 * 1).setHours(9, 0, 0, 0),
                    endTime: new Date(Date.now() + 86400000 * 2).setHours(18, 0, 0, 0),
                    color: 'sky'
                },
                {
                    id: 'item-3',
                    type: 'event',
                    title: '🎯 Events can be dragged around in the week veiw',
                    startTime: new Date(Date.now() + 86400000 * 1).setHours(14, 30, 0, 0),
                    color: 'amber'
                }
            ]
        };

        let activeEditingId = null;
        let pendingYophFile = null;
        let pendingIcalAction = null; // 'load' or 'save'
        let selectedModalColor = 'emerald';
        let quickAddTimestamp = null;

        // DOM Elements
        const viewContainer = document.getElementById('view-container');
        const viewLabel = document.getElementById('current-view-label');
        const titleInput = document.getElementById('calendar-title-input');
        const btnViewMonth = document.getElementById('btn-view-month');
        const btnViewWeek = document.getElementById('btn-view-week');

        // Modals
        const editModal = document.getElementById('modal-edit');
        const editItemTitle = document.getElementById('edit-item-title');
        const editItemStart = document.getElementById('edit-item-start');
        const editItemEnd = document.getElementById('edit-item-end');
        const editEndContainer = document.getElementById('edit-end-container');
        const editStartLabel = document.getElementById('edit-start-label');
        const colorPickerGroup = document.getElementById('color-picker-group');

        const quickAddModal = document.getElementById('modal-quick-add');
        const quickAddDateLabel = document.getElementById('quick-add-date-label');
        const overwriteModal = document.getElementById('modal-overwrite');
        const icalNoticeModal = document.getElementById('modal-ical-notice');

        function init() {
            setupEventListeners();
            renderAll();
        }

        function renderAll() {
            titleInput.value = state.title;

            if (state.viewMode === 'month') {
                btnViewMonth.className = 'px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white border-r border-slate-300 transition-colors';
                btnViewWeek.className = 'px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors';
                renderMonthView();
            } else {
                btnViewWeek.className = 'px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white border-l border-slate-300 transition-colors';
                btnViewMonth.className = 'px-3 py-1.5 text-xs font-semibold text-slate-700 border-r border-slate-300 hover:bg-slate-100 transition-colors';
                renderWeekView();
            }
        }

        /* ----------------------------------------------------
           MONTH VIEW RENDERER
           ---------------------------------------------------- */
        function renderMonthView() {
            const year = state.currentDate.getFullYear();
            const month = state.currentDate.getMonth();

            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);

            // Month Label Header
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            viewLabel.textContent = `${monthNames[month]} ${year}`;

            // Calculate Grid Days (Sunday-start grid)
            const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
            const totalDays = lastDayOfMonth.getDate();

            // Calculate exact total rows needed for this month (5 or 6 rows)
            const totalCellsNeeded = startDayOfWeek + totalDays;
            const rowCount = totalCellsNeeded > 35 ? 6 : 5;
            const gridRowsClass = rowCount === 6 ? 'grid-rows-6' : 'grid-rows-5';

            let gridHTML = `
                <div class="w-full h-full flex flex-col">
                    <!-- Day Headers -->
                    <div class="grid grid-cols-7 bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700 text-center py-2 flex-shrink-0">
                        <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
                    </div>
                    <!-- Calendar Days Grid -->
                    <div class="grid grid-cols-7 ${gridRowsClass} flex-1 bg-slate-300 gap-[1px]">
            `;

            // Start timestamp of month display
            const today = new Date();
            const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

            // Previous Month Fillers
            const prevMonthLastDay = new Date(year, month, 0).getDate();
            for (let i = startDayOfWeek - 1; i >= 0; i--) {
                const dayNum = prevMonthLastDay - i;
                gridHTML += `<div class="bg-slate-50/60 p-1.5 text-slate-400 text-xs select-none flex flex-col justify-between opacity-60"><span>${dayNum}</span></div>`;
            }

            // Current Month Days
            for (let day = 1; day <= totalDays; day++) {
                const dayDate = new Date(year, month, day);
                const isToday = isCurrentMonth && today.getDate() === day;

                // Find events & periods for this date
                const dayStart = new Date(year, month, day, 0, 0, 0, 0).getTime();
                const dayEnd = new Date(year, month, day, 23, 59, 59, 999).getTime();

                const dayItems = state.items.filter(item => {
                    if (item.type === 'event') {
                        return item.startTime >= dayStart && item.startTime <= dayEnd;
                    } else if (item.type === 'period') {
                        return item.startTime <= dayEnd && item.endTime >= dayStart;
                    }
                    return false;
                });

                gridHTML += `
                    <div class="month-day-cell bg-white p-1.5 text-xs flex flex-col relative overflow-hidden group hover:bg-slate-50 transition-colors cursor-pointer ${isToday ? 'ring-2 ring-emerald-500 ring-inset' : ''}" data-date="${dayStart}">
                        <div class="flex items-center justify-between mb-1 pointer-events-none">
                            <span class="font-bold ${isToday ? 'bg-emerald-600 text-white px-1.5 py-0.5' : 'text-slate-700'}">${day}</span>
                            <button class="btn-quick-add text-[10px] text-slate-400 hover:text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto" title="Add item on this day">+ Add</button>
                        </div>
                        <div class="flex-1 overflow-y-auto space-y-1">
                `;

                dayItems.forEach(item => {
                    const color = COLORS[item.color] || COLORS.emerald;
                    const isPeriod = item.type === 'period';
                    const formatTime = isPeriod ? 'Period' : new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    gridHTML += `
                        <div class="month-item border ${color.bg} ${color.border} ${color.text} px-1.5 py-1 text-[11px] flex items-center justify-between cursor-pointer hover:brightness-110 shadow-xs" data-id="${item.id}">
                            <div class="truncate font-semibold flex items-center gap-1">
                                <span>${isPeriod ? '↔' : '•'}</span>
                                <span class="truncate">${escapeHtml(item.title)}</span>
                            </div>
                            <span class="text-[9px] opacity-80 ml-1 flex-shrink-0">${formatTime}</span>
                        </div>
                    `;
                });

                gridHTML += `
                        </div>
                    </div>
                `;
            }

            // Next Month Fillers
            const totalCellsSoFar = startDayOfWeek + totalDays;
            const remainingCells = (totalCellsSoFar > 35 ? 42 : 35) - totalCellsSoFar;
            for (let day = 1; day <= remainingCells; day++) {
                gridHTML += `<div class="bg-slate-50/60 p-1.5 text-slate-400 text-xs select-none flex flex-col justify-between opacity-60"><span>${day}</span></div>`;
            }

            gridHTML += `</div></div>`;
            viewContainer.innerHTML = gridHTML;

            // Bind day cell click to jump to Week View
            viewContainer.querySelectorAll('.month-day-cell').forEach(cell => {
                cell.addEventListener('click', (e) => {
                    const dayTs = parseInt(cell.dataset.date);
                    if (dayTs) {
                        state.currentDate = new Date(dayTs);
                        state.viewMode = 'week';
                        renderAll();
                    }
                });
            });

            // Bind item click events in month grid (prevent bubbling to cell)
            viewContainer.querySelectorAll('.month-item').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const item = state.items.find(i => i.id === el.dataset.id);
                    if (item) openEditModal(item);
                });
            });

            // Bind quick add buttons rendered dynamically in month cells
            viewContainer.querySelectorAll('.btn-quick-add').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dayTs = parseInt(btn.closest('[data-date]').dataset.date);
                    openQuickAddModal(dayTs);
                });
            });
        }

        /* ----------------------------------------------------
           WEEK TIMETABLE VIEW RENDERER
           ---------------------------------------------------- */
        function renderWeekView() {
            // Compute Week Start (Sunday)
            const current = new Date(state.currentDate);
            const sunday = new Date(current.setDate(current.getDate() - current.getDay()));
            sunday.setHours(0, 0, 0, 0);

            const saturday = new Date(sunday);
            saturday.setDate(saturday.getDate() + 6);
            saturday.setHours(23, 59, 59, 999);

            // Label Header
            const formatShort = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            viewLabel.textContent = `${formatShort(sunday)} - ${formatShort(saturday)}, ${sunday.getFullYear()}`;

            let weekDays = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(sunday);
                d.setDate(d.getDate() + i);
                weekDays.push(d);
            }

            let weekHTML = `
                <div class="w-full h-full flex flex-col overflow-hidden">
                    <!-- Week Header Bar -->
                    <div class="flex border-b border-slate-300 bg-slate-100 flex-shrink-0 text-xs font-bold text-slate-700">
                        <div class="w-16 py-2 text-center border-r border-slate-300 text-slate-400 flex-shrink-0">GMT</div>
                        <div class="flex-1 grid grid-cols-7 border-r border-slate-300">
            `;

            const today = new Date();
            weekDays.forEach(d => {
                const isToday = today.toDateString() === d.toDateString();
                weekHTML += `
                    <div class="py-2 text-center border-r border-slate-300 ${isToday ? 'bg-emerald-100 text-emerald-800' : ''}">
                        <div>${d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}</div>
                        <div class="text-sm font-bold">${d.getDate()}</div>
                    </div>
                `;
            });

            weekHTML += `
                        </div>
                    </div>

                    <!-- Timetable Scroll Body -->
                    <div class="flex-1 flex overflow-y-auto relative">
                        <!-- Hour Labels Column -->
                        <div class="w-16 bg-slate-50 border-r border-slate-300 flex-shrink-0 text-[11px] font-medium text-slate-500 text-center select-none">
            `;

            for (let hour = 0; hour < 24; hour++) {
                const label = `${hour.toString().padStart(2, '0')}:00`;
                weekHTML += `<div class="h-12 border-b border-slate-200 pt-1 border-r border-slate-300">${label}</div>`;
            }

            weekHTML += `
                        </div>

                        <!-- 7 Days Timetable Grid -->
                        <div class="flex-1 grid grid-cols-7 relative bg-white min-h-[1152px]">
            `;

            // Render Hour Grid lines for days
            for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
                const isTodayColumn = today.toDateString() === weekDays[dayIdx].toDateString();
                weekHTML += `<div class="week-day-column border-r border-slate-200 h-full relative" data-day-ts="${weekDays[dayIdx].getTime()}">`;

                // Red horizontal line indicator for current time
                if (isTodayColumn) {
                    const currentHour = today.getHours();
                    const currentMin = today.getMinutes();
                    const currentTimePx = (currentHour + currentMin / 60) * 48; // 48px per hour

                    weekHTML += `
                        <div class="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style="top: ${currentTimePx}px;">
                            <div class="w-2 h-2 rounded-full bg-rose-600 -ml-1"></div>
                            <div class="flex-1 h-[2px] bg-rose-600 shadow-xs"></div>
                        </div>
                    `;
                }

                for (let hour = 0; hour < 24; hour++) {
                    weekHTML += `<div class="h-12 border-b border-slate-200"></div>`;
                }

                // Render Events & Periods into day columns
                const dayStart = new Date(weekDays[dayIdx]).setHours(0, 0, 0, 0);
                const dayEnd = new Date(weekDays[dayIdx]).setHours(23, 59, 59, 999);

                const dayItems = state.items.filter(item => {
                    if (item.type === 'event') {
                        return item.startTime >= dayStart && item.startTime <= dayEnd;
                    } else if (item.type === 'period') {
                        return item.startTime <= dayEnd && item.endTime >= dayStart;
                    }
                    return false;
                });

                dayItems.forEach(item => {
                    const color = COLORS[item.color] || COLORS.emerald;
                    const dStart = new Date(item.startTime);

                    let topPx = 0;
                    let heightPx = 44; // Ensure full height so titles are not clipped

                    if (item.startTime >= dayStart) {
                        topPx = (dStart.getHours() + dStart.getMinutes() / 60) * 48; // 48px per hour
                    }

                    if (item.type === 'period') {
                        const durationHours = Math.max(0.75, (item.endTime - Math.max(item.startTime, dayStart)) / (3600 * 1000));
                        heightPx = Math.max(44, Math.min(1152 - topPx, durationHours * 48));
                    }

                    const isEvent = item.type === 'event';
                    weekHTML += `
                        <div class="week-item absolute left-1 right-1 border ${color.bg} ${color.border} ${color.text} px-2 py-1 text-xs shadow-sm ${isEvent ? 'cursor-grab active:cursor-grabbing z-20' : 'cursor-pointer z-10'} hover:brightness-110 flex flex-col justify-between overflow-hidden select-none"
                             style="top: ${topPx}px; height: ${heightPx}px;" data-id="${item.id}" ${isEvent ? 'draggable="true"' : ''}>
                            <div class="font-bold leading-tight line-clamp-2 pointer-events-none">${escapeHtml(item.title)}</div>
                            <div class="text-[10px] opacity-85 leading-none mt-0.5 pointer-events-none">${formatShortTime(item.startTime)}</div>
                        </div>
                    `;
                });

                weekHTML += `</div>`;
            }

            weekHTML += `
                        </div>
                    </div>
                </div>
            `;

            viewContainer.innerHTML = weekHTML;

            // Bind drag and drop events for week items
            setupDragAndDrop();

            // Bind week items to edit modal (click without drag)
            let wasDragging = false;
            viewContainer.querySelectorAll('.week-item').forEach(el => {
                el.addEventListener('mousedown', () => { wasDragging = false; });
                el.addEventListener('mousemove', () => { wasDragging = true; });
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (wasDragging) return;
                    const item = state.items.find(i => i.id === el.dataset.id);
                    if (item) openEditModal(item);
                });
            });
        }

        /* ----------------------------------------------------
           DRAG AND DROP FOR WEEK VIEW EVENTS
           ---------------------------------------------------- */
        function setupDragAndDrop() {
            let draggedItemId = null;

            viewContainer.querySelectorAll('.week-item[draggable="true"]').forEach(itemEl => {
                itemEl.addEventListener('dragstart', (e) => {
                    draggedItemId = itemEl.dataset.id;
                    itemEl.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', draggedItemId);
                    e.dataTransfer.effectAllowed = 'move';
                });

                itemEl.addEventListener('dragend', () => {
                    itemEl.classList.remove('dragging');
                    draggedItemId = null;
                });
            });

            viewContainer.querySelectorAll('.week-day-column').forEach(col => {
                col.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                });

                col.addEventListener('drop', (e) => {
                    e.preventDefault();
                    if (!draggedItemId) return;

                    const item = state.items.find(i => i.id === draggedItemId);
                    if (!item || item.type !== 'event') return;

                    const dayTs = parseInt(col.dataset.dayTs);
                    if (!dayTs) return;

                    // Calculate y position relative to column
                    const colRect = col.getBoundingClientRect();
                    const offsetY = Math.max(0, Math.min(e.clientY - colRect.top, 1152));

                    // Convert offsetY (48px per hour) to minutes
                    const totalMinutes = (offsetY / 48) * 60;

                    // Snap to 15-minute intervals (15 mins = 12px)
                    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
                    const hours = Math.floor(snappedMinutes / 60);
                    const minutes = snappedMinutes % 60;

                    // Set new startTime
                    const newDate = new Date(dayTs);
                    newDate.setHours(hours, minutes, 0, 0);
                    item.startTime = newDate.getTime();

                    // Save current vertical scroll position of the timetable body
                    const scrollContainer = viewContainer.querySelector('.overflow-y-auto');
                    const savedScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

                    renderAll();

                    // Restore vertical scroll position after re-rendering
                    const newScrollContainer = viewContainer.querySelector('.overflow-y-auto');
                    if (newScrollContainer) {
                        newScrollContainer.scrollTop = savedScrollTop;
                    }

                    showToast(`Updated event time to ${newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
                });
            });
        }

        /* ----------------------------------------------------
           EVENT & ITEM CREATION / EDITING
           ---------------------------------------------------- */
        function openQuickAddModal(timestamp) {
            quickAddTimestamp = timestamp || Date.now();
            const d = new Date(quickAddTimestamp);
            quickAddDateLabel.textContent = `Adding for ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
            quickAddModal.classList.remove('hidden');
        }

        function createItem(type, baseTimestamp) {
            const start = baseTimestamp ? new Date(baseTimestamp) : new Date(state.currentDate);
            if (!baseTimestamp) start.setHours(10, 0, 0, 0);

            const newItem = {
                id: 'item-' + Date.now(),
                type: type,
                title: type === 'event' ? 'New Yoph Event' : 'New Yoph Period',
                startTime: start.getTime(),
                color: 'emerald'
            };

            if (type === 'period') {
                const end = new Date(start);
                end.setDate(end.getDate() + 2);
                newItem.endTime = end.getTime();
            }

            state.items.push(newItem);
            renderAll();
            openEditModal(newItem);
        }

        function openEditModal(item) {
            activeEditingId = item.id;
            selectedModalColor = item.color || 'emerald';

            document.getElementById('edit-modal-title').textContent = item.type === 'event' ? 'Edit Yoph Event' : 'Edit Yoph Period';
            editItemTitle.value = item.title;

            // Start Datetime string
            editItemStart.value = formatDatetimeInput(item.startTime);

            if (item.type === 'period') {
                editEndContainer.classList.remove('hidden');
                editStartLabel.textContent = 'Start Date & Time';
                editItemEnd.value = formatDatetimeInput(item.endTime || (item.startTime + 86400000));
            } else {
                editEndContainer.classList.add('hidden');
                editStartLabel.textContent = 'Date & Time';
            }

            renderColorPalette();
            editModal.classList.remove('hidden');
        }

        function renderColorPalette() {
            colorPickerGroup.innerHTML = '';
            Object.keys(COLORS).forEach(cKey => {
                const isSel = selectedModalColor === cKey;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `w-7 h-7 ${COLORS[cKey].bg} border-2 ${isSel ? 'border-slate-900 ring-2 ring-slate-400' : 'border-transparent'} transition-all`;
                btn.addEventListener('click', () => {
                    selectedModalColor = cKey;
                    renderColorPalette();
                });
                colorPickerGroup.appendChild(btn);
            });
        }

        function saveEditModal() {
            if (!activeEditingId) return;
            const item = state.items.find(i => i.id === activeEditingId);
            if (!item) return;

            const titleVal = editItemTitle.value.trim();
            if (!titleVal) {
                showToast('Please enter a valid title');
                return;
            }

            item.title = titleVal;
            item.startTime = new Date(editItemStart.value).getTime();
            item.color = selectedModalColor;

            if (item.type === 'period') {
                const endTs = new Date(editItemEnd.value).getTime();
                if (endTs <= item.startTime) {
                    showToast('End time must be after start time');
                    return;
                }
                item.endTime = endTs;
            }

            editModal.classList.add('hidden');
            activeEditingId = null;
            renderAll();
            showToast('Changes saved');
        }

        function deleteActiveItem() {
            if (!activeEditingId) return;
            state.items = state.items.filter(i => i.id !== activeEditingId);
            editModal.classList.add('hidden');
            activeEditingId = null;
            renderAll();
            showToast('Item deleted');
        }

        /* ----------------------------------------------------
           FILE IMPORT / EXPORT (.yophline & .ics)
           ---------------------------------------------------- */
        function saveYophline() {
            const exportData = {
                app: 'Yoph Suite',
                type: 'calendar',
                version: '1.0',
                title: state.title,
                items: state.items
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            downloadFile(blob, `${slugify(state.title)}.yophline`);
            showToast('Saved .yophline file');
        }

        function loadYophlineFile(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.items && Array.isArray(data.items)) {
                        state.title = data.title || 'Loaded Schedule';
                        state.items = data.items;
                        renderAll();
                        showToast('Schedule loaded successfully');
                    } else {
                        showToast('Invalid .yophline file structure');
                    }
                } catch (err) {
                    showToast('Failed to parse .yophline file');
                }
            };
            reader.readAsText(file);
        }

        function exportIcal() {
            let icsLines = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Yoph Suite//Yoph Calendar//EN',
                `X-WR-CALNAME:${state.title}`
            ];

            state.items.forEach(item => {
                icsLines.push('BEGIN:VEVENT');
                icsLines.push(`UID:${item.id}@yophcalendar`);
                icsLines.push(`SUMMARY:${escapeIcal(item.title)}`);
                icsLines.push(`DTSTART:${toIcalFormat(item.startTime)}`);
                if (item.type === 'period' && item.endTime) {
                    icsLines.push(`DTEND:${toIcalFormat(item.endTime)}`);
                } else {
                    icsLines.push(`DTEND:${toIcalFormat(item.startTime + 3600000)}`);
                }
                icsLines.push('END:VEVENT');
            });

            icsLines.push('END:VCALENDAR');
            const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
            downloadFile(blob, `${slugify(state.title)}.ics`);
            showToast('Exported .ics file');
        }

        function loadIcalFile(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const events = parseIcalContent(text);
                    if (events.length > 0) {
                        state.items = [...state.items, ...events];
                        renderAll();
                        showToast(`Imported ${events.length} events from iCal`);
                    } else {
                        showToast('No valid events found in iCal file');
                    }
                } catch (err) {
                    showToast('Error reading iCal file');
                }
            };
            reader.readAsText(file);
        }

        /* ----------------------------------------------------
           EVENT LISTENERS & BINDINGS
           ---------------------------------------------------- */
        function setupEventListeners() {
            // View Mode Switching
            btnViewMonth.addEventListener('click', () => {
                state.viewMode = 'month';
                renderAll();
            });
            btnViewWeek.addEventListener('click', () => {
                state.viewMode = 'week';
                renderAll();
            });

            // Date Navigation
            document.getElementById('btn-nav-prev').addEventListener('click', () => {
                if (state.viewMode === 'month') {
                    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
                } else {
                    state.currentDate.setDate(state.currentDate.getDate() - 7);
                }
                renderAll();
            });

            document.getElementById('btn-nav-next').addEventListener('click', () => {
                if (state.viewMode === 'month') {
                    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
                } else {
                    state.currentDate.setDate(state.currentDate.getDate() + 7);
                }
                renderAll();
            });

            document.getElementById('btn-nav-today').addEventListener('click', () => {
                state.currentDate = new Date();
                renderAll();
            });

            // Title input update
            titleInput.addEventListener('change', (e) => {
                state.title = e.target.value.trim() || 'My Schedule';
            });

            // Add Buttons
            document.getElementById('btn-add-event').addEventListener('click', () => createItem('event'));
            document.getElementById('btn-add-period').addEventListener('click', () => createItem('period'));

            // Quick Add Modal Buttons
            document.getElementById('btn-quick-create-event').addEventListener('click', () => {
                quickAddModal.classList.add('hidden');
                createItem('event', quickAddTimestamp);
            });
            document.getElementById('btn-quick-create-period').addEventListener('click', () => {
                quickAddModal.classList.add('hidden');
                createItem('period', quickAddTimestamp);
            });
            document.getElementById('btn-cancel-quick-add').addEventListener('click', () => {
                quickAddModal.classList.add('hidden');
            });

            // Edit Modal Buttons
            document.getElementById('btn-save-edit').addEventListener('click', saveEditModal);
            document.getElementById('btn-cancel-edit').addEventListener('click', () => editModal.classList.add('hidden'));
            document.getElementById('btn-delete-item').addEventListener('click', deleteActiveItem);

            // Save & Load Dropdown Toggles
            const btnSaveDropdown = document.getElementById('btn-save-dropdown');
            const menuSave = document.getElementById('menu-save');
            const btnLoadDropdown = document.getElementById('btn-load-dropdown');
            const menuLoad = document.getElementById('menu-load');

            btnSaveDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
                menuSave.classList.toggle('hidden');
                menuLoad.classList.add('hidden');
            });

            btnLoadDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
                menuLoad.classList.toggle('hidden');
                menuSave.classList.add('hidden');
            });

            document.addEventListener('click', () => {
                menuSave.classList.add('hidden');
                menuLoad.classList.add('hidden');
            });

            // Save Options
            document.getElementById('btn-save-yoph').addEventListener('click', saveYophline);
            document.getElementById('btn-save-ical').addEventListener('click', () => {
                pendingIcalAction = 'save';
                document.getElementById('ical-modal-description').textContent = 'Exporting as .ics will allow reading this calendar in external calendar programs, but custom Yoph styling will not be preserved.';
                icalNoticeModal.classList.remove('hidden');
            });

            // Load Options
            const fileInputYoph = document.getElementById('file-input-yoph');
            const fileInputIcal = document.getElementById('file-input-ical');

            document.getElementById('btn-load-yoph').addEventListener('click', () => {
                fileInputYoph.value = '';
                fileInputYoph.click();
            });

            fileInputYoph.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    pendingYophFile = e.target.files[0];
                    overwriteModal.classList.remove('hidden');
                }
            });

            document.getElementById('btn-confirm-load').addEventListener('click', () => {
                if (pendingYophFile) {
                    loadYophlineFile(pendingYophFile);
                    pendingYophFile = null;
                }
                overwriteModal.classList.add('hidden');
            });

            document.getElementById('btn-cancel-load').addEventListener('click', () => {
                pendingYophFile = null;
                overwriteModal.classList.add('hidden');
            });

            document.getElementById('btn-load-ical').addEventListener('click', () => {
                pendingIcalAction = 'load';
                document.getElementById('ical-modal-description').textContent = 'Importing standard iCal (.ics) files will parse events into Yoph Calendar. Non-standard color tags and custom period markers will default to standard themes.';
                icalNoticeModal.classList.remove('hidden');
            });

            document.getElementById('btn-confirm-ical').addEventListener('click', () => {
                icalNoticeModal.classList.add('hidden');
                if (pendingIcalAction === 'save') {
                    exportIcal();
                } else if (pendingIcalAction === 'load') {
                    fileInputIcal.value = '';
                    fileInputIcal.click();
                }
            });

            document.getElementById('btn-cancel-ical').addEventListener('click', () => {
                icalNoticeModal.classList.add('hidden');
            });

            fileInputIcal.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    loadIcalFile(e.target.files[0]);
                }
            });
        }

        /* ----------------------------------------------------
           UTILITIES & HELPERS
           ---------------------------------------------------- */
        function formatDatetimeInput(ts) {
            const d = new Date(ts);
            const pad = num => String(num).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }

        function formatShortTime(ts) {
            return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        function escapeHtml(str) {
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function escapeIcal(str) {
            return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
        }

        function slugify(str) {
            return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'schedule';
        }

        function downloadFile(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }

        function showToast(msg) {
            const toast = document.getElementById('toast');
            document.getElementById('toast-message').textContent = msg;
            toast.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(() => {
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 3000);
        }

        function toIcalFormat(ts) {
            const d = new Date(ts);
            const pad = n => String(n).padStart(2, '0');
            return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
        }

        function parseIcalContent(text) {
            const events = [];
            const lines = text.split(/\r\n|\n|\r/);
            let inEvent = false;
            let currentEvent = {};

            lines.forEach(line => {
                if (line.startsWith('BEGIN:VEVENT')) {
                    inEvent = true;
                    currentEvent = { id: 'item-' + Math.random().toString(36).substr(2, 9), type: 'event', color: 'emerald' };
                } else if (line.startsWith('END:VEVENT')) {
                    if (currentEvent.title && currentEvent.startTime) {
                        events.push(currentEvent);
                    }
                    inEvent = false;
                } else if (inEvent) {
                    if (line.startsWith('SUMMARY:')) {
                        currentEvent.title = line.replace('SUMMARY:', '').trim();
                    } else if (line.startsWith('DTSTART:')) {
                        currentEvent.startTime = parseIcalDate(line.replace('DTSTART:', '').trim());
                    } else if (line.startsWith('DTEND:')) {
                        const endTime = parseIcalDate(line.replace('DTEND:', '').trim());
                        if (endTime && currentEvent.startTime && (endTime - currentEvent.startTime > 3600000 * 4)) {
                            currentEvent.type = 'period';
                            currentEvent.endTime = endTime;
                        }
                    }
                }
            });
            return events;
        }

        function parseIcalDate(str) {
            if (!str) return Date.now();
            // Basic ISO / iCal date parser (YYYYMMDDTHHMMSSZ)
            const clean = str.replace(/[^0-9T]/g, '');
            if (clean.length >= 8) {
                const y = parseInt(clean.substr(0, 4));
                const m = parseInt(clean.substr(4, 2)) - 1;
                const d = parseInt(clean.substr(6, 2));
                const hh = clean.length >= 13 ? parseInt(clean.substr(9, 2)) : 0;
                const mm = clean.length >= 15 ? parseInt(clean.substr(11, 2)) : 0;
                return new Date(Date.UTC(y, m, d, hh, mm)).getTime();
            }
            return Date.now();
        }

        // Initialize application on load
        window.onload = init;
    
