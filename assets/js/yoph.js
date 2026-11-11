(() => {
    'use strict';

    const apps = [
        ['Home', 'index.html'], ['AI', 'ai.html'], ['Calendar', 'calander.html'],
        ['Paint', 'paint.html'], ['Planner', 'planner.html'], ['Timeline', 'timeline.html'], ['Word', 'word.html']
    ];
    const page = location.pathname.split('/').pop() || 'index.html';
    if (page === 'index.html') return;

    const key = `yoph-${page.replace(/\.html$/i, '')}`;
    const readCookie = name => {
        const match = document.cookie.split('; ').find(item => item.startsWith(`${name}=`));
        if (!match) return null;
        try { return JSON.parse(decodeURIComponent(match.slice(name.length + 1))); } catch { return null; }
    };
    const writeCookie = (name, value) => {
        try {
            const encoded = encodeURIComponent(JSON.stringify(value));
            if (encoded.length > 3800) return false;
            document.cookie = `${name}=${encoded}; max-age=31536000; path=/; SameSite=Lax`;
            return true;
        } catch { return false; }
    };

    function addToolbar() {
        const header = document.querySelector('header');
        const aiFooter = document.querySelector('body > footer');
        if (page === 'ai.html' && !aiFooter) return;
        if (page !== 'ai.html' && !header) return;
        document.body.classList.add('yoph-tool-body');

        let topHost = header;
        let bottom = aiFooter;
        let saveHost;

        if (page === 'ai.html') {
            bottom.classList.add('yoph-toolbar-bottom', 'yoph-ai-toolbar');
            const toolbarRow = document.createElement('div');
            toolbarRow.className = 'yoph-ai-meta-row';
            toolbarRow.setAttribute('aria-label', 'AI toolbar');
            bottom.appendChild(toolbarRow);
            topHost = toolbarRow;
            saveHost = toolbarRow;
        } else {
            header.classList.add('yoph-toolbar-top');
            const isWord = page === 'word.html';
            const existingNav = isWord ? document.querySelector('body > nav') : null;
            bottom = existingNav || document.createElement('nav');
            bottom.classList.add('yoph-toolbar-bottom');
            if (!existingNav) header.after(bottom);
            saveHost = bottom;

            const host = header.querySelector(':scope > div:last-child') || header;
            if (!isWord && host !== header) {
                const topControls = document.createElement('div');
                const lowerControls = document.createElement('div');
                topControls.className = 'yoph-toolbar-controls';
                lowerControls.className = 'yoph-toolbar-controls';
                [...host.children].forEach(child => {
                    const isFileControl = child.matches('input[type="file"]') || child.querySelector('#btn-save, #btn-load, #btn-save-dropdown, #btn-load-dropdown, #btn-load-img, #file-input');
                    (isFileControl ? topControls : lowerControls).appendChild(child);
                });
                const zoomControl = lowerControls.querySelector('#btn-zoom-out, #btn-zoom-in')?.parentElement;
                if (zoomControl) lowerControls.prepend(zoomControl);
                host.replaceWith(topControls);
                header.appendChild(topControls);
                bottom.appendChild(lowerControls);
            }

            const rows = [...header.querySelectorAll('.yoph-toolbar-controls')];
            topHost = rows.length ? rows[rows.length - 1] : header;
        }

        if (!topHost.querySelector('.yoph-shared-actions')) {
            const actions = document.createElement('span');
            actions.className = 'yoph-shared-actions';
            actions.innerHTML = `
                <div class="yoph-app-menu">
                    <button type="button" class="yoph-app-grid" aria-label="Open app selector" aria-expanded="false">
                        <span class="yoph-grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
                    </button>
                    <ul aria-label="Yoph app list"></ul>
                </div>
                <button type="button" class="yoph-clear" title="Clear" aria-label="Clear current tool">
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.9-1.858L5.5 7M10 11v6M14 11v6M3 7h18M8 7l1-2h6l1 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </button>
            `;
            if (document.querySelector('#btn-clear-chat, #btn-clear')) actions.querySelector('.yoph-clear').remove();
            topHost.appendChild(actions);

            const menu = actions.querySelector('.yoph-app-menu');
            const list = menu.querySelector('ul');
            apps.forEach(([label, href]) => {
                const item = document.createElement('li');
                item.innerHTML = `<a href="${href}" ${href === page ? 'aria-current="page"' : ''}>${label}</a>`;
                list.appendChild(item);
            });
            const menuButton = menu.querySelector('button');
            menuButton.addEventListener('click', () => {
                const open = menu.classList.toggle('open');
                menuButton.setAttribute('aria-expanded', String(open));
            });
            document.addEventListener('click', event => {
                if (!menu.contains(event.target)) {
                    menu.classList.remove('open');
                    menuButton.setAttribute('aria-expanded', 'false');
                }
            });
            menu.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    menu.classList.remove('open');
                    menuButton.setAttribute('aria-expanded', 'false');
                    menuButton.focus();
                }
            });

            const clearButton = actions.querySelector('.yoph-clear');
            if (clearButton) {
                clearButton.addEventListener('click', () => {
                    const native = document.querySelector('#btn-clear-chat, #btn-clear');
                    if (native && native !== clearButton) {
                        native.click();
                        return;
                    }
                    if (!confirm('Clear editable content in this Yoph app?')) return;
                    document.querySelectorAll('textarea, [contenteditable="true"]').forEach(el => {
                        if ('value' in el) el.value = '';
                        el.innerHTML = '';
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                    document.querySelectorAll('input[type="text"]:not([data-preserve-clear])').forEach(el => {
                        if (!el.closest('.yoph-shared-actions')) el.value = '';
                    });
                    save();
                });
            }
        }

        if (!saveHost.querySelector('.yoph-save-state')) {
            const indicator = document.createElement('span');
            indicator.className = 'yoph-save-state is-saving';
            indicator.title = 'Saving';
            indicator.setAttribute('aria-label', 'Saving');
            indicator.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">progress_activity</span>';
            saveHost.appendChild(indicator);

            const setState = (saving, label) => {
                indicator.classList.toggle('is-saving', saving);
                indicator.title = label;
                indicator.setAttribute('aria-label', label);
                indicator.innerHTML = `<span class="material-symbols-outlined" aria-hidden="true">${saving ? 'progress_activity' : 'check'}</span>`;
            };
            const markSaving = () => {
                setState(true, 'Saving');
                clearTimeout(window.yophSaveStateTimer);
                window.yophSaveStateTimer = setTimeout(() => { save(); setState(false, 'Saved'); }, 350);
            };
            document.addEventListener('input', markSaving);
            document.addEventListener('change', markSaving);
            setTimeout(() => setState(false, 'Saved'), 500);
        }
    }

    function fields() {
        return [...document.querySelectorAll('input, textarea, select, [contenteditable="true"]')]
            .filter(el => !el.closest('.yoph-shared-actions') && el.type !== 'file' && el.type !== 'password' && el.id);
    }
    function snapshot() {
        const values = {};
        fields().forEach(el => { values[el.id] = el.matches('[contenteditable="true"]') ? el.innerHTML : el.value; });
        const chat = document.querySelector('#chat-container');
        if (chat && chat.innerHTML.length < 2800) values.__chat = chat.innerHTML;
        return values;
    }
    function save() {
        writeCookie(key, snapshot());
    }
    function restore() {
        const values = readCookie(key);
        if (!values) return;
        fields().forEach(el => {
            if (!(el.id in values)) return;
            if (el.matches('[contenteditable="true"]')) el.innerHTML = values[el.id]; else el.value = values[el.id];
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        const chat = document.querySelector('#chat-container');
        if (chat && values.__chat) chat.innerHTML = values.__chat;
    }

    addToolbar();
    restore();
    let timer;
    document.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(save, 350); });
    document.addEventListener('change', save);
    window.addEventListener('beforeunload', save);
})();
