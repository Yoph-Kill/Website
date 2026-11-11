
        // Application State
        let state = {
            artworkTitle: 'Untitled Canvas',
            tool: 'brush', // pan, brush, eraser, bucket, line, rect, circle, eyedropper
            color: '#0f172a',
            brushSize: 5,
            brushStyle: 'round', // round, square, highlighter
            scale: 1.0,
            panX: 0,
            panY: 0,
            canvasWidth: 1000,
            canvasHeight: 600,
            undoStack: [],
            redoStack: [],
            maxUndo: 20
        };

        // Drawing & Interaction state
        let isDrawing = false;
        let isPanning = false;
        let panStartX = 0;
        let panStartY = 0;

        let startX = 0;
        let startY = 0;
        let lastX = 0;
        let lastY = 0;

        // DOM elements
        const canvas = document.getElementById('paint-canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        const previewCanvas = document.getElementById('preview-canvas');
        const previewCtx = previewCanvas.getContext('2d');
        
        const canvasWrapper = document.getElementById('canvas-wrapper');
        const workspaceContainer = document.getElementById('workspace-container');
        
        const titleInput = document.getElementById('artwork-title-input');
        const colorPicker = document.getElementById('color-picker');
        const colorHex = document.getElementById('color-hex');
        const brushSizeInput = document.getElementById('brush-size-input');
        const brushStyleSelect = document.getElementById('brush-style');
        const zoomLevelEl = document.getElementById('zoom-level');
        const statusCoords = document.getElementById('status-coords');
        const statusDimensions = document.getElementById('status-dimensions');
        const modalOverwrite = document.getElementById('modal-overwrite');
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');

        // Initialize Paint Application
        function init() {
            setupCanvasSize(state.canvasWidth, state.canvasHeight);
            saveState(); // First initial state for undo
            setupEventListeners();
            updateUI();
        }

        function setupCanvasSize(w, h) {
            state.canvasWidth = w;
            state.canvasHeight = h;

            canvas.width = w;
            canvas.height = h;
            previewCanvas.width = w;
            previewCanvas.height = h;

            // Default white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);

            statusDimensions.textContent = `Canvas: ${w} x ${h}px`;
        }

        function setColor(newColor) {
            state.color = newColor;
            colorPicker.value = newColor;
            colorHex.textContent = newColor.toUpperCase();
        }

        // Undo / Redo Manager
        function saveState() {
            if (state.undoStack.length >= state.maxUndo) {
                state.undoStack.shift();
            }
            state.undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            state.redoStack = []; // Clear redo on new action
            updateUndoRedoButtons();
        }

        function undo() {
            if (state.undoStack.length > 1) {
                state.redoStack.push(state.undoStack.pop());
                const previousState = state.undoStack[state.undoStack.length - 1];
                ctx.putImageData(previousState, 0, 0);
                updateUndoRedoButtons();
                showToast('Undo');
            }
        }

        function redo() {
            if (state.redoStack.length > 0) {
                const nextState = state.redoStack.pop();
                state.undoStack.push(nextState);
                ctx.putImageData(nextState, 0, 0);
                updateUndoRedoButtons();
                showToast('Redo');
            }
        }

        function updateUndoRedoButtons() {
            undoBtn.disabled = state.undoStack.length <= 1;
            redoBtn.disabled = state.redoStack.length === 0;
        }

        // Canvas Coordinates Helper
        function getCanvasCoords(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            return {
                x: Math.round((e.clientX - rect.left) * scaleX),
                y: Math.round((e.clientY - rect.top) * scaleY)
            };
        }

        // Drawing Event Handlers
        function startDrawing(e) {
            if (e.button !== 0) return; // Left click only

            if (state.tool === 'pan') {
                isPanning = true;
                panStartX = e.clientX - state.panX;
                panStartY = e.clientY - state.panY;
                workspaceContainer.classList.add('cursor-grabbing');
                return;
            }
            
            const coords = getCanvasCoords(e);
            startX = coords.x;
            startY = coords.y;
            lastX = coords.x;
            lastY = coords.y;

            if (state.tool === 'eyedropper') {
                pickColor(coords.x, coords.y);
                return;
            }

            if (state.tool === 'bucket') {
                floodFill(coords.x, coords.y, state.color);
                saveState();
                return;
            }

            isDrawing = true;

            if (state.tool === 'brush' || state.tool === 'eraser') {
                drawStroke(coords.x, coords.y);
            }
        }

        function draw(e) {
            if (isPanning) {
                state.panX = e.clientX - panStartX;
                state.panY = e.clientY - panStartY;
                updateTransform();
                return;
            }

            const coords = getCanvasCoords(e);
            statusCoords.textContent = `X: ${coords.x}px, Y: ${coords.y}px`;

            if (!isDrawing) return;

            if (state.tool === 'brush' || state.tool === 'eraser') {
                drawStroke(coords.x, coords.y);
            } else if (['line', 'rect', 'circle'].includes(state.tool)) {
                drawShapePreview(coords.x, coords.y);
            }

            lastX = coords.x;
            lastY = coords.y;
        }

        function stopDrawing(e) {
            if (isPanning) {
                isPanning = false;
                workspaceContainer.classList.remove('cursor-grabbing');
                return;
            }

            if (!isDrawing) return;
            isDrawing = false;

            const coords = getCanvasCoords(e);

            // Finalize shape tools to main canvas
            if (['line', 'rect', 'circle'].includes(state.tool)) {
                clearPreview();
                drawShape(ctx, startX, startY, coords.x, coords.y, state.tool);
            }

            saveState();
        }

        function drawStroke(x, y) {
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);

            if (state.tool === 'eraser') {
                ctx.strokeStyle = '#ffffff';
                ctx.globalCompositeOperation = 'source-over';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = state.brushSize;
            } else {
                ctx.strokeStyle = state.color;
                ctx.globalCompositeOperation = 'source-over';
                
                if (state.brushStyle === 'square') {
                    ctx.lineCap = 'square';
                    ctx.lineJoin = 'miter';
                } else if (state.brushStyle === 'highlighter') {
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.globalAlpha = 0.3; // Soft highlighter effect
                } else {
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                }
                ctx.lineWidth = state.brushSize;
            }

            ctx.stroke();
            ctx.globalAlpha = 1.0; // Reset alpha
        }

        function drawShapePreview(currentX, currentY) {
            clearPreview();
            drawShape(previewCtx, startX, startY, currentX, currentY, state.tool);
        }

        function drawShape(targetCtx, x1, y1, x2, y2, tool) {
            targetCtx.beginPath();
            targetCtx.strokeStyle = state.color;
            targetCtx.lineWidth = state.brushSize;
            targetCtx.lineCap = 'round';

            if (tool === 'line') {
                targetCtx.moveTo(x1, y1);
                targetCtx.lineTo(x2, y2);
            } else if (tool === 'rect') {
                const w = x2 - x1;
                const h = y2 - y1;
                targetCtx.rect(x1, y1, w, h);
            } else if (tool === 'circle') {
                const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                targetCtx.arc(x1, y1, radius, 0, 2 * Math.PI);
            }

            targetCtx.stroke();
        }

        function clearPreview() {
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        }

        // Color Eyedropper
        function pickColor(x, y) {
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
            setColor(hex);
            showToast(`Color picked: ${hex.toUpperCase()}`);
        }

        // Flood Fill Bucket Tool
        function floodFill(startX, startY, fillColorHex) {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            const targetColor = getPixelColor(data, startX, startY, canvas.width);
            const fillColor = hexToRgba(fillColorHex);

            if (colorsMatch(targetColor, fillColor)) return;

            const pixelStack = [[startX, startY]];
            const width = canvas.width;
            const height = canvas.height;

            while (pixelStack.length > 0) {
                const [x, y] = pixelStack.pop();
                let currentY = y;

                while (currentY >= 0 && colorsMatch(getPixelColor(data, x, currentY, width), targetColor)) {
                    currentY--;
                }
                currentY++;

                let reachLeft = false;
                let reachRight = false;

                while (currentY < height && colorsMatch(getPixelColor(data, x, currentY, width), targetColor)) {
                    setPixelColor(data, x, currentY, width, fillColor);

                    if (x > 0) {
                        if (colorsMatch(getPixelColor(data, x - 1, currentY, width), targetColor)) {
                            if (!reachLeft) {
                                pixelStack.push([x - 1, currentY]);
                                reachLeft = true;
                            }
                        } else if (reachLeft) {
                            reachLeft = false;
                        }
                    }

                    if (x < width - 1) {
                        if (colorsMatch(getPixelColor(data, x + 1, currentY, width), targetColor)) {
                            if (!reachRight) {
                                pixelStack.push([x + 1, currentY]);
                                reachRight = true;
                            }
                        } else if (reachRight) {
                            reachRight = false;
                        }
                    }

                    currentY++;
                }
            }

            ctx.putImageData(imgData, 0, 0);
        }

        function getPixelColor(data, x, y, width) {
            const index = (y * width + x) * 4;
            return [data[index], data[index + 1], data[index + 2], data[index + 3]];
        }

        function setPixelColor(data, x, y, width, color) {
            const index = (y * width + x) * 4;
            data[index] = color[0];
            data[index + 1] = color[1];
            data[index + 2] = color[2];
            data[index + 3] = 255;
        }

        function colorsMatch(c1, c2) {
            return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3];
        }

        function hexToRgba(hex) {
            let c = hex.replace('#', '');
            if (c.length === 3) c = c.split('').map(x => x + x).join('');
            const num = parseInt(c, 16);
            return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
        }

        // Cursor-Centered Mouse Wheel Zoom Logic
        function handleWheelZoom(e) {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
            const newScale = Math.max(0.1, Math.min(5.0, state.scale * zoomFactor));

            if (newScale === state.scale) return;

            // Get viewport bounding rect of workspace to get accurate cursor position
            const rect = workspaceContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - rect.width / 2;
            const mouseY = e.clientY - rect.top - rect.height / 2;

            // Keep cursor point fixed in world coordinates
            state.panX = mouseX - (mouseX - state.panX) * (newScale / state.scale);
            state.panY = mouseY - (mouseY - state.panY) * (newScale / state.scale);
            state.scale = newScale;

            updateTransform();
        }

        function zoomBy(factor) {
            const newScale = Math.max(0.1, Math.min(5.0, state.scale * factor));
            if (newScale === state.scale) return;

            // Zoom relative to workspace center
            state.panX = - (- state.panX) * (newScale / state.scale);
            state.panY = - (- state.panY) * (newScale / state.scale);
            state.scale = newScale;

            updateTransform();
        }

        function resetZoom() {
            state.scale = 1.0;
            state.panX = 0;
            state.panY = 0;
            updateTransform();
            showToast('Zoom reset to 100%');
        }

        function updateTransform() {
            canvasWrapper.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
            zoomLevelEl.textContent = `${Math.round(state.scale * 100)}%`;
        }

        // Image Loading & Saving Logic
        function loadImage(file) {
            // Extract filename without extension and set artwork title
            const filenameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            state.artworkTitle = filenameWithoutExt;
            titleInput.value = filenameWithoutExt;

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    setupCanvasSize(img.width, img.height);
                    ctx.drawImage(img, 0, 0);
                    saveState();
                    showToast('Image loaded successfully');
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function exportImage(format) {
            const filename = (state.artworkTitle.trim() || 'yoph-artwork') + (format === 'jpeg' ? '.jpg' : '.png');
            
            let dataUrl;
            if (format === 'jpeg') {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.fillStyle = '#ffffff';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(canvas, 0, 0);
                dataUrl = tempCanvas.toDataURL('image/jpeg', 0.92);
            } else {
                dataUrl = canvas.toDataURL('image/png');
            }

            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast(`Saved as ${format.toUpperCase()}`);
        }

        // Setup Event Listeners
        function setupEventListeners() {
            // Artwork Title
            titleInput.addEventListener('input', (e) => {
                state.artworkTitle = e.target.value;
            });

            // Save Dropdown Toggle on Click
            const saveBtn = document.getElementById('btn-save');
            const saveMenu = document.getElementById('save-menu');

            saveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                saveMenu.classList.toggle('hidden');
                saveMenu.classList.toggle('flex');
            });

            // Close Save Dropdown on Click Outside
            window.addEventListener('click', (e) => {
                if (!document.getElementById('save-dropdown-container').contains(e.target)) {
                    saveMenu.classList.add('hidden');
                    saveMenu.classList.remove('flex');
                }
            });

            // Canvas Pointer Drawing & Panning Listeners
            workspaceContainer.addEventListener('mousedown', startDrawing);
            window.addEventListener('mousemove', draw);
            window.addEventListener('mouseup', stopDrawing);

            // Wheel Mouse Zoom
            workspaceContainer.addEventListener('wheel', handleWheelZoom, { passive: false });

            // Tools Selection
            document.querySelectorAll('.btn-tool').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.btn-tool').forEach(b => b.classList.remove('active', 'bg-slate-200'));
                    btn.classList.add('active', 'bg-slate-200');
                    state.tool = btn.dataset.tool;

                    if (state.tool === 'pan') {
                        workspaceContainer.style.cursor = 'grab';
                    } else if (state.tool === 'eyedropper') {
                        workspaceContainer.style.cursor = 'copy';
                    } else {
                        workspaceContainer.style.cursor = 'crosshair';
                    }

                    // Toggle style container visibility based on active tool
                    const styleContainer = document.getElementById('brush-style-container');
                    if (['brush', 'line'].includes(state.tool)) {
                        styleContainer.classList.remove('hidden');
                        styleContainer.classList.add('flex');
                    } else {
                        styleContainer.classList.add('hidden');
                        styleContainer.classList.remove('flex');
                    }
                });
            });

            // Brush Adjustments
            colorPicker.addEventListener('input', (e) => setColor(e.target.value));
            brushSizeInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                state.brushSize = isNaN(val) ? 1 : Math.max(1, Math.min(500, val));
            });
            brushStyleSelect.addEventListener('change', (e) => {
                state.brushStyle = e.target.value;
            });

            // Undo / Redo
            undoBtn.addEventListener('click', undo);
            redoBtn.addEventListener('click', redo);

            // Keyboard Shortcuts
            window.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT') return;
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'z') { e.preventDefault(); undo(); }
                    else if (e.key === 'y') { e.preventDefault(); redo(); }
                }
            });

            // Zoom Controls
            document.getElementById('btn-zoom-in').addEventListener('click', () => zoomBy(1.2));
            document.getElementById('btn-zoom-out').addEventListener('click', () => zoomBy(0.8));
            document.getElementById('btn-reset-view').addEventListener('click', resetZoom);

            // Clear Canvas Modal Trigger
            document.getElementById('btn-clear').addEventListener('click', () => {
                modalOverwrite.classList.remove('hidden');
            });
            document.getElementById('btn-cancel-clear').addEventListener('click', () => {
                modalOverwrite.classList.add('hidden');
            });
            document.getElementById('btn-confirm-clear').addEventListener('click', () => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                saveState();
                modalOverwrite.classList.add('hidden');
                showToast('Canvas cleared');
            });

            // Load Image Trigger
            document.getElementById('btn-load-img').addEventListener('click', () => {
                document.getElementById('file-input').click();
            });
            document.getElementById('file-input').addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    loadImage(e.target.files[0]);
                }
            });

            // Save Image Options
            document.getElementById('save-png').addEventListener('click', () => {
                exportImage('png');
                saveMenu.classList.add('hidden');
                saveMenu.classList.remove('flex');
            });
            document.getElementById('save-jpg').addEventListener('click', () => {
                exportImage('jpeg');
                saveMenu.classList.add('hidden');
                saveMenu.classList.remove('flex');
            });
        }

        function updateUI() {
            colorHex.textContent = state.color.toUpperCase();
            brushSizeInput.value = state.brushSize;
            updateUndoRedoButtons();
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
            }, 2000);
        }

        // Initialize App on Window Load
        window.onload = init;
    
