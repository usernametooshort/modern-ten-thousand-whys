const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

const STAR_COUNT = 400;
const stars = [];
let mouseX = 0;
let mouseY = 0;
let pixelRatio = window.devicePixelRatio || 1;

function resizeCanvas() {
    canvas.width = window.innerWidth * pixelRatio;
    canvas.height = window.innerHeight * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);
}

function createStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            radius: Math.random() * 1.5 + 0.2,
            speed: Math.random() * 0.4 + 0.05,
            alpha: Math.random() * 0.8 + 0.2
        });
    }
}

function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        const offsetX = (mouseX / window.innerWidth - 0.5) * star.radius * 4;
        const offsetY = (mouseY / window.innerHeight - 0.5) * star.radius * 4;
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x + offsetX, star.y + offsetY, star.radius, 0, Math.PI * 2);
        ctx.fill();
        star.alpha += (Math.random() - 0.5) * 0.01;
        star.alpha = Math.min(Math.max(star.alpha, 0.2), 0.9);
    });
    ctx.globalAlpha = 1;
}

function animate() {
    drawStars();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    createStars();
});

window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

resizeCanvas();
createStars();
animate();

// 章节目录折叠
const chapterToggles = document.querySelectorAll('.chapter-toggle');
chapterToggles.forEach(button => {
    button.addEventListener('click', () => {
        const targetId = `nav-${button.dataset.target}`;
        const list = document.getElementById(targetId);
        if (!list) return;
        const isCollapsed = list.classList.toggle('collapsed');
        button.setAttribute('aria-expanded', (!isCollapsed).toString());
    });
});
