// ══════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════
let state = {
    currency: '$',
    people: [],
    adjs: [],
    billTotal: ''
};

let _pid = 0, _iid = 0, _aid = 0;

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
    load();
    if (state.people.length === 0) {
        addPerson('Person 1');
        addPerson('Person 2');
    }
    render();
    calculate();
});

// ══════════════════════════════════════════
//  PERSISTENCE
// ══════════════════════════════════════════
function save() {
    collectFromDOM();
    try { localStorage.setItem('splitcheck_v2', JSON.stringify(state)); } catch (e) { }
    calculate();
}

function load() {
    try {
        const raw = localStorage.getItem('splitcheck_v2');
        if (raw) {
            state = JSON.parse(raw);
            // restore ID counters
            state.people.forEach(p => {
                if (p.id >= _pid) _pid = p.id + 1;
                p.items.forEach(i => { if (i.id >= _iid) _iid = i.id + 1; });
            });
            state.adjs.forEach(a => { if (a.id >= _aid) _aid = a.id + 1; });
        }
    } catch (e) { }
}

// ══════════════════════════════════════════
//  COLLECT VALUES FROM DOM → STATE
// ══════════════════════════════════════════
function collectFromDOM() {
    // currency
    state.currency = document.getElementById('currency-select').value;

    // bill total
    state.billTotal = document.getElementById('bill-total').value;

    // people
    state.people.forEach(person => {
        const pEl = document.getElementById('person-' + person.id);
        if (!pEl) return;
        person.name = pEl.querySelector('.person-name-input').value;
        person.items.forEach(item => {
            const row = document.getElementById('item-' + item.id);
            if (!row) return;
            item.name = row.querySelector('.item-name').value;
            item.qty = parseFloat(row.querySelector('.item-qty').value) || 1;
            item.price = parseFloat(row.querySelector('.item-price').value) || 0;
        });
    });

    // adjustments
    state.adjs.forEach(adj => {
        const el = document.getElementById('adj-' + adj.id);
        if (!el) return;
        adj.name = el.querySelector('.adj-name-input').value;
        adj.value = parseFloat(el.querySelector('.adj-value-input').value) || 0;
        adj.mode = el.querySelector('.adj-select').value;
        adj.split = el.querySelector('.adj-split-cb').checked;
    });
}

// ══════════════════════════════════════════
//  ADD / REMOVE
// ══════════════════════════════════════════
function addPerson(defaultName = '') {
    const p = { id: _pid++, name: defaultName, items: [] };
    addItem(p);
    state.people.push(p);
    render();
    // focus the name input of newly added person
    setTimeout(() => {
        const el = document.getElementById('person-' + p.id);
        if (el) el.querySelector('.person-name-input').focus();
    }, 50);
    save();
}

function removePerson(pid) {
    if (state.people.length <= 1) { toast('Need at least one person!'); return; }
    collectFromDOM();
    state.people = state.people.filter(p => p.id !== pid);
    render();
    save();
}

function addItem(person) {
    person.items.push({ id: _iid++, name: '', qty: 1, price: 0 });
}

function addItemToPerson(pid) {
    collectFromDOM();
    const p = state.people.find(p => p.id === pid);
    if (p) { addItem(p); render(); focusLastItem(pid); save(); }
}

function removeItem(pid, iid) {
    collectFromDOM();
    const p = state.people.find(p => p.id === pid);
    if (!p) return;
    if (p.items.length <= 1) { toast("Each person needs at least one row."); return; }
    p.items = p.items.filter(i => i.id !== iid);
    render();
    save();
}

function addAdj(kind) {
    collectFromDOM();
    state.adjs.push({
        id: _aid++,
        kind,           // 'tax' | 'discount'
        name: kind === 'tax' ? 'Tax' : 'Discount',
        value: kind === 'tax' ? 10 : 5,
        mode: '%',      // '%' or 'flat'
        split: true
    });
    render();
    save();
}

function removeAdj(aid) {
    collectFromDOM();
    state.adjs = state.adjs.filter(a => a.id !== aid);
    render();
    save();
}

// ══════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════
function render() {
    renderPeople();
    renderAdjs();

    const cur = state.currency;
    document.getElementById('currency-select').value = cur;
    document.getElementById('bill-total').value = state.billTotal;
}

function renderPeople() {
    const list = document.getElementById('people-list');
    list.innerHTML = '';
    state.people.forEach(person => {
        const subtotal = personSubtotal(person);
        const block = document.createElement('div');
        block.className = 'person-block';
        block.id = 'person-' + person.id;

        // items rows
        const itemRows = person.items.map(item => `
      <tr id="item-${item.id}">
        <td class="col-item">
          <input class="item-input item-name" type="text"
            placeholder="Item name (e.g. Burger)"
            value="${esc(item.name)}"
            oninput="save()" />
        </td>
        <td class="col-qty">
          <input class="item-input price item-qty" type="number"
            min="1" step="1" value="${item.qty}"
            oninput="save()" style="width:3rem;" />
        </td>
        <td class="col-price">
          <input class="item-input price item-price" type="number"
            min="0" step="0.01" placeholder="0.00"
            value="${item.price || ''}"
            oninput="save()" />
        </td>
        <td class="col-del">
          <button class="btn-remove-item" onclick="removeItem(${person.id}, ${item.id})" title="Remove item">×</button>
        </td>
      </tr>
    `).join('');

        block.innerHTML = `
      <div class="person-header">
        <div class="person-avatar">${avatarLetter(person.name, person.id)}</div>
        <input class="person-name-input" type="text"
          placeholder="Person's name"
          value="${esc(person.name)}"
          oninput="updateAvatar(this, ${person.id}); save();" />
        <div class="person-total-badge" id="badge-${person.id}">${state.currency}${subtotal.toFixed(2)}</div>
        <button class="btn-remove-person" onclick="removePerson(${person.id})" title="Remove person">×</button>
      </div>
      <table class="items-table">
        <thead>
          <tr>
            <th class="col-item">Item</th>
            <th class="col-qty">Qty</th>
            <th class="col-price">Price</th>
            <th class="col-del"></th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div class="person-footer">
        <button class="btn-add-item" onclick="addItemToPerson(${person.id})">＋ Add item</button>
        <div class="person-subtotal">Subtotal: <span id="sub-${person.id}">${state.currency}${subtotal.toFixed(2)}</span></div>
      </div>
    `;
        list.appendChild(block);
    });
}

function renderAdjs() {
    const list = document.getElementById('adj-list');
    list.innerHTML = '';
    if (state.adjs.length === 0) {
        list.innerHTML = '<div class="empty-state">No taxes or discounts added yet.<br>Use the buttons below to add some.</div>';
        return;
    }
    state.adjs.forEach(adj => {
        const el = document.createElement('div');
        el.className = 'adj-item';
        el.id = 'adj-' + adj.id;
        const isDiscount = adj.kind === 'discount';
        el.innerHTML = `
      <label>${isDiscount ? '🏷 Discount' : '🧾 Tax / Fee'}</label>
      <div class="adj-row">
        <input class="adj-name-input" type="text"
          placeholder="${isDiscount ? 'e.g. Coupon, Promo' : 'e.g. VAT, Service Charge'}"
          value="${esc(adj.name)}"
          oninput="save()" />
        <input class="adj-value-input" type="number"
          min="0" step="0.01"
          value="${adj.value}"
          oninput="save()" />
        <select class="adj-select" onchange="save()">
          <option value="%" ${adj.mode === '%' ? 'selected' : ''}>%</option>
          <option value="flat" ${adj.mode === 'flat' ? 'selected' : ''}>flat</option>
        </select>
      </div>
      <div class="adj-split-row">
        <input type="checkbox" class="adj-split-cb" id="split-${adj.id}"
          ${adj.split ? 'checked' : ''} onchange="save()" />
        <label for="split-${adj.id}">Split proportionally by person's subtotal</label>
      </div>
      <button class="btn-remove-item" onclick="removeAdj(${adj.id})" title="Remove" style="position:absolute;top:.5rem;right:.5rem;">×</button>
    `;
        list.appendChild(el);
    });
}

// ══════════════════════════════════════════
//  CALCULATE
// ══════════════════════════════════════════
function calculate() {
    collectFromDOM();
    const cur = state.currency;

    const subtotals = {};
    let grandSubtotal = 0;
    state.people.forEach(p => {
        const s = personSubtotal(p);
        subtotals[p.id] = s;
        grandSubtotal += s;

        // live badge update
        const badge = document.getElementById('badge-' + p.id);
        const sub = document.getElementById('sub-' + p.id);
        if (badge) badge.textContent = cur + s.toFixed(2);
        if (sub) sub.textContent = cur + s.toFixed(2);
    });

    // apply adjustments
    const perPersonAdj = {}; // pid → delta
    state.people.forEach(p => perPersonAdj[p.id] = 0);

    let adjTotal = 0;

    state.adjs.forEach(adj => {
        if (!adj.value) return;
        const isDiscount = adj.kind === 'discount';
        const sign = isDiscount ? -1 : 1;

        let adjAmount = 0;
        if (adj.mode === '%') {
            adjAmount = (adj.value / 100) * grandSubtotal;
        } else {
            adjAmount = adj.value;
        }
        adjAmount *= sign;
        adjTotal += adjAmount;

        // distribute
        state.people.forEach(p => {
            if (adj.split && grandSubtotal > 0) {
                // proportional
                perPersonAdj[p.id] += adjAmount * (subtotals[p.id] / grandSubtotal);
            } else {
                // equal split
                perPersonAdj[p.id] += adjAmount / state.people.length;
            }
        });
    });

    const grandTotal = grandSubtotal + adjTotal;

    // ── render results ──
    const section = document.getElementById('results-section');
    section.classList.add('visible');

    // summary stats
    const summaryEl = document.getElementById('results-summary');
    summaryEl.innerHTML = `
    <div class="summary-stat">
      <div class="stat-label">Items Total</div>
      <div class="stat-val">${cur}${grandSubtotal.toFixed(2)}</div>
    </div>
    <div class="summary-stat">
      <div class="stat-label">Adjustments</div>
      <div class="stat-val" style="color:${adjTotal >= 0 ? 'var(--red)' : 'var(--green)'}">${adjTotal >= 0 ? '+' : ''}${cur}${adjTotal.toFixed(2)}</div>
    </div>
    <div class="summary-stat highlight">
      <div class="stat-label">Grand Total</div>
      <div class="stat-val">${cur}${grandTotal.toFixed(2)}</div>
    </div>
  `;

    // per-person rows
    const tbody = document.getElementById('results-body');
    tbody.innerHTML = '';
    state.people.forEach(p => {
        const base = subtotals[p.id];
        const adj = perPersonAdj[p.id];
        const total = base + adj;
        const itemsList = p.items
            .filter(i => i.price > 0)
            .map(i => {
                const lbl = i.name || 'Item';
                const amt = (i.qty || 1) * i.price;
                return `${lbl}${i.qty > 1 ? ' ×' + i.qty : ''}: ${cur}${amt.toFixed(2)}`;
            }).join('<br>');

        const adjLabel = adj !== 0
            ? `${adj >= 0 ? '+' : ''}${cur}${adj.toFixed(2)} adjustments`
            : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>
        <div class="res-name">${esc(p.name) || 'Unnamed'}</div>
        <div class="res-items">${itemsList || '—'}</div>
      </td>
      <td>
        <div class="res-amount">${cur}${total.toFixed(2)}</div>
        ${adjLabel ? `<div class="res-adj">${adjLabel}</div>` : ''}
      </td>
    `;
        tbody.appendChild(tr);
    });

    // bill match check
    const matchEl = document.getElementById('bill-match-row');
    if (state.billTotal) {
        const expected = parseFloat(state.billTotal);
        const diff = Math.abs(grandTotal - expected);
        if (diff < 0.02) {
            matchEl.innerHTML = `<div class="bill-match ok"><span class="icon">✓</span> Calculated total matches your bill! You're good to go.</div>`;
        } else {
            matchEl.innerHTML = `<div class="bill-match warn"><span class="icon">⚠</span> Difference of ${cur}${diff.toFixed(2)} from your bill total (${cur}${expected.toFixed(2)}). Double-check the items or adjustments.</div>`;
        }
    } else {
        matchEl.innerHTML = '';
    }
}

// ══════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════
function personSubtotal(p) {
    return p.items.reduce((s, i) => s + (parseFloat(i.price) || 0) * (parseFloat(i.qty) || 1), 0);
}

function avatarLetter(name, id) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (name && name.trim()) return name.trim()[0].toUpperCase();
    return letters[id % 26];
}

function updateAvatar(input, pid) {
    const block = document.getElementById('person-' + pid);
    if (block) {
        const av = block.querySelector('.person-avatar');
        const i = state.people.findIndex(p => p.id === pid);
        if (av) av.textContent = avatarLetter(input.value, i);
    }
}

function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function focusLastItem(pid) {
    setTimeout(() => {
        const block = document.getElementById('person-' + pid);
        if (!block) return;
        const inputs = block.querySelectorAll('.item-name');
        if (inputs.length) inputs[inputs.length - 1].focus();
    }, 50);
}

function resetAll() {
    if (!confirm('Reset everything and start fresh?')) return;
    localStorage.removeItem('splitcheck_v2');
    _pid = 0; _iid = 0; _aid = 0;
    state = { currency: '$', people: [], adjs: [], billTotal: '' };
    addPerson('Person 1');
    addPerson('Person 2');
    render();
    calculate();
    toast('Reset! Fresh start.');
}

function copyResults() {
    collectFromDOM();
    const cur = state.currency;
    const subtotals = {};
    let grandSubtotal = 0;
    state.people.forEach(p => {
        const s = personSubtotal(p);
        subtotals[p.id] = s;
        grandSubtotal += s;
    });
    const perPersonAdj = {};
    state.people.forEach(p => perPersonAdj[p.id] = 0);
    let adjTotal = 0;
    state.adjs.forEach(adj => {
        if (!adj.value) return;
        const sign = adj.kind === 'discount' ? -1 : 1;
        let adjAmount = adj.mode === '%' ? (adj.value / 100) * grandSubtotal : adj.value;
        adjAmount *= sign;
        adjTotal += adjAmount;
        state.people.forEach(p => {
            perPersonAdj[p.id] += adj.split && grandSubtotal > 0
                ? adjAmount * (subtotals[p.id] / grandSubtotal)
                : adjAmount / state.people.length;
        });
    });
    const lines = ['🧾 SplitCheck Results', ''];
    state.people.forEach(p => {
        const total = subtotals[p.id] + perPersonAdj[p.id];
        lines.push(`${p.name || 'Unnamed'}: ${cur}${total.toFixed(2)}`);
    });
    lines.push('');
    lines.push(`Grand Total: ${cur}${(grandSubtotal + adjTotal).toFixed(2)}`);
    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard!')).catch(() => {
        prompt('Copy this:', text);
    });
}

function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
}
