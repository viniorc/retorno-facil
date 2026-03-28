const STORAGE_KEY = "retorno-facil-clientes";

const form = document.querySelector("#client-form");
const clientList = document.querySelector("#client-list");
const emptyState = document.querySelector("#empty-state");

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

function saveClients(clients) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
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
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createInfoRow(label, value) {
  return `
    <div class="client-card-row">
      <span class="client-card-label">${label}</span>
      <p class="client-card-value">${escapeHtml(value)}</p>
    </div>
  `;
}

function renderClients(clients) {
  if (!clientList || !emptyState) {
    return;
  }

  if (clients.length === 0) {
    clientList.innerHTML = "";
    emptyState.classList.remove("is-hidden");
    return;
  }

  emptyState.classList.add("is-hidden");

  clientList.innerHTML = clients
    .map((client) => {
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

if (form) {
  let clients = loadClients();

  renderClients(clients);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const newClient = getClientFromForm();

    if (!newClient) {
      return;
    }

    clients = [newClient, ...clients];
    saveClients(clients);
    renderClients(clients);
    resetForm();
  });
}
