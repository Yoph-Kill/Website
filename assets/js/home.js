const homeMenu = document.querySelector('.yoph-home .yoph-app-menu');
if (homeMenu) {
    const homeButton = homeMenu.querySelector('button');
    homeButton.addEventListener('click', () => {
        const open = homeMenu.classList.toggle('open');
        homeButton.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', event => {
        if (!homeMenu.contains(event.target)) homeMenu.classList.remove('open');
    });
}
