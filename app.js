const STORAGE_KEY = "retorno-facil-clientes";

const form = document.querySelector("#client-form");
const clientList = document.querySelector("#client-list");
const emptyState = document.querySelector("#empty-state");
const statusFilter = document.querySelector("#status-filter");

let clients = loadClients();

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

function createInfoRow(label, value) {
  return `
    <div class="client-card-row">
      <span class="client-card-label">${label}</span>
      <p class="client-card-value">${escapeHtml(value)}</p>
    </div>
  `;
}

function getCurrentFilter() {
  if (!statusFilter) {
    return "todos";
  }

  return statusFilter.value;
}

function filterClientsByStatus(allClients, filter) {
  if (filter === "todos") {
    return allClients;
  }

  return allClients.filter((client) => client.status === filter);
}

function getEmptyStateMessage(filter) {
  if (filter === "todos") {
    return "Ainda nao ha clientes cadastrados.";
  }

  return "Nenhum cliente encontrado para o filtro selecionado.";
}

function createWhatsappLink(phone) {
  const normalizedPhone = normalizeWhatsappPhone(phone);

  if (!normalizedPhone) {
    return "";
  }

  return `https://wa.me/${normalizedPhone}`;
}

function renderClients() {
  if (!clientList || !emptyState) {
    return;
  }

  const currentFilter = getCurrentFilter();
  const visibleClients = filterClientsByStatus(clients, currentFilter);

  if (visibleClients.length === 0) {
    clientList.innerHTML = "";
    emptyState.textContent = getEmptyStateMessage(currentFilter);
    emptyState.classList.remove("is-hidden");
    return;
  }

  emptyState.classList.add("is-hidden");

  clientList.innerHTML = visibleClients
    .map((client) => {
      const whatsappLink = createWhatsappLink(client.phone);
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
          ${whatsappButton}
        </article>
      `;
    })
    .join("");
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

function resetForm() {
  if (!form) {
    return;
  }

  form.reset();
}

renderClients();

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const newClient = getClientFromForm();

    if (!newClient) {
      return;
    }

    clients = [newClient, ...clients];
    saveClients(clients);
    renderClients();
    resetForm();
  });
}

if (statusFilter) {
  statusFilter.addEventListener("change", () => {
    renderClients();
  });
}
