// Переключение вкладок
function switchTab(tabId, button) {
    // Скрываем все секции
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Показываем выбранную секцию
    const activeSection = document.getElementById(tabId);
    activeSection.classList.add('active');

    // Обновляем кнопки навигации
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');

    updateNavIndicator(button);

    // Запускаем счетчики если открыта страница статистики
    if (tabId === 'stats') {
        animateCounters();
    }

    // Добавляем эффект вибрации при переключении
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Анимация счетчиков
function animateCounters(reset = false) {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 секунды
        const step = target / (duration / 16); // 60 FPS
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        // Начинаем только если счетчик в 0 или если принудительно перезапуск
        if (reset || parseInt(counter.textContent) === 0) {
            counter.textContent = '0';
            updateCounter();
        }
    });
}

// Эффект ripple для кнопок
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
        existingRipple.remove();
    }

    button.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Добавляем ripple эффект на кнопки

// Корректная высота экрана на мобильных + учет высоты нижней навигации
function setViewportVars() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    const nav = document.querySelector('.nav');
    if (nav) {
        const navH = nav.getBoundingClientRect().height || 0;
        document.documentElement.style.setProperty('--nav-h', `${Math.ceil(navH)}px`);
    }
}

// Ссылка на форум (поменяй на свою)
const FORUM_URL = 'https://forum.slavyankaroleplay.ru';

// Мониторинг онлайна
const STATUS_URL = 'https://wh27264.web2.maze-tech.ru/cache/status.php';

// IP/порт для копирования (поменяй под свой сервер)
const CONNECT_VALUE = 'your.server.ip:7777';

// Соцсети (поменяй ссылки)
const SOCIAL_LINKS = {
  vk: 'https://vk.com/',
  tg: 'https://t.me/',
  yt: 'https://youtube.com/'
};

// Мониторинг онлайна
let lastOnlineValue = null;
let lastMaxValue = null;

function safeNumber(v){
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
}

function parseStatusPayload(text){
    const out = { online: null, max: null, servers: null };
    if(!text) return out;

    const trimmed = String(text).trim();

    // JSON
    if(trimmed.startsWith('{') || trimmed.startsWith('[')){
        try{
            const j = JSON.parse(trimmed);

            out.online = safeNumber(j.online ?? j.players ?? j.playerOnline ?? j.onl ?? j.count);
            out.max = safeNumber(j.max ?? j.maxplayers ?? j.slots ?? j.limit);

            if(Array.isArray(j.servers)) out.servers = j.servers;
            if(Array.isArray(j.data)) out.servers = j.data;

            if(!out.online && Array.isArray(out.servers)){
                const sum = out.servers.reduce((acc,s)=>{
                    const v = safeNumber(s.online ?? s.players ?? s.count);
                    return acc + (v || 0);
                },0);
                if(sum > 0) out.online = sum;
            }
            return out;
        }catch(e){
            // fallthrough
        }
    }

    // Regex (online=123 / online: 123 / 123)
    const m1 = trimmed.match(/online\D+(\d+)/i);
    if(m1) out.online = safeNumber(m1[1]);

    const m2 = trimmed.match(/max\D+(\d+)/i);
    if(m2) out.max = safeNumber(m2[1]);

    if(!out.online){
        const m3 = trimmed.match(/(\d{1,5})/);
        if(m3) out.online = safeNumber(m3[1]);
    }
    return out;
}

function escapeHtml(str){
    return String(str)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'",'&#039;');
}

function renderServersList(online, max, servers){
    const root = document.getElementById('serverList');
    if(!root) return;

    if(Array.isArray(servers) && servers.length){
        root.innerHTML = servers.slice(0, 8).map((s, idx)=>{
            const name = (s.name || s.title || `Сервер #${idx+1}`).toString();
            const ip = (s.ip || s.address || s.host || '').toString();
            const on = safeNumber(s.online ?? s.players ?? s.count) ?? 0;
            const mx = safeNumber(s.max ?? s.maxplayers ?? s.slots ?? s.limit) ?? max ?? 1000;
            const pct = Math.max(2, Math.min(100, Math.round((on / (mx || 1)) * 100)));
            return `
                <div class="server-item">
                    <div class="server-left">
                        <div class="server-name">${escapeHtml(name)}</div>
                        <div class="server-ip">${escapeHtml(ip || 'Онлайн обновляется')}</div>
                        <div class="server-bar"><div style="width:${pct}%"></div></div>
                    </div>
                    <div class="server-right">
                        <div class="server-online">${on}/${mx}</div>
                    </div>
                </div>
            `;
        }).join('');
        return;
    }

    const mx = max ?? 1000;
    const on = online ?? 0;
    const pct = Math.max(2, Math.min(100, Math.round((on / (mx || 1)) * 100)));
    root.innerHTML = `
        <div class="server-item">
            <div class="server-left">
                <div class="server-name">Сервер #1</div>
                <div class="server-ip">${escapeHtml(CONNECT_VALUE)}</div>
                <div class="server-bar"><div style="width:${pct}%"></div></div>
            </div>
            <div class="server-right">
                <div class="server-online">${on}/${mx}</div>
            </div>
        </div>
    `;
}

function setOnlineUI(online, max, servers){
    const onlineCountEl = document.getElementById('onlineCount');
    if(onlineCountEl){
        onlineCountEl.textContent = online != null ? String(online) : '--';
    }

    // обновляем счетчики в статистике
    const counters = document.querySelectorAll('#stats .counter');
    counters.forEach((el)=>{
        const label = el.parentElement?.querySelector?.('.stat-label')?.textContent?.toLowerCase?.() || '';
        if(label.includes('онлайн')){
            el.setAttribute('data-target', online ?? 0);
            el.textContent = '0';
        }
    });

    // если пользователь сейчас на вкладке stats — анимируем заново
    const statsSection = document.getElementById('stats');
    if(statsSection && statsSection.classList.contains('active')){
        animateCounters(true);
    }

    renderServersList(online, max, servers);
}

async function fetchOnline(){
    try{
        const res = await fetch(STATUS_URL, { cache: 'no-store' });
        const text = await res.text();
        const parsed = parseStatusPayload(text);

        if(parsed.online != null) lastOnlineValue = parsed.online;
        if(parsed.max != null) lastMaxValue = parsed.max;

        setOnlineUI(lastOnlineValue, lastMaxValue, parsed.servers);

        // если ничего не пришло — легкая “жизнь”
        if(parsed.online == null && lastOnlineValue != null){
            const jitter = Math.floor(Math.random()*7) - 3;
            setOnlineUI(Math.max(0, lastOnlineValue + jitter), lastMaxValue, parsed.servers);
        }
    }catch(e){
        // CORS/сеть — показываем последнее значение или --
        if(lastOnlineValue != null){
            const jitter = Math.floor(Math.random()*7) - 3;
            setOnlineUI(Math.max(0, lastOnlineValue + jitter), lastMaxValue, null);
        }else{
            setOnlineUI(null, null, null);
        }
    }
}





document.addEventListener('DOMContentLoaded', () => {
    setViewportVars();
    window.addEventListener('resize', setViewportVars);

    const forumBtn = document.getElementById('forumOpenBtn');
    const forumTxt = document.getElementById('forumUrlText');
    if (forumBtn) forumBtn.href = FORUM_URL;
    if (forumTxt) forumTxt.textContent = FORUM_URL;

    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .payment-btn');
    buttons.forEach(button => {
        button.addEventListener('click', createRipple);
    });

    // Добавляем плавную прокрутку
    document.querySelectorAll('.section').forEach(section => {
        section.style.scrollBehavior = 'smooth';
    });

    // Инициализация индикатора навигации
    const activeBtn = document.querySelector('.nav-btn.active');
    if(activeBtn) updateNavIndicator(activeBtn);

    // Запуск мониторинга онлайна
    fetchOnline();
    setInterval(fetchOnline, 7000);

    // Анимация при загрузке страницы
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);

    // Обработка форм
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('focus', (e) => {
            e.target.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', (e) => {
            if (!e.target.value) {
                e.target.parentElement.classList.remove('focused');
            }
        });
    });

    // Эффект параллакса для фона
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;

        const glows = document.querySelectorAll('.bg-glow');
        glows.forEach((glow, index) => {
            const speed = (index + 1) * 10;
            const x = mouseX * speed;
            const y = mouseY * speed;
            glow.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Эффект наклона для карточек
    const cards = document.querySelectorAll('.stat-card, .news-card, .payment-btn');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });

    // Lazy loading для изображений
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Предотвращение двойного клика на кнопках
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.classList.contains('clicked')) {
                e.preventDefault();
                return false;
            }
            this.classList.add('clicked');
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 1000);
        });
    });
});

// Обработка ошибок изображений
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
    }
}, true);

// Отключение контекстного меню на изображениях
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
    }
});

// Плавное появление элементов при скролле внутри секций
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Применяем наблюдатель к элементам, которые должны появляться
document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.stat-card, .news-card, .feature');
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeInObserver.observe(el);
    });
});

// Эффект печати для заголовков
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Обработка копирования текста
document.addEventListener('copy', (e) => {
    const selection = document.getSelection();
    if (selection.toString()) {
        console.log('Скопирован текст:', selection.toString());
    }
});

// Определение устройства
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
    document.body.classList.add('mobile');
    // Отключаем некоторые эффекты на мобильных для производительности
    document.querySelectorAll('.bg-glow').forEach(glow => {
        glow.style.animation = 'none';
    });
}

// Экспорт функций для использования в HTML
window.switchTab = switchTab;
window.createRipple = createRipple;
window.typeWriter = typeWriter;


function updateNavIndicator(activeButton){
    const indicator = document.getElementById('navIndicator');
    if(!indicator || !activeButton) return;

    const container = activeButton.closest('.nav-container');
    if(!container) return;

    const btnRect = activeButton.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();

    const width = Math.max(34, Math.min(56, btnRect.width * 0.62));
    const x = (btnRect.left - contRect.left) + (btnRect.width - width) / 2;

    indicator.style.width = `${Math.round(width)}px`;
    indicator.style.transform = `translateX(${Math.round(x)}px)`;
}

// ===== Modals / Quick actions =====
let modalEl = null;

function openModal(type){
    closeModal();

    const title = type === 'rules' ? 'Правила' : 'Как начать';
    const body = type === 'rules'
        ? `
            <div>Коротко и по делу:</div>
            <ul>
              <li>Не используйте читы/скрипты — бан навсегда.</li>
              <li>Не оскорбляйте игроков/админов.</li>
              <li>RP-игра: соблюдаем атмосферу и логику.</li>
              <li>Жалобы/апелляции — на форуме.</li>
            </ul>
          `
        : `
            <div>Старт за 30 секунд:</div>
            <ul>
              <li>Нажми <b>НАЧАТЬ ИГРАТЬ</b> и скачай клиент/запусти лаунчер.</li>
              <li>Зайди на сервер по IP (кнопка <b>Скопировать IP</b>).</li>
              <li>Создай персонажа и проходи обучение.</li>
              <li>Хочешь быстрее? Загляни в <b>Донат</b> и поддержи проект.</li>
            </ul>
          `;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
            <div class="modal-header">
                <div class="modal-title">${title}</div>
                <button class="modal-close" type="button" aria-label="Закрыть">✕</button>
            </div>
            <div class="modal-body">${body}</div>
        </div>
    `;

    overlay.addEventListener('click', (e)=>{
        if(e.target === overlay) closeModal();
    });
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);

    document.body.appendChild(overlay);
    modalEl = overlay;

    if (navigator.vibrate) navigator.vibrate(20);
}

function closeModal(){
    if(modalEl){
        modalEl.remove();
        modalEl = null;
    }
}

async function copyConnect(){
    try{
        await navigator.clipboard.writeText(CONNECT_VALUE);
        toast(`IP скопирован: ${CONNECT_VALUE}`);
    }catch(e){
        const t = document.createElement('textarea');
        t.value = CONNECT_VALUE;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        t.remove();
        toast(`IP скопирован: ${CONNECT_VALUE}`);
    }
}

function openSocial(type){
    const url = SOCIAL_LINKS[type] || '#';
    if(url === '#'){
        toast('Ссылка не задана');
        return;
    }
    window.open(url, '_blank', 'noopener');
}

let toastEl = null;
let toastTimer = null;

function toast(text){
    if(toastEl){
        toastEl.remove();
        toastEl = null;
    }
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.bottom = 'calc(88px + env(safe-area-inset-bottom))';
    el.style.transform = 'translateX(-50%)';
    el.style.zIndex = '9999';
    el.style.padding = '12px 14px';
    el.style.borderRadius = '14px';
    el.style.fontWeight = '800';
    el.style.fontSize = '12px';
    el.style.letterSpacing = '.2px';
    el.style.color = '#fff';
    el.style.background = 'rgba(24,24,27,0.92)';
    el.style.border = '1px solid rgba(63,63,70,0.55)';
    el.style.backdropFilter = 'blur(10px)';
    el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.45)';
    el.textContent = text;

    document.body.appendChild(el);
    toastEl = el;

    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{
        if(toastEl){
            toastEl.remove();
            toastEl = null;
        }
    }, 2400);
}

window.openModal = openModal;
window.copyConnect = copyConnect;
window.openSocial = openSocial;
window.updateNavIndicator = updateNavIndicator;
