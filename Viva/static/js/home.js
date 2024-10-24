// home.js
document.getElementById('menu-button').addEventListener('click', () => {
    const dropdownMenu = document.getElementById('dropdown-menu');
    const hamburger = document.getElementById('hamburger');
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    hamburger.classList.toggle('open');
});

document.addEventListener('click', (event) => {
    const isClickInsideMenu = document.querySelector('.menu').contains(event.target);
    if (!isClickInsideMenu) {
        document.getElementById('dropdown-menu').style.display = 'none';
        document.getElementById('hamburger').classList.remove('open');
    }
});
