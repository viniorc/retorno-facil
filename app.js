const STORAGE_KEY = "retorno-facil-clientes";

const form = document.querySelector("#client-form");
const submitButton = document.querySelector("#submit-button");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const clientList = document.querySelector("#client-list");
const emptyState = document.querySelector("#empty-state");
const statusFilter = document.querySelector("#status-filter");
const searchInput = document.querySelector("#search-input");
const sortOrder = document.querySelector("#sort-order");
const totalClientsValue = document.querySelector("#metric-total-clientes");
const waitingReturnValue = document.querySelector("#metric-aguardando-retorno");
const completedValue = document.querySelector("#metric-concluidos");
const overdueReturnsValue = document.querySelector("#metric-retornos-atrasados");
const todayReminders = document.querySelector("#today-reminders");
const overdueReminders = document.querySelector("#overdue-reminders");

let editingClientId = null;
let clients = ensureClientIds(loadClients());

saveClients(clients);
renderApp();

function loadClients() {
  const storedClients = window.localStorage.getItem(STORAGE_KEY);

  if (!storedClients) {
    return [];
  }

  try {
    const parsedClients = JSON.parse(storedClients);
    return Array.isArray(parsedClients) ? parsedClients : [];
  } catch (error) {
    console.error("Nao foi possivel ler os clientes salvos.", error);
    return [];
  }
}

function saveClients(updatedClients) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedClients));
}

function createClientId() {
  return `cliente-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function ensureClientIds(allClients) {
  let hasChanges = false;

  const normalizedClients = allClients.map((client) => {
    if (client.id) {
      return client;
    }

    hasChanges = true;

    return {
      ...client,
      id: createClientId(),
    };
  });

  return hasChanges ? normalizedClients : allClients;
}

function formatStatus(status) {
  const labels = {
    novo: "Novo",
    "em-atendimento": "Em atendimento",
    "aguardando-retorno": "Aguardando retorno",
    concluido: "Concluido",
  };

  return labels[status] || status;
}

function formatDate(date) {
  if (!date) {
    return "-";
  }

  const [year, month, day] = date.split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeWhatsappPhone(phone) {
  const digits = String(phone).replace(/\D/g, "").replace(/^0+/, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  return `55${digits}`;
}

function createWhatsappLink(phone) {
  const normalizedPhone = normalizeWhatsappPhone(phone);

  if (!normalizedPhone) {
    return "";
  }

  return `https://wa.me/${normalizedPhone}`;
}

function normalizeText(value) {
  return String(value).trim().toLowerCase();
}

function normalizeDigits(value) {
  return String(value).replace(/\D/g, "");
}

function createInfoRow(label, value) {
  return `
    <div class="client-card-row">
      <span class="client-card-label">${label}</span>
      <p class="client-card-value">${escapeHtml(value)}</p>
    </div>
  `;
}

function getCurrentFilter() {
  return statusFilter ? statusFilter.value : "todos";
}

function getSearchTerm() {
  return searchInput ? normalizeText(searchInput.value) : "";
}

function getSortOrder() {
  return sortOrder ? sortOrder.value : "padrao";
}

function filterClientsByStatus(allClients, filter) {
  if (filter === "todos") {
    return allClients;
  }

  return allClients.filter((client) => client.status === filter);
}

function filterClientsBySearch(allClients, searchTerm) {
  if (!searchTerm) {
    return allClients;
  }

  const digitsTerm = normalizeDigits(searchTerm);

  return allClients.filter((client) => {
    const nameMatches = normalizeText(client.name).includes(searchTerm);
    const phoneMatches = digitsTerm
      ? normalizeDigits(client.phone).includes(digitsTerm)
      : normalizeText(client.phone).includes(searchTerm);

    return nameMatches || phoneMatches;
  });
}

function createDateFromInput(date) {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getReturnTimestamp(date) {
  const parsedDate = createDateFromInput(date);
  return parsedDate ? parsedDate.getTime() : Number.POSITIVE_INFINITY;
}

function sortClients(allClients, currentSortOrder) {
  const sortedClients = [...allClients];

  if (currentSortOrder === "nome-a-z") {
    sortedClients.sort((firstClient, secondClient) => {
      return firstClient.name.localeCompare(secondClient.name, "pt-BR");
    });
  }

  if (currentSortOrder === "retorno-mais-proximo") {
    sortedClients.sort((firstClient, secondClient) => {
      return getReturnTimestamp(firstClient.returnDate) - getReturnTimestamp(secondClient.returnDate);
    });
  }

  if (currentSortOrder === "retorno-mais-distante") {
    sortedClients.sort((firstClient, secondClient) => {
      return getReturnTimestamp(secondClient.returnDate) - getReturnTimestamp(firstClient.returnDate);
    });
  }

  return sortedClients;
}

function getVisibleClients() {
  const filteredByStatus = filterClientsByStatus(clients, getCurrentFilter());
  const filteredBySearch = filterClientsBySearch(filteredByStatus, getSearchTerm());

  return sortClients(filteredBySearch, getSortOrder());
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getClientAlertType(client) {
  if (client.status === "concluido") {
    return "normal";
  }

  const returnDate = createDateFromInput(client.returnDate);

  if (!returnDate) {
    return "normal";
  }

  const todayStart = getTodayStart();

  if (returnDate < todayStart) {
    return "atrasado";
  }

  if (returnDate.getTime() === todayStart.getTime()) {
    return "hoje";
  }

  return "normal";
}

function calculateMetrics(allClients) {
  return {
    totalClients: allClients.length,
    waitingReturn: allClients.filter((client) => client.status === "aguardando-retorno").length,
    completed: allClients.filter((client) => client.status === "concluido").length,
    overdueReturns: allClients.filter((client) => getClientAlertType(client) === "atrasado").length,
  };
}

function getAlertLabel(alertType) {
  if (alertType === "atrasado") {
    return "Retorno atrasado";
  }

  if (alertType === "hoje") {
    return "Retorno hoje";
  }

  return "";
}

function getAlertClass(alertType) {
  if (alertType === "atrasado") {
    return "client-card--overdue";
  }

  if (alertType === "hoje") {
    return "client-card--today";
  }

  return "";
}

function renderMetrics() {
  const metrics = calculateMetrics(clients);

  if (totalClientsValue) {
    totalClientsValue.textContent = String(metrics.totalClients);
  }

  if (waitingReturnValue) {
    waitingReturnValue.textContent = String(metrics.waitingReturn);
  }

  if (completedValue) {
    completedValue.textContent = String(metrics.completed);
  }

  if (overdueReturnsValue) {
    overdueReturnsValue.textContent = String(metrics.overdueReturns);
  }
}

function getReminderClients(alertType) {
  return sortClients(
    clients.filter((client) => getClientAlertType(client) === alertType),
    "retorno-mais-proximo"
  );
}

function createReminderItem(client, alertType) {
  const whatsappLink = createWhatsappLink(client.phone);
  const whatsappButton = whatsappLink
    ? `
      <a
        class="whatsapp-button"
        href="${whatsappLink}"
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp
      </a>
    `
    : "";

  return `
    <article class="reminder-item reminder-item--${alertType}">
      <h3 class="reminder-title">${escapeHtml(client.name)}</h3>
      <div class="reminder-meta">
        <p class="reminder-line"><strong>Telefone:</strong> ${escapeHtml(client.phone)}</p>
        <p class="reminder-line"><strong>Status:</strong> ${escapeHtml(formatStatus(client.status))}</p>
        <p class="reminder-line"><strong>Próximo retorno:</strong> ${escapeHtml(formatDate(client.returnDate))}</p>
      </div>
      ${whatsappButton}
    </article>
  `;
}

function renderReminderList(container, clientsToRender, alertType, emptyMessage) {
  if (!container) {
    return;
  }

  if (clientsToRender.length === 0) {
    container.innerHTML = `<p class="reminder-empty">${emptyMessage}</p>`;
    return;
  }

  container.innerHTML = clientsToRender
    .map((client) => createReminderItem(client, alertType))
    .join("");
}

function renderReminders() {
  renderReminderList(
    todayReminders,
    getReminderClients("hoje"),
    "today",
    "Nenhum retorno previsto para hoje."
  );

  renderReminderList(
    overdueReminders,
    getReminderClients("atrasado"),
    "overdue",
    "Nenhum retorno atrasado no momento."
  );
}

function getEmptyStateMessage() {
  if (clients.length === 0) {
    return "Ainda nao ha clientes cadastrados.";
  }

  return "Nenhum cliente encontrado com os filtros atuais.";
}

function updateFormMode() {
  if (!submitButton || !cancelEditButton) {
    return;
  }

  const isEditing = Boolean(editingClientId);

  submitButton.textContent = isEditing ? "Atualizar cliente" : "Salvar cliente";
  cancelEditButton.classList.toggle("is-hidden", !isEditing);
}

function resetForm() {
  if (!form) {
    return;
  }

  form.reset();
}

function exitEditMode() {
  editingClientId = null;
  resetForm();
  updateFormMode();
}

function findClientById(clientId) {
  return clients.find((client) => client.id === clientId) || null;
}

function fillFormWithClient(client) {
  if (!form || !client) {
    return;
  }

  form.elements.nome.value = client.name;
  form.elements.telefone.value = client.phone;
  form.elements.observacao.value = client.notes;
  form.elements.status.value = client.status;
  form.elements["proximo-retorno"].value = client.returnDate;
}

function enterEditMode(clientId) {
  const client = findClientById(clientId);

  if (!client) {
    return;
  }

  editingClientId = client.id;
  fillFormWithClient(client);
  updateFormMode();
}

function getClientFromForm() {
  if (!form) {
    return null;
  }

  const formData = new FormData(form);

  return {
    name: String(formData.get("nome") || "").trim(),
    phone: String(formData.get("telefone") || "").trim(),
    notes: String(formData.get("observacao") || "").trim(),
    status: String(formData.get("status") || "").trim(),
    returnDate: String(formData.get("proximo-retorno") || "").trim(),
  };
}

function persistAndRender() {
  saveClients(clients);
  renderApp();
}

function removeClient(clientId) {
  const shouldRemove = window.confirm("Deseja remover este cliente?");

  if (!shouldRemove) {
    return;
  }

  clients = clients.filter((client) => client.id !== clientId);

  if (editingClientId === clientId) {
    exitEditMode();
  }

  persistAndRender();
}

function renderClients() {
  if (!clientList || !emptyState) {
    return;
  }

  const visibleClients = getVisibleClients();

  if (visibleClients.length === 0) {
    clientList.innerHTML = "";
    emptyState.textContent = getEmptyStateMessage();
    emptyState.classList.remove("is-hidden");
    return;
  }

  emptyState.classList.add("is-hidden");

  clientList.innerHTML = visibleClients
    .map((client) => {
      const whatsappLink = createWhatsappLink(client.phone);
      const safeClientId = escapeHtml(client.id);
      const alertType = getClientAlertType(client);
      const alertLabel = getAlertLabel(alertType);
      const alertClass = getAlertClass(alertType);
      const alertBadge = alertLabel
        ? `<span class="client-alert-badge client-alert-badge--${alertType}">${escapeHtml(alertLabel)}</span>`
        : "";
      const whatsappButton = whatsappLink
        ? `
          <a
            class="whatsapp-button"
            href="${whatsappLink}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir no WhatsApp
          </a>
        `
        : "";

      return `
        <article class="client-card ${alertClass}">
          <div class="client-card-header">
            <div class="client-card-title-group">
              <h3 class="client-card-title">${escapeHtml(client.name)}</h3>
              ${alertBadge}
            </div>
            <span class="client-card-status">${escapeHtml(formatStatus(client.status))}</span>
          </div>
          <div class="client-card-info">
            ${createInfoRow("Telefone", client.phone)}
            ${createInfoRow("Observacao", client.notes)}
            ${createInfoRow("Proximo retorno", formatDate(client.returnDate))}
          </div>
          <div class="client-card-actions">
            ${whatsappButton}
            <button class="card-action-button" type="button" data-action="edit" data-client-id="${safeClientId}">
              Editar
            </button>
            <button
              class="card-action-button remove-button"
              type="button"
              data-action="remove"
              data-client-id="${safeClientId}"
            >
              Remover
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderApp() {
  renderMetrics();
  renderReminders();
  renderClients();
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formClient = getClientFromForm();

    if (!formClient) {
      return;
    }

    if (editingClientId) {
      clients = clients.map((client) => {
        if (client.id !== editingClientId) {
          return client;
        }

        return {
          ...client,
          ...formClient,
        };
      });
    } else {
      clients = [
        {
          id: createClientId(),
          ...formClient,
        },
        ...clients,
      ];
    }

    persistAndRender();
    exitEditMode();
  });
}

if (cancelEditButton) {
  cancelEditButton.addEventListener("click", () => {
    exitEditMode();
  });
}

if (clientList) {
  clientList.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");

    if (!actionButton) {
      return;
    }

    const clientId = actionButton.getAttribute("data-client-id");
    const action = actionButton.getAttribute("data-action");

    if (!clientId || !action) {
      return;
    }

    if (action === "edit") {
      enterEditMode(clientId);
    }

    if (action === "remove") {
      removeClient(clientId);
    }
  });
}

if (statusFilter) {
  statusFilter.addEventListener("change", () => {
    renderApp();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderApp();
  });
}

if (sortOrder) {
  sortOrder.addEventListener("change", () => {
    renderApp();
  });
}

updateFormMode();
