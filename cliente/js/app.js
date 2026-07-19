import { SUPABASE_CONFIG, hasSupabaseConfig } from "../../js/supabase-config.js";

const LAST_BOOKING_KEY = "resenha-boa-last-booking";
const PLACEHOLDER_PHOTO = "";

const elements = {
  form: document.querySelector("#bookingForm"),
  bookingCard: document.querySelector(".booking-card"),
  professional: document.querySelector("#professionalSelect"),
  professionalCards: document.querySelector("#professionalCards"),
  professionalSelectionHint: document.querySelector("#professionalSelectionHint"),
  service: document.querySelector("#serviceSelect"),
  date: document.querySelector("#bookingDate"),
  time: document.querySelector("#bookingTime"),
  name: document.querySelector("#clientName"),
  phone: document.querySelector("#clientPhone"),
  notes: document.querySelector("#bookingNotes"),
  consent: document.querySelector("#arrivalConsent"),
  submit: document.querySelector("#submitBookingButton"),
  message: document.querySelector("#connectionMessage"),
  confirmation: document.querySelector("#bookingConfirmation"),
  confirmationText: document.querySelector("#confirmationText"),
  confirmationInstruction: document.querySelector("#confirmationInstruction"),
  newBooking: document.querySelector("#newBookingButton"),
  tracking: document.querySelector("#bookingTracking"),
  trackingProfessionalPhoto: document.querySelector("#trackingProfessionalPhoto"),
  trackingProfessionalName: document.querySelector("#trackingProfessionalName"),
  trackingBookingStatus: document.querySelector("#trackingBookingStatus"),
  trackingClientName: document.querySelector("#trackingClientName"),
  trackingServiceName: document.querySelector("#trackingServiceName"),
  trackingPreference: document.querySelector("#trackingPreference"),
  trackingPresenceText: document.querySelector("#trackingPresenceText"),
  queuePositionPanel: document.querySelector("#queuePositionPanel"),
  queuePositionNumber: document.querySelector("#queuePositionNumber"),
  queuePositionTitle: document.querySelector("#queuePositionTitle"),
  queuePositionText: document.querySelector("#queuePositionText"),
  queuePositionMeta: document.querySelector("#queuePositionMeta"),
  queuePeopleAhead: document.querySelector("#queuePeopleAhead"),
  queuePositionUpdated: document.querySelector("#queuePositionUpdated"),
  queuePositionNote: document.querySelector("#queuePositionNote"),
  queueTurnAlert: document.querySelector("#queueTurnAlert"),
  queueTurnAlertTitle: document.querySelector("#queueTurnAlertTitle"),
  queueTurnAlertText: document.querySelector("#queueTurnAlertText"),
  dismissQueueTurnAlertButton: document.querySelector("#dismissQueueTurnAlertButton"),
  presenceActions: document.querySelector("#presenceActions"),
  trackingNote: document.querySelector("#trackingNote"),
  atBarbershopButton: document.querySelector("#atBarbershopButton"),
  clientTrackingActions: document.querySelector("#clientTrackingActions"),
  cancelBookingButton: document.querySelector("#cancelBookingButton"),
  newRequestButton: document.querySelector("#newRequestButton"),
  cancelBookingModal: document.querySelector("#cancelBookingModal"),
  cancelBookingModalTitle: document.querySelector("#cancelBookingModalTitle"),
  cancelBookingWarning: document.querySelector("#cancelBookingWarning"),
  cancellationReason: document.querySelector("#cancellationReason"),
  otherCancellationReasonField: document.querySelector("#otherCancellationReasonField"),
  otherCancellationReason: document.querySelector("#otherCancellationReason"),
  closeCancelBookingModalButton: document.querySelector("#closeCancelBookingModalButton"),
  keepBookingButton: document.querySelector("#keepBookingButton"),
  confirmCancelBookingButton: document.querySelector("#confirmCancelBookingButton"),
  clientPresenceReminder: document.querySelector("#clientPresenceReminder"),
  clientPresenceReminderTitle: document.querySelector("#clientPresenceReminderTitle"),
  clientPresenceReminderText: document.querySelector("#clientPresenceReminderText"),
  reminderAtBarbershopButton: document.querySelector("#reminderAtBarbershopButton"),
  toast: document.querySelector("#toast")
};

let client = null;
let professionals = [];
let services = [];
let currentAppointment = null;
let realtimeChannel = null;
let catalogChannel = null;
let reminderAudioContext = null;
let queuePositionRequestToken = 0;
let currentQueuePositionState = null;

const FIRST_POSITION_ALERT_PREFIX =
  "resenha-boa-first-position-alert";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function createClientAccessToken() {
  if (crypto?.randomUUID) return crypto.randomUUID();

  const random = new Uint8Array(24);
  crypto.getRandomValues(random);
  return Array.from(random, value => value.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function playClientReminderSound(urgent = false) {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    reminderAudioContext =
      reminderAudioContext || new AudioContextClass();

    if (reminderAudioContext.state === "suspended") {
      reminderAudioContext.resume().catch(() => {});
    }

    const startAt = reminderAudioContext.currentTime;
    const frequencies = urgent ? [660, 820] : [560];

    frequencies.forEach((frequency, index) => {
      const oscillator = reminderAudioContext.createOscillator();
      const gain = reminderAudioContext.createGain();
      const noteStart = startAt + index * 0.16;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStart);

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.09, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.13);

      oscillator.connect(gain);
      gain.connect(reminderAudioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.14);
    });
  } catch (error) {
    console.warn("O navegador bloqueou o som do lembrete.", error);
  }
}

function syncPresenceActionsVisibility(
  appointment = currentAppointment
) {
  if (!appointment) {
    elements.presenceActions.hidden = true;
    elements.presenceActions.style.display = "none";
    elements.presenceActions.setAttribute("aria-hidden", "true");
    return;
  }

  const presenceStatus =
    appointment.status_presenca || "nao_confirmado";
  const reminderIsOpen =
    !elements.clientPresenceReminder.hidden;

  const shouldHide =
    isFinishedAppointmentStatus(appointment.status) ||
    appointment.status === "na_fila" ||
    presenceStatus === "presente" ||
    reminderIsOpen;

  elements.presenceActions.hidden = shouldHide;
  elements.presenceActions.style.display =
    shouldHide ? "none" : "";
  elements.presenceActions.setAttribute(
    "aria-hidden",
    String(shouldHide)
  );
}


function syncClientTrackingActions(
  appointment = currentAppointment
) {
  if (!appointment) {
    elements.clientTrackingActions.hidden = true;
    elements.cancelBookingButton.hidden = true;
    elements.newRequestButton.hidden = true;
    return;
  }

  const inService =
    currentQueuePositionState?.type === "in_service";
  const canCancel =
    appointment.status === "agendado" ||
    (appointment.status === "na_fila" && !inService);
  const canStartAgain =
    isFinishedAppointmentStatus(appointment.status);

  elements.clientTrackingActions.hidden =
    !canCancel && !canStartAgain;
  elements.cancelBookingButton.hidden = !canCancel;
  elements.newRequestButton.hidden = !canStartAgain;
  elements.cancelBookingButton.textContent =
    appointment.status === "na_fila"
      ? "Sair da fila"
      : "Cancelar solicitação";
}

function hideClientPresenceReminder() {
  elements.clientPresenceReminder.hidden = true;
  elements.clientPresenceReminder.classList.remove("is-urgent");
  syncPresenceActionsVisibility();
}

function showClientPresenceReminder({ estimate, urgent }) {
  elements.clientPresenceReminder.hidden = false;
  elements.clientPresenceReminder.classList.toggle("is-urgent", urgent);

  elements.clientPresenceReminderTitle.textContent = urgent
    ? "Confirme sua presença ao chegar"
    : "Seu atendimento pode estar próximo";

  elements.clientPresenceReminderText.textContent =
    `O atendimento atual pode terminar em aproximadamente ${Math.max(
      1,
      estimate
    )} minuto(s). Quando estiver na barbearia, confirme sua presença para solicitar entrada na fila do profissional escolhido.`;

  // Enquanto o lembrete estiver aberto, ele é o único ponto de ação.
  syncPresenceActionsVisibility();
}


function formatQueuePositionUpdated() {
  return `Atualizado às ${new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date())}`;
}

function firstPositionAlertKey(queueRow) {
  return [
    FIRST_POSITION_ALERT_PREFIX,
    currentAppointment?.id || "sem-agendamento",
    queueRow?.id || "sem-fila"
  ].join("-");
}

function hideQueueTurnAlert() {
  elements.queueTurnAlert.hidden = true;
  elements.queueTurnAlert.removeAttribute("data-alert-key");
}

function dismissQueueTurnAlert() {
  const key = elements.queueTurnAlert.dataset.alertKey;

  if (key) {
    sessionStorage.setItem(`${key}-dismissed`, "true");
  }

  hideQueueTurnAlert();
}

function renderQueuePosition(state) {
  currentQueuePositionState = state;

  if (!state) {
    elements.queuePositionPanel.hidden = true;
    elements.queuePositionPanel.classList.remove(
      "is-next",
      "is-in-service"
    );
    hideQueueTurnAlert();
    syncClientTrackingActions();
    return;
  }

  elements.queuePositionPanel.hidden = false;
  elements.queuePositionPanel.classList.toggle(
    "is-next",
    state.type === "waiting" && state.position === 1
  );
  elements.queuePositionPanel.classList.toggle(
    "is-in-service",
    state.type === "in_service"
  );
  elements.queuePositionUpdated.textContent =
    formatQueuePositionUpdated();

  if (state.type === "in_service") {
    elements.trackingBookingStatus.textContent =
      "Em atendimento";
    elements.trackingBookingStatus.className =
      "tracking-status is-info";

    elements.queuePositionNumber.textContent = "✓";
    elements.queuePositionTitle.textContent =
      "Seu atendimento foi iniciado";
    elements.queuePositionText.textContent =
      `O profissional ${state.professionalName} já iniciou seu atendimento.`;
    elements.queuePositionMeta.hidden = true;
    elements.queuePositionNote.textContent =
      "Seu atendimento está em andamento.";
    hideQueueTurnAlert();
    syncClientTrackingActions();
    return;
  }

  elements.queuePositionMeta.hidden = false;
  elements.queuePositionNumber.textContent =
    `${state.position}ª`;

  if (state.position === 1) {
    elements.queuePositionTitle.textContent =
      "Você é o próximo";
    elements.queuePositionText.textContent =
      "Não há outros clientes aguardando antes de você.";
    elements.queuePeopleAhead.textContent =
      "Nenhuma pessoa à sua frente";
  } else {
    elements.queuePositionTitle.textContent =
      `Você está na ${state.position}ª posição`;
    elements.queuePositionText.textContent =
      state.peopleAhead === 1
        ? "Existe 1 cliente aguardando antes de você."
        : `Existem ${state.peopleAhead} clientes aguardando antes de você.`;
    elements.queuePeopleAhead.textContent =
      state.peopleAhead === 1
        ? "1 pessoa à sua frente"
        : `${state.peopleAhead} pessoas à sua frente`;
  }

  elements.queuePositionNote.textContent =
    "A posição pode mudar conforme a fila é atualizada. Acompanhe o aplicativo e permaneça próximo à barbearia.";
  syncClientTrackingActions();
}

function notifyFirstQueuePosition(queueRow, professionalName) {
  const alertKey = firstPositionAlertKey(queueRow);
  const dismissedKey = `${alertKey}-dismissed`;
  const notifiedKey = `${alertKey}-notified`;

  if (!sessionStorage.getItem(dismissedKey)) {
    elements.queueTurnAlert.hidden = false;
    elements.queueTurnAlert.dataset.alertKey = alertKey;
    elements.queueTurnAlertTitle.textContent =
      "Você é o próximo da fila";
    elements.queueTurnAlertText.textContent =
      `O profissional ${professionalName} poderá chamar você em breve. Permaneça próximo à barbearia.`;
  }

  if (sessionStorage.getItem(notifiedKey)) return;

  sessionStorage.setItem(notifiedKey, "true");

  if ("vibrate" in navigator) {
    navigator.vibrate([180, 90, 180, 90, 240]);
  }

  playClientReminderSound(true);
  showToast(
    "Você é o próximo da fila. Permaneça próximo à barbearia."
  );
}

function calculateQueuePosition(queueRows, appointmentId) {
  const orderedRows = [...queueRows].sort(
    (first, second) =>
      new Date(first.entrada_em).getTime() -
      new Date(second.entrada_em).getTime()
  );

  const ownRow = orderedRows.find(
    item => item.agendamento_id === appointmentId
  );

  if (!ownRow) return null;

  if (ownRow.status === "em_atendimento") {
    return {
      type: "in_service",
      queueRow: ownRow
    };
  }

  const waitingRows = orderedRows.filter(
    item => ["aguardando", "chamado"].includes(item.status)
  );

  const positionIndex = waitingRows.findIndex(
    item => item.id === ownRow.id
  );

  if (positionIndex < 0) return null;

  return {
    type: "waiting",
    queueRow: ownRow,
    position: positionIndex + 1,
    peopleAhead: positionIndex
  };
}

async function refreshQueuePosition() {
  const requestToken = ++queuePositionRequestToken;

  if (
    !client ||
    !currentAppointment ||
    currentAppointment.status !== "na_fila"
  ) {
    renderQueuePosition(null);
    return;
  }

  const { data: queueRows, error } = await client
    .from("fila")
    .select(
      "id,agendamento_id,status,entrada_em,iniciado_em,atualizado_em"
    )
    .eq("barbearia_id", SUPABASE_CONFIG.barbershopId)
    .eq("profissional_id", currentAppointment.profissional_id)
    .order("entrada_em", { ascending: true });

  if (requestToken !== queuePositionRequestToken) return;

  if (error) {
    console.warn(
      "Não foi possível atualizar a posição na fila.",
      error
    );

    if (!elements.queuePositionPanel.hidden) {
      elements.queuePositionUpdated.textContent =
        "Atualização temporariamente indisponível";
    }
    return;
  }

  const result = calculateQueuePosition(
    queueRows || [],
    currentAppointment.id
  );

  if (!result) {
    renderQueuePosition(null);
    return;
  }

  const professionalName =
    professionalForAppointment(currentAppointment)?.nome ||
    "profissional";

  if (result.type === "in_service") {
    renderQueuePosition({
      ...result,
      professionalName
    });
    return;
  }

  renderQueuePosition({
    ...result,
    professionalName
  });

  if (result.position === 1) {
    notifyFirstQueuePosition(
      result.queueRow,
      professionalName
    );
  } else {
    hideQueueTurnAlert();
  }
}


function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatPhone(value) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(
    () => elements.toast.classList.remove("is-visible"),
    2800
  );
}

function todayKey() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(new Date(`${dateValue}T12:00:00`));
}

function buildTimes() {
  const options = [];

  for (let hour = 8; hour <= 20; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === 20 && minute === 30) continue;
      const value =
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      options.push(`<option value="${value}">${value}</option>`);
    }
  }

  elements.time.innerHTML =
    '<option value="">Selecione</option>' + options.join("");
}

function professionalAvailability(professional) {
  const today = todayKey();
  const status =
    professional?.status_expediente ||
    "expediente_encerrado";
  const sameDay =
    professional?.expediente_data === today;

  if (status === "recebendo_clientes" && sameDay) {
    return {
      available: true,
      label: "Recebendo clientes",
      className: "is-open"
    };
  }

  if (status === "fechado_novos_clientes" && sameDay) {
    return {
      available: false,
      label: "Fechado para novos clientes",
      className: "is-limited"
    };
  }

  return {
    available: false,
    label: "Expediente encerrado",
    className: "is-closed"
  };
}

function isProfessionalAvailable(professional) {
  return professionalAvailability(professional).available;
}

function selectedProfessional() {
  return professionals.find(item => item.id === elements.professional.value);
}

function professionalServices(professionalId) {
  return services.filter(item => item.profissional_id === professionalId);
}

function professionalServiceSummary(professionalId) {
  const allServices = professionalServices(professionalId);
  const names = allServices.map(item => item.nome).slice(0, 3);

  if (!names.length) return "Serviços ainda não cadastrados";

  return `${names.join(" • ")}${
    allServices.length > names.length ? " • outros" : ""
  }`;
}

function renderProfessionals() {
  const selectedId = elements.professional.value;

  elements.professional.innerHTML =
    '<option value="">Selecione</option>' +
    professionals
      .map(item => {
        const availability =
          professionalAvailability(item);

        return `
          <option
            value="${item.id}"
            ${availability.available ? "" : "disabled"}
          >
            ${escapeHtml(item.nome)} — ${escapeHtml(
              availability.label
            )}
          </option>
        `;
      })
      .join("");

  if (
    selectedId &&
    professionals.some(
      item =>
        item.id === selectedId &&
        isProfessionalAvailable(item)
    )
  ) {
    elements.professional.value = selectedId;
  } else {
    elements.professional.value = "";
  }

  if (!professionals.length) {
    elements.professionalCards.innerHTML =
      '<p class="professional-cards__empty">Nenhum profissional ativo foi encontrado.</p>';
    elements.professionalSelectionHint.textContent =
      "Os profissionais aparecerão aqui após a sincronização.";
    elements.professionalSelectionHint.classList.remove(
      "is-selected"
    );
    elements.submit.disabled = true;
    return;
  }

  elements.professionalCards.innerHTML = professionals
    .map(professional => {
      const availability =
        professionalAvailability(professional);
      const selected =
        professional.id === elements.professional.value &&
        availability.available;

      const photo = professional.foto_base64
        ? `<img src="${professional.foto_base64}" alt="Foto de ${escapeHtml(
            professional.nome
          )}" />`
        : "";

      return `
        <button
          class="professional-card ${
            selected ? "is-selected" : ""
          } ${availability.className} ${
            availability.available ? "" : "is-unavailable"
          }"
          type="button"
          role="option"
          aria-selected="${selected}"
          aria-disabled="${!availability.available}"
          ${availability.available ? "" : "disabled"}
          data-professional-id="${professional.id}"
        >
          <span class="professional-card__photo ${
            professional.foto_base64
              ? ""
              : "professional-card__photo--empty"
          }">
            ${photo}
          </span>

          <span class="professional-card__body">
            <strong>${escapeHtml(professional.nome)}</strong>
            <span class="professional-availability ${
              availability.className
            }">
              ${escapeHtml(availability.label)}
            </span>
            <small>${
              availability.available
                ? escapeHtml(
                    professionalServiceSummary(professional.id)
                  )
                : "Escolha outro profissional disponível"
            }</small>
            <span class="professional-card__check">
              Selecionado
            </span>
          </span>
        </button>
      `;
    })
    .join("");

  const selected = selectedProfessional();
  const availableCount = professionals.filter(
    isProfessionalAvailable
  ).length;

  if (selected && isProfessionalAvailable(selected)) {
    elements.professionalSelectionHint.textContent =
      `${selected.nome} selecionado. Escolha um serviço abaixo.`;
    elements.professionalSelectionHint.classList.add(
      "is-selected"
    );
    elements.submit.disabled = false;
  } else {
    elements.professionalSelectionHint.textContent =
      availableCount
        ? "Toque em um profissional que esteja recebendo clientes."
        : "Nenhum profissional está recebendo novos clientes neste momento.";
    elements.professionalSelectionHint.classList.remove(
      "is-selected"
    );
    elements.submit.disabled = !availableCount;
  }
}

function selectProfessional(professionalId, options = {}) {
  const professional = professionals.find(
    item => item.id === professionalId
  );

  if (!professional) return;

  if (!isProfessionalAvailable(professional)) {
    showToast(
      professionalAvailability(professional).label +
      ". Escolha outro profissional."
    );
    return;
  }

  elements.professional.value = professional.id;
  renderProfessionals();
  renderServices();

  if (options.focusService) {
    elements.service.focus({ preventScroll: true });
  }
}

function renderServices() {
  const professionalId = elements.professional.value;
  const filtered = professionalServices(professionalId);

  if (!professionalId) {
    elements.service.innerHTML =
      '<option value="">Selecione primeiro um profissional disponível</option>';
    return;
  }

  const professional = selectedProfessional();

  if (!isProfessionalAvailable(professional)) {
    elements.service.innerHTML =
      '<option value="">Este profissional não está recebendo novos clientes</option>';
    return;
  }

  elements.service.innerHTML =
    '<option value="">Selecione</option>' +
    filtered
      .map(
        item =>
          `<option value="${item.id}">${escapeHtml(item.nome)} — R$ ${Number(
            item.preco
          )
            .toFixed(2)
            .replace(".", ",")}</option>`
      )
      .join("");

  if (!filtered.length) {
    elements.service.innerHTML =
      '<option value="">Este profissional ainda não cadastrou serviços</option>';
  }
}

function bookingStatusInfo(status) {
  const values = {
    agendado: ["Agendado", ""],
    na_fila: ["Na fila", "is-success"],
    concluido: ["Atendido", "is-success"],
    atendido: ["Atendido", "is-success"],
    cancelado: ["Cancelado", "is-danger"]
  };

  return values[status] || [status || "Agendado", ""];
}

function presenceInfo(status) {
  const values = {
    nao_confirmado: "Ainda não confirmada",
    a_caminho: "Ainda não confirmada",
    presente: "Presença informada",
    ausente: "Ausência informada"
  };

  return values[status] || values.nao_confirmado;
}


function isFinishedAppointmentStatus(status) {
  return ["concluido", "atendido", "cancelado"].includes(status);
}

function dismissFinishedTrackingForNewBooking() {
  if (
    !currentAppointment ||
    !isFinishedAppointmentStatus(currentAppointment.status)
  ) {
    return;
  }

  localStorage.removeItem(LAST_BOOKING_KEY);
  currentAppointment = null;
  hideClientPresenceReminder();

  if (client && realtimeChannel) {
    client.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  renderTracking(null);
}

function professionalForAppointment(appointment) {
  return professionals.find(item => item.id === appointment.profissional_id);
}

function renderTracking(appointment) {
  if (!appointment) {
    elements.tracking.hidden = true;
    elements.tracking.classList.remove("is-finished");
    elements.presenceActions.hidden = true;
    elements.presenceActions.style.display = "none";
    elements.presenceActions.setAttribute("aria-hidden", "true");
    elements.trackingNote.hidden = true;
    renderQueuePosition(null);
    return;
  }

  const professional = professionalForAppointment(appointment);
  const [statusLabel, statusClass] = bookingStatusInfo(appointment.status);
  const presenceStatus = appointment.status_presenca || "nao_confirmado";
  const trackingFinished =
    isFinishedAppointmentStatus(appointment.status);
  const isInitialConfirmation =
    appointment.status === "agendado" &&
    presenceStatus === "nao_confirmado";

  if (!isInitialConfirmation) {
    elements.confirmation.hidden = true;
  }

  elements.tracking.hidden = false;
  elements.tracking.classList.toggle("is-finished", trackingFinished);
  elements.tracking.classList.remove("is-dismissed");
  const trackingProfessional =
    elements.trackingProfessionalPhoto.closest(".tracking-professional");
  const hasProfessionalPhoto = Boolean(professional?.foto_base64);

  trackingProfessional.classList.toggle(
    "is-photo-empty",
    !hasProfessionalPhoto
  );
  elements.trackingProfessionalPhoto.src =
    hasProfessionalPhoto ? professional.foto_base64 : "";
  elements.trackingProfessionalPhoto.alt =
    hasProfessionalPhoto
      ? `Foto do profissional ${professional.nome}`
      : "";
  elements.trackingProfessionalName.textContent =
    professional?.nome || "Profissional";
  elements.trackingBookingStatus.textContent = statusLabel;
  elements.trackingBookingStatus.className =
    `tracking-status ${statusClass}`.trim();
  elements.trackingClientName.textContent = appointment.cliente_nome;
  elements.trackingServiceName.textContent =
    `${appointment.servico_nome} — R$ ${Number(appointment.valor || 0)
      .toFixed(2)
      .replace(".", ",")}`;
  elements.trackingPreference.textContent =
    `${formatDate(appointment.data_agendada)} às ${String(
      appointment.hora_preferida || ""
    ).slice(0, 5)}`;
  elements.trackingPresenceText.textContent =
    appointment.status === "cancelado"
      ? "Cancelamento registrado"
      : trackingFinished
        ? "Presença confirmada"
        : presenceInfo(presenceStatus);

  if (appointment.status !== "na_fila") {
    renderQueuePosition(null);
  }

  syncPresenceActionsVisibility(appointment);

  elements.trackingNote.hidden = trackingFinished;

  if (appointment.status === "cancelado") {
    elements.trackingNote.hidden = false;
    elements.trackingNote.textContent = appointment.cancelamento_motivo
      ? `Solicitação cancelada. Motivo: ${appointment.cancelamento_motivo}`
      : "Solicitação cancelada. Você pode fazer um novo pedido quando desejar.";
  } else if (!trackingFinished) {
    if (appointment.status === "na_fila") {
      elements.trackingNote.textContent =
        "Sua presença foi confirmada. Você está na fila do profissional escolhido e pode acompanhar o andamento acima.";
    } else if (presenceStatus === "presente") {
      elements.trackingNote.textContent =
        "Presença informada. Aguarde o barbeiro validar sua chegada e adicionar você ao final da fila.";
    } else {
      elements.trackingNote.textContent =
        "Ao chegar à barbearia, confirme sua presença. O barbeiro validará a chegada antes de adicionar você à fila.";
    }
  }

  elements.atBarbershopButton.classList.toggle(
    "is-active",
    presenceStatus === "presente"
  );
  elements.atBarbershopButton.disabled = presenceStatus === "presente";
  elements.atBarbershopButton.textContent =
    presenceStatus === "presente"
      ? "Presença informada"
      : "Confirmar presença";

  syncClientTrackingActions(appointment);
}

function loadStoredBooking() {
  const raw = localStorage.getItem(LAST_BOOKING_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? { id: parsed } : parsed;
  } catch {
    return { id: raw };
  }
}

function saveStoredBooking(
  appointment,
  clientAccessToken = loadStoredBooking()?.clientAccessToken || null
) {
  if (!appointment?.id) return;

  localStorage.setItem(
    LAST_BOOKING_KEY,
    JSON.stringify({
      ...appointment,
      id: appointment.id,
      ...(clientAccessToken ? { clientAccessToken } : {})
    })
  );
}

async function ensureClientAccessToken() {
  const stored = loadStoredBooking();

  if (stored?.clientAccessToken) {
    return stored.clientAccessToken;
  }

  if (!client || !currentAppointment?.id) {
    throw new Error("Não foi possível validar este acompanhamento.");
  }

  const token = createClientAccessToken();
  const tokenHash = await sha256Hex(token);
  const { error } = await client
    .from("agendamentos")
    .update({
      cliente_token_hash: tokenHash,
      atualizado_em: new Date().toISOString()
    })
    .eq("id", currentAppointment.id);

  if (error) {
    throw new Error(
      "Execute a migração 05 no Supabase antes de liberar o cancelamento."
    );
  }

  saveStoredBooking(currentAppointment, token);
  return token;
}

async function fetchCurrentAppointment() {
  const stored = loadStoredBooking();

  if (!client || !stored?.id) {
    currentAppointment = null;
    renderTracking(null);
    return null;
  }

  const { data, error } = await client
    .from("agendamentos")
    .select("*")
    .eq("id", stored.id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") console.warn(error);
    currentAppointment = null;
    renderTracking(null);
    return null;
  }

  currentAppointment = data;
  saveStoredBooking(
    { ...stored, ...data, id: data.id },
    stored.clientAccessToken
  );

  renderTracking(currentAppointment);
  await Promise.all([
    refreshProximityAlert(),
    refreshQueuePosition()
  ]);
  return currentAppointment;
}

async function refreshProximityAlert() {
  hideClientPresenceReminder();

  const presenceStatus =
    currentAppointment?.status_presenca || "nao_confirmado";

  if (
    !client ||
    !currentAppointment ||
    currentAppointment.data_agendada !== todayKey() ||
    currentAppointment.status !== "agendado" ||
    !["nao_confirmado", "a_caminho"].includes(presenceStatus)
  ) {
    return;
  }

  const { data: queueRows, error } = await client
    .from("fila")
    .select("id,status,previsao_fim_em")
    .eq("barbearia_id", SUPABASE_CONFIG.barbershopId)
    .eq("profissional_id", currentAppointment.profissional_id);

  if (error || !queueRows?.length) return;

  const current = queueRows.find(
    item => item.status === "em_atendimento"
  );

  if (!current?.previsao_fim_em) return;

  const remainingMinutes = Math.ceil(
    (new Date(current.previsao_fim_em) - new Date()) / 60000
  );

  if (remainingMinutes > 10) return;

  const estimate = Math.max(0, remainingMinutes);
  const urgent = remainingMinutes <= 5;

  showClientPresenceReminder({ estimate, urgent });

  const alertLevel = urgent ? "5" : "10";
  const alertKey =
    `resenha-boa-client-reminder-${currentAppointment.id}-` +
    `${current.id}-${alertLevel}`;

  if (sessionStorage.getItem(alertKey)) return;

  sessionStorage.setItem(alertKey, "shown");

  if ("vibrate" in navigator) {
    navigator.vibrate(
      urgent ? [130, 70, 130] : [90, 55, 90]
    );
  }

  playClientReminderSound(urgent);

  showToast(
    urgent
      ? "Ao chegar, confirme sua presença para solicitar entrada na fila."
      : "Seu atendimento pode estar próximo. Confirme a presença quando chegar."
  );

  if (!currentAppointment.aviso_proximidade_em) {
    const now = new Date().toISOString();

    await client
      .from("agendamentos")
      .update({
        aviso_proximidade_em: now,
        atualizado_em: now
      })
      .eq("id", currentAppointment.id);

    currentAppointment.aviso_proximidade_em = now;
  }
}

async function updatePresence(status) {
  if (!client || !currentAppointment) {
    showToast("Nenhum agendamento ativo foi encontrado.");
    return;
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from("agendamentos")
    .update({
      status_presenca: status,
      presenca_atualizada_em: now,
      atualizado_em: now
    })
    .eq("id", currentAppointment.id)
    .select("*")
    .single();

  if (error) {
    showToast(`Não foi possível atualizar: ${error.message}`);
    return;
  }

  currentAppointment = data;
  saveStoredBooking(currentAppointment);
  hideClientPresenceReminder();
  renderTracking(currentAppointment);
  await Promise.all([
    refreshProximityAlert(),
    refreshQueuePosition()
  ]);

  showToast(
    "Presença informada. Aguarde o barbeiro validar sua entrada na fila."
  );
}


function closeCancellationModal() {
  elements.cancelBookingModal.hidden = true;
  document.body.classList.remove("is-modal-open");
  elements.confirmCancelBookingButton.disabled = false;
  elements.confirmCancelBookingButton.textContent =
    "Confirmar cancelamento";
}

function openCancellationModal() {
  if (!currentAppointment) return;

  if (currentQueuePositionState?.type === "in_service") {
    showToast(
      "O atendimento já foi iniciado. Procure o profissional para qualquer alteração."
    );
    return;
  }

  const leavingQueue = currentAppointment.status === "na_fila";
  elements.cancelBookingModalTitle.textContent = leavingQueue
    ? "Sair da fila?"
    : "Cancelar solicitação?";
  elements.cancelBookingWarning.textContent = leavingQueue
    ? "Você perderá sua posição atual. As posições dos demais clientes serão atualizadas automaticamente."
    : "O pedido será cancelado e deixará de aparecer como atendimento pendente para o profissional.";
  elements.cancellationReason.value = "";
  elements.otherCancellationReason.value = "";
  elements.otherCancellationReasonField.hidden = true;
  elements.cancelBookingModal.hidden = false;
  document.body.classList.add("is-modal-open");
  elements.keepBookingButton.focus();
}

function selectedCancellationReason() {
  if (elements.cancellationReason.value === "Outro") {
    return elements.otherCancellationReason.value.trim();
  }

  return elements.cancellationReason.value;
}

async function confirmClientCancellation() {
  if (!client || !currentAppointment?.id) return;

  elements.confirmCancelBookingButton.disabled = true;
  elements.confirmCancelBookingButton.textContent = "Cancelando...";

  try {
    const token = await ensureClientAccessToken();
    const { data, error } = await client.rpc(
      "cancelar_agendamento_cliente",
      {
        p_agendamento_id: currentAppointment.id,
        p_cliente_token: token,
        p_motivo: selectedCancellationReason() || null
      }
    );

    if (error) throw error;

    const cancelled = Array.isArray(data) ? data[0] : data;
    currentAppointment = cancelled || {
      ...currentAppointment,
      status: "cancelado",
      cancelado_por: "cliente",
      cancelado_em: new Date().toISOString(),
      cancelamento_motivo: selectedCancellationReason() || null
    };

    saveStoredBooking(currentAppointment, token);
    hideClientPresenceReminder();
    hideQueueTurnAlert();
    renderQueuePosition(null);
    renderTracking(currentAppointment);
    closeCancellationModal();
    showToast(
      currentAppointment.status === "cancelado"
        ? "Solicitação cancelada."
        : "Cancelamento processado."
    );
  } catch (error) {
    elements.confirmCancelBookingButton.disabled = false;
    elements.confirmCancelBookingButton.textContent =
      "Confirmar cancelamento";
    showToast(
      error.message?.includes("cancelar_agendamento_cliente")
        ? "Execute a migração 05 no Supabase antes de testar o cancelamento."
        : error.message
    );
  }
}

function subscribeTracking() {
  if (!client || !currentAppointment?.id) return;

  if (realtimeChannel) {
    client.removeChannel(realtimeChannel);
  }

  realtimeChannel = client
    .channel(`cliente-acompanhamento-${currentAppointment.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "agendamentos",
        filter: `id=eq.${currentAppointment.id}`
      },
      () => fetchCurrentAppointment().catch(console.warn)
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "fila",
        filter: `profissional_id=eq.${currentAppointment.profissional_id}`
      },
      () =>
        Promise.all([
          refreshProximityAlert(),
          refreshQueuePosition()
        ]).catch(console.warn)
    )
    .subscribe();
}

async function loadCatalog() {
  if (!client) return;

  const selectedId = elements.professional.value;

  const [
    { data: pros, error: prosError },
    { data: servs, error: servsError }
  ] = await Promise.all([
    client
      .from("profissionais")
      .select(
        "id,nome,foto_base64,status_expediente,expediente_data,expediente_iniciado_em,expediente_encerrado_em,atualizado_em"
      )
      .eq("barbearia_id", SUPABASE_CONFIG.barbershopId)
      .eq("ativo", true)
      .order("nome"),
    client
      .from("servicos")
      .select(
        "id,profissional_id,nome,preco,duracao_minutos,atualizado_em"
      )
      .eq("barbearia_id", SUPABASE_CONFIG.barbershopId)
      .eq("ativo", true)
      .order("nome")
  ]);

  if (prosError) throw prosError;
  if (servsError) throw servsError;

  professionals = pros || [];
  services = servs || [];

  if (
    selectedId &&
    professionals.some(
      item =>
        item.id === selectedId &&
        isProfessionalAvailable(item)
    )
  ) {
    elements.professional.value = selectedId;
  } else {
    elements.professional.value = "";
  }

  renderProfessionals();
  renderServices();

  if (currentAppointment) {
    renderTracking(currentAppointment);
  }
}

function subscribeCatalog() {
  if (!client) return;

  if (catalogChannel) {
    client.removeChannel(catalogChannel);
  }

  catalogChannel = client
    .channel("resenha-boa-catalogo-cliente")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profissionais",
        filter: `barbearia_id=eq.${SUPABASE_CONFIG.barbershopId}`
      },
      () => loadCatalog().catch(console.warn)
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "servicos",
        filter: `barbearia_id=eq.${SUPABASE_CONFIG.barbershopId}`
      },
      () => loadCatalog().catch(console.warn)
    )
    .subscribe();
}

async function loadData() {
  if (!hasSupabaseConfig()) {
    elements.message.className = "connection-message is-error";
    elements.message.textContent =
      "O aplicativo ainda não foi conectado ao Supabase. Configure o arquivo js/supabase-config.js no projeto principal.";
    elements.submit.disabled = true;
    return;
  }

  try {
    const { createClient } = await import(
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
    );

    client = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.publishableKey
    );

    await loadCatalog();

    elements.message.className = "connection-message is-ok";
    const availableCount =
      professionals.filter(isProfessionalAvailable).length;

    elements.message.textContent = !professionals.length
      ? "Conectado, mas ainda não existem profissionais sincronizados."
      : availableCount
        ? "Conectado. Escolha um profissional que esteja recebendo clientes."
        : "Conectado. Nenhum profissional está recebendo novos clientes neste momento.";

    elements.submit.disabled = !availableCount;

    await fetchCurrentAppointment();
    subscribeTracking();
    subscribeCatalog();
  } catch (error) {
    elements.message.className = "connection-message is-error";
    elements.message.textContent =
      `Não foi possível conectar: ${error.message}`;
    elements.submit.disabled = true;
  }
}

elements.date.min = todayKey();
elements.date.value = todayKey();
buildTimes();

elements.phone.addEventListener(
  "input",
  event => {
    event.target.value = formatPhone(event.target.value);
  }
);

elements.professional.addEventListener("change", () => {
  renderProfessionals();
  renderServices();
});

elements.professionalCards.addEventListener("click", event => {
  const card = event.target.closest("[data-professional-id]");

  if (!card) return;

  dismissFinishedTrackingForNewBooking();

  selectProfessional(card.dataset.professionalId, {
    focusService: true
  });
});
elements.atBarbershopButton.addEventListener(
  "click",
  () => updatePresence("presente")
);
elements.reminderAtBarbershopButton.addEventListener(
  "click",
  () => updatePresence("presente")
);

elements.dismissQueueTurnAlertButton.addEventListener(
  "click",
  dismissQueueTurnAlert
);

elements.cancelBookingButton.addEventListener(
  "click",
  openCancellationModal
);
elements.closeCancelBookingModalButton.addEventListener(
  "click",
  closeCancellationModal
);
elements.keepBookingButton.addEventListener(
  "click",
  closeCancellationModal
);
elements.confirmCancelBookingButton.addEventListener(
  "click",
  confirmClientCancellation
);
elements.cancellationReason.addEventListener("change", () => {
  elements.otherCancellationReasonField.hidden =
    elements.cancellationReason.value !== "Outro";
});
elements.cancelBookingModal.addEventListener("click", event => {
  if (event.target === elements.cancelBookingModal) {
    closeCancellationModal();
  }
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !elements.cancelBookingModal.hidden) {
    closeCancellationModal();
  }
});

elements.form.addEventListener(
  "focusin",
  dismissFinishedTrackingForNewBooking
);

elements.form.addEventListener(
  "input",
  dismissFinishedTrackingForNewBooking
);

elements.form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!client) {
    showToast("Supabase não conectado.");
    return;
  }

  const phone = digitsOnly(elements.phone.value);
  const professional = selectedProfessional();
  const service = services.find(item => item.id === elements.service.value);

  if (!professional) {
    showToast("Selecione um profissional.");
    elements.professionalCards.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    return;
  }

  if (!isProfessionalAvailable(professional)) {
    showToast(
      professionalAvailability(professional).label +
      ". Escolha outro profissional."
    );
    await loadCatalog();
    return;
  }

  if (phone.length < 10) {
    showToast("Informe um WhatsApp válido.");
    return;
  }

  if (!service) {
    showToast("Selecione um serviço.");
    return;
  }

  if (!elements.consent.checked) {
    showToast("Confirme que está ciente da ordem de chegada.");
    return;
  }

  elements.submit.disabled = true;
  elements.submit.textContent = "Enviando...";

  await loadCatalog();

  const refreshedProfessional = selectedProfessional();

  if (!isProfessionalAvailable(refreshedProfessional)) {
    showToast(
      refreshedProfessional
        ? professionalAvailability(refreshedProfessional).label +
          ". Escolha outro profissional."
        : "O profissional selecionado não está mais disponível."
    );
    elements.submit.disabled = false;
    elements.submit.textContent = "Enviar pré-agendamento";
    return;
  }

  const clientAccessToken = createClientAccessToken();
  const clientTokenHash = await sha256Hex(clientAccessToken);

  const payload = {
    barbearia_id: SUPABASE_CONFIG.barbershopId,
    profissional_id: elements.professional.value,
    cliente_nome: elements.name.value.trim(),
    cliente_telefone: phone,
    servico_id: service.id,
    servico_nome: service.nome,
    valor: Number(service.preco || 0),
    data_agendada: elements.date.value,
    hora_preferida: elements.time.value,
    observacao: elements.notes.value.trim() || null,
    status: "agendado",
    status_presenca: "nao_confirmado",
    cliente_token_hash: clientTokenHash
  };

  try {
    const { data, error } = await client.rpc(
      "criar_agendamento_cliente",
      {
        p_barbearia_id: payload.barbearia_id,
        p_profissional_id: payload.profissional_id,
        p_cliente_nome: payload.cliente_nome,
        p_cliente_telefone: payload.cliente_telefone,
        p_servico_id: payload.servico_id,
        p_data_agendada: payload.data_agendada,
        p_hora_preferida: payload.hora_preferida,
        p_observacao: payload.observacao,
        p_cliente_token_hash: payload.cliente_token_hash
      }
    );

    if (error) {
      if (
        error.message?.includes(
          "criar_agendamento_cliente"
        )
      ) {
        throw new Error(
          "Execute a migração 06 no Supabase antes de testar o expediente."
        );
      }

      throw error;
    }

    saveStoredBooking(data, clientAccessToken);

    currentAppointment = data;
    elements.bookingCard.hidden = true;
    elements.confirmation.hidden = false;
    elements.confirmationText.textContent =
      `${payload.cliente_nome}, sua preferência para ` +
      `${payload.data_agendada.split("-").reverse().join("/")} às ` +
      `${payload.hora_preferida} foi enviada ao profissional.`;
    elements.confirmationInstruction.textContent =
      "Ao chegar à barbearia, use Confirmar presença no acompanhamento acima.";

    renderTracking(currentAppointment);
    subscribeTracking();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showToast(`Não foi possível enviar: ${error.message}`);
  } finally {
    elements.submit.disabled = false;
    elements.submit.textContent = "Enviar pré-agendamento";
  }
});

function startNewBookingFlow() {
  localStorage.removeItem(LAST_BOOKING_KEY);
  currentAppointment = null;
  hideClientPresenceReminder();
  hideQueueTurnAlert();
  renderQueuePosition(null);
  renderTracking(null);

  if (client && realtimeChannel) {
    client.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  elements.form.reset();
  elements.professional.value = "";
  elements.date.value = todayKey();
  buildTimes();
  renderProfessionals();
  renderServices();
  elements.confirmation.hidden = true;
  elements.bookingCard.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

elements.newBooking.addEventListener("click", startNewBookingFlow);
elements.newRequestButton.addEventListener("click", startNewBookingFlow);

window.setInterval(() => {
  if (currentAppointment) {
    Promise.all([
      refreshProximityAlert(),
      refreshQueuePosition()
    ]).catch(console.warn);
  }
}, 15000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(console.warn);
  });
}

loadData();
