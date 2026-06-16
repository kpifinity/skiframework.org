/* ============================================================
   SKI Framework — main.js
   Nav, envelope demo, EU AI Act countdown, mobile menu
   ============================================================ */

/* ---- Announcement banner height sync ---------------------- */
(function () {
  const ann = document.querySelector('.announce');
  if (!ann) return;
  function syncAnnHeight() {
    const h = ann.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--ann-h', h + 'px');
  }
  syncAnnHeight();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncAnnHeight).observe(ann);
  }
  window.addEventListener('resize', syncAnnHeight, { passive: true });
})();

/* ---- Mobile nav ------------------------------------------- */
const hamburger = document.querySelector('.nav-hamburger');
const mobileNav = document.querySelector('.nav-mobile');
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', open);
    if (open) {
      const first = mobileNav.querySelector(FOCUSABLE);
      if (first) first.focus();
    }
  });

  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileNav.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  /* Escape closes the menu */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
      mobileNav.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.focus();
    }
  });

  /* Focus trap inside open mobile nav */
  mobileNav.addEventListener('keydown', e => {
    if (!mobileNav.classList.contains('is-open') || e.key !== 'Tab') return;
    const focusable = [...mobileNav.querySelectorAll(FOCUSABLE)];
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/* ---- Active nav link -------------------------------------- */
const path = window.location.pathname.replace(/\/$/, '') || '/index.html';
document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
  const href = a.getAttribute('href');
  if (href && path.endsWith(href.replace(/^\.\//, ''))) a.classList.add('active');
  if ((path === '/' || path.endsWith('index.html')) && (href === './' || href === 'index.html')) {
    a.classList.add('active');
  }
});

/* ---- Envelope demo (hover + tap/click for mobile) --------- */
const fields  = document.querySelectorAll('.ef[data-field]');
const panel   = document.querySelector('.envelope-panel-inner');
const defView = panel?.querySelector('.envelope-panel-default');

const fieldData = {
  verdict: {
    tag: 'Verdict',
    field: '"verdict"',
    desc: 'One of five categorical outcomes: CLEAR, FLAG, NULL_UNMAPPED, NULL_STALE, or DISCRETIONARY. Never a confidence score, probability, or free-form assessment.',
    guarantee: 'Closed taxonomy. Every verdict type has a defined meaning and a defined escalation path. Ambiguity routes to human review, not to a confidence percentage.'
  },
  reasoning: {
    tag: 'Reasoning',
    field: '"reasoning"',
    desc: 'The model\'s natural-language explanation — human-readable context for a reviewer. Informative, but not the legal ground truth: the assertions and citations are.',
    guarantee: 'The reasoning is signed as part of the transcript so it cannot be altered after the fact. A reviewer can trust it was the actual output, not a summary.'
  },
  kg_citations: {
    tag: 'KG Citations',
    field: '"kg_citations"',
    desc: 'Every verdict traces to at least one Knowledge Graph node. Each node cites the exact source regulatory document and clause. No citation, no verdict.',
    guarantee: 'KG citations are checked against the signed, version-locked rulebook. The model cannot cite a node that doesn\'t exist in the approved graph.'
  },
  formalizable_assertions: {
    tag: 'Assertions',
    field: '"formalizable_assertions"',
    desc: 'The structured, machine-checkable claims the model made: metric, operator, observed value, expected value, unit, and whether it was satisfied. These are what the Symbolic Verifier cross-checks.',
    guarantee: 'Every assertion is verified against the actual measurement record and the cited obligation. A fabricated reading or a wrong threshold is caught as LLM_CONTRADICTION.'
  },
  verifier_result: {
    tag: 'Verifier',
    field: '"verifier_result"',
    desc: 'The independent Symbolic Verifier\'s cross-check result. AGREED means both examiners reached the same conclusion independently. LLM_CONTRADICTION means they disagreed — a person decides.',
    guarantee: 'The Verifier is a deterministic algorithm, not another LLM. It re-does every piece of arithmetic mechanically. It cannot be charmed or confused.'
  },
  model_provenance: {
    tag: 'Provenance',
    field: '"model_provenance"',
    desc: 'Six hash anchors: model weight hash, KG version hash, prompt template ID and hash, decoder seed, and structured grammar hash. Together they let any auditor replay this exact evaluation.',
    guarantee: 'An auditor with the same weights, graph, and prompt can re-run the evaluation and verify the envelope is authentic. Replay is reconstructible, not just claimed.'
  },
  transcript_ref: {
    tag: 'Ledger',
    field: '"transcript_ref"',
    desc: 'The ledger sequence entry where the signed LLM transcript is stored. The ledger is append-only — no UPDATE, no DELETE, enforced at the database trigger level.',
    guarantee: 'The transcript is cryptographically signed before writing. Any tampering is detectable. Sequence gaps trigger the monitoring alert.'
  }
};

function showEnvelopeField(el) {
  const f = el.dataset.field;
  const d = fieldData[f];
  if (!d) return;
  if (defView) defView.style.display = 'none';
  panel.querySelectorAll('.envelope-panel-content').forEach(p => p.classList.remove('is-active'));
  fields.forEach(fe => fe.classList.remove('is-active'));
  el.classList.add('is-active');
  let content = panel.querySelector(`.ep-${f}`);
  if (!content) {
    content = document.createElement('div');
    content.className = `envelope-panel-content ep-${f}`;
    content.innerHTML = `
      <div class="ep-tag">${d.tag}</div>
      <div class="ep-field">${d.field}</div>
      <div class="ep-desc">${d.desc}</div>
      <div class="ep-guarantee">${d.guarantee}</div>`;
    panel.appendChild(content);
  }
  content.classList.add('is-active');
}

function hideEnvelopePanel() {
  fields.forEach(fe => fe.classList.remove('is-active'));
  panel?.querySelectorAll('.envelope-panel-content').forEach(p => p.classList.remove('is-active'));
  if (defView) defView.style.display = '';
}

if (fields.length && panel) {
  fields.forEach(el => {
    /* Desktop: hover */
    el.addEventListener('mouseenter', () => showEnvelopeField(el));

    /* Mobile / touch: tap to toggle */
    el.addEventListener('click', e => {
      if (el.classList.contains('is-active')) {
        hideEnvelopePanel();
      } else {
        showEnvelopeField(el);
      }
      e.stopPropagation();
    });
  });

  /* Mouse leaves the code block: reset */
  document.querySelector('.envelope-code')?.addEventListener('mouseleave', hideEnvelopePanel);

  /* Tap outside the envelope block on mobile: reset */
  document.addEventListener('click', e => {
    if (!e.target.closest('.envelope-inner')) hideEnvelopePanel();
  });
}

/* ---- EU AI Act countdown ---------------------------------- */
const daysEl = document.getElementById('euai-days');
if (daysEl) {
  const target = new Date('2026-08-02T00:00:00Z');
  const now    = new Date();
  const diff   = Math.max(0, Math.ceil((target - now) / 86400000));
  daysEl.textContent = diff;
}

/* ---- Scroll-triggered fade-in ----------------------------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

/* ---- Smooth scroll with fixed-header offset --------------- */
function getHeaderOffset() {
  const style = getComputedStyle(document.documentElement);
  const annH  = parseInt(style.getPropertyValue('--ann-h'))  || 40;
  const navH  = parseInt(style.getPropertyValue('--nav-h'))  || 64;
  return annH + navH + 20;
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const sel = a.getAttribute('href');
    if (!sel || sel === '#') return;
    const target = document.querySelector(sel);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  });
});

/* ---- Docs sidebar + mobile pills active on scroll --------- */
const docHeaders   = document.querySelectorAll('.docs-content h2[id], .docs-content h3[id]');
const sidebarLinks = document.querySelectorAll('.docs-sidebar a[href^="#"]');
const mobilePills  = document.querySelectorAll('.docs-mobile-nav a[href^="#"]');

if (docHeaders.length && (sidebarLinks.length || mobilePills.length)) {
  const headingObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id    = entry.target.id;
        const sLink = document.querySelector(`.docs-sidebar a[href="#${id}"]`);
        const mLink = document.querySelector(`.docs-mobile-nav a[href="#${id}"]`);
        sidebarLinks.forEach(l => l.classList.remove('active'));
        mobilePills.forEach(l => l.classList.remove('active'));
        if (sLink) sLink.classList.add('active');
        if (mLink) {
          mLink.classList.add('active');
          mLink.scrollIntoView({ block: 'nearest', inline: 'center' });
        }
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  docHeaders.forEach(h => headingObserver.observe(h));
}
