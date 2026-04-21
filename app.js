const adminData = [
  { ref: 'CL001', allocationId: '2 lots', clientCode: 'SPGD1429', clientName: 'Ramit Thaliyil' },
  { ref: 'CL002', allocationId: '3 lots', clientCode: 'SPGD1203', clientName: 'Rachit Narang' },
];

const overviewData = [
  { ideaId: 'IDEA001', stock: 'TCS', tradeName: 'TCS 30 Apr 2680 CE Sell', expiry: '30/Apr/2026', strike: 2680, peCe: 'CE', buySell: 'SELL', lotSize: 175, expectedPremiumPoints: 20 },
  { ideaId: 'IDEA002', stock: 'NESTLE', tradeName: 'Nestle 1300 April end CE Sell', expiry: '30/Apr/2026', strike: 1300, peCe: 'CE', buySell: 'SELL', lotSize: 500, expectedPremiumPoints: 5 },
];

const plannerData = [
  { clientRef: 'CL001', monthlyTarget: 6000, slot: '1', ideaId: 'IDEA001', intendedPct: 0.6 },
];

const clientIdeaAssignment = {};
const adminExpectedRevenue = {};
const tradeDeciderIntendedPct = {};
const STORAGE_KEY = 'fno_planner_state_v1';

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed.adminData)) {
      adminData.splice(0, adminData.length, ...parsed.adminData);
    }
    if (Array.isArray(parsed.overviewData)) {
      overviewData.splice(0, overviewData.length, ...parsed.overviewData);
    }
    if (Array.isArray(parsed.plannerData)) {
      plannerData.splice(0, plannerData.length, ...parsed.plannerData);
    }
    if (parsed.clientIdeaAssignment && typeof parsed.clientIdeaAssignment === 'object') {
      Object.keys(clientIdeaAssignment).forEach((k) => delete clientIdeaAssignment[k]);
      Object.assign(clientIdeaAssignment, parsed.clientIdeaAssignment);
    }
    if (parsed.adminExpectedRevenue && typeof parsed.adminExpectedRevenue === 'object') {
      Object.keys(adminExpectedRevenue).forEach((k) => delete adminExpectedRevenue[k]);
      Object.assign(adminExpectedRevenue, parsed.adminExpectedRevenue);
    }
    if (parsed.tradeDeciderIntendedPct && typeof parsed.tradeDeciderIntendedPct === 'object') {
      Object.keys(tradeDeciderIntendedPct).forEach((k) => delete tradeDeciderIntendedPct[k]);
      Object.assign(tradeDeciderIntendedPct, parsed.tradeDeciderIntendedPct);
    }
  } catch (error) {
    console.warn('Unable to load saved state from browser storage.', error);
  }
}

function persistState() {
  const state = {
    adminData,
    overviewData,
    plannerData,
    clientIdeaAssignment,
    adminExpectedRevenue,
    tradeDeciderIntendedPct,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save state to browser storage.', error);
  }
}

const adminBody = document.querySelector('#adminTable tbody');
const adminRevenueBody = document.querySelector('#adminRevenueTable tbody');
const overviewBody = document.querySelector('#overviewTable tbody');
const plannerBody = document.querySelector('#plannerTable tbody');
const snapshot = document.getElementById('snapshot');
const searchInput = document.querySelector('.search');
const ideaAssignSelect = document.getElementById('ideaAssignSelect');
const ideaSelectList = document.getElementById('ideaSelectList');
const addAnotherIdeaBtn = document.getElementById('addAnotherIdeaBtn');
const selectAllClients = document.getElementById('selectAllClients');
const deselectAllClients = document.getElementById('deselectAllClients');
const submitIdeaAssign = document.getElementById('submitIdeaAssign');
const clientChecklist = document.getElementById('clientChecklist');
const ideaAssignSummaryBody = document.querySelector('#ideaAssignSummaryTable tbody');
const selectedIdeaSnippet = document.getElementById('selectedIdeaSnippet');
const ideaTabButtons = document.querySelectorAll('.idea-tab-btn');
const ideaAssignPanel = document.getElementById('ideaSelectAssignPanel');
const ideaPlannerPanel = document.getElementById('ideaPlannerPanel');
const ideaPlannerFilter = document.getElementById('ideaPlannerFilter');
const ideaPlannerBody = document.querySelector('#ideaPlannerTable tbody');
const tradeDeciderPanel = document.getElementById('tradeDeciderPanel');
const tradeDeciderFilter = document.getElementById('tradeDeciderFilter');
const tradeDeciderBody = document.querySelector('#tradeDeciderTable tbody');
let searchQuery = '';


const viewButtons = document.querySelectorAll('.nav-item');
const views = {
  dashboard: document.getElementById('view-dashboard'),
  planner: document.getElementById('view-planner'),
  admin: document.getElementById('view-admin'),
  'admin-revenue': document.getElementById('view-admin-revenue'),
  overview: document.getElementById('view-overview'),
  'idea-select': document.getElementById('view-idea-select'),
};

function switchView(viewName) {
  Object.entries(views).forEach(([name, el]) => {
    if (!el) return;
    el.classList.toggle('hidden-view', name !== viewName);
    el.classList.toggle('active-view', name === viewName);
  });

  viewButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  applyTableSearch();
  renderIdeaSelectPage();
  renderAdminRevenue();
}

viewButtons.forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

const shell = document.querySelector('.app-shell');
const menuToggle = document.getElementById('menuToggle');
if (menuToggle && shell) {
  menuToggle.addEventListener('click', () => {
    shell.classList.toggle('menu-closed');
  });
}


function applyTableSearch() {
  const tables = ['#adminTable', '#adminRevenueTable', '#overviewTable', '#plannerTable', '#ideaPlannerTable', '#tradeDeciderTable'];

  tables.forEach((selector) => {
    const rows = document.querySelectorAll(`${selector} tbody tr`);
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = !searchQuery || text.includes(searchQuery) ? '' : 'none';
    });
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = String(e.target.value || '').trim().toLowerCase();
    applyTableSearch();
  });
}



function switchIdeaTab(tabName) {
  const panels = {
    assign: ideaAssignPanel,
    planner: ideaPlannerPanel,
    'trade-decider': tradeDeciderPanel,
  };

  Object.entries(panels).forEach(([name, panel]) => {
    if (!panel) return;
    const isActive = name === tabName;
    panel.classList.toggle('hidden-view', !isActive);
    panel.classList.toggle('active-view', isActive);
  });

  ideaTabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.ideaTab === tabName);
  });
}

function getIdeaAssignments(activeFilter = '') {
  return Object.entries(clientIdeaAssignment)
    .flatMap(([clientRef, ideaIds]) => (ideaIds || []).map((ideaId) => {
      const client = adminData.find((x) => x.ref === clientRef) || {};
      const idea = overviewData.find((x) => x.ideaId === ideaId) || {};
      const expectedRevenue = Number(adminExpectedRevenue[clientRef] || 0);
      return { clientRef, ideaId, client, idea, expectedRevenue };
    }))
    .filter(({ ideaId }) => !activeFilter || ideaId === activeFilter);
}

function setIdeaFilterOptions(selectEl) {
  if (!selectEl) return;
  const selectedFilter = selectEl.value;
  const ideaIds = overviewData.map((x) => x.ideaId).filter(Boolean);
  selectEl.innerHTML = ['<option value="">All Ideas</option>', ...ideaIds.map((id) => `<option ${selectedFilter === id ? 'selected' : ''} value="${id}">${id}</option>`)].join('');
}

function renderIdeaPlannerTable() {
  if (!ideaPlannerBody || !ideaPlannerFilter) return;

  setIdeaFilterOptions(ideaPlannerFilter);
  const assignments = getIdeaAssignments(ideaPlannerFilter.value);

  ideaPlannerBody.innerHTML = '';

  assignments.forEach(({ clientRef, ideaId, client, idea, expectedRevenue }) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Idea ID">${ideaId}</td>
      <td data-label="Client Ref">${clientRef}</td>
      <td data-label="Client Code">${client.clientCode || ''}</td>
      <td data-label="Client Name">${client.clientName || ''}</td>
      <td data-label="Expected Revenue">${toMoney(expectedRevenue)}</td>
      <td data-label="Stock">${idea.stock || ''}</td>
      <td data-label="Trade Name">${idea.tradeName || ''}</td>
      <td data-label="Expiry">${idea.expiry || ''}</td>
      <td data-label="Strike">${idea.strike || ''}</td>
      <td data-label="PE/CE">${idea.peCe || ''}</td>
      <td data-label="BUY/SELL">${idea.buySell || ''}</td>
      <td data-label="Lot Size">${idea.lotSize || 0}</td>
      <td data-label="Expected Premium Points">${idea.expectedPremiumPoints || 0}</td>
      <td data-label="Expected/Lots RS">${toMoney(expectedLotsRs(idea))}</td>
      <td data-label="In Hand Prem">${toMoney(inHandPrem(idea))}</td>
    `;
    ideaPlannerBody.appendChild(tr);
  });

  if (assignments.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td data-label="Info" colspan="15">No clients assigned for selected Idea ID.</td>';
    ideaPlannerBody.appendChild(tr);
  }

  applyTableSearch();
}

function renderTradeDeciderTable() {
  if (!tradeDeciderBody || !tradeDeciderFilter) return;

  setIdeaFilterOptions(tradeDeciderFilter);
  const assignments = getIdeaAssignments(tradeDeciderFilter.value);

  tradeDeciderBody.innerHTML = '';

  assignments.forEach(({ clientRef, ideaId, client, idea, expectedRevenue }) => {
    const key = `${clientRef}__${ideaId}`;
    const intendedPct = Number(tradeDeciderIntendedPct[key] ?? 0);
    const revenueNeeded = expectedRevenue * intendedPct;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Idea ID">${ideaId}</td>
      <td data-label="Client Ref">${clientRef}</td>
      <td data-label="Client Code">${client.clientCode || ''}</td>
      <td data-label="Client Name">${client.clientName || ''}</td>
      <td data-label="Expected Revenue">${toMoney(expectedRevenue)}</td>
      <td data-label="Intended Target %"><input type="number" min="0" max="100" step="1" class="trade-intended-input" data-trade-key="${key}" value="${Math.round(intendedPct * 100)}"></td>
      <td data-label="Revenue Needed">${toMoney(revenueNeeded)}</td>
      <td data-label="Stock">${idea.stock || ''}</td>
      <td data-label="Trade Name">${idea.tradeName || ''}</td>
      <td data-label="Expiry">${idea.expiry || ''}</td>
      <td data-label="Strike">${idea.strike || ''}</td>
      <td data-label="PE/CE">${idea.peCe || ''}</td>
      <td data-label="BUY/SELL">${idea.buySell || ''}</td>
      <td data-label="Lot Size">${idea.lotSize || 0}</td>
      <td data-label="Expected Premium Points">${idea.expectedPremiumPoints || 0}</td>
      <td data-label="Expected/Lots RS">${toMoney(expectedLotsRs(idea))}</td>
      <td data-label="In Hand Prem">${toMoney(inHandPrem(idea))}</td>
    `;
    tradeDeciderBody.appendChild(tr);
  });

  if (assignments.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td data-label="Info" colspan="17">No clients assigned for selected Idea ID.</td>';
    tradeDeciderBody.appendChild(tr);
  }

  tradeDeciderBody.querySelectorAll('.trade-intended-input').forEach((input) => {
    input.addEventListener('input', (e) => {
      const key = e.target.dataset.tradeKey;
      const value = Number(e.target.value || 0);
      const normalized = Math.min(100, Math.max(0, value));
      tradeDeciderIntendedPct[key] = normalized / 100;
      persistState();
      renderTradeDeciderTable();
    });
  });

  applyTableSearch();
}

ideaTabButtons.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const tabName = btn.dataset.ideaTab;
    switchIdeaTab(tabName);
    if (tabName === 'planner') {
      renderIdeaPlannerTable();
    }
    if (tabName === 'trade-decider') {
      renderTradeDeciderTable();
    }
  });
});

if (ideaPlannerFilter) {
  ideaPlannerFilter.addEventListener('change', () => {
    renderIdeaPlannerTable();
  });
}

if (tradeDeciderFilter) {
  tradeDeciderFilter.addEventListener('change', () => {
    renderTradeDeciderTable();
  });
}

function getSelectedIdeaIds() {
  return [...document.querySelectorAll('.idea-assign-select')]
    .map((sel) => sel.value)
    .filter(Boolean);
}

function makeIdeaSelectRow(selectedValue = '') {
  const row = document.createElement('div');
  row.className = 'idea-select-row';

  const select = document.createElement('select');
  select.className = 'idea-assign-select';
  const ideaIds = overviewData.map((x) => x.ideaId).filter(Boolean);
  const options = ['<option value="">Select Idea ID</option>', ...ideaIds
    .map((ideaId) => `<option ${selectedValue === ideaId ? 'selected' : ''} value="${ideaId}">${ideaId}</option>`)]
    .join('');
  select.innerHTML = options;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'delete';
  removeBtn.textContent = '✕';
  removeBtn.title = 'Remove idea';

  removeBtn.addEventListener('click', () => {
    row.remove();
    if (document.querySelectorAll('.idea-assign-select').length === 0 && ideaSelectList) {
      ideaSelectList.appendChild(makeIdeaSelectRow());
    }
    renderIdeaSelectPage();
  });

  select.addEventListener('change', () => {
    const selected = select.value;
    if (selected) {
      const others = [...document.querySelectorAll('.idea-assign-select')]
        .filter((node) => node !== select)
        .map((node) => node.value);

      if (others.includes(selected)) {
        alert('This Idea ID is already selected. Please choose a different Idea ID.');
        select.value = '';
      }
    }

    renderIdeaSelectPage();
  });

  row.appendChild(select);
  row.appendChild(removeBtn);
  return row;
}

function syncSelectAllState() {
  if (!selectAllClients) return;

  const checks = [...document.querySelectorAll('.assign-client-check')];
  selectAllClients.checked = checks.length > 0 && checks.every((check) => check.checked);
}

function renderIdeaAssignSummary() {
  if (!ideaAssignSummaryBody) return;

  const counts = {};
  Object.values(clientIdeaAssignment).forEach((ideaIds) => {
    (ideaIds || []).forEach((ideaId) => {
      counts[ideaId] = (counts[ideaId] || 0) + 1;
    });
  });

  const ideaIds = overviewData.map((x) => x.ideaId).filter(Boolean);
  ideaAssignSummaryBody.innerHTML = '';

  ideaIds.forEach((ideaId) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td data-label="Idea ID">${ideaId}</td><td data-label="Assigned Clients Count">${counts[ideaId] || 0}</td>`;
    ideaAssignSummaryBody.appendChild(tr);
  });
}

function renderIdeaSelectPage() {
  if (!ideaAssignSelect || !clientChecklist) return;

  const selectedIdeaIdsBefore = [...document.querySelectorAll('.idea-assign-select')].map((sel) => sel.value);

  if (ideaSelectList) {
    const currentRows = [...ideaSelectList.querySelectorAll('.idea-select-row')];
    currentRows.forEach((row, idx) => {
      const selectedValue = selectedIdeaIdsBefore[idx] || '';
      const newRow = makeIdeaSelectRow(selectedValue);
      row.replaceWith(newRow);
    });

    if (ideaSelectList.querySelectorAll('.idea-select-row').length === 0) {
      ideaSelectList.appendChild(makeIdeaSelectRow());
    }
  }

  const selectedIdeaIds = getSelectedIdeaIds();

  // Disable already-selected idea options in other dropdown rows.
  const selects = [...document.querySelectorAll('.idea-assign-select')];
  selects.forEach((select) => {
    const others = selects
      .filter((node) => node !== select)
      .map((node) => node.value)
      .filter(Boolean);

    [...select.options].forEach((opt) => {
      if (!opt.value) return;
      opt.disabled = others.includes(opt.value) && select.value !== opt.value;
    });
  });

  if (selectedIdeaSnippet) {
    if (selectedIdeaIds.length === 0) {
      selectedIdeaSnippet.textContent = 'Select an Idea ID to view quick details.';
    } else {
      const snippet = selectedIdeaIds
        .map((ideaId) => {
          const ideaDetails = overviewData.find((x) => x.ideaId === ideaId);
          return `${ideaId}: ${ideaDetails?.tradeName || 'N/A'}`;
        })
        .join(' | ');
      selectedIdeaSnippet.textContent = `Selected Ideas: ${snippet}`;
    }
  }

  clientChecklist.innerHTML = adminData
    .map((client) => {
      return `<label class="check-item"><input type="checkbox" class="assign-client-check" data-client-ref="${client.ref}"> ${client.ref} - ${client.clientName || 'Unnamed'}</label>`;
    })
    .join('');

  document.querySelectorAll('.assign-client-check').forEach((check) => {
    check.addEventListener('change', () => {
      syncSelectAllState();
    });
  });

  syncSelectAllState();
  renderIdeaAssignSummary();
  renderIdeaPlannerTable();
  renderTradeDeciderTable();
}

if (addAnotherIdeaBtn) {
  addAnotherIdeaBtn.addEventListener('click', () => {
    if (ideaSelectList) {
      ideaSelectList.appendChild(makeIdeaSelectRow());
      renderIdeaSelectPage();
    }
  });
}

if (selectAllClients) {
  selectAllClients.addEventListener('change', (e) => {
    document.querySelectorAll('.assign-client-check').forEach((check) => {
      check.checked = e.target.checked;
    });
    syncSelectAllState();
  });
}

if (deselectAllClients) {
  deselectAllClients.addEventListener('click', () => {
    document.querySelectorAll('.assign-client-check').forEach((check) => {
      check.checked = false;
    });
    syncSelectAllState();
  });
}

if (submitIdeaAssign) {
  submitIdeaAssign.addEventListener('click', () => {
    const selectedIdeaIds = getSelectedIdeaIds();
    if (selectedIdeaIds.length === 0) {
      alert('Please select at least one Idea ID.');
      return;
    }

    const selectedClients = [...document.querySelectorAll('.assign-client-check:checked')]
      .map((node) => node.dataset.clientRef)
      .filter(Boolean);

    selectedClients.forEach((clientRef) => {
      clientIdeaAssignment[clientRef] = [...new Set(selectedIdeaIds)];
    });
    persistState();

    document.querySelectorAll('.assign-client-check').forEach((check) => {
      check.checked = false;
    });
    syncSelectAllState();

    plannerData.forEach((row) => {
      if (row.clientRef && clientIdeaAssignment[row.clientRef]?.length) {
        row.ideaId = clientIdeaAssignment[row.clientRef][0];
      }
    });

    renderIdeaSelectPage();
    renderPlanner();
  });
}


document.getElementById('addAdminRow').addEventListener('click', () => {
  adminData.push({ ref: '', allocationId: '', clientCode: '', clientName: '' });
  persistState();
  renderAdmin();
  renderPlanner();
});

document.getElementById('addOverviewRow').addEventListener('click', () => {
  overviewData.push({ ideaId: '', stock: '', tradeName: '', expiry: '', strike: 0, peCe: 'CE', buySell: 'BUY', lotSize: 0, expectedPremiumPoints: 0 });
  persistState();
  renderOverview();
  renderPlanner();
});

document.getElementById('addPlannerRow').addEventListener('click', () => {
  plannerData.push({ clientRef: '', monthlyTarget: 0, slot: '', ideaId: '', intendedPct: 0.5 });
  persistState();
  renderPlanner();
});

document.getElementById('exportCsv').addEventListener('click', exportPlannerCsv);

function toMoney(n) {
  return Number(n || 0).toLocaleString();
}

function toPercent(n) {
  return `${Math.round(Number(n || 0) * 100)}%`;
}

function getClient(ref) {
  return adminData.find((x) => x.ref === ref) || null;
}

function getIdea(ideaId) {
  return overviewData.find((x) => x.ideaId === ideaId) || null;
}


function isDuplicateAdminValue(key, value, currentIndex) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return false;

  return adminData.some((row, index) => (
    index !== currentIndex
    && String(row[key] || '').trim().toLowerCase() === normalized
  ));
}


function normalizeExpiry(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const match = raw.match(/^(\d{2})\/([A-Za-z]{3})\/(\d{4})$/);
  if (!match) return null;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = match[1];
  const month = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
  const year = match[3];

  if (!months.includes(month)) return null;

  return `${day}/${month}/${year}`;
}

function sideClass(value) {
  return value === 'BUY' ? 'side-buy' : 'side-sell';
}



function expectedLotsRs(row) {
  return Number(row?.lotSize || 0) * Number(row?.expectedPremiumPoints || 0);
}

function inHandPrem(row) {
  return expectedLotsRs(row) * 0.75;
}

function calc(row) {
  const client = getClient(row.clientRef);
  const idea = getIdea(row.ideaId);

  const allocationId = client?.allocationId || '';
  const clientCode = client?.clientCode || '';
  const clientName = client?.clientName || '';

  const expectedLot = expectedLotsRs(idea);
  const stock = idea?.stock || '';
  const revenueNeeded = Number(row.monthlyTarget || 0) * Number(row.intendedPct || 0);
  const lotsNeeded = expectedLot > 0 ? Math.ceil(revenueNeeded / expectedLot) : 0;
  const plannedRevenue = lotsNeeded * expectedLot;
  const achievePct = Number(row.monthlyTarget || 0) > 0
    ? plannedRevenue / Number(row.monthlyTarget)
    : 0;

  let status = 'Not Started';
  if (achievePct >= 1) status = 'Complete';
  else if (achievePct >= 0.7) status = 'Near Complete';
  else if (achievePct > 0) status = 'Partial';

  return {
    allocationId,
    clientCode,
    clientName,
    stock,
    expectedLot,
    revenueNeeded,
    lotsNeeded,
    plannedRevenue,
    achievePct,
    status,
  };
}

function clientOptions(selected) {
  return adminData
    .map(({ ref, clientName }) => `<option ${selected === ref ? 'selected' : ''} value="${ref}">${ref} - ${clientName || 'Unnamed'}</option>`)
    .join('');
}

function ideaOptions(selected) {
  return overviewData
    .map(({ ideaId }) => `<option ${selected === ideaId ? 'selected' : ''} value="${ideaId}">${ideaId}</option>`)
    .join('');
}

function renderAdmin() {
  adminBody.innerHTML = '';
  adminData.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Client Ref"><input value="${row.ref}" data-k="ref" placeholder="CL001"></td>
      <td data-label="Allocation ID (A)"><input value="${row.allocationId}" data-k="allocationId"></td>
      <td data-label="Client Code (B)"><input value="${row.clientCode}" data-k="clientCode"></td>
      <td data-label="Client Name (C)"><input value="${row.clientName}" data-k="clientName"></td>
      <td data-label="Action"><button class="delete">✕</button></td>
    `;

    tr.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const key = e.target.dataset.k;
        const newValue = e.target.value;
        const oldValue = adminData[i][key];

        if (
          ['ref', 'clientCode', 'clientName'].includes(key)
          && isDuplicateAdminValue(key, newValue, i)
        ) {
          alert('duplicate data is entered');
          e.target.value = oldValue;
          return;
        }

        adminData[i][key] = newValue;
        persistState();
        renderPlanner();
      });
    });

    tr.querySelector('.delete').addEventListener('click', () => {
      adminData.splice(i, 1);
      persistState();
      renderAdmin();
      renderPlanner();
    });

    adminBody.appendChild(tr);
  });

  applyTableSearch();
  renderIdeaSelectPage();
  renderAdminRevenue();
}


function renderAdminRevenue() {
  if (!adminRevenueBody) return;

  adminRevenueBody.innerHTML = '';
  adminData.forEach((row) => {
    const tr = document.createElement('tr');
    const currentValue = adminExpectedRevenue[row.ref] ?? 0;
    tr.innerHTML = `
      <td data-label="Client Ref">${row.ref}</td>
      <td data-label="Allocation ID (A)">${row.allocationId}</td>
      <td data-label="Client Code (B)">${row.clientCode}</td>
      <td data-label="Client Name (C)">${row.clientName}</td>
      <td data-label="Expected Revenue"><input type="number" class="admin-revenue-input" data-client-ref="${row.ref}" value="${currentValue}"></td>
    `;
    adminRevenueBody.appendChild(tr);
  });

  adminRevenueBody.querySelectorAll('.admin-revenue-input').forEach((input) => {
    input.addEventListener('change', (e) => {
      const clientRef = e.target.dataset.clientRef;
      adminExpectedRevenue[clientRef] = Number(e.target.value || 0);
      persistState();
    });
  });

  applyTableSearch();
}

function renderOverview() {
  overviewBody.innerHTML = '';
  overviewData.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Idea ID"><input value="${row.ideaId}" data-k="ideaId"></td>
      <td data-label="Stock"><input value="${row.stock}" data-k="stock"></td>
      <td data-label="Trade Name"><input value="${row.tradeName}" data-k="tradeName"></td>
      <td data-label="Expiry"><input value="${row.expiry || ""}" placeholder="DD/MMM/YYYY" data-k="expiry"></td>
      <td data-label="Strike"><input type="number" value="${row.strike || 0}" data-k="strike"></td>
      <td data-label="PE/CE">
        <select data-k="peCe">
          <option ${row.peCe === 'PE' ? 'selected' : ''} value="PE">PE</option>
          <option ${row.peCe === 'CE' ? 'selected' : ''} value="CE">CE</option>
        </select>
      </td>
      <td data-label="BUY/SELL" class="${sideClass(row.buySell)}">
        <select data-k="buySell">
          <option ${row.buySell === 'BUY' ? 'selected' : ''} value="BUY">BUY</option>
          <option ${row.buySell === 'SELL' ? 'selected' : ''} value="SELL">SELL</option>
        </select>
      </td>
      <td data-label="Lot Size"><input type="number" value="${row.lotSize || 0}" data-k="lotSize"></td>
      <td data-label="Expected Premium Points"><input type="number" value="${row.expectedPremiumPoints || 0}" data-k="expectedPremiumPoints"></td>
      <td data-label="Expected/Lots RS" class="cell-auto">${toMoney(expectedLotsRs(row))}</td>
      <td data-label="In Hand Prem" class="cell-auto">${toMoney(inHandPrem(row))}</td>
      <td data-label="Action"><button class="delete">✕</button></td>
    `;

    tr.querySelectorAll('input, select').forEach((field) => {
      field.addEventListener('change', (e) => {
        const key = e.target.dataset.k;

        if (key === 'expiry') {
          const formatted = normalizeExpiry(e.target.value);
          if (formatted === null) {
            alert('Expiry must be in DD/MMM/YYYY format');
            e.target.value = row.expiry || '';
            return;
          }
          row.expiry = formatted;
        } else if (['strike', 'lotSize', 'expectedPremiumPoints'].includes(key)) {
          row[key] = Number(e.target.value || 0);
        } else {
          row[key] = e.target.value;
        }

        persistState();
        renderOverview();
        renderPlanner();
      });
    });

    tr.querySelector('.delete').addEventListener('click', () => {
      overviewData.splice(i, 1);
      persistState();
      renderOverview();
      renderPlanner();
    });

    overviewBody.appendChild(tr);
  });

  applyTableSearch();
  renderIdeaSelectPage();
  renderAdminRevenue();
}

function renderPlanner() {
  plannerBody.innerHTML = '';
  plannerData.forEach((row, i) => {
    const out = calc(row);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Client Ref"><select data-k="clientRef"><option value="">Select Client</option>${clientOptions(row.clientRef)}</select></td>
      <td data-label="Allocation ID (A)" class="cell-auto">${out.allocationId}</td>
      <td data-label="Client Code (B)" class="cell-auto">${out.clientCode}</td>
      <td data-label="Client Name (C)" class="cell-auto">${out.clientName}</td>
      <td data-label="Monthly Target"><input type="number" value="${row.monthlyTarget}" data-k="monthlyTarget"></td>
      <td data-label="Slot"><input value="${row.slot}" data-k="slot"></td>
      <td data-label="Idea ID"><select data-k="ideaId"><option value="">Select Idea</option>${ideaOptions(row.ideaId)}</select></td>
      <td data-label="Stock" class="cell-auto">${out.stock}</td>
      <td data-label="Intended %">
        <select data-k="intendedPct">
          ${[0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
            .map((v) => `<option ${Number(row.intendedPct) === v ? 'selected' : ''} value="${v}">${Math.round(v * 100)}%</option>`)
            .join('')}
        </select>
      </td>
      <td data-label="Revenue Needed" class="cell-auto">${toMoney(out.revenueNeeded)}</td>
      <td data-label="Expected / Lot" class="cell-auto">${toMoney(out.expectedLot)}</td>
      <td data-label="Lots Needed" class="cell-auto">${toMoney(out.lotsNeeded)}</td>
      <td data-label="Planned Revenue" class="cell-auto">${toMoney(out.plannedRevenue)}</td>
      <td data-label="Achieve %" class="cell-auto">${toPercent(out.achievePct)}</td>
      <td data-label="Coverage Status" class="cell-auto">${out.status}</td>
      <td data-label="Action"><button class="delete">✕</button></td>
    `;

    tr.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', (e) => {
        const key = e.target.dataset.k;
        const numeric = ['monthlyTarget', 'intendedPct'];
        plannerData[i][key] = numeric.includes(key) ? Number(e.target.value || 0) : e.target.value;

        if (key === 'clientRef' && clientIdeaAssignment[plannerData[i].clientRef]?.length) {
          plannerData[i].ideaId = clientIdeaAssignment[plannerData[i].clientRef][0];
        }

        persistState();
        renderPlanner();
      });
    });

    tr.querySelector('.delete').addEventListener('click', () => {
      plannerData.splice(i, 1);
      persistState();
      renderPlanner();
    });

    plannerBody.appendChild(tr);
  });

  renderSnapshot();
  applyTableSearch();
  renderIdeaSelectPage();
  renderAdminRevenue();
}

function renderSnapshot() {
  const totals = plannerData.map(calc);
  const clients = plannerData.length;
  const lots = totals.reduce((acc, x) => acc + x.lotsNeeded, 0);
  const revenue = totals.reduce((acc, x) => acc + x.plannedRevenue, 0);
  const hp = totals.filter((x) => x.lotsNeeded >= 2).length;
  const maxLot = Math.max(0, ...totals.map((x) => x.lotsNeeded));
  const avgRev = clients ? Math.round(revenue / clients) : 0;

  const cards = [
    ['Client Count', clients],
    ['Total Planned Lots', lots],
    ['Total Expected Revenue', toMoney(revenue)],
    ['High Priority Clients (2+ lots)', hp],
    ['Largest Allocation', maxLot],
    ['Average Revenue / Client', toMoney(avgRev)],
  ];

  snapshot.innerHTML = cards
    .map(([k, v]) => `<div class="metric"><span>${k}</span><strong>${v}</strong></div>`)
    .join('');
}

function exportPlannerCsv() {
  const headers = [
    'Client Ref',
    'Allocation ID',
    'Client Code',
    'Client Name',
    'Monthly Target',
    'Slot',
    'Idea ID',
    'Stock',
    'Intended %',
    'Revenue Needed',
    'Expected / Lot',
    'Lots Needed',
    'Planned Revenue',
    'Achieve %',
    'Coverage Status',
  ];

  const rows = plannerData.map((row) => {
    const out = calc(row);
    return [
      row.clientRef,
      out.allocationId,
      out.clientCode,
      out.clientName,
      row.monthlyTarget,
      row.slot,
      row.ideaId,
      out.stock,
      toPercent(row.intendedPct),
      out.revenueNeeded,
      out.expectedLot,
      out.lotsNeeded,
      out.plannedRevenue,
      toPercent(out.achievePct),
      out.status,
    ];
  });

  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'fno_planner.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

loadPersistedState();

renderAdmin();
renderAdminRevenue();
renderOverview();
renderIdeaSelectPage();
renderIdeaPlannerTable();
renderTradeDeciderTable();
switchIdeaTab('assign');
renderPlanner();

switchView('dashboard');
