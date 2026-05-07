const TG_TOKEN   = '8252533453:AAF_LgNzw-sgxGUf0QkmUSQhLPmN59jDfM4';
const TG_CHAT_ID = '400073510';

// ——— DOM refs ———
const burg = document.getElementById('burg');
const mob  = document.getElementById('mob');

// ——— SCROLL REVEAL ———
const obs = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); }),
  { threshold: 0.06 }
);
document.querySelectorAll('.rv').forEach(el => obs.observe(el));

// ——— SPA VIEW SWITCHING ———
let currentView = 'home';

function showView(name, scrollTarget) {
  const next = document.getElementById('view-' + name);
  if (!next) return;

  const current = document.querySelector('.view.active');
  if (current === next) {
    if (scrollTarget) scrollToSection(scrollTarget);
    return;
  }

  if (current) current.classList.remove('active');
  next.classList.add('active');
  window.scrollTo(0, 0);
  currentView = name;

  history.replaceState(null, '', name === 'home' ? location.pathname + location.search : '#' + name);

  document.querySelectorAll('.nl').forEach(el => {
    el.classList.toggle('nav-on', el.dataset.view === name && !el.dataset.scroll);
  });

  setTimeout(() => {
    next.querySelectorAll('.rv:not(.on)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95) el.classList.add('on');
      else obs.observe(el);
    });
    if (scrollTarget) scrollToSection(scrollTarget);
  }, 40);
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
  window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + scrollY - navH - 16), behavior: 'smooth' });
}

// ——— CLICK DELEGATION ———
document.addEventListener('click', e => {
  const t = e.target.closest('[data-view]');
  if (!t) return;
  e.preventDefault();
  showView(t.dataset.view, t.dataset.scroll || null);
  burg.classList.remove('open');
  mob.classList.remove('open');
  document.body.style.overflow = '';
});

// ——— INITIAL HASH ROUTING ———
(function () {
  const hash = location.hash.replace('#', '');
  if (hash && document.getElementById('view-' + hash)) {
    document.getElementById('view-home').classList.remove('active');
    document.getElementById('view-' + hash).classList.add('active');
    currentView = hash;
    document.querySelectorAll('.nl').forEach(el => {
      el.classList.toggle('nav-on', el.dataset.view === hash && !el.dataset.scroll);
    });
    setTimeout(() => {
      document.getElementById('view-' + hash).querySelectorAll('.rv:not(.on)').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.95) el.classList.add('on');
        else obs.observe(el);
      });
    }, 40);
  }
})();

// ——— BURGER ———
burg.addEventListener('click', () => {
  burg.classList.toggle('open');
  mob.classList.toggle('open');
  document.body.style.overflow = mob.classList.contains('open') ? 'hidden' : '';
});

// ——— FORM ———
const form     = document.getElementById('contact-form');
const feedback = document.getElementById('form-feedback');
const submitBtn = form ? form.querySelector('.fsub') : null;

function showFeedback(type, message) {
  feedback.className = 'form-feedback ' + type;
  feedback.textContent = message;
}
function hideFeedback() {
  feedback.className = 'form-feedback';
  feedback.textContent = '';
}
function validatePhone(phone) {
  return /^[\+\d][\d\s\(\)\-]{8,18}$/.test(phone.trim());
}
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function sendToTelegram(name, phone, interest, comment) {
  const lines = [
    '🔔 <b>Новая заявка — Довод</b>', '',
    `👤 <b>Имя:</b> ${escapeHtml(name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(phone)}`,
    `📋 <b>Интерес:</b> ${escapeHtml(interest)}`,
  ];
  if (comment.trim()) lines.push(`💬 <b>Комментарий:</b> ${escapeHtml(comment)}`);
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT_ID, text: lines.join('\n'), parse_mode: 'HTML' }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.description || 'Ошибка Telegram API'); }
}

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    hideFeedback();
    const nameEl = document.getElementById('f-name');
    const phoneEl = document.getElementById('f-phone');
    const interestEl = document.getElementById('f-interest');
    const commentEl = document.getElementById('f-comment');
    const name = nameEl.value.trim(), phone = phoneEl.value.trim();
    const interest = interestEl.value, comment = commentEl.value.trim();

    [nameEl, phoneEl].forEach(el => el.classList.remove('invalid'));
    if (name.length < 2) { showFeedback('error','Пожалуйста, введите ваше имя.'); nameEl.classList.add('invalid'); nameEl.focus(); return; }
    if (!validatePhone(phone)) { showFeedback('error','Введите корректный номер телефона.'); phoneEl.classList.add('invalid'); phoneEl.focus(); return; }

    submitBtn.disabled = true;
    const origText = submitBtn.textContent;
    submitBtn.textContent = 'Отправка...';
    try {
      await sendToTelegram(name, phone, interest, comment);
      showFeedback('success', 'Заявка принята! Мы свяжемся с вами в ближайшее время.');
      form.reset();
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Не удалось отправить заявку. Позвоните нам или напишите в ВКонтакте.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = origText;
    }
  });
  form.querySelectorAll('input').forEach(el => el.addEventListener('input', () => el.classList.remove('invalid')));
}
