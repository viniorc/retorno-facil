const STORAGE_KEY = "retorno-facil-clientes";

const form = document.querySelector("#client-form");
const submitButton = document.querySelector("#submit-button");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const clientList = document.querySelector("#client-list");
const emptyState = document.querySelector("#empty-state");
const statusFilter = document.querySelector("#status-filter");
const searchInput = document.querySelector("#search-input");
const sortOrder = document.querySelector("#sort-order");

let editingClientId = null;
let clients = ensureClientIds(loadClients());

saveClients(clients);
renderClients();

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

function getReturnTimestamp(date) {
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
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
  renderClients();
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
        <article class="client-card">
          <div class="client-card-header">
            <h3 class="client-card-title">${escapeHtml(client.name)}</h3>
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
    renderClients();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderClients();
  });
}

if (sortOrder) {
  sortOrder.addEventListener("change", () => {
    renderClients();
  });
}

updateFormMode();
