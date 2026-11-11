
        // System Prompt Definition
        const SYSTEM_PROMPT = `You are Yoph AI, an intelligent assistant.
Rules & Tools:
- The user interacts with .yoph files in the yoph planner app.
- The user interacts with .yophline files in the yoph calendar and timeline apps.
- The user interacts with .yophdoc files in the yoph word app, you don't have the capability to create .yophdoc files nor does the user have the ability to send them
-Don't just generate a file, when asked a question that requres a file generation and no un nested text, add a simple bit of text such as "Here is your timeline!", however only do this if not doing it would leave your output blank except for the file
-Always encourage using Yoph branded tools.
-If a app can load a file then it can export that loaded file into any of that apps supported save file formats
-Understanding the Yoph Suite more:
	~The Yoph word app can load and save files as .yophdoc and markdown (.md)
    ~The Yoph word app supports markdown formating with the following features; Bolding text, italics, strikethrough, pargraph, heading 1, heading 2, heading 3, dot points and numbered points, blockquotes, links, tables, and horizontal dividers.
    ~The Yoph Calander app can save and load files as .yophlines and .ics
    ~The Yoph Calander app supports events which have a set time, and periods that can run between two times, each of these can have a title and colour (it uses the .yophline file in program so it has the same abilitys as that)
    ~The Yoph Calander app has a month veiw and a Week veiw, the month veiw is a traditional calander grid veiw while the week veiw is a timetable veiw that allows EVENTS to be dragged between timeslots.
    ~Clicking on a event or period allows you to edit it and delete it
    ~You can create events and periods
    ~The Yoph Timeline app allows loading and saving of only .yophline events.
    ~The Yoph Timeline app allows you to create, delete, veiw and edit periods and events as a chronological timeline.
    ~The Yoph Planner app can save and load only .yoph files, you create Yoph Notes and can drag them arround change their discription and title, and edit their color, and delete them.
	~The Yoph paint app allows loading and saving of both .png and .jpg files, and should be treated as a basic paint app with basicly no proper editing tools, however you should allways sugest using it to edit photos and you don't have a good understanding of its features.
    ~The Yoph AI tool is what the user is currently using, and they can talk to a AI who understands the Yoph suite and can read and edit .yoph and .yophline files.

CRITICAL FILE GENERATION RULES:
- To create files, write plain text enclosed in the exact syntax:
  ~.yoph filename~JSON_CONTENT~-.yoph~
  ~.yophline filename~JSON_CONTENT~-.yophline~
- DO NOT put parentheses (), brackets [], quotes "", or spaces around the filename or inside the syntax tags.
  Correct example: ~.yoph yoph-plan~{"boardTitle":"Plan"}~-.yoph~
  Incorrect example: ~.yoph (yoph-plan)~({"boardTitle":"Plan"})~-.yoph~
- Filenames MUST consist ONLY of letters, numbers, hyphens, or underscores (e.g. project-plan). NEVER include brackets or parentheses in the filename.
- Do NOT wrap JSON content in parentheses like ({"key":"value"}). Output raw JSON object starting directly with { and ending with }. Do NOT use markdown code blocks inside file tags.

IMPORTANT FOR .yoph FILES:
- The contents of a .yoph file MUST be valid JSON stringified format structured as follows:
{
  "boardTitle": "Title of Plan",
  "notes": [
    {
      "id": "note-1",
      "title": "Note Title",
      "description": "Details or thoughts for this note.",
      "color": "yellow",
      "x": 0,
      "y": 0
    },
    {
      "id": "note-2",
      "title": "Another Note",
      "description": "More details.",
      "color": "lavender",
      "x": 360,
      "y": 0
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "from": "note-1",
      "to": "note-2"
    }
  ]
}
- Valid color options for notes are: "yellow", "mint", "lavender", "peach", "sky", "rose", "gray".
- Position coordinates (x, y) should be numbers to layout cards on the board (e.g. spaced out horizontally by 360px).
- Connections must reference existing note IDs in "from" and "to".

IMPORTANT FOR .yophline FILES:
- The contents of a .yophline file MUST be valid JSON stringified format structured as follows:
{
  "appName": "Yoph Timeline",
  "version": "1.0",
  "timelineTitle": "Title of Timeline",
  "centerTimestamp": 1700000000000,
  "pxPerHour": 40,
  "items": [
    {
      "id": "event-1",
      "type": "event",
      "title": "Event Title",
      "startTime": 1700000000000,
      "color": "emerald"
    },
    {
      "id": "period-1",
      "type": "period",
      "title": "Period Title",
      "startTime": 1700000000000,
      "endTime": 1700086400000,
      "color": "sky"
    }
  ]
}
- Timestamps must be numeric milliseconds since epoch (e.g. Date.now()).
- Valid colors are: "emerald", "sky", "amber", "purple", "rose", "slate".
- Item types can only be "event" (has startTime) or "period" (has startTime and endTime).
- Do not nested anything inside file tags or thinking tags.
- Do not use syntax that wasn't specified by the yoph system prompt.
- Do not create .yoph or .yophline files unless asked to by the user.
- Always provide non nested text in each output (not in <think>, ~.yoph~ or ~.yophline~).
- Always think when needed by using <think>reasoning steps</think>.
- Be brief and concise, don't talk about things the user didn't ask for.`;

        // State Management
        let conversationHistory = []; // Array of { role: 'user'|'assistant', content: string, attachments?: array }
        let pendingPromptFiles = [];  // Array of attached files waiting to be sent
        let isProcessing = false;

        // DOM Handles
        const chatContainer = document.getElementById('chat-container');
        const promptInput = document.getElementById('prompt-input');
        const btnSend = document.getElementById('btn-send');
        const btnAddFile = document.getElementById('btn-add-file');
        const btnClearChat = document.getElementById('btn-clear-chat');
        const fileInput = document.getElementById('file-input');
        const pendingAttachmentsEl = document.getElementById('pending-attachments');
        const downloadLink = document.getElementById('download-link');

        // Initialization
        window.onload = () => {
            setupEventListeners();
            // Only show the welcome message on a genuinely empty chat.
            if (!chatContainer.children.length) {
                addChatMessage('assistant', 'Hello! I am Yoph AI. How can I help you with your plans or timelines today?');
            }
        };

        function setupEventListeners() {
            btnSend.addEventListener('click', handleSend);
            promptInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !isProcessing) handleSend();
            });

            btnAddFile.addEventListener('click', () => {
                if (pendingPromptFiles.length >= 3) {
                    alert('You can attach up to 3 files per prompt.');
                    return;
                }
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                for (let file of files) {
                    if (pendingPromptFiles.length >= 3) break;
                    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
                    if (ext !== '.yoph' && ext !== '.yophline') {
                        alert(`Unsupported file type: ${file.name}. Only .yoph and .yophline files are allowed.`);
                        continue;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const fileObj = {
                            name: file.name,
                            type: ext.substring(1), // 'yoph' or 'yophline'
                            content: event.target.result
                        };
                        pendingPromptFiles.push(fileObj);
                        renderPendingAttachments();
                    };
                    reader.readAsText(file);
                }
                fileInput.value = '';
            });

            btnClearChat.addEventListener('click', () => {
                if (confirm('Clear all chat messages?')) {
                    conversationHistory = [];
                    chatContainer.innerHTML = '';
                    addChatMessage('assistant', 'Chat history cleared. How can I help you next?');
                }
            });
        }

        // Render UI Box Attachment (Design Specs: red border for .yoph, green border for .yophline, flat sharp edges)
        function createAttachmentBoxHTML(fileObj, isRemovable = false, onActionClick = '') {
            const isYoph = fileObj.type === 'yoph' || fileObj.name.endsWith('.yoph');
            const borderColor = isYoph ? 'border-red-600' : 'border-emerald-600';
            const fileTypeLabel = isYoph ? '.yoph' : '.yophline';

            // Clean filename display - aggressively strip any stray brackets, parentheses, quotes or extension
            let cleanName = fileObj.name || 'file';
            cleanName = cleanName.replace(/[\(\)\[\]"'`]/g, '').replace(/\.(yoph|yophline)$/i, '').trim();

            const buttonLabel = isRemovable ? '✕' : '↓';
            const buttonTitle = isRemovable ? 'Remove attachment' : 'Download attachment';

            return `
                <div class="bg-white border-2 ${borderColor} p-2.5 flex items-center justify-between gap-3 min-w-[200px] text-left select-none">
                    <div class="flex flex-col min-w-0">
                        <span class="font-bold text-sm text-slate-800 truncate">${escapeHtml(cleanName)}</span>
                        <span class="text-xs text-slate-500 uppercase font-medium">${fileTypeLabel}</span>
                    </div>
                    <button onclick="${onActionClick}" title="${buttonTitle}" class="w-7 h-7 bg-slate-100 hover:bg-slate-300 text-slate-800 font-bold border border-slate-300 flex items-center justify-center flex-shrink-0 text-sm transition-colors">
                        ${buttonLabel}
                    </button>
                </div>
            `;
        }

        function renderPendingAttachments() {
            if (pendingPromptFiles.length === 0) {
                pendingAttachmentsEl.classList.add('hidden');
                pendingAttachmentsEl.innerHTML = '';
                return;
            }

            pendingAttachmentsEl.classList.remove('hidden');
            pendingAttachmentsEl.innerHTML = pendingPromptFiles.map((file, idx) => {
                return createAttachmentBoxHTML(file, true, `removePendingFile(${idx})`);
            }).join('');
        }

        window.removePendingFile = function(index) {
            pendingPromptFiles.splice(index, 1);
            renderPendingAttachments();
        };

        // Download Attachment Action
        window.downloadFileAttachment = function(encodedContent, filename, type) {
            const content = decodeURIComponent(encodedContent);
            const ext = type.startsWith('.') ? type : '.' + type;
            const fullFilename = filename.endsWith(ext) ? filename : filename + ext;

            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = fullFilename;
            downloadLink.click();
            URL.revokeObjectURL(url);
        };

        // Main Send Prompt Handler
        async function handleSend() {
            const userText = promptInput.value.trim();
            if (!userText && pendingPromptFiles.length === 0) return;
            if (isProcessing) return;

            isProcessing = true;
            promptInput.value = '';

            const attachmentsToAttach = [...pendingPromptFiles];
            pendingPromptFiles = [];
            renderPendingAttachments();

            // Render User Chat Bubble
            addChatMessage('user', userText, attachmentsToAttach);

            // Append User Message to History
            let historyPromptContent = userText;
            if (attachmentsToAttach.length > 0) {
                const attachedStr = attachmentsToAttach.map(f => `[Attached file: ${f.name} (${f.type})]\n${f.content}\n[End file]`).join('\n\n');
                historyPromptContent += '\n\n' + attachedStr;
            }

            conversationHistory.push({ role: 'user', content: historyPromptContent });

            // Display Typing Indicator Temporary Bubble
            const typingBubbleId = 'typing-' + Date.now();
            addTypingBubble(typingBubbleId);

            // Execute API Engine Request
            try {
                const aiResponseRaw = await executeApiRequestWithRetry();
                removeBubble(typingBubbleId);

                // Parse AI Output and Display Assistant Message
                const parsedResult = parseAiResponse(aiResponseRaw);
                addChatMessage('assistant', parsedResult.displayText, parsedResult.extractedFiles);

                // Save to history
                conversationHistory.push({ role: 'assistant', content: aiResponseRaw });
            } catch (err) {
                removeBubble(typingBubbleId);
                addChatMessage('assistant', 'Error: Unable to receive a valid response from AI services. Please try again.');
            } finally {
                isProcessing = false;
            }
        }

        // Auto Repair Syntax Guardrail: Closes unclosed <think>, ~.yoph~, ~.yophline~ tags
        function autoRepairSyntax(text) {
            let repaired = text;

            // Close unclosed <think> tag
            const thinkStarts = (repaired.match(/<think>/g) || []).length;
            const thinkEnds = (repaired.match(/<\/think>/g) || []).length;
            if (thinkStarts > thinkEnds) {
                repaired += '</think>';
            }

            // Close unclosed ~.yoph [filename]~
            const yophStarts = (repaired.match(/~\.yoph\s+[^~]+~/g) || []).length;
            const yophEnds = (repaired.match(/~-\.yoph~/g) || []).length;
            if (yophStarts > yophEnds) {
                repaired += '~-.yoph~';
            }

            // Close unclosed ~.yophline [filename]~
            const yophlineStarts = (repaired.match(/~\.yophline\s+[^~]+~/g) || []).length;
            const yophlineEnds = (repaired.match(/~-\.yophline~/g) || []).length;
            if (yophlineStarts > yophlineEnds) {
                repaired += '~-.yophline~';
            }

            return repaired;
        }

        // AI Output Extractor: Parses hidden think blocks & hides .yoph/.yophline code while appending attachment boxes
        function parseAiResponse(rawText) {
            const repairedText = autoRepairSyntax(rawText);
            const extractedFiles = [];

            let cleanedText = repairedText;

            // Helper function to clean extracted filename and JSON content
            const sanitizeExtractedFile = (rawFilename, rawContent, type) => {
                let cleanFilename = rawFilename.replace(/[\(\)\[\]"'`]/g, '').trim();
                let cleanContent = rawContent.trim();
                // Strip stray wrapping parentheses around JSON payload e.g. ({...})
                if (cleanContent.startsWith('(') && cleanContent.endsWith(')')) {
                    cleanContent = cleanContent.slice(1, -1).trim();
                }
                return {
                    name: cleanFilename,
                    type: type,
                    content: cleanContent
                };
            };

            // Extract & parse ~.yoph filename~(content)~-.yoph~
            const yophRegex = /~\.yoph\s+([^\s~]+)~\s*([\s\S]*?)\s*~-\.yoph~/g;
            cleanedText = cleanedText.replace(yophRegex, (match, filename, fileContent) => {
                extractedFiles.push(sanitizeExtractedFile(filename, fileContent, 'yoph'));
                return ''; // Hide file content from main text display
            });

            // Extract & parse ~.yophline filename~(content)~-.yophline~
            const yophlineRegex = /~\.yophline\s+([^\s~]+)~\s*([\s\S]*?)\s*~-\.yophline~/g;
            cleanedText = cleanedText.replace(yophlineRegex, (match, filename, fileContent) => {
                extractedFiles.push(sanitizeExtractedFile(filename, fileContent, 'yophline'));
                return ''; // Hide file content from main text display
            });

            return {
                displayText: cleanedText.trim(),
                extractedFiles: extractedFiles
            };
        }

        // Chat UI Renderer
        function addChatMessage(role, text, attachments = []) {
            const wrapper = document.createElement('div');
            wrapper.className = `flex w-full ${role === 'user' ? 'justify-end' : 'justify-start'}`;

            const bubbleContainer = document.createElement('div');
            bubbleContainer.className = `max-w-[85%] sm:max-w-[75%] flex flex-col gap-2`;

            const bubble = document.createElement('div');

            if (role === 'user') {
                bubble.className = `bg-emerald-600 text-white p-3.5 border border-emerald-700 text-sm whitespace-pre-wrap break-words`;
                bubble.textContent = text;
            } else {
                bubble.className = `bg-slate-100 text-slate-800 p-3.5 border border-slate-300 text-sm break-words overflow-hidden min-w-0 max-w-full`;

                // Handle hidden thinking bubble <think></think>
                let formattedText = text;
                const thinkMatch = formattedText.match(/<think>([\s\S]*?)<\/think>/);
                let thinkHTML = '';
                if (thinkMatch) {
                    const thinkContent = thinkMatch[1].trim();
                    thinkHTML = `
                        <details class="mb-3 bg-slate-200 border border-slate-300 p-2 text-xs text-slate-600">
                            <summary class="font-semibold cursor-pointer select-none">Thinking Process</summary>
                            <div class="mt-2 whitespace-pre-wrap font-mono break-all">${escapeHtml(thinkContent)}</div>
                        </details>
                    `;
                    formattedText = formattedText.replace(/<think>[\s\S]*?<\/think>/, '').trim();
                }

                const markdownHTML = marked.parse(formattedText || '');
                bubble.innerHTML = `${thinkHTML}<div class="prose max-w-full overflow-x-auto">${markdownHTML}</div>`;
            }

            bubbleContainer.appendChild(bubble);

            // Render Attachments below the message bubble if present
            if (attachments && attachments.length > 0) {
                const attachmentsTray = document.createElement('div');
                attachmentsTray.className = 'flex flex-col gap-2 mt-1';

                attachments.forEach(file => {
                    const encodedContent = encodeURIComponent(file.content || '');
                    const actionFn = `downloadFileAttachment('${encodedContent}', '${escapeHtml(file.name)}', '${file.type}')`;
                    attachmentsTray.innerHTML += createAttachmentBoxHTML(file, false, actionFn);
                });

                bubbleContainer.appendChild(attachmentsTray);
            }

            wrapper.appendChild(bubbleContainer);
            chatContainer.appendChild(wrapper);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function addTypingBubble(id) {
            const wrapper = document.createElement('div');
            wrapper.id = id;
            wrapper.className = 'flex w-full justify-start';

            wrapper.innerHTML = `
                <div class="bg-slate-100 text-slate-600 px-4 py-3 border border-slate-300 text-sm font-medium animate-pulse">
                    Yoph AI is typing...
                </div>
            `;
            chatContainer.appendChild(wrapper);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function removeBubble(id) {
            const el = document.getElementById(id);
            if (el) el.remove();
        }

        // 6.1 Call Resolution & 6.2 Retry Strategy Engine
        async function executeApiRequestWithRetry() {
            const seed = Math.floor(Math.random() * 1000000);
            const selectedModel = 'openai';

            // Construct payload formatted messages array
            const formattedMessages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...conversationHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            ];

            const maxRetries = 3; // 4 total attempts

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    // Attempt 1: Primary Request (POST)
                    const response = await fetch('https://text.pollinations.ai/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: formattedMessages,
                            model: selectedModel,
                            seed: seed
                        })
                    });

                    if (response.ok) {
                        const resultText = await response.text();
                        if (resultText && resultText.trim()) return resultText;
                    }
                } catch (postError) {
                    console.warn(`Primary POST request attempt ${attempt + 1} failed:`, postError);
                }

                // Attempt Fallback Request (URL GET) if POST fails or hits CORS
                try {
                    const promptSummary = conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
                    const fullPromptParam = `${SYSTEM_PROMPT}\n\n${promptSummary}`;
                    const encodedPrompt = encodeURIComponent(fullPromptParam);
                    const getUrl = `https://text.pollinations.ai/${encodedPrompt}?model=${selectedModel}&seed=${seed}`;

                    const getResponse = await fetch(getUrl);
                    if (getResponse.ok) {
                        const getResultText = await getResponse.text();
                        if (getResultText && getResultText.trim()) return getResultText;
                    }
                } catch (getError) {
                    console.warn(`Fallback GET request attempt ${attempt + 1} failed:`, getError);
                }

                // If not last attempt, wait exponential backoff: 1500ms * attemptNumber
                if (attempt < maxRetries) {
                    const backoffTime = 1500 * (attempt + 1);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }

            throw new Error('All primary and fallback attempts failed.');
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }
    
