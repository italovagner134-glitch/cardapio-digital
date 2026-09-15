export interface BusinessHourRow {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  /** Ordena turnos do mesmo dia (almoço antes de jantar). Opcional só pra
   * não quebrar chamador antigo que ainda não seleciona a coluna — quando
   * ausente todas as linhas do dia empatam e a ordem vira a de chegada. */
  position?: number;
}

/**
 * O produto é para restaurantes brasileiros — em vez de depender do fuso do
 * navegador de quem está olhando (o dono pode estar em outro estado, o
 * cliente também), fixamos America/Sao_Paulo. É uma simplificação
 * deliberada: cobre a esmagadora maioria dos restaurantes do produto e evita
 * o bug de "fuso de quem está olhando" que a implementação anterior tinha.
 */
const TIMEZONE = "America/Sao_Paulo";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Dia da semana (0=domingo) e minutos desde 00:00, no horário de São Paulo.
 * `at` é só para teste com instante sintético (ver lib/promotions.ts e os
 * scripts de verificação) — em produção sempre é chamado sem argumento. */
export function nowInRestaurantTimezone(at: Date = new Date()): { dayOfWeek: number; minutesOfDay: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);

  const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = WEEKDAYS.indexOf(weekdayShort);

  return { dayOfWeek: dayOfWeek === -1 ? 0 : dayOfWeek, minutesOfDay: hour * 60 + minute };
}

/** Turnos válidos (não fechados, com hora de abrir/fechar) de um dia,
 * ordenados por `position` — pode ser mais de um (almoço + jantar). */
function turnsForDay(businessHours: BusinessHourRow[], day: number): BusinessHourRow[] {
  return businessHours
    .filter((row) => row.day_of_week === day && !row.is_closed && row.opens_at && row.closes_at)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

interface ActiveTurn {
  turn: BusinessHourRow;
  /** Esse turno atravessa a meia-noite (closes_at <= opens_at). */
  crossesMidnight: boolean;
  /** O turno é o de ONTEM que ainda está aberto (cruzou a meia-noite). */
  fromYesterday: boolean;
}

/** Acha o turno aberto agora, se houver — hoje primeiro, depois o de ontem
 * caso tenha cruzado a meia-noite. Único lugar que sabe "qual turno está
 * valendo agora"; isOpenNow/getClosingTimeLabel/getLastOrderInstant só
 * leem o resultado, pra não triplicar essa lógica. */
function findActiveTurn(businessHours: BusinessHourRow[], at?: Date): ActiveTurn | null {
  const { dayOfWeek, minutesOfDay } = nowInRestaurantTimezone(at);
  const yesterday = (dayOfWeek + 6) % 7;

  for (const turn of turnsForDay(businessHours, dayOfWeek)) {
    const opens = toMinutes(turn.opens_at!);
    const closes = toMinutes(turn.closes_at!);
    const crossesMidnight = closes <= opens;
    const withinToday = crossesMidnight ? minutesOfDay >= opens : minutesOfDay >= opens && minutesOfDay < closes;
    if (withinToday) return { turn, crossesMidnight, fromYesterday: false };
  }

  for (const turn of turnsForDay(businessHours, yesterday)) {
    const opens = toMinutes(turn.opens_at!);
    const closes = toMinutes(turn.closes_at!);
    // Só relevante se o turno de ontem cruzou a meia-noite.
    if (closes <= opens && minutesOfDay < closes) {
      return { turn, crossesMidnight: true, fromYesterday: true };
    }
  }

  return null;
}

/**
 * true = aberto, false = fechado, null = sem horário válido configurado.
 * Considera janelas que cruzam a meia-noite e mais de um turno por dia
 * (almoço + jantar) — ver findActiveTurn.
 */
export function isOpenNow(businessHours: BusinessHourRow[], at?: Date): boolean | null {
  if (businessHours.length === 0) return null;
  if (findActiveTurn(businessHours, at)) return true;

  const hasAnyConfiguredDay = businessHours.some(
    (row) => !row.is_closed && row.opens_at && row.closes_at,
  );
  return hasAnyConfiguredDay ? false : null;
}

/**
 * "Fecha às HH:mm" pra exibir na loja pública, quando `isOpenNow` é true.
 * Deriva do turno aberto agora — não de um campo solto tipo `closing_time`,
 * que dessincronizaria do horário real assim que o dono editasse os dias em
 * /app/horarios.
 */
export function getClosingTimeLabel(businessHours: BusinessHourRow[], at?: Date): string | null {
  const active = findActiveTurn(businessHours, at);
  return active ? active.turn.closes_at!.slice(0, 5) : null;
}

/** Usado pelo checklist do onboarding — só conta como concluído se existir
 * pelo menos um dia realmente aberto com horário válido, não só linhas
 * gravadas na tabela (uma tabela cheia de "fechado o tempo todo" não conta). */
export function hasValidBusinessHours(businessHours: BusinessHourRow[]): boolean {
  return businessHours.some((row) => !row.is_closed && !!row.opens_at && !!row.closes_at);
}

// América/São_Paulo é UTC-3 fixo (sem horário de verão desde 2019) — dá pra
// construir o instante UTC real de um "HH:mm" local sem biblioteca de fuso.
const SAO_PAULO_UTC_OFFSET_HOURS = 3;

function saoPauloDateParts(at: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);

  return {
    year: Number(parts.find((p) => p.type === "year")?.value ?? "1970"),
    month: Number(parts.find((p) => p.type === "month")?.value ?? "1"),
    day: Number(parts.find((p) => p.type === "day")?.value ?? "1"),
  };
}

/** Converte um "HH:mm" local de São Paulo (hoje + dayOffset dias) no instante
 * UTC real correspondente. `Date.UTC` já resolve o overflow de dia sozinho. */
function saoPauloTimeToInstant(hhmm: string, dayOffset: number, at?: Date): Date {
  const { year, month, day } = saoPauloDateParts(at);
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day + dayOffset, h + SAO_PAULO_UTC_OFFSET_HOURS, m, 0));
}

/**
 * Mesma regra acima, mas para o valor cru de um `<input type="datetime-local">`
 * ("YYYY-MM-DDTHH:mm", com data própria em vez de "hoje + offset") — usado
 * pelo início/fim de campanha de uma promoção. Sem isto, `new Date(valor)`
 * no servidor interpretaria a string no fuso do PROCESSO (ex.: UTC numa
 * função serverless), não no de São Paulo — o mesmo bug que esta timezone.ts
 * inteira existe pra evitar, só que pela borda do formulário em vez do
 * navegador de quem olha. `null` se a string não bater o formato esperado.
 */
export function saoPauloDateTimeToISO(datetimeLocal: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(datetimeLocal);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) + SAO_PAULO_UTC_OFFSET_HOURS, Number(minute), 0),
  ).toISOString();
}

/** Caminho inverso — um instante ISO (UTC, como vem do banco) pro valor que
 * um `<input type="datetime-local">` espera, sempre no horário de São Paulo
 * (não no fuso de quem está com o navegador aberto), pra editar uma
 * promoção mostrar de volta exatamente a hora que foi salva. */
export function isoToSaoPauloDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Instante real (não só "HH:mm") em que a cozinha para de aceitar pedido —
 * horário de fechamento do turno aberto agora, menos `lastOrderOffsetMin`.
 * `null` se a loja não estiver aberta agora. Usado pelo cronômetro
 * (StoreStatusCountdown) — o servidor calcula, o cliente só conta.
 */
export function getLastOrderInstant(
  businessHours: BusinessHourRow[],
  lastOrderOffsetMin: number,
  at?: Date,
): Date | null {
  const active = findActiveTurn(businessHours, at);
  if (!active) return null;

  // Turno de hoje que cruza a meia-noite fecha amanhã (dayOffset 1); turno
  // de ontem que ainda está valendo fecha hoje (dayOffset 0, `at` já é hoje).
  const dayOffset = active.crossesMidnight && !active.fromYesterday ? 1 : 0;
  const closeInstant = saoPauloTimeToInstant(active.turn.closes_at!, dayOffset, at);
  return new Date(closeInstant.getTime() - lastOrderOffsetMin * 60_000);
}

const WEEKDAYS_PT = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
export { WEEKDAYS_PT };

/** "Abre amanhã às 18:00" / "Abre segunda às 11:00" — usado quando a loja
 * está fechada agora. Pega o primeiro turno (menor `position`) do próximo
 * dia configurado. `null` se nenhum dia tiver horário configurado. */
export function getNextOpeningLabel(businessHours: BusinessHourRow[], at?: Date): string | null {
  const { dayOfWeek } = nowInRestaurantTimezone(at);

  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (dayOfWeek + offset) % 7;
    const firstTurn = turnsForDay(businessHours, day)[0];
    if (firstTurn) {
      const label = offset === 1 ? "amanhã" : WEEKDAYS_PT[day];
      return `Abre ${label} às ${firstTurn.opens_at!.slice(0, 5)}`;
    }
  }

  return null;
}

/** Instante UTC de um "HH:mm" local de São Paulo, hoje — usado pelo
 * contador de promoção (PromotionCountdown), que só lida com "termina hoje
 * às tal hora", nunca cruza meia-noite. */
export function saoPauloTimeToday(hhmm: string): Date {
  return saoPauloTimeToInstant(hhmm, 0);
}

/** Mesmo critério do getNextOpeningLabel (primeiro turno do próximo dia
 * configurado), mas devolve o instante real em vez do label em PT — usado
 * pelo painel de urgência (lib/urgency.ts), que nunca deve montar string
 * de UI, só instantes ISO. `null` se nenhum dia tiver horário configurado. */
export function getNextOpenInstant(businessHours: BusinessHourRow[], at?: Date): Date | null {
  const { dayOfWeek } = nowInRestaurantTimezone(at);

  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (dayOfWeek + offset) % 7;
    const firstTurn = turnsForDay(businessHours, day)[0];
    if (firstTurn) return saoPauloTimeToInstant(firstTurn.opens_at!, offset, at);
  }

  return null;
}

/** "18:00 – 23:00" pra um turno, ou "11:00 – 14:00 · 18:00 – 23:00" pra
 * vários — usado pelo InfoSheet (Parte 4.2). "Fechado" se não houver turno
 * válido no dia. */
export function formatDayHoursLabel(businessHours: BusinessHourRow[], day: number): string {
  const turns = turnsForDay(businessHours, day);
  if (turns.length === 0) return "Fechado";
  return turns.map((turn) => `${turn.opens_at!.slice(0, 5)} – ${turn.closes_at!.slice(0, 5)}`).join(" · ");
}
