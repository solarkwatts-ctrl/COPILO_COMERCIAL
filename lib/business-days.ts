export type GoalStatus = {
  todayLabel: string;
  monthLabel: string;
  businessDaysElapsed: number;
  businessDaysTotal: number;
  businessDaysRemaining: number;
  expectedProgress: number;
  actualProgress: number;
  deviation: number;
  color: "green" | "yellow" | "red";
  label: string;
  message: string;
  managementMessage: string;
};

const COLOMBIA_HOLIDAYS: Record<number, string[]> = {
  2026: [
    "2026-01-01","2026-01-12","2026-03-23","2026-04-02","2026-04-03",
    "2026-05-01","2026-05-18","2026-06-08","2026-06-15","2026-06-29",
    "2026-07-20","2026-08-07","2026-08-17","2026-10-12","2026-11-02",
    "2026-11-16","2026-12-08","2026-12-25"
  ],
  2027: [
    "2027-01-01","2027-01-11","2027-03-22","2027-03-25","2027-03-26",
    "2027-05-01","2027-05-10","2027-05-31","2027-06-07","2027-07-05",
    "2027-07-20","2027-08-07","2027-08-16","2027-10-18","2027-11-01",
    "2027-11-15","2027-12-08","2027-12-25"
  ]
};

function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isBusinessDay(date: Date) {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  const holidays = COLOMBIA_HOLIDAYS[date.getFullYear()] || [];
  return !holidays.includes(isoDate(date));
}

function countBusinessDays(start: Date, end: Date) {
  if (start > end) return 0;
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(12, 0, 0, 0);
  const last = new Date(end);
  last.setHours(12, 0, 0, 0);

  while (cursor <= last) {
    if (isBusinessDay(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function motivationalMessage(color: "green" | "yellow" | "red", deviation: number, name?: string) {
  const who = name ? `${name}, ` : "";

  if (color === "green") {
    return `${who}vas bien. Mantén el ritmo, protege tus clientes fuertes y sigue así.`;
  }

  if (color === "yellow") {
    return `${who}vas un poco por debajo del ritmo esperado, pero todavía puedes lograrlo. Prioriza clientes con mayor potencial e intenta una estrategia distinta.`;
  }

  if (deviation <= -30) {
    return `${who}el reto es alto, pero ya has demostrado que puedes recuperarte. Enfócate hoy en tres oportunidades concretas y pide acompañamiento si lo necesitas.`;
  }

  return `${who}estás por debajo del ritmo esperado. Aún hay margen de reacción: revisa clientes inactivos, productos disponibles y oportunidades de recompra.`;
}

export function calculateGoalStatus(
  sales: number,
  goal: number,
  name?: string,
  now = new Date()
): GoalStatus {
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const businessDaysTotal = countBusinessDays(firstDay, lastDay);
  const businessDaysElapsed = countBusinessDays(firstDay, now > lastDay ? lastDay : now);
  const businessDaysRemaining = Math.max(businessDaysTotal - businessDaysElapsed, 0);

  const expectedProgress = businessDaysTotal > 0
    ? (businessDaysElapsed / businessDaysTotal) * 100
    : 0;

  const actualProgress = goal > 0 ? (sales / goal) * 100 : 0;
  const deviation = actualProgress - expectedProgress;

  let color: "green" | "yellow" | "red" = "green";
  let label = "En buen ritmo";

  if (deviation < -15) {
    color = "red";
    label = "Requiere acción inmediata";
  } else if (deviation < -5) {
    color = "yellow";
    label = "Necesita atención";
  }

  const managementMessage =
    color === "green"
      ? `${name || "El responsable"} mantiene un ritmo adecuado frente a los días hábiles transcurridos.`
      : color === "yellow"
      ? `${name || "El responsable"} está ligeramente por debajo del cumplimiento esperado y requiere seguimiento.`
      : `${name || "El responsable"} está muy por debajo del ritmo esperado; requiere acompañamiento comercial inmediato.`;

  return {
    todayLabel: now.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }),
    monthLabel: now.toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric"
    }),
    businessDaysElapsed,
    businessDaysTotal,
    businessDaysRemaining,
    expectedProgress,
    actualProgress,
    deviation,
    color,
    label,
    message: motivationalMessage(color, deviation, name),
    managementMessage
  };
}