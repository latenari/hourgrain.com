// The page reads fine without this script; it only adds the beta sign-up,
// the portion picker and the billing toggle.

// The waitlist Worker in ../waitlist stores each address in Cloudflare D1.
const WAITLIST_URL = 'https://hourgrain-waitlist.oshan-ivantha.workers.dev/join';

const EMAIL = /^\S+@\S+\.\S+$/;

const PRICES = {
  year: { amt: '$49.99', per: 'a year', note: '$4.17 a month, billed yearly. 58% less than paying monthly.' },
  month: { amt: '$9.99', per: 'a month', note: 'Billed monthly. Cancel any time.' },
};

// Each serving of the demo batch: 1,840 g of curry cooked from about 2,440 kcal of ingredients.
const KCAL_PER_GRAM = 1.325;

function showJoined() {
  document.querySelectorAll('form.signup').forEach((f) => { f.hidden = true; });
  document.querySelectorAll('.signup-done').forEach((d) => { d.hidden = false; });
}

function setError(form, message) {
  const el = form.querySelector('.signup-error');
  el.textContent = message || '';
  el.hidden = !message;
}

async function joinBeta(email, source) {
  const res = await fetch(WAITLIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
}

document.querySelectorAll('form.signup').forEach((form) => {
  const input = form.querySelector('input[type=email]');
  const button = form.querySelector('button[type=submit]');
  input.addEventListener('input', () => setError(form, ''));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!EMAIL.test(email)) {
      setError(form, "That doesn't look like an email address yet.");
      input.focus();
      return;
    }
    // A filled honeypot means a bot; let it think it worked.
    if (form.querySelector('input[name=botcheck]').checked) { showJoined(); return; }

    button.disabled = true;
    button.textContent = 'Joining…';
    try {
      await joinBeta(email, form.dataset.source);
      showJoined();
    } catch (err) {
      console.error('beta sign-up failed', err);
      setError(form, "That didn't go through. Please try again in a moment.");
    } finally {
      button.disabled = false;
      button.textContent = 'Join the beta';
    }
  });
});

function press(buttons, active) {
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === active)));
}

const portionButtons = document.querySelectorAll('[data-portion]');
portionButtons.forEach((b) => b.addEventListener('click', () => {
  const g = Number(b.dataset.portion);
  press(portionButtons, b);
  document.querySelector('[data-portion-g]').textContent = String(g);
  document.querySelector('[data-portion-k]').textContent = String(Math.round(g * KCAL_PER_GRAM));
}));

const billButtons = document.querySelectorAll('[data-bill]');
billButtons.forEach((b) => b.addEventListener('click', () => {
  const p = PRICES[b.dataset.bill];
  press(billButtons, b);
  document.querySelector('[data-price-amt]').textContent = p.amt;
  document.querySelector('[data-price-per]').textContent = p.per;
  document.querySelector('[data-price-note]').textContent = p.note;
}));
