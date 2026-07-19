import { SUPABASE_CONFIG, hasSupabaseConfig } from "./supabase-config.js";

let client = null;
let context = null;
let pushTimer = null;
let suppressPush = false;
let realtimeChannel = null;
let lastAppointments = [];

const CDN_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

function report(state, message) {
  context?.onStatus?.({ state, message, at: new Date().toISOString() });
}

function professionalId() {
  return context?.getState?.().professional?.id || null;
}

function baseFilter(query, includeProfessional = true) {
  let filtered = query.eq("barbearia_id", SUPABASE_CONFIG.barbershopId);
  if (includeProfessional && professionalId()) {
    filtered = filtered.eq("profissional_id", professionalId());
  }
  return filtered;
}

async function selectRows(table, includeProfessional = true) {
  let query = client.from(table).select("*");
  query = baseFilter(query, includeProfessional);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function replaceRows(table, rows, includeProfessional = true) {
  if (rows.length) {
    const { error } = await client.from(table).upsert(rows, { onConflict: "id" });
    if (error) throw error;
  }

  let idQuery = client.from(table).select("id");
  idQuery = baseFilter(idQuery, includeProfessional);
  const { data: remoteIds, error: selectError } = await idQuery;
  if (selectError) throw selectError;

  const localIds = new Set(rows.map(row => row.id));
  const missingIds = (remoteIds || []).map(row => row.id).filter(id => !localIds.has(id));
  if (missingIds.length) {
    const { error: deleteError } = await client.from(table).delete().in("id", missingIds);
    if (deleteError) throw deleteError;
  }
}

function toRemote(state, cancelledAppointmentIds = new Set()) {
  const barbearia = SUPABASE_CONFIG.barbershopId;
  const profissional = state.professional.id;

  return {
    professional: {
      id: profissional,
      barbearia_id: barbearia,
      nome: state.professional.name || "Profissional",
      foto_base64: state.professional.photo || null,
      ativo: true,
      status_expediente:
        state.professional.statusExpediente ||
        "expediente_encerrado",
      expediente_data:
        state.professional.expedienteData || null,
      expediente_iniciado_em:
        state.professional.expedienteIniciadoEm || null,
      expediente_encerrado_em:
        state.professional.expedienteEncerradoEm || null,
      atualizado_em: new Date().toISOString()
    },
    services: state.services.map(item => ({
      id: item.id,
      barbearia_id: barbearia,
      profissional_id: profissional,
      nome: item.name,
      preco: Number(item.price || 0),
      duracao_minutos: Number(item.durationMinutes || 30),
      ativo: true,
      atualizado_em: new Date().toISOString()
    })),
    customers: state.knownCustomers.map(item => ({
      id: item.id,
      barbearia_id: barbearia,
      profissional_id: profissional,
      nome: item.name,
      telefone: item.phone,
      servico_preferido_id: item.serviceId || null,
      pagamento_preferido: item.payment || null,
      observacoes: item.notes || null,
      ultima_visita: item.lastVisit || null,
      atualizado_em: new Date().toISOString()
    })),
    queue: state.queue
      .filter(
        item =>
          !item.appointmentId ||
          !cancelledAppointmentIds.has(item.appointmentId)
      )
      .map(item => ({
        id: item.id,
        barbearia_id: barbearia,
        profissional_id: profissional,
        cliente_id: item.knownCustomerId || null,
        agendamento_id: item.appointmentId || null,
        nome_cliente: item.name,
        telefone: item.phone,
        servico_id: item.serviceId || null,
        servico_nome: item.serviceName,
        valor: Number(item.value || 0),
        pagamento: item.payment || null,
        status: item.status,
        entrada_em: item.createdAt,
        iniciado_em: item.startedAt || null,
        duracao_prevista_minutos:
          item.plannedDurationMinutes || null,
        previsao_fim_em: item.expectedEndAt || null,
        atualizado_em: new Date().toISOString()
      })),
    history: state.history.map(item => ({
      id: item.id,
      barbearia_id: barbearia,
      profissional_id: profissional,
      cliente_id: item.knownCustomerId || null,
      agendamento_id: item.appointmentId || null,
      nome_cliente: item.name,
      telefone: item.phone,
      servico_id: item.serviceId || null,
      servico_nome: item.serviceName,
      valor: Number(item.value || 0),
      pagamento: item.payment || null,
      entrada_em: item.createdAt,
      iniciado_em: item.startedAt || null,
      finalizado_em: item.finishedAt,
      duracao_segundos: Number(item.durationSeconds || 0),
      atualizado_em: new Date().toISOString()
    })),
    closures: state.closures.map(item => ({
      id: item.id,
      barbearia_id: barbearia,
      profissional_id: profissional,
      data_fechamento: item.date,
      quantidade_atendimentos: Number(item.attendanceCount || 0),
      faturamento: Number(item.revenue || 0),
      fechado_em: item.closedAt,
      atualizado_em: new Date().toISOString()
    }))
  };
}

function fromRemote(raw, current) {
  const professionalRow = raw.professional[0];
  const cancelledAppointmentIds = new Set(
    (raw.appointments || [])
      .filter(item => item.status === "cancelado")
      .map(item => item.id)
  );

  return {
    professional: professionalRow ? {
      ...current.professional,
      id: professionalRow.id,
      name: professionalRow.nome,
      photo: professionalRow.foto_base64 || current.professional.photo || "",
      statusExpediente:
        professionalRow.status_expediente ||
        current.professional.statusExpediente ||
        "expediente_encerrado",
      expedienteData:
        professionalRow.expediente_data ||
        current.professional.expedienteData ||
        null,
      expedienteIniciadoEm:
        professionalRow.expediente_iniciado_em ||
        current.professional.expedienteIniciadoEm ||
        null,
      expedienteEncerradoEm:
        professionalRow.expediente_encerrado_em ||
        current.professional.expedienteEncerradoEm ||
        null
    } : current.professional,
    services: raw.services.map(item => ({
      id: item.id,
      name: item.nome,
      price: Number(item.preco || 0),
      durationMinutes: Number(item.duracao_minutos || 30)
    })),
    knownCustomers: raw.customers.map(item => ({
      id: item.id,
      name: item.nome,
      phone: item.telefone,
      serviceId: item.servico_preferido_id,
      payment: item.pagamento_preferido || "Pix",
      notes: item.observacoes || "",
      lastVisit: item.ultima_visita || null
    })),
    queue: raw.queue
      .filter(
        item =>
          !item.agendamento_id ||
          !cancelledAppointmentIds.has(item.agendamento_id)
      )
      .map(item => ({
        id: item.id,
        knownCustomerId: item.cliente_id,
        appointmentId: item.agendamento_id,
        name: item.nome_cliente,
        phone: item.telefone,
        serviceId: item.servico_id,
        serviceName: item.servico_nome,
        value: Number(item.valor || 0),
        professional:
          professionalRow?.nome ||
          current.professional.name,
        payment: item.pagamento || "A definir",
        status: item.status,
        createdAt: item.entrada_em,
        startedAt: item.iniciado_em,
        plannedDurationMinutes:
          item.duracao_prevista_minutos,
        expectedEndAt: item.previsao_fim_em
      })),
    history: raw.history.map(item => ({
      id: item.id,
      knownCustomerId: item.cliente_id,
      appointmentId: item.agendamento_id,
      name: item.nome_cliente,
      phone: item.telefone,
      serviceId: item.servico_id,
      serviceName: item.servico_nome,
      value: Number(item.valor || 0),
      professional: professionalRow?.nome || current.professional.name,
      payment: item.pagamento || "A definir",
      status: "atendido",
      createdAt: item.entrada_em,
      startedAt: item.iniciado_em,
      finishedAt: item.finalizado_em,
      durationSeconds: Number(item.duracao_segundos || 0)
    })),
    closures: raw.closures.map(item => ({
      id: item.id,
      date: item.data_fechamento,
      professional: professionalRow?.nome || current.professional.name,
      attendanceCount: Number(item.quantidade_atendimentos || 0),
      revenue: Number(item.faturamento || 0),
      closedAt: item.fechado_em
    }))
  };
}

function mapAppointments(rows) {
  return rows.map(item => ({
    id: item.id,
    professionalId: item.profissional_id,
    clientName: item.cliente_nome,
    phone: item.cliente_telefone,
    serviceId: item.servico_id,
    serviceName: item.servico_nome,
    value: Number(item.valor || 0),
    date: item.data_agendada,
    time: String(item.hora_preferida || "").slice(0, 5),
    status: item.status,
    notes: item.observacao || "",
    completedAt: item.concluido_em || null,
    presenceStatus: item.status_presenca || "nao_confirmado",
    presenceUpdatedAt: item.presenca_atualizada_em || null,
    proximityAlertAt: item.aviso_proximidade_em || null,
    createdAt: item.criado_em,
    arrivalAt: item.chegada_confirmada_em || null,
    cancelledAt: item.cancelado_em || null,
    cancelledBy: item.cancelado_por || null,
    cancellationReason: item.cancelamento_motivo || ""
  })).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}

async function pullRaw() {
  const pid = professionalId();

  const [
    professional,
    services,
    customers,
    queue,
    history,
    closures,
    appointmentsResult
  ] = await Promise.all([
    client
      .from("profissionais")
      .select("*")
      .eq("id", pid),
    selectRows("servicos"),
    selectRows("clientes"),
    selectRows("fila"),
    selectRows("atendimentos"),
    selectRows("fechamentos"),
    client
      .from("agendamentos")
      .select("*")
      .eq(
        "barbearia_id",
        SUPABASE_CONFIG.barbershopId
      )
      .eq("profissional_id", pid)
  ]);

  if (professional.error) throw professional.error;
  if (appointmentsResult.error) {
    throw appointmentsResult.error;
  }

  return {
    professional: professional.data || [],
    services,
    customers,
    queue,
    history,
    closures,
    appointments: appointmentsResult.data || []
  };
}

function remoteHasData(raw) {
  return raw.professional.length || raw.services.length || raw.customers.length || raw.queue.length || raw.history.length || raw.closures.length;
}

async function pushAll() {
  if (!client || !context || suppressPush) return;

  report("syncing", "Enviando alterações...");

  const state = context.getState();
  const { data: cancelledAppointments, error } =
    await client
      .from("agendamentos")
      .select("id")
      .eq(
        "barbearia_id",
        SUPABASE_CONFIG.barbershopId
      )
      .eq("profissional_id", professionalId())
      .eq("status", "cancelado");

  if (error) throw error;

  const cancelledAppointmentIds = new Set(
    (cancelledAppointments || []).map(item => item.id)
  );

  const safeQueue = (state.queue || []).filter(
    item =>
      !item.appointmentId ||
      !cancelledAppointmentIds.has(item.appointmentId)
  );

  if (safeQueue.length !== (state.queue || []).length) {
    suppressPush = true;

    context.applyState({
      ...state,
      queue: safeQueue
    });

    queueMicrotask(() => {
      suppressPush = false;
    });
  }

  const rows = toRemote(
    {
      ...state,
      queue: safeQueue
    },
    cancelledAppointmentIds
  );

  const { error: professionalError } = await client.from("profissionais").upsert(rows.professional, { onConflict: "id" });
  if (professionalError) throw professionalError;

  // Respeita as dependências das chaves estrangeiras.
  // A fila e o histórico podem apontar para serviços e clientes.
  await replaceRows("servicos", rows.services);
  await replaceRows("clientes", rows.customers);
  await replaceRows("fila", rows.queue);
  await replaceRows("atendimentos", rows.history);
  await replaceRows("fechamentos", rows.closures);

  report("connected", "Dados sincronizados");
}

async function pullAll({ apply = true } = {}) {
  if (!client || !context) return null;
  report("syncing", "Buscando dados...");
  const raw = await pullRaw();
  lastAppointments = mapAppointments(
    raw.appointments || []
  );

  if (apply && remoteHasData(raw)) {
    suppressPush = true;
    context.applyState(
      fromRemote(raw, context.getState())
    );
    queueMicrotask(() => { suppressPush = false; });
  }
  await refreshAppointments();
  report("connected", "Dados atualizados");
  return raw;
}

function purgeCancelledQueueFromState(
  cancelledAppointmentIds
) {
  if (!cancelledAppointmentIds.size || !context) {
    return false;
  }

  const currentState = context.getState();
  const currentQueue = currentState.queue || [];
  const filteredQueue = currentQueue.filter(
    item =>
      !item.appointmentId ||
      !cancelledAppointmentIds.has(item.appointmentId)
  );

  if (filteredQueue.length === currentQueue.length) {
    return false;
  }

  suppressPush = true;

  context.applyState({
    ...currentState,
    queue: filteredQueue
  });

  queueMicrotask(() => {
    suppressPush = false;
  });

  return true;
}

async function refreshAppointments() {
  if (!client || !professionalId()) return;

  const query = client
    .from("agendamentos")
    .select("*")
    .eq("barbearia_id", SUPABASE_CONFIG.barbershopId)
    .eq("profissional_id", professionalId())
    .order("data_agendada", { ascending: true })
    .order("hora_preferida", { ascending: true });

  const { data, error } = await query;
  if (error) throw error;

  lastAppointments = mapAppointments(data || []);

  const cancelledAppointmentIds = new Set(
    lastAppointments
      .filter(item => item.status === "cancelado")
      .map(item => item.id)
  );

  if (cancelledAppointmentIds.size && context) {
    purgeCancelledQueueFromState(
      cancelledAppointmentIds
    );

    const { error: cleanupError } = await client
      .from("fila")
      .delete()
      .eq("profissional_id", professionalId())
      .in(
        "agendamento_id",
        [...cancelledAppointmentIds]
      )
      .in("status", ["aguardando", "chamado"]);

    if (cleanupError) throw cleanupError;
  }

  context?.onAppointments?.(lastAppointments);
}

function subscribeRealtime() {
  if (!client || !professionalId()) return;
  if (realtimeChannel) client.removeChannel(realtimeChannel);
  const pid = professionalId();
  realtimeChannel = client.channel(`resenha-${pid}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos", filter: `profissional_id=eq.${pid}` }, () => refreshAppointments().catch(handleError))
    .on("postgres_changes", { event: "*", schema: "public", table: "fila", filter: `profissional_id=eq.${pid}` }, () => pullAll().catch(handleError))
    .on("postgres_changes", { event: "*", schema: "public", table: "servicos", filter: `profissional_id=eq.${pid}` }, () => pullAll().catch(handleError))
    .on("postgres_changes", { event: "*", schema: "public", table: "profissionais", filter: `id=eq.${pid}` }, () => pullAll().catch(handleError))
    .subscribe(status => {
      if (status === "SUBSCRIBED") report("connected", "Sincronização em tempo real ativa");
    });
}

function handleError(error) {
  console.error("Supabase:", error);
  report("error", error?.message || "Falha na sincronização");
}

export function scheduleSupabaseSync() {
  if (!client || suppressPush) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushAll().catch(handleError), 900);
}

export async function syncNow({ forcePush = false } = {}) {
  if (!client) throw new Error("Supabase ainda não está configurado.");
  if (forcePush) {
    await pushAll();
    await refreshAppointments();
    return;
  }
  const raw = await pullAll({ apply: true });
  if (!remoteHasData(raw)) await pushAll();
}

export async function updateAppointment(id, patch) {
  if (!client) throw new Error("Supabase não configurado.");
  const remotePatch = {};
  if (patch.status !== undefined) remotePatch.status = patch.status;
  if (patch.arrivalAt !== undefined) remotePatch.chegada_confirmada_em = patch.arrivalAt;
  if (patch.completedAt !== undefined) remotePatch.concluido_em = patch.completedAt;
  if (patch.presenceStatus !== undefined) remotePatch.status_presenca = patch.presenceStatus;
  if (patch.presenceUpdatedAt !== undefined) remotePatch.presenca_atualizada_em = patch.presenceUpdatedAt;
  if (patch.proximityAlertAt !== undefined) remotePatch.aviso_proximidade_em = patch.proximityAlertAt;
  if (patch.notes !== undefined) remotePatch.observacao = patch.notes;
  if (patch.cancelledAt !== undefined) remotePatch.cancelado_em = patch.cancelledAt;
  if (patch.cancelledBy !== undefined) remotePatch.cancelado_por = patch.cancelledBy;
  if (patch.cancellationReason !== undefined) remotePatch.cancelamento_motivo = patch.cancellationReason;
  remotePatch.atualizado_em = new Date().toISOString();
  const { error } = await client.from("agendamentos").update(remotePatch).eq("id", id);
  if (error) throw error;
  await refreshAppointments();
}

export async function initSupabaseSync(ctx) {
  context = ctx;
  if (!hasSupabaseConfig()) {
    report("local", "Preencha js/supabase-config.js para conectar");
    return { configured: false };
  }

  try {
    report("syncing", "Conectando ao Supabase...");
    const { createClient } = await import(CDN_URL);
    client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });

    const raw = await pullRaw();
    if (remoteHasData(raw)) {
      suppressPush = true;
      context.applyState(fromRemote(raw, context.getState()));
      queueMicrotask(() => { suppressPush = false; });
    } else {
      await pushAll();
    }
    await refreshAppointments();
    subscribeRealtime();
    report("connected", "Conectado e sincronizado");
    return { configured: true };
  } catch (error) {
    handleError(error);
    return { configured: true, error };
  }
}

export function isSupabaseConfigured() {
  return hasSupabaseConfig();
}
