const STORAGE_KEYS = {
  services: "resenha-boa-services-v13",
  queue: "resenha-boa-queue-v13",
  history: "resenha-boa-history-v13",
  professional: "resenha-boa-professional-v13",
  closures: "resenha-boa-closures-v13",
  knownCustomers: "resenha-boa-known-customers-v14",
  alertSettings: "resenha-boa-alert-settings-v14"
};

const DEFAULT_SERVICES = [
  { id: crypto.randomUUID(), name: "Corte", price: 35 },
  { id: crypto.randomUUID(), name: "Barba", price: 25 },
  { id: crypto.randomUUID(), name: "Corte + barba", price: 55 },
  { id: crypto.randomUUID(), name: "Pezinho", price: 10 }
];

let services = load(STORAGE_KEYS.services, DEFAULT_SERVICES);
let queue = load(STORAGE_KEYS.queue, []);
let history = load(STORAGE_KEYS.history, []);
let alertSettings = load(STORAGE_KEYS.alertSettings, {
  soundType: "soft",
  volume: 70,
  vibrationOnly: false
});
let professional = load(STORAGE_KEYS.professional, { name: "" });
let closures = load(STORAGE_KEYS.closures, []);
let knownCustomers = load(STORAGE_KEYS.knownCustomers, []);
let deferredInstallPrompt = null;
let calendarDate = new Date();
let selectedCalendarDate = localDateKey();
let audioContext = null;
const alertedCustomers = new Set();

const elements = {
  tabs: document.querySelectorAll(".tab"),
  views: document.querySelectorAll(".view"),
  todayLabel: document.querySelector("#todayLabel"),

  premiumGreeting: document.querySelector("#premiumGreeting"),
  premiumHeroSummary: document.querySelector("#premiumHeroSummary"),
  premiumCurrentCustomer: document.querySelector("#premiumCurrentCustomer"),
  premiumCurrentService: document.querySelector("#premiumCurrentService"),
  premiumCurrentBadge: document.querySelector("#premiumCurrentBadge"),
  premiumRemainingTime: document.querySelector("#premiumRemainingTime"),
  premiumTimerCaption: document.querySelector("#premiumTimerCaption"),
  premiumProgressBar: document.querySelector("#premiumProgressBar"),
  premiumWeekTotal: document.querySelector("#premiumWeekTotal"),
  premiumWeeklyChart: document.querySelector("#premiumWeeklyChart"),
  premiumPayments: document.querySelector("#premiumPayments"),
  premiumTopServices: document.querySelector("#premiumTopServices"),
  premiumFrequentCustomers: document.querySelector("#premiumFrequentCustomers"),
  mobileNavItems: document.querySelectorAll(".mobile-app-nav__item"),
  mobileMoreButton: document.querySelector("#mobileMoreButton"),
  mobileMoreMenu: document.querySelector("#mobileMoreMenu"),
  mobileMoreBackdrop: document.querySelector("#mobileMoreBackdrop"),
  mobileMoreClose: document.querySelector("#mobileMoreClose"),
  mobileMoreCollapse: document.querySelector("#mobileMoreCollapse"),
  mobileMoreTargetButtons: document.querySelectorAll("[data-mobile-more-target]"),
  dashboardTargetButtons: document.querySelectorAll("[data-dashboard-target]"),


  customerForm: document.querySelector("#customerForm"),
  customerName: document.querySelector("#customerName"),
  customerPhone: document.querySelector("#customerPhone"),
  customerService: document.querySelector("#customerService"),
  customerPayment: document.querySelector("#customerPayment"),
  customerValue: document.querySelector("#customerValue"),

  callNextButton: document.querySelector("#callNextButton"),
  nextCustomerName: document.querySelector("#nextCustomerName"),
  nextCustomerDetails: document.querySelector("#nextCustomerDetails"),
  quickQueue: document.querySelector("#quickQueue"),
  queueList: document.querySelector("#queueList"),

  serviceForm: document.querySelector("#serviceForm"),
  serviceId: document.querySelector("#serviceId"),
  serviceName: document.querySelector("#serviceName"),
  servicePrice: document.querySelector("#servicePrice"),
  saveServiceButton: document.querySelector("#saveServiceButton"),
  cancelServiceEditButton: document.querySelector("#cancelServiceEditButton"),
  serviceList: document.querySelector("#serviceList"),

  knownCustomerForm: document.querySelector("#knownCustomerForm"),
  knownCustomerId: document.querySelector("#knownCustomerId"),
  knownCustomerName: document.querySelector("#knownCustomerName"),
  knownCustomerPhone: document.querySelector("#knownCustomerPhone"),
  knownCustomerService: document.querySelector("#knownCustomerService"),
  knownCustomerPayment: document.querySelector("#knownCustomerPayment"),
  knownCustomerNotes: document.querySelector("#knownCustomerNotes"),
  saveKnownCustomerButton: document.querySelector("#saveKnownCustomerButton"),
  cancelKnownCustomerEditButton: document.querySelector("#cancelKnownCustomerEditButton"),
  knownCustomerSearch: document.querySelector("#knownCustomerSearch"),
  knownCustomerList: document.querySelector("#knownCustomerList"),

  knownCustomerQueueDialog: document.querySelector("#knownCustomerQueueDialog"),
  knownCustomerQueueForm: document.querySelector("#knownCustomerQueueForm"),
  knownCustomerQueueId: document.querySelector("#knownCustomerQueueId"),
  knownCustomerQueueTitle: document.querySelector("#knownCustomerQueueTitle"),
  knownCustomerQueueService: document.querySelector("#knownCustomerQueueService"),
  knownCustomerQueuePayment: document.querySelector("#knownCustomerQueuePayment"),
  cancelKnownCustomerQueueButton: document.querySelector("#cancelKnownCustomerQueueButton"),

  serviceDurationDialog: document.querySelector("#serviceDurationDialog"),
  serviceDurationForm: document.querySelector("#serviceDurationForm"),
  serviceDurationCustomerId: document.querySelector("#serviceDurationCustomerId"),
  serviceDurationTitle: document.querySelector("#serviceDurationTitle"),
  serviceDurationMinutes: document.querySelector("#serviceDurationMinutes"),
  confirmStartServiceButton: document.querySelector("#confirmStartServiceButton"),
  cancelServiceDurationButton: document.querySelector("#cancelServiceDurationButton"),
  durationOptionButtons: document.querySelectorAll(".duration-option"),

  historyDateFilter: document.querySelector("#historyDateFilter"),
  clearHistoryFilterButton: document.querySelector("#clearHistoryFilterButton"),
  clearHistoryButton: document.querySelector("#clearHistoryButton"),
  historyList: document.querySelector("#historyList"),

  metricQueue: document.querySelector("#metricQueue"),
  metricInService: document.querySelector("#metricInService"),
  metricServed: document.querySelector("#metricServed"),
  metricRevenue: document.querySelector("#metricRevenue"),
  metricAverage: document.querySelector("#metricAverage"),
  metricAverageTime: document.querySelector("#metricAverageTime"),

  professionalHeader: document.querySelector("#professionalHeader"),
  professionalPhoto: document.querySelector("#professionalPhoto"),
  professionalPhotoPreview: document.querySelector("#professionalPhotoPreview"),
  professionalPhotoInput: document.querySelector("#professionalPhotoInput"),
  removeProfessionalPhotoButton: document.querySelector("#removeProfessionalPhotoButton"),
  alertSoundType: document.querySelector("#alertSoundType"),
  alertVolume: document.querySelector("#alertVolume"),
  alertVolumeValue: document.querySelector("#alertVolumeValue"),
  vibrationOnly: document.querySelector("#vibrationOnly"),
  soundSettingsForm: document.querySelector("#soundSettingsForm"),
  saveSoundSettingsButton: document.querySelector("#saveSoundSettingsButton"),
  soundSettingsFeedback: document.querySelector("#soundSettingsFeedback"),
  testSoundButton: document.querySelector("#testSoundButton"),
  professionalDialog: document.querySelector("#professionalDialog"),
  professionalForm: document.querySelector("#professionalForm"),
  professionalName: document.querySelector("#professionalName"),
  cancelProfessionalButton: document.querySelector("#cancelProfessionalButton"),
  professionalSettingsForm: document.querySelector("#professionalSettingsForm"),
  professionalSettingsName: document.querySelector("#professionalSettingsName"),

  editCustomerDialog: document.querySelector("#editCustomerDialog"),
  editCustomerForm: document.querySelector("#editCustomerForm"),
  editCustomerId: document.querySelector("#editCustomerId"),
  editCustomerName: document.querySelector("#editCustomerName"),
  editCustomerPhone: document.querySelector("#editCustomerPhone"),
  editCustomerService: document.querySelector("#editCustomerService"),
  editCustomerPayment: document.querySelector("#editCustomerPayment"),
  cancelCustomerEditButton: document.querySelector("#cancelCustomerEditButton"),

  calendarMonthLabel: document.querySelector("#calendarMonthLabel"),
  calendarGrid: document.querySelector("#calendarGrid"),
  previousMonthButton: document.querySelector("#previousMonthButton"),
  nextMonthButton: document.querySelector("#nextMonthButton"),
  monthlyAttendanceCount: document.querySelector("#monthlyAttendanceCount"),
  monthlyRevenue: document.querySelector("#monthlyRevenue"),
  monthlyAverage: document.querySelector("#monthlyAverage"),
  monthlyAverageTime: document.querySelector("#monthlyAverageTime"),
  monthlyPaymentSummary: document.querySelector("#monthlyPaymentSummary"),
  monthlyServiceSummary: document.querySelector("#monthlyServiceSummary"),

  reportDate: document.querySelector("#reportDate"),
  reportDateLabel: document.querySelector("#reportDateLabel"),
  reportProfessional: document.querySelector("#reportProfessional"),
  reportAttendanceCount: document.querySelector("#reportAttendanceCount"),
  reportRevenue: document.querySelector("#reportRevenue"),
  reportAverage: document.querySelector("#reportAverage"),
  reportAverageTime: document.querySelector("#reportAverageTime"),
  paymentSummary: document.querySelector("#paymentSummary"),
  serviceSummary: document.querySelector("#serviceSummary"),
  closureStatus: document.querySelector("#closureStatus"),
  printReportButton: document.querySelector("#printReportButton"),
  closeDayButton: document.querySelector("#closeDayButton"),

  calendarDayDialog: document.querySelector("#calendarDayDialog"),
  calendarDayDialogTitle: document.querySelector("#calendarDayDialogTitle"),
  calendarDayDialogSummary: document.querySelector("#calendarDayDialogSummary"),
  calendarDayDialogList: document.querySelector("#calendarDayDialogList"),
  closeCalendarDayDialogButton: document.querySelector("#closeCalendarDayDialogButton"),
  openDayHistoryButton: document.querySelector("#openDayHistoryButton"),
  openDayReportButton: document.querySelector("#openDayReportButton"),

  toast: document.querySelector("#toast"),
  installAppButton: document.querySelector("#installAppButton")
};

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function saveAll() {
  localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(services));
  localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(queue));
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  localStorage.setItem(STORAGE_KEYS.alertSettings, JSON.stringify(alertSettings));
  localStorage.setItem(STORAGE_KEYS.professional, JSON.stringify(professional));
  localStorage.setItem(STORAGE_KEYS.closures, JSON.stringify(closures));
  localStorage.setItem(STORAGE_KEYS.knownCustomers, JSON.stringify(knownCustomers));
}

function localDateKey(value = new Date()) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value) || 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long"
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatPhone(value) {
  const digits = String(value).replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function digitsOnly(value) {
  return String(value).replace(/\D/g, "");
}

function durationSeconds(start, end = new Date()) {
  if (!start) return 0;
  return Math.max(0, Math.floor((new Date(end) - new Date(start)) / 1000));
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, secs]
      .map(value => String(value).padStart(2, "0"))
      .join(":");
  }

  return [minutes, secs]
    .map(value => String(value).padStart(2, "0"))
    .join(":");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2800);
}

function swalAvailable() {
  return typeof window.Swal !== "undefined";
}

async function confirmAction({ title, html, confirmText = "Confirmar", icon = "question" }) {
  if (!swalAvailable()) {
    return window.confirm(`${title}\n\n${String(html).replace(/<[^>]*>/g, "")}`);
  }

  const result = await Swal.fire({
    title,
    html,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    focusCancel: true
  });

  return result.isConfirmed;
}


function remainingSeconds(customer) {
  if (!customer.expectedEndAt) return null;
  return Math.floor((new Date(customer.expectedEndAt) - new Date()) / 1000);
}

function playAlarmSound(type = alertSettings.soundType, volume = alertSettings.volume) {
  if (alertSettings.vibrationOnly) return;

  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    const gainValue = Math.max(0.01, Math.min(1, Number(volume) / 100));
    const now = audioContext.currentTime;
    const gain = audioContext.createGain();

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    gain.connect(audioContext.destination);

    const patterns = {
      soft: [{frequency:660,start:0,duration:.45}],
      double: [{frequency:820,start:0,duration:.22},{frequency:820,start:.32,duration:.22}],
      bell: [{frequency:1046,start:0,duration:.35},{frequency:784,start:.38,duration:.5}],
      strong: [{frequency:980,start:0,duration:.28},{frequency:620,start:.28,duration:.28},{frequency:980,start:.56,duration:.42}]
    };

    for (const note of (patterns[type] || patterns.soft)) {
      const oscillator = audioContext.createOscillator();
      oscillator.type = type === "bell" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(note.frequency, now + note.start);
      oscillator.connect(gain);
      oscillator.start(now + note.start);
      oscillator.stop(now + note.start + note.duration);
    }
  } catch (error) {
    console.warn("Alerta sonoro indisponível.", error);
  }
}

function addMinutesToService(customer, minutes = 5) {
  const base = customer.expectedEndAt && new Date(customer.expectedEndAt) > new Date()
    ? new Date(customer.expectedEndAt)
    : new Date();

  customer.expectedEndAt = new Date(base.getTime() + minutes * 60000).toISOString();
  customer.plannedDurationMinutes = Number(customer.plannedDurationMinutes || 0) + minutes;
  alertedCustomers.delete(customer.id);
  renderAll();
  showToast(`${minutes} minutos adicionados.`);
}

async function showTimeFinishedAlert(customer) {
  playAlarmSound();
  if ("vibrate" in navigator) navigator.vibrate([250,120,250,120,500]);

  const result = await Swal.fire({
    title: "Tempo previsto encerrado",
    html: `<strong>${escapeHtml(customer.name)}</strong><br>${escapeHtml(customer.serviceName)} — ${formatMoney(customer.value)}`,
    icon: "warning",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Finalizar",
    denyButtonText: "Adicionar 5 min",
    cancelButtonText: "Fechar"
  });

  if (result.isConfirmed) await finishCustomer(customer);
  if (result.isDenied) addMinutesToService(customer, 5);
}

function openServiceDurationDialog(customer) {
  elements.serviceDurationCustomerId.value = customer.id;
  elements.serviceDurationTitle.textContent = `Tempo previsto para ${customer.name}`;
  elements.serviceDurationMinutes.value = 30;
  elements.durationOptionButtons.forEach(button => {
    button.classList.toggle("is-selected", button.dataset.minutes === "30");
  });
  elements.serviceDurationDialog.showModal();
}


function resizeImageFile(file, maxSize = 256, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = maxSize;
        canvas.height = maxSize;

        const context = canvas.getContext("2d");
        const scale = Math.max(maxSize / image.width, maxSize / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        const x = (maxSize - width) / 2;
        const y = (maxSize - height) / 2;

        context.drawImage(image, x, y, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };

      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderProfessional() {
  const name = professional.name?.trim() || "não configurado";
  const photo = professional.photo || "./assets/images/professional-placeholder.svg";

  elements.professionalHeader.textContent = name;
  elements.reportProfessional.textContent = `Profissional: ${name}`;
  elements.professionalPhoto.src = photo;
  elements.professionalPhotoPreview.src = photo;
  elements.professionalSettingsName.value = professional.name || "";

  elements.alertSoundType.value = alertSettings.soundType;
  elements.alertVolume.value = alertSettings.volume;
  elements.alertVolumeValue.textContent = `${alertSettings.volume}%`;
  elements.vibrationOnly.checked = alertSettings.vibrationOnly;
}

function renderServiceOptions() {
  const currentCustomerService = elements.customerService.value;
  const currentEditService = elements.editCustomerService.value;

  const options = services
    .map(service => `
      <option value="${service.id}">
        ${escapeHtml(service.name)} — ${formatMoney(service.price)}
      </option>
    `)
    .join("");

  elements.customerService.innerHTML = `<option value="">Selecione</option>${options}`;
  elements.editCustomerService.innerHTML = options;
  elements.knownCustomerService.innerHTML = options;
  elements.knownCustomerQueueService.innerHTML = options;

  if (services.some(service => service.id === currentCustomerService)) {
    elements.customerService.value = currentCustomerService;
  }

  if (services.some(service => service.id === currentEditService)) {
    elements.editCustomerService.value = currentEditService;
  }
}

function renderServices() {
  if (services.length === 0) {
    elements.serviceList.innerHTML = '<div class="empty-state">Nenhum serviço cadastrado.</div>';
    return;
  }

  elements.serviceList.innerHTML = services
    .map(service => `
      <article class="service-card">
        <div class="card-topline">
          <div>
            <h3>${escapeHtml(service.name)}</h3>
            <p class="muted">${formatMoney(service.price)}</p>
          </div>
        </div>

        <div class="card-actions">
          <button
            class="button button--secondary"
            type="button"
            data-action="edit-service"
            data-id="${service.id}"
          >
            Editar
          </button>

          <button
            class="button button--danger-outline"
            type="button"
            data-action="delete-service"
            data-id="${service.id}"
          >
            Excluir
          </button>
        </div>
      </article>
    `)
    .join("");
}

function statusInfo(customer) {
  if (customer.status === "em_atendimento") {
    return { label: "Em atendimento", className: "badge--service" };
  }

  if (customer.status === "chamado") {
    return { label: "Chamado", className: "badge--called" };
  }

  return { label: "Aguardando", className: "badge--waiting" };
}

function queueSort(items) {
  return [...items].sort((a, b) => {
    const aInService = a.status === "em_atendimento" ? 0 : 1;
    const bInService = b.status === "em_atendimento" ? 0 : 1;

    if (aInService !== bInService) return aInService - bInService;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

function renderQueue() {
  const sortedQueue = queueSort(queue);
  const nextWaiting = sortedQueue.find(customer => customer.status !== "em_atendimento");

  elements.callNextButton.disabled = !nextWaiting;

  if (nextWaiting) {
    elements.nextCustomerName.textContent = nextWaiting.name;
    elements.nextCustomerDetails.textContent =
      `${nextWaiting.serviceName} • ${formatMoney(nextWaiting.value)} • espera ${formatDuration(durationSeconds(nextWaiting.createdAt))}`;
  } else if (sortedQueue.some(customer => customer.status === "em_atendimento")) {
    elements.nextCustomerName.textContent = "Atendimento em andamento";
    elements.nextCustomerDetails.textContent = "Finalize o atendimento atual para avançar a fila.";
  } else {
    elements.nextCustomerName.textContent = "Fila vazia";
    elements.nextCustomerDetails.textContent = "Cadastre um cliente para começar.";
  }

  const waitingOnly = sortedQueue.filter(customer => customer.status !== "em_atendimento");

  elements.quickQueue.innerHTML = waitingOnly.length
    ? waitingOnly.slice(0, 4).map((customer, index) => `
        <div class="compact-item">
          <span><strong>${index + 1}.</strong> ${escapeHtml(customer.name)}</span>
          <span>${formatDuration(durationSeconds(customer.createdAt))}</span>
        </div>
      `).join("")
    : '<div class="empty-state">Nenhum cliente aguardando.</div>';

  elements.queueList.innerHTML = sortedQueue.length
    ? sortedQueue.map((customer, index) => customerCard(customer, index)).join("")
    : '<div class="empty-state">A fila está vazia.</div>';
}

function customerCard(customer, index) {
  const status = statusInfo(customer);
  const waitingSeconds = durationSeconds(customer.createdAt);
  const serviceSeconds = customer.startedAt
    ? durationSeconds(customer.startedAt)
    : 0;
  const remaining = customer.status === "em_atendimento" ? remainingSeconds(customer) : null;
  const overdue = remaining !== null && remaining <= 0;

  const primaryAction = customer.status === "em_atendimento"
    ? `
      <button class="button button--success" type="button" data-action="finish" data-id="${customer.id}">
        Finalizar
      </button>
      <button class="button button--secondary" type="button" data-action="add-five" data-id="${customer.id}">
        +5 min
      </button>
    `
    : `
      <button class="button button--info" type="button" data-action="start" data-id="${customer.id}">
        Iniciar atendimento
      </button>
    `;

  return `
    <article
      class="customer-card"
      data-customer-id="${customer.id}"
      data-customer-status="${customer.status}"
    >
      <div class="card-topline">
        <div>
          <p class="muted">Posição ${index + 1}</p>
          <h3>${escapeHtml(customer.name)}</h3>
        </div>

        <span class="badge ${status.className}">${status.label}</span>
      </div>

      <div class="meta">
        <div>
          <span>Serviço</span>
          <strong>${escapeHtml(customer.serviceName)}</strong>
        </div>

        <div>
          <span>Valor</span>
          <strong>${formatMoney(customer.value)}</strong>
        </div>

        <div>
          <span>Pagamento</span>
          <strong>${escapeHtml(customer.payment)}</strong>
        </div>

        <div>
          <span>Entrada</span>
          <strong>${formatDateTime(customer.createdAt)}</strong>
        </div>
      </div>

      <div class="timer ${
        customer.status === "em_atendimento"
          ? overdue ? "timer--active timer--overdue" : "timer--active timer--countdown"
          : "timer--waiting"
      }">
        <span class="timer__icon" aria-hidden="true">${customer.status === "em_atendimento" ? "⏳" : "⌛"}</span>
        <span class="timer__content">
          ${
            customer.status === "em_atendimento"
              ? `Tempo de atendimento: <strong data-live-service="${customer.id}">${formatDuration(serviceSeconds)}</strong>
                 <span class="timer__remaining" data-live-remaining="${customer.id}">
                   ${overdue ? `Tempo excedido: ${formatDuration(Math.abs(remaining))}` : `Tempo restante: ${formatDuration(remaining)}`}
                 </span>`
              : `Tempo de espera: <strong data-live-wait="${customer.id}">${formatDuration(waitingSeconds)}</strong>`
          }
        </span>
      </div>

      <div class="card-actions">
        <button class="button button--accent" type="button" data-action="whatsapp" data-id="${customer.id}">
          WhatsApp
        </button>

        ${primaryAction}

        <details class="more-actions">
          <summary class="button button--secondary">Mais ações</summary>

          <div class="more-actions__menu">
            <button class="button button--secondary" type="button" data-action="edit" data-id="${customer.id}">
              Editar
            </button>

            <button
              class="button button--secondary"
              type="button"
              data-action="move-up"
              data-id="${customer.id}"
              ${index === 0 ? "disabled" : ""}
            >
              Subir na fila
            </button>

            <button class="button button--danger-outline" type="button" data-action="remove" data-id="${customer.id}">
              Remover
            </button>

            <button
              class="button button--secondary more-actions__close"
              type="button"
              data-action="close-actions"
              data-id="${customer.id}"
            >
              <span aria-hidden="true">←</span>
              Voltar
            </button>
          </div>
        </details>
      </div>
    </article>
  `;
}

function filteredHistory() {
  const selectedDate = elements.historyDateFilter.value;

  if (!selectedDate) {
    return [...history].reverse();
  }

  return history
    .filter(item => localDateKey(item.finishedAt) === selectedDate)
    .reverse();
}

function renderHistory() {
  const items = filteredHistory();

  if (items.length === 0) {
    elements.historyList.innerHTML = '<div class="empty-state">Nenhum atendimento encontrado.</div>';
    return;
  }

  elements.historyList.innerHTML = items
    .map(item => `
      <article class="history-card">
        <div class="card-topline">
          <div>
            <h3>${escapeHtml(item.name)}</h3>
            <p class="muted">${escapeHtml(item.serviceName)}</p>
          </div>

          <span class="badge badge--served">Atendido</span>
        </div>

        <div class="meta">
          <div>
            <span>Valor</span>
            <strong>${formatMoney(item.value)}</strong>
          </div>

          <div>
            <span>Pagamento</span>
            <strong>${escapeHtml(item.payment)}</strong>
          </div>

          <div>
            <span>Duração</span>
            <strong>${formatDuration(item.durationSeconds || 0)}</strong>
          </div>

          <div>
            <span>Finalizado</span>
            <strong>${formatDateTime(item.finishedAt)}</strong>
          </div>
        </div>
      </article>
    `)
    .join("");
}

function todayHistory() {
  const today = localDateKey();
  return history.filter(item => localDateKey(item.finishedAt) === today);
}

function renderMetrics() {
  const completedToday = todayHistory();
  const revenue = completedToday.reduce((total, item) => total + Number(item.value), 0);
  const average = completedToday.length ? revenue / completedToday.length : 0;
  const durationTotal = completedToday.reduce(
    (total, item) => total + Number(item.durationSeconds || 0),
    0
  );
  const averageDuration = completedToday.length
    ? Math.round(durationTotal / completedToday.length)
    : 0;

  elements.metricQueue.textContent = queue.filter(item => item.status !== "em_atendimento").length;
  elements.metricInService.textContent = queue.filter(item => item.status === "em_atendimento").length;
  elements.metricServed.textContent = completedToday.length;
  elements.metricRevenue.textContent = formatMoney(revenue);
  elements.metricAverage.textContent = formatMoney(average);
  elements.metricAverageTime.textContent = formatDuration(averageDuration);
}


function renderMonthlySummary() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const monthItems = history.filter(item => {
    const finished = new Date(item.finishedAt);
    return finished.getFullYear() === year && finished.getMonth() === month;
  });

  const revenue = monthItems.reduce(
    (total, item) => total + Number(item.value),
    0
  );

  const average = monthItems.length
    ? revenue / monthItems.length
    : 0;

  const durationTotal = monthItems.reduce(
    (total, item) => total + Number(item.durationSeconds || 0),
    0
  );

  const averageDuration = monthItems.length
    ? Math.round(durationTotal / monthItems.length)
    : 0;

  const payments = monthItems.reduce((summary, item) => {
    summary[item.payment] = (summary[item.payment] || 0) + Number(item.value);
    return summary;
  }, {});

  const servicesSummary = monthItems.reduce((summary, item) => {
    const current = summary[item.serviceName] || { count: 0, total: 0 };
    current.count += 1;
    current.total += Number(item.value);
    summary[item.serviceName] = current;
    return summary;
  }, {});

  elements.monthlyAttendanceCount.textContent = monthItems.length;
  elements.monthlyRevenue.textContent = formatMoney(revenue);
  elements.monthlyAverage.textContent = formatMoney(average);
  elements.monthlyAverageTime.textContent = formatDuration(averageDuration);

  const paymentEntries = Object.entries(payments);

  elements.monthlyPaymentSummary.innerHTML = paymentEntries.length
    ? paymentEntries
        .map(([payment, total]) => `
          <div class="summary-item">
            <span>${escapeHtml(payment)}</span>
            <strong>${formatMoney(total)}</strong>
          </div>
        `)
        .join("")
    : '<div class="empty-state">Nenhum pagamento registrado neste mês.</div>';

  const serviceEntries = Object.entries(servicesSummary);

  elements.monthlyServiceSummary.innerHTML = serviceEntries.length
    ? serviceEntries
        .map(([service, summary]) => `
          <div class="summary-item">
            <span>${escapeHtml(service)} (${summary.count})</span>
            <strong>${formatMoney(summary.total)}</strong>
          </div>
        `)
        .join("")
    : '<div class="empty-state">Nenhum serviço registrado neste mês.</div>';
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  elements.calendarMonthLabel.textContent = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(calendarDate);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = localDateKey();

  const emptyDays = Array.from({ length: firstWeekday }, () =>
    '<div class="calendar-day calendar-day--empty" aria-hidden="true"></div>'
  );

  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayItems = history.filter(item => localDateKey(item.finishedAt) === dateKey);
    const revenue = dayItems.reduce((total, item) => total + Number(item.value), 0);
    const todayClass = dateKey === todayKey ? " calendar-day--today" : "";

    return `
      <button
        class="calendar-day${todayClass}"
        type="button"
        data-date="${dateKey}"
        aria-label="Abrir atendimentos de ${formatDate(dateKey)}"
      >
        <span class="calendar-day__number">${day}</span>

        <span class="calendar-day__summary">
          <strong>${dayItems.length} atendimento${dayItems.length === 1 ? "" : "s"}</strong>
          <span>${formatMoney(revenue)}</span>
        </span>

        <span class="calendar-day__hint">Toque para abrir</span>
      </button>
    `;
  });

  elements.calendarGrid.innerHTML = [...emptyDays, ...monthDays].join("");
}

function switchView(targetId) {
  elements.tabs.forEach(tab => {
    const selected = tab.dataset.target === targetId;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", selected ? "true" : "false");
  });

  elements.views.forEach(view => {
    view.classList.toggle("is-visible", view.id === targetId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openCalendarDay(dateKey) {
  selectedCalendarDate = dateKey;

  const dayItems = history
    .filter(item => localDateKey(item.finishedAt) === dateKey)
    .sort((a, b) => new Date(a.finishedAt) - new Date(b.finishedAt));

  const revenue = dayItems.reduce(
    (total, item) => total + Number(item.value),
    0
  );

  elements.calendarDayDialogTitle.textContent = formatDate(dateKey);
  elements.calendarDayDialogSummary.textContent =
    `${dayItems.length} atendimento${dayItems.length === 1 ? "" : "s"} • ${formatMoney(revenue)}`;

  elements.calendarDayDialogList.innerHTML = dayItems.length
    ? dayItems.map(item => `
        <article class="day-detail-card">
          <div class="card-topline">
            <div>
              <h3>${escapeHtml(item.name)}</h3>
              <p class="muted">${escapeHtml(item.serviceName)}</p>
            </div>

            <strong>${formatMoney(item.value)}</strong>
          </div>

          <div class="meta">
            <div>
              <span>Pagamento</span>
              <strong>${escapeHtml(item.payment)}</strong>
            </div>

            <div>
              <span>Duração</span>
              <strong>${formatDuration(item.durationSeconds || 0)}</strong>
            </div>

            <div>
              <span>Finalizado</span>
              <strong>${formatDateTime(item.finishedAt)}</strong>
            </div>
          </div>
        </article>
      `).join("")
    : '<div class="empty-state">Nenhum atendimento registrado nesta data.</div>';

  elements.calendarDayDialog.showModal();
}

function reportData(dateKey) {
  const items = history.filter(item => localDateKey(item.finishedAt) === dateKey);
  const revenue = items.reduce((total, item) => total + Number(item.value), 0);
  const average = items.length ? revenue / items.length : 0;
  const durationTotal = items.reduce(
    (total, item) => total + Number(item.durationSeconds || 0),
    0
  );
  const averageDuration = items.length
    ? Math.round(durationTotal / items.length)
    : 0;

  const payments = items.reduce((summary, item) => {
    summary[item.payment] = (summary[item.payment] || 0) + Number(item.value);
    return summary;
  }, {});

  const serviceCounts = items.reduce((summary, item) => {
    const current = summary[item.serviceName] || { count: 0, total: 0 };
    current.count += 1;
    current.total += Number(item.value);
    summary[item.serviceName] = current;
    return summary;
  }, {});

  return {
    items,
    revenue,
    average,
    averageDuration,
    payments,
    serviceCounts
  };
}

function renderReport() {
  const selectedDate = elements.reportDate.value || localDateKey();
  const data = reportData(selectedDate);
  const closure = closures.find(item => item.date === selectedDate);

  elements.reportDateLabel.textContent = formatDate(selectedDate);
  elements.reportAttendanceCount.textContent = data.items.length;
  elements.reportRevenue.textContent = formatMoney(data.revenue);
  elements.reportAverage.textContent = formatMoney(data.average);
  elements.reportAverageTime.textContent = formatDuration(data.averageDuration);

  const paymentEntries = Object.entries(data.payments);
  elements.paymentSummary.innerHTML = paymentEntries.length
    ? paymentEntries
        .map(([payment, total]) => `
          <div class="summary-item">
            <span>${escapeHtml(payment)}</span>
            <strong>${formatMoney(total)}</strong>
          </div>
        `)
        .join("")
    : '<div class="empty-state">Nenhum pagamento registrado.</div>';

  const serviceEntries = Object.entries(data.serviceCounts);
  elements.serviceSummary.innerHTML = serviceEntries.length
    ? serviceEntries
        .map(([service, summary]) => `
          <div class="summary-item">
            <span>${escapeHtml(service)} (${summary.count})</span>
            <strong>${formatMoney(summary.total)}</strong>
          </div>
        `)
        .join("")
    : '<div class="empty-state">Nenhum serviço registrado.</div>';

  elements.closureStatus.innerHTML = closure
    ? `<strong>Dia fechado.</strong> Registro criado em ${formatDateTime(closure.closedAt)}.`
    : "Este dia ainda não foi fechado.";
}


function filteredKnownCustomers() {
  const term = elements.knownCustomerSearch.value.trim().toLowerCase();

  if (!term) {
    return [...knownCustomers].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  return knownCustomers
    .filter(customer => {
      const searchable = `${customer.name} ${customer.phone}`.toLowerCase();
      return searchable.includes(term);
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function renderKnownCustomers() {
  const items = filteredKnownCustomers();

  if (items.length === 0) {
    elements.knownCustomerList.innerHTML =
      '<div class="empty-state">Nenhum cliente cadastrado.</div>';
    return;
  }

  elements.knownCustomerList.innerHTML = items.map(customer => {
    const service = services.find(item => item.id === customer.serviceId);

    return `
      <article class="known-customer-card">
        <div class="card-topline">
          <div>
            <h3>${escapeHtml(customer.name)}</h3>
            <p class="muted">${formatPhone(customer.phone)}</p>
          </div>

          <span class="badge">${escapeHtml(service?.name || "Serviço indisponível")}</span>
        </div>

        <div class="meta">
          <div>
            <span>Pagamento</span>
            <strong>${escapeHtml(customer.payment)}</strong>
          </div>

          <div>
            <span>Última visita</span>
            <strong>${customer.lastVisit ? formatDateTime(customer.lastVisit) : "Ainda não registrada"}</strong>
          </div>
        </div>

        ${customer.notes ? `<p class="known-customer-card__notes">${escapeHtml(customer.notes)}</p>` : ""}

        <div class="known-customer-card__actions">
          <button class="button button--primary" type="button" data-known-action="queue" data-id="${customer.id}">
            Adicionar à fila
          </button>

          <button class="button button--secondary" type="button" data-known-action="edit" data-id="${customer.id}">
            Editar
          </button>

          <button class="button button--danger-outline" type="button" data-known-action="delete" data-id="${customer.id}">
            Excluir
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function resetKnownCustomerForm() {
  elements.knownCustomerForm.reset();
  elements.knownCustomerId.value = "";
  elements.saveKnownCustomerButton.textContent = "Salvar cliente";
  elements.cancelKnownCustomerEditButton.hidden = true;

  if (services[0]) {
    elements.knownCustomerService.value = services[0].id;
  }
}

function openKnownCustomerQueue(customer) {
  const duplicated = queue.some(item => item.knownCustomerId === customer.id);

  if (duplicated) {
    Swal.fire({
      title: "Cliente já está na fila",
      text: `${customer.name} já possui um atendimento aguardando ou em andamento.`,
      icon: "warning",
      confirmButtonText: "Entendi"
    });
    return;
  }

  elements.knownCustomerQueueId.value = customer.id;
  elements.knownCustomerQueueTitle.textContent = customer.name;
  elements.knownCustomerQueueService.value = customer.serviceId;
  elements.knownCustomerQueuePayment.value = customer.payment;
  elements.knownCustomerQueueDialog.showModal();
}


function greetingForHour(hour) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function startOfLocalDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function renderPremiumDashboard() {
  const now = new Date();
  const firstName = professional.name?.trim()?.split(/\s+/)[0] || "profissional";
  const completedToday = todayHistory();
  const revenueToday = completedToday.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const waiting = queue.filter(item => item.status !== "em_atendimento");
  const current = queue.find(item => item.status === "em_atendimento");

  elements.premiumGreeting.textContent = `${greetingForHour(now.getHours())}, ${firstName}`;
  elements.premiumHeroSummary.textContent = completedToday.length
    ? `Hoje você já realizou ${completedToday.length} atendimento${completedToday.length === 1 ? "" : "s"} e faturou ${formatMoney(revenueToday)}.`
    : waiting.length
      ? `Você tem ${waiting.length} cliente${waiting.length === 1 ? "" : "s"} aguardando atendimento.`
      : "Sua agenda está pronta. Adicione o primeiro cliente para começar o dia.";

  if (current) {
    const remaining = remainingSeconds(current);
    const plannedSeconds = Math.max(60, Number(current.plannedDurationMinutes || 30) * 60);
    const elapsed = current.startedAt ? durationSeconds(current.startedAt) : 0;
    const progress = Math.min(100, Math.max(0, (elapsed / plannedSeconds) * 100));

    elements.premiumCurrentCustomer.textContent = current.name;
    elements.premiumCurrentService.textContent = `${current.serviceName} • ${formatMoney(current.value)}`;
    elements.premiumCurrentBadge.textContent = remaining <= 0 ? "Tempo excedido" : "Em atendimento";
    elements.premiumCurrentBadge.classList.add("is-live");
    elements.premiumRemainingTime.textContent = formatDuration(Math.abs(remaining));
    elements.premiumTimerCaption.textContent = remaining <= 0 ? "Tempo excedido" : "Tempo restante";
    elements.premiumProgressBar.style.width = `${progress}%`;
  } else {
    elements.premiumCurrentCustomer.textContent = "Nenhum atendimento iniciado";
    elements.premiumCurrentService.textContent = "O cronômetro aparecerá aqui.";
    elements.premiumCurrentBadge.textContent = "Aguardando";
    elements.premiumCurrentBadge.classList.remove("is-live");
    elements.premiumRemainingTime.textContent = "00:00";
    elements.premiumTimerCaption.textContent = "Tempo restante";
    elements.premiumProgressBar.style.width = "0%";
  }

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = startOfLocalDay(now);
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    const count = history.filter(item => localDateKey(item.finishedAt) === key).length;
    return {
      date,
      count,
      label: new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
        .format(date)
        .replace(".", "")
    };
  });

  const maxCount = Math.max(1, ...weekDays.map(day => day.count));
  const weekTotal = weekDays.reduce((sum, day) => sum + day.count, 0);
  elements.premiumWeekTotal.textContent =
    `${weekTotal} atendimento${weekTotal === 1 ? "" : "s"}`;

  elements.premiumWeeklyChart.innerHTML = weekDays.map(day => {
    const height = day.count ? Math.max(10, (day.count / maxCount) * 100) : 3;
    return `
      <div class="premium-chart__item" title="${day.count} atendimento(s)">
        <div class="premium-chart__track">
          <span class="premium-chart__bar" style="height:${height}%"></span>
        </div>
        <span class="premium-chart__value">${day.count}</span>
        <span class="premium-chart__label">${escapeHtml(day.label)}</span>
      </div>
    `;
  }).join("");

  const paymentTotals = completedToday.reduce((summary, item) => {
    const payment = item.payment || "Não informado";
    summary[payment] = (summary[payment] || 0) + Number(item.value || 0);
    return summary;
  }, {});

  const paymentEntries = Object.entries(paymentTotals).sort((a, b) => b[1] - a[1]);
  elements.premiumPayments.innerHTML = paymentEntries.length
    ? paymentEntries.map(([payment, total]) => `
        <div class="premium-summary-row">
          <span>${escapeHtml(payment)}</span>
          <strong>${formatMoney(total)}</strong>
        </div>
      `).join("")
    : '<div class="empty-state">Nenhum recebimento registrado hoje.</div>';

  const recentLimit = startOfLocalDay(now);
  recentLimit.setDate(recentLimit.getDate() - 29);
  const recentItems = history.filter(item => new Date(item.finishedAt) >= recentLimit);

  const serviceRanking = recentItems.reduce((summary, item) => {
    const name = item.serviceName || "Serviço";
    summary[name] = (summary[name] || 0) + 1;
    return summary;
  }, {});

  const topServices = Object.entries(serviceRanking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  elements.premiumTopServices.innerHTML = topServices.length
    ? topServices.map(([name, count], index) => `
        <div class="premium-ranking__row">
          <span><b class="premium-ranking__position">${index + 1}</b>${escapeHtml(name)}</span>
          <strong>${count}x</strong>
        </div>
      `).join("")
    : '<div class="empty-state">Os serviços mais realizados aparecerão aqui.</div>';

  const customerRanking = history.reduce((summary, item) => {
    const key = (item.phone || item.name || "").toLowerCase();
    if (!key) return summary;
    const currentItem = summary[key] || { name: item.name, count: 0 };
    currentItem.count += 1;
    currentItem.name = item.name || currentItem.name;
    summary[key] = currentItem;
    return summary;
  }, {});

  const topCustomers = Object.values(customerRanking)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  elements.premiumFrequentCustomers.innerHTML = topCustomers.length
    ? topCustomers.map((customer, index) => `
        <div class="premium-ranking__row">
          <span><b class="premium-ranking__position">${index + 1}</b>${escapeHtml(customer.name)}</span>
          <strong>${customer.count} visitas</strong>
        </div>
      `).join("")
    : '<div class="empty-state">Os clientes frequentes aparecerão aqui.</div>';
}

function closeMobileMoreMenu() {
  elements.mobileMoreMenu.hidden = true;
  elements.mobileMoreBackdrop.hidden = true;
  elements.mobileMoreButton.setAttribute("aria-expanded", "false");
}

function openMobileMoreMenu() {
  elements.mobileMoreMenu.hidden = false;
  elements.mobileMoreBackdrop.hidden = false;
  elements.mobileMoreButton.setAttribute("aria-expanded", "true");
}

function activateView(targetId) {
  elements.tabs.forEach(tab => {
    const active = tab.dataset.target === targetId;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  elements.views.forEach(view => {
    view.classList.toggle("is-visible", view.id === targetId);
  });

  const moreTargets = ["servicos", "calendario", "fechamento", "configuracoes"];
  elements.mobileNavItems.forEach(item => {
    const directMatch = item.dataset.mobileTarget === targetId;
    const moreMatch = item.id === "mobileMoreButton" && moreTargets.includes(targetId);
    item.classList.toggle("is-active", directMatch || moreMatch);
  });

  closeMobileMoreMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAll() {
  renderProfessional();
  renderServiceOptions();
  renderServices();
  renderKnownCustomers();
  renderQueue();
  renderHistory();
  renderMetrics();
  renderPremiumDashboard();
  renderMonthlySummary();
  renderCalendar();
  renderReport();
  saveAll();
}

function resetServiceForm() {
  elements.serviceForm.reset();
  elements.serviceId.value = "";
  elements.saveServiceButton.textContent = "Salvar serviço";
  elements.cancelServiceEditButton.hidden = true;
}

function openProfessionalDialog(force = false) {
  elements.professionalName.value = professional.name || "";
  elements.cancelProfessionalButton.hidden = force;
  elements.professionalDialog.showModal();
}

function openCustomerEdit(customer) {
  elements.editCustomerId.value = customer.id;
  elements.editCustomerName.value = customer.name;
  elements.editCustomerPhone.value = formatPhone(customer.phone);
  elements.editCustomerService.value = customer.serviceId;
  elements.editCustomerPayment.value = customer.payment;
  elements.editCustomerDialog.showModal();
}

function openWhatsApp(customer) {
  const message = encodeURIComponent(
    `Olá, ${customer.name}! Você é o próximo cliente da fila da Barbearia Resenha Boa. Por favor, dirija-se à barbearia.`
  );

  window.open(
    `https://wa.me/55${customer.phone}?text=${message}`,
    "_blank",
    "noopener,noreferrer"
  );
}

async function startService(customer, plannedMinutes = null) {
  const anotherInService = queue.find(
    item => item.status === "em_atendimento" && item.id !== customer.id
  );

  if (anotherInService) {
    if (elements.serviceDurationDialog.open) {
      elements.serviceDurationDialog.close();
    }

    await Swal.fire({
      title: "Já existe um atendimento em andamento",
      text: `${anotherInService.name} está sendo atendido no momento.`,
      icon: "warning",
      confirmButtonText: "Entendi"
    });

    return false;
  }

  if (plannedMinutes === null) {
    openServiceDurationDialog(customer);
    return false;
  }

  const minutes = Number(plannedMinutes);

  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) {
    showToast("Informe um tempo entre 1 e 240 minutos.");
    return false;
  }

  const startedAt = new Date();

  customer.status = "em_atendimento";
  customer.startedAt = startedAt.toISOString();
  customer.plannedDurationMinutes = minutes;
  customer.expectedEndAt = new Date(
    startedAt.getTime() + minutes * 60000
  ).toISOString();

  alertedCustomers.delete(customer.id);

  if (elements.serviceDurationDialog.open) {
    elements.serviceDurationDialog.close();
  }

  renderAll();
  activateView("painel");

  window.setTimeout(() => {
    const serviceCard = document.querySelector(".premium-card--service");

    if (!serviceCard) return;

    serviceCard.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    serviceCard.classList.remove("premium-card--service-started");
    void serviceCard.offsetWidth;
    serviceCard.classList.add("premium-card--service-started");

    window.setTimeout(() => {
      serviceCard.classList.remove("premium-card--service-started");
    }, 1800);
  }, 220);

  showToast("Atendimento iniciado. O painel foi aberto automaticamente.");
  return true;
}

async function finishCustomer(customer) {
  const confirmed = await confirmAction({
    title: "Finalizar atendimento?",
    html: `
      <strong>Cliente:</strong> ${escapeHtml(customer.name)}<br>
      <strong>Serviço:</strong> ${escapeHtml(customer.serviceName)}<br>
      <strong>Valor:</strong> ${formatMoney(customer.value)}
    `,
    confirmText: "Finalizar",
    icon: "question"
  });

  if (!confirmed) return;

  const finishedAt = new Date().toISOString();
  const startedAt = customer.startedAt || finishedAt;

  history.push({
    ...customer,
    status: "atendido",
    finishedAt,
    durationSeconds: durationSeconds(startedAt, finishedAt)
  });

  if (customer.knownCustomerId) {
    const knownCustomer = knownCustomers.find(item => item.id === customer.knownCustomerId);

    if (knownCustomer) {
      knownCustomer.lastVisit = finishedAt;
    }
  }

  queue = queue.filter(item => item.id !== customer.id);
  renderAll();
  showToast("Atendimento finalizado e registrado.");
}

function moveCustomerUp(id) {
  const sorted = queueSort(queue);
  const customerIndex = sorted.findIndex(item => item.id === id);

  if (customerIndex <= 0) return;

  const current = sorted[customerIndex];
  const previous = sorted[customerIndex - 1];

  const currentCreatedAt = current.createdAt;
  current.createdAt = previous.createdAt;
  previous.createdAt = currentCreatedAt;

  renderAll();
  showToast("Posição atualizada.");
}

elements.todayLabel.textContent = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric"
}).format(new Date());

elements.reportDate.value = localDateKey();

elements.tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    switchView(tab.dataset.target);
  });
});

elements.customerPhone.addEventListener("input", event => {
  event.target.value = formatPhone(event.target.value);
});

elements.editCustomerPhone.addEventListener("input", event => {
  event.target.value = formatPhone(event.target.value);
});

elements.customerService.addEventListener("change", () => {
  const service = services.find(item => item.id === elements.customerService.value);
  elements.customerValue.value = service ? formatMoney(service.price) : "";
});

elements.customerForm.addEventListener("reset", () => {
  setTimeout(() => {
    elements.customerValue.value = "";
  });
});

elements.customerForm.addEventListener("submit", event => {
  event.preventDefault();

  if (!professional.name?.trim()) {
    openProfessionalDialog(true);
    showToast("Configure o profissional antes de cadastrar clientes.");
    return;
  }

  const service = services.find(item => item.id === elements.customerService.value);
  const phone = digitsOnly(elements.customerPhone.value);

  if (!service) {
    showToast("Selecione um serviço válido.");
    return;
  }

  if (phone.length < 10) {
    showToast("Informe um WhatsApp válido.");
    elements.customerPhone.focus();
    return;
  }

  queue.push({
    id: crypto.randomUUID(),
    name: elements.customerName.value.trim(),
    phone,
    serviceId: service.id,
    serviceName: service.name,
    value: service.price,
    professional: professional.name.trim(),
    payment: elements.customerPayment.value,
    status: "aguardando",
    createdAt: new Date().toISOString(),
    startedAt: null
  });

  elements.customerForm.reset();
  elements.customerValue.value = "";

  renderAll();
  showToast("Cliente adicionado à fila.");
});

elements.callNextButton.addEventListener("click", async () => {
  const next = queueSort(queue).find(customer => customer.status !== "em_atendimento");

  if (!next) {
    showToast("A fila está vazia.");
    return;
  }

  next.status = "chamado";
  renderAll();
  openWhatsApp(next);
});

elements.queueList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  if (button.dataset.action === "close-actions") {
    button.closest("details.more-actions")?.removeAttribute("open");
    return;
  }

  const customer = queue.find(item => item.id === button.dataset.id);

  if (!customer) return;

  switch (button.dataset.action) {
    case "whatsapp":
      openWhatsApp(customer);
      break;

    case "start":
      await startService(customer);
      break;

    case "finish":
      await finishCustomer(customer);
      break;

    case "add-five":
      addMinutesToService(customer, 5);
      break;

    case "edit":
      openCustomerEdit(customer);
      break;

    case "move-up":
      moveCustomerUp(customer.id);
      break;

    case "remove": {
      const confirmed = await confirmAction({
        title: "Remover cliente da fila?",
        html: `<strong>${escapeHtml(customer.name)}</strong> será removido sem entrar no histórico.`,
        confirmText: "Remover",
        icon: "warning"
      });

      if (confirmed) {
        queue = queue.filter(item => item.id !== customer.id);
        renderAll();
        showToast("Cliente removido.");
      }
      break;
    }
  }
});

elements.editCustomerForm.addEventListener("submit", event => {
  event.preventDefault();

  const customer = queue.find(item => item.id === elements.editCustomerId.value);
  const service = services.find(item => item.id === elements.editCustomerService.value);
  const phone = digitsOnly(elements.editCustomerPhone.value);

  if (!customer || !service || phone.length < 10) {
    showToast("Verifique os dados informados.");
    return;
  }

  customer.name = elements.editCustomerName.value.trim();
  customer.phone = phone;
  customer.serviceId = service.id;
  customer.serviceName = service.name;
  customer.value = service.price;
  customer.payment = elements.editCustomerPayment.value;

  elements.editCustomerDialog.close();
  renderAll();
  showToast("Dados do cliente atualizados.");
});

elements.cancelCustomerEditButton.addEventListener("click", () => {
  elements.editCustomerDialog.close();
});



elements.durationOptionButtons.forEach(button => {
  button.addEventListener("click", () => {
    elements.serviceDurationMinutes.value = button.dataset.minutes;
    elements.durationOptionButtons.forEach(item => item.classList.toggle("is-selected", item === button));
  });
});

elements.serviceDurationMinutes.addEventListener("input", () => {
  elements.durationOptionButtons.forEach(button => {
    button.classList.toggle("is-selected", button.dataset.minutes === elements.serviceDurationMinutes.value);
  });
});

elements.serviceDurationForm.addEventListener("submit", async event => {
  event.preventDefault();

  const customer = queue.find(
    item => item.id === elements.serviceDurationCustomerId.value
  );

  if (!customer) {
    showToast("Cliente não encontrado.");
    return;
  }

  const button = elements.confirmStartServiceButton;
  const label = button.querySelector(".service-start-confirm-button__label");

  button.disabled = true;
  button.classList.add("is-loading");
  label.textContent = "Iniciando...";

  try {
    await startService(customer, elements.serviceDurationMinutes.value);
  } finally {
    button.disabled = false;
    button.classList.remove("is-loading");
    label.textContent = "Iniciar atendimento";
  }
});

elements.cancelServiceDurationButton.addEventListener("click", () => {
  elements.serviceDurationDialog.close();
});

elements.knownCustomerPhone.addEventListener("input", event => {
  event.target.value = formatPhone(event.target.value);
});

elements.knownCustomerSearch.addEventListener("input", renderKnownCustomers);

elements.knownCustomerForm.addEventListener("submit", event => {
  event.preventDefault();

  const service = services.find(item => item.id === elements.knownCustomerService.value);
  const phone = digitsOnly(elements.knownCustomerPhone.value);
  const name = elements.knownCustomerName.value.trim();

  if (!service || phone.length < 10 || name.length < 2) {
    showToast("Verifique os dados do cliente.");
    return;
  }

  if (elements.knownCustomerId.value) {
    const customer = knownCustomers.find(item => item.id === elements.knownCustomerId.value);

    if (customer) {
      customer.name = name;
      customer.phone = phone;
      customer.serviceId = service.id;
      customer.payment = elements.knownCustomerPayment.value;
      customer.notes = elements.knownCustomerNotes.value.trim();
      showToast("Cliente atualizado.");
    }
  } else {
    knownCustomers.push({
      id: crypto.randomUUID(),
      name,
      phone,
      serviceId: service.id,
      payment: elements.knownCustomerPayment.value,
      notes: elements.knownCustomerNotes.value.trim(),
      lastVisit: null
    });

    showToast("Cliente cadastrado.");
  }

  resetKnownCustomerForm();
  renderAll();
});

elements.cancelKnownCustomerEditButton.addEventListener("click", resetKnownCustomerForm);

elements.knownCustomerList.addEventListener("click", async event => {
  const button = event.target.closest("[data-known-action]");

  if (!button) return;

  const customer = knownCustomers.find(item => item.id === button.dataset.id);

  if (!customer) return;

  switch (button.dataset.knownAction) {
    case "queue":
      openKnownCustomerQueue(customer);
      break;

    case "edit":
      elements.knownCustomerId.value = customer.id;
      elements.knownCustomerName.value = customer.name;
      elements.knownCustomerPhone.value = formatPhone(customer.phone);
      elements.knownCustomerService.value = customer.serviceId;
      elements.knownCustomerPayment.value = customer.payment;
      elements.knownCustomerNotes.value = customer.notes || "";
      elements.saveKnownCustomerButton.textContent = "Atualizar cliente";
      elements.cancelKnownCustomerEditButton.hidden = false;
      elements.knownCustomerName.focus();
      break;

    case "delete": {
      const confirmed = await confirmAction({
        title: "Excluir cliente cadastrado?",
        html: `<strong>${escapeHtml(customer.name)}</strong> será removido da lista de clientes.`,
        confirmText: "Excluir",
        icon: "warning"
      });

      if (confirmed) {
        knownCustomers = knownCustomers.filter(item => item.id !== customer.id);
        renderAll();
        showToast("Cliente excluído.");
      }
      break;
    }
  }
});

elements.knownCustomerQueueForm.addEventListener("submit", event => {
  event.preventDefault();

  if (!professional.name?.trim()) {
    openProfessionalDialog(true);
    return;
  }

  const customer = knownCustomers.find(item => item.id === elements.knownCustomerQueueId.value);
  const service = services.find(item => item.id === elements.knownCustomerQueueService.value);

  if (!customer || !service) {
    showToast("Não foi possível adicionar o cliente.");
    return;
  }

  const duplicated = queue.some(item => item.knownCustomerId === customer.id);

  if (duplicated) {
    showToast("Esse cliente já está na fila.");
    return;
  }

  queue.push({
    id: crypto.randomUUID(),
    knownCustomerId: customer.id,
    name: customer.name,
    phone: customer.phone,
    serviceId: service.id,
    serviceName: service.name,
    value: service.price,
    professional: professional.name.trim(),
    payment: elements.knownCustomerQueuePayment.value,
    status: "aguardando",
    createdAt: new Date().toISOString(),
    startedAt: null
  });

  elements.knownCustomerQueueDialog.close();
  renderAll();
  showToast("Cliente adicionado à fila.");
});

elements.cancelKnownCustomerQueueButton.addEventListener("click", () => {
  elements.knownCustomerQueueDialog.close();
});

elements.serviceForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = elements.serviceName.value.trim();
  const price = Number(elements.servicePrice.value);

  if (!name || Number.isNaN(price) || price < 0) {
    showToast("Preencha o serviço e o preço corretamente.");
    return;
  }

  if (elements.serviceId.value) {
    const service = services.find(item => item.id === elements.serviceId.value);

    if (service) {
      service.name = name;
      service.price = price;
      showToast("Serviço atualizado.");
    }
  } else {
    services.push({
      id: crypto.randomUUID(),
      name,
      price
    });

    showToast("Serviço cadastrado.");
  }

  resetServiceForm();
  renderAll();
});

elements.serviceList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const service = services.find(item => item.id === button.dataset.id);

  if (!service) return;

  if (button.dataset.action === "edit-service") {
    elements.serviceId.value = service.id;
    elements.serviceName.value = service.name;
    elements.servicePrice.value = service.price;
    elements.saveServiceButton.textContent = "Atualizar serviço";
    elements.cancelServiceEditButton.hidden = false;
    elements.serviceName.focus();
  }

  if (button.dataset.action === "delete-service") {
    const inUse = queue.some(customer => customer.serviceId === service.id);

    if (inUse) {
      await Swal.fire({
        title: "Serviço em uso",
        text: "Esse serviço está vinculado a um cliente da fila.",
        icon: "warning",
        confirmButtonText: "Entendi"
      });
      return;
    }

    const confirmed = await confirmAction({
      title: "Excluir serviço?",
      html: `<strong>${escapeHtml(service.name)}</strong> será removido da lista.`,
      confirmText: "Excluir",
      icon: "warning"
    });

    if (confirmed) {
      services = services.filter(item => item.id !== service.id);
      resetServiceForm();
      renderAll();
      showToast("Serviço excluído.");
    }
  }
});

elements.cancelServiceEditButton.addEventListener("click", resetServiceForm);

elements.historyDateFilter.addEventListener("change", renderHistory);

elements.clearHistoryFilterButton.addEventListener("click", () => {
  elements.historyDateFilter.value = "";
  renderHistory();
});

elements.clearHistoryButton.addEventListener("click", async () => {
  if (history.length === 0) {
    showToast("O histórico já está vazio.");
    return;
  }

  if (!swalAvailable()) {
    const confirmation = prompt('Digite APAGAR para confirmar:');
    if (confirmation !== "APAGAR") return;
  } else {
    const result = await Swal.fire({
      title: "Limpar todo o histórico?",
      text: 'Digite APAGAR para confirmar. Esta ação não pode ser desfeita.',
      input: "text",
      inputPlaceholder: "APAGAR",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Apagar histórico",
      cancelButtonText: "Cancelar",
      preConfirm: value => {
        if (value !== "APAGAR") {
          Swal.showValidationMessage("Digite exatamente APAGAR.");
          return false;
        }

        return value;
      }
    });

    if (!result.isConfirmed) return;
  }

  history = [];
  closures = [];
  renderAll();
  showToast("Histórico apagado.");
});


elements.cancelProfessionalButton.addEventListener("click", () => {
  elements.professionalDialog.close();
});

elements.professionalForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = elements.professionalName.value.trim();

  if (name.length < 2) {
    showToast("Informe um nome válido.");
    return;
  }

  professional = {
    ...professional,
    name
  };
  elements.professionalDialog.close();
  renderAll();
  showToast("Profissional configurado com sucesso.");
});

elements.calendarGrid.addEventListener("click", event => {
  const dayButton = event.target.closest("[data-date]");

  if (!dayButton) return;

  openCalendarDay(dayButton.dataset.date);
});

elements.closeCalendarDayDialogButton.addEventListener("click", () => {
  elements.calendarDayDialog.close();
});

elements.calendarDayDialog.addEventListener("click", event => {
  if (event.target === elements.calendarDayDialog) {
    elements.calendarDayDialog.close();
  }
});

elements.openDayHistoryButton.addEventListener("click", () => {
  elements.historyDateFilter.value = selectedCalendarDate;
  elements.calendarDayDialog.close();
  renderHistory();
  switchView("historico");
});

elements.openDayReportButton.addEventListener("click", () => {
  elements.reportDate.value = selectedCalendarDate;
  elements.calendarDayDialog.close();
  renderReport();
  switchView("fechamento");
});

elements.previousMonthButton.addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
  renderMonthlySummary();
  renderCalendar();
});

elements.nextMonthButton.addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
  renderMonthlySummary();
  renderCalendar();
});

elements.reportDate.addEventListener("change", renderReport);

elements.printReportButton.addEventListener("click", () => {
  renderReport();
  window.print();
});

elements.closeDayButton.addEventListener("click", async () => {
  const date = elements.reportDate.value || localDateKey();
  const data = reportData(date);
  const existingClosure = closures.find(item => item.date === date);

  if (existingClosure) {
    await Swal.fire({
      title: "Dia já fechado",
      text: `O fechamento foi registrado em ${formatDateTime(existingClosure.closedAt)}.`,
      icon: "info",
      confirmButtonText: "Entendi"
    });
    return;
  }

  const confirmed = await confirmAction({
    title: `Fechar ${formatDate(date)}?`,
    html: `
      <strong>Atendimentos:</strong> ${data.items.length}<br>
      <strong>Total:</strong> ${formatMoney(data.revenue)}
    `,
    confirmText: "Fechar dia",
    icon: "question"
  });

  if (!confirmed) return;

  closures.push({
    id: crypto.randomUUID(),
    date,
    professional: professional.name,
    attendanceCount: data.items.length,
    revenue: data.revenue,
    closedAt: new Date().toISOString()
  });

  renderAll();

  await Swal.fire({
    title: "Dia fechado",
    text: "O resumo foi registrado. Você pode imprimir ou salvar como PDF.",
    icon: "success",
    confirmButtonText: "OK"
  });
});


elements.professionalSettingsForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = elements.professionalSettingsName.value.trim();

  if (name.length < 2) {
    showToast("Informe um nome válido.");
    elements.professionalSettingsName.focus();
    return;
  }

  professional = {
    ...professional,
    name
  };

  saveAll();
  renderAll();
  showToast("Nome do profissional atualizado.");
});

elements.professionalPhotoInput.addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    showToast("Use JPG, PNG ou WebP.");
    event.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("A imagem deve ter no máximo 5 MB.");
    event.target.value = "";
    return;
  }

  try {
    professional.photo = await resizeImageFile(file);
    saveAll();
    renderAll();
    showToast("Foto atualizada com sucesso.");
  } catch {
    showToast("Não foi possível processar a imagem.");
  }
});

elements.removeProfessionalPhotoButton.addEventListener("click", async () => {
  const confirmed = await confirmAction({
    title: "Remover foto?",
    html: "A imagem padrão voltará a ser exibida.",
    confirmText: "Remover",
    icon: "warning"
  });

  if (!confirmed) return;

  professional.photo = "";
  elements.professionalPhotoInput.value = "";
  saveAll();
  renderAll();
  showToast("Foto removida.");
});

elements.alertVolume.addEventListener("input", () => {
  elements.alertVolumeValue.textContent = `${elements.alertVolume.value}%`;
});

elements.soundSettingsForm.addEventListener("submit", event => {
  event.preventDefault();

  alertSettings = {
    soundType: elements.alertSoundType.value,
    volume: Number(elements.alertVolume.value),
    vibrationOnly: elements.vibrationOnly.checked
  };

  saveAll();
  renderAll();

  const button = elements.saveSoundSettingsButton;
  const label = button.querySelector(".settings-save-button__label");

  clearTimeout(elements.soundSettingsForm.feedbackTimer);
  clearTimeout(elements.soundSettingsForm.buttonTimer);

  elements.soundSettingsForm.classList.remove("sound-settings--saved");
  button.classList.remove("is-saved");
  void elements.soundSettingsForm.offsetWidth;

  elements.soundSettingsForm.classList.add("sound-settings--saved");
  button.classList.add("is-saved");
  label.textContent = "Configurações salvas";

  elements.soundSettingsFeedback.hidden = false;
  elements.soundSettingsFeedback.classList.remove("is-visible");
  void elements.soundSettingsFeedback.offsetWidth;
  elements.soundSettingsFeedback.classList.add("is-visible");

  if ("vibrate" in navigator) {
    navigator.vibrate(45);
  }

  elements.soundSettingsForm.feedbackTimer = window.setTimeout(() => {
    elements.soundSettingsFeedback.classList.remove("is-visible");

    window.setTimeout(() => {
      elements.soundSettingsFeedback.hidden = true;
    }, 250);
  }, 2400);

  elements.soundSettingsForm.buttonTimer = window.setTimeout(() => {
    button.classList.remove("is-saved");
    label.textContent = "Salvar configurações";
    elements.soundSettingsForm.classList.remove("sound-settings--saved");
  }, 2200);

  showToast("Configurações de alerta salvas.");
});

elements.testSoundButton.addEventListener("click", () => {
  if (elements.vibrationOnly.checked) {
    if ("vibrate" in navigator) navigator.vibrate([250,120,350]);
    showToast("Teste de vibração executado.");
    return;
  }

  playAlarmSound(elements.alertSoundType.value, Number(elements.alertVolume.value));
  showToast("Som de teste reproduzido.");
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  elements.installAppButton.hidden = false;
});

elements.installAppButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;

  deferredInstallPrompt = null;
  elements.installAppButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      console.warn("Não foi possível registrar o Service Worker.");
    });
  });
}

setInterval(() => {
  renderPremiumDashboard();
  document.querySelectorAll("[data-live-wait]").forEach(element => {
    const customer = queue.find(item => item.id === element.dataset.liveWait);

    if (customer) {
      element.textContent = formatDuration(durationSeconds(customer.createdAt));
    }
  });

  document.querySelectorAll("[data-live-service]").forEach(element => {
    const customer = queue.find(item => item.id === element.dataset.liveService);

    if (customer?.startedAt) {
      element.textContent = formatDuration(durationSeconds(customer.startedAt));
    }
  });

  document.querySelectorAll("[data-live-remaining]").forEach(element => {
    const customer = queue.find(item => item.id === element.dataset.liveRemaining);
    if (!customer?.expectedEndAt) return;

    const remaining = remainingSeconds(customer);
    element.textContent = remaining <= 0
      ? `Tempo excedido: ${formatDuration(Math.abs(remaining))}`
      : `Tempo restante: ${formatDuration(remaining)}`;

    const timerBox = element.closest(".timer");
    if (timerBox) {
      timerBox.classList.toggle("timer--overdue", remaining <= 0);
      timerBox.classList.toggle("timer--countdown", remaining > 0);
    }

    if (remaining <= 0 && !alertedCustomers.has(customer.id)) {
      alertedCustomers.add(customer.id);
      showTimeFinishedAlert(customer);
    }
  });

  const next = queueSort(queue).find(customer => customer.status !== "em_atendimento");

  if (next) {
    elements.nextCustomerDetails.textContent =
      `${next.serviceName} • ${formatMoney(next.value)} • espera ${formatDuration(durationSeconds(next.createdAt))}`;
  }
}, 1000);


elements.dashboardTargetButtons.forEach(button => {
  button.addEventListener("click", () => {
    activateView(button.dataset.dashboardTarget);
  });
});

elements.mobileNavItems.forEach(item => {
  item.addEventListener("click", () => {
    activateView(item.dataset.mobileTarget);
  });
});

elements.mobileMoreButton.addEventListener("click", () => {
  const expanded = elements.mobileMoreButton.getAttribute("aria-expanded") === "true";
  expanded ? closeMobileMoreMenu() : openMobileMoreMenu();
});

elements.mobileMoreClose.addEventListener("click", closeMobileMoreMenu);
elements.mobileMoreCollapse.addEventListener("click", closeMobileMoreMenu);
elements.mobileMoreBackdrop.addEventListener("click", closeMobileMoreMenu);

elements.mobileMoreTargetButtons.forEach(button => {
  button.addEventListener("click", () => {
    activateView(button.dataset.mobileMoreTarget);
  });
});


document.addEventListener("toggle", event => {
  const details = event.target;

  if (!(details instanceof HTMLDetailsElement) || !details.matches(".more-actions") || !details.open) {
    return;
  }

  document.querySelectorAll("details.more-actions[open]").forEach(item => {
    if (item !== details) item.removeAttribute("open");
  });
}, true);

document.addEventListener("click", event => {
  document.querySelectorAll("details.more-actions[open]").forEach(details => {
    if (!details.contains(event.target)) {
      details.removeAttribute("open");
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;

  document.querySelectorAll("details.more-actions[open]").forEach(details => {
    details.removeAttribute("open");
  });
});

renderAll();

if (!professional.name?.trim()) {
  setTimeout(() => openProfessionalDialog(true), 250);
}
