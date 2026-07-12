"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";

export function CurrentDateHeader() {
  const [value, setValue] = useState({ date: "", time: "" });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setValue({
        date: now.toLocaleDateString("es-CO", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
          timeZone: "America/Bogota"
        }),
        time: now.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Bogota"
        })
      });
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 font-bold capitalize text-slate-700">
        <CalendarDays size={17} className="text-blue-700" />
        {value.date || "Cargando fecha actual…"}
      </div>
      <div className="flex items-center gap-2 font-semibold text-slate-500">
        <Clock3 size={16} /> Hora Colombia: {value.time || "--:--"}
      </div>
    </div>
  );
}
