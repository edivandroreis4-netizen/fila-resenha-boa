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
  presenceActions: document.querySelector("#presenceActions"),
  trackingNote: document.querySelector("#trackingNote"),
  atBarbershopButton: document.querySelector("#atBarbershopButton"),
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
      .map(
        item =>
          `<option value="${item.id}">${escapeHtml(item.nome)}</option>`
      )
      .join("");

  if (
    selectedId &&
    professionals.some(item => item.id === selectedId)
  ) {
    elements.professional.value = selectedId;
  }

  if (!professionals.length) {
    elements.professionalCards.innerHTML =
      '<p class="professional-cards__empty">Nenhum profissional ativo foi encontrado.</p>';
    elements.professionalSelectionHint.textContent =
      "Os profissionais aparecerão aqui após a sincronização.";
    elements.professionalSelectionHint.classList.remove("is-selected");
    return;
  }

  elements.professionalCards.innerHTML = professionals
    .map(professional => {
      const selected =
        professional.id === elements.professional.value;

      const photo = professional.foto_base64
        ? `<img src="${professional.foto_base64}" alt="Foto de ${escapeHtml(
            professional.nome
          )}" />`
        : "";

      return `
        <button
          class="professional-card ${selected ? "is-selected" : ""}"
          type="button"
          role="option"
          aria-selected="${selected}"
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
            <small>${escapeHtml(
              professionalServiceSummary(professional.id)
            )}</small>
            <span class="professional-card__check">Selecionado</span>
          </span>
        </button>
      `;
    })
    .join("");

  const selected = selectedProfessional();

  if (selected) {
    elements.professionalSelectionHint.textContent =
      `${selected.nome} selecionado. Escolha um serviço abaixo.`;
    elements.professionalSelectionHint.classList.add("is-selected");
  } else {
    elements.professionalSelectionHint.textContent =
      "Toque em um card para selecionar o barbeiro.";
    elements.professionalSelectionHint.classList.remove("is-selected");
  }
}

function selectProfessional(professionalId, options = {}) {
  const professional = professionals.find(
    item => item.id === professionalId
  );

  if (!professional) return;

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
      '<option value="">Selecione primeiro um profissional</option>';
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
  elements.trackingPresenceText.textContent = trackingFinished
    ? "Presença confirmada"
    : presenceInfo(presenceStatus);

  syncPresenceActionsVisibility(appointment);

  elements.trackingNote.hidden = trackingFinished;

  if (!trackingFinished) {
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
}

function loadStoredBooking() {
  try {
    return JSON.parse(localStorage.getItem(LAST_BOOKING_KEY) || "null");
  } catch {
    return null;
  }
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
  localStorage.setItem(
    LAST_BOOKING_KEY,
    JSON.stringify({
      ...stored,
      ...data,
      id: data.id
    })
  );

  renderTracking(currentAppointment);
  await refreshProximityAlert();
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
  hideClientPresenceReminder();
  renderTracking(currentAppointment);
  await refreshProximityAlert();

  showToast(
    "Presença informada. Aguarde o barbeiro validar sua entrada na fila."
  );
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
      () => refreshProximityAlert().catch(console.warn)
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
      .select("id,nome,foto_base64,atualizado_em")
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
    professionals.some(item => item.id === selectedId)
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
    elements.message.textContent = professionals.length
      ? "Conectado. Escolha o profissional para continuar."
      : "Conectado, mas ainda não existem profissionais sincronizados.";
    elements.submit.disabled = !professionals.length;

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
    status_presenca: "nao_confirmado"
  };

  try {
    const { data, error } = await client
      .from("agendamentos")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    localStorage.setItem(
      LAST_BOOKING_KEY,
      JSON.stringify(data)
    );

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

elements.newBooking.addEventListener("click", () => {
  dismissFinishedTrackingForNewBooking();
  elements.form.reset();
  elements.professional.value = "";
  elements.date.value = todayKey();
  buildTimes();
  renderProfessionals();
  renderServices();
  elements.confirmation.hidden = true;
  elements.bookingCard.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.setInterval(() => {
  if (currentAppointment) {
    refreshProximityAlert().catch(console.warn);
  }
}, 30000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(console.warn);
  });
}

loadData();
