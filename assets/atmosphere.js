(function () {
    const spotlight = document.getElementById('page-spotlight');
    if (!spotlight) return;

    document.addEventListener('pointermove', (event) => {
        document.documentElement.style.setProperty('--mx', `${event.clientX}px`);
        document.documentElement.style.setProperty('--my', `${event.clientY}px`);
    });
})();
