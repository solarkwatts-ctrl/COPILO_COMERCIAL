"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { AlertTriangle, CheckCircle2, CircleDot, Send, Sparkles } from "lucide-react";
import { roleScopeDescription } from "@/lib/role-permissions";

function formatLine(line: string) {
  return line
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

function AnswerView({ answer }: { answer: string }) {
  const lines = answer.split("\n").filter((line) => line.trim() !== "");
  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        const text = line.trim();
        if (text.startsWith("## ")) {
          return <h3 key={index} className="mt-5 text-xl font-black text-slate-950">{text.slice(3)}</h3>;
        }
        if (text.startsWith("🔴")) return <div key={index} className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-900">{text}</div>;
        if (text.startsWith("🟡")) return <div key={index} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-900">{text}</div>;
        if (text.startsWith("🟢")) return <div key={index} className="rounded-2xl border border-green-200 bg-green-50 p-4 font-bold text-green-900">{text}</div>;
        if (/^\d+\./.test(text) || text.startsWith("- ")) {
          return (
            <div key={index} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-slate-700">
              <CircleDot className="mt-0.5 shrink-0 text-blue-700" size={18} />
              <div dangerouslySetInnerHTML={{ __html: formatLine(text.replace(/^- /, "")) }} />
            </div>
          );
        }
        return <p key={index} className="leading-7 text-slate-700" dangerouslySetInnerHTML={{ __html: formatLine(text) }} />;
      })}
    </div>
  );
}

export default function IAPage() {
  const [role, setRole] = useState("Gerencia Comercial");
  const [name, setName] = useState("Usuario");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("Escriba una pregunta libre. El Copiloto comprenderá la intención y responderá únicamente con los datos autorizados para su rol y empresa activa.");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("copiloto_user");
      const user = raw ? JSON.parse(raw) : null;
      setRole(user?.rol || "Gerencia Comercial");
      setName(user?.nombre || "Usuario");
    } catch {
      setRole("Gerencia Comercial");
    }
  }, []);

  async function respond() {
    const cleanQuestion = question.trim();
    if (cleanQuestion.length < 3 || loading) return;
    setLoading(true);
    setAnswer("Analizando su pregunta, los datos de la empresa activa y las restricciones del perfil…");
    try {
      const { supabaseBrowser } = await import("@/lib/supabase/client");
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData.session?.access_token;
      const companyId = localStorage.getItem("active_company_id");
      const response = await fetch("/api/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(companyId ? { "X-Company-Id": companyId } : {})
        },
        body: JSON.stringify({ question: cleanQuestion })
      });
      const data = await response.json();
      setAnswer(data.answer || "No se recibió una respuesta utilizable.");
      setMode(data.mode || "");
    } catch {
      setAnswer("No fue posible consultar la IA. Revise la conexión y las variables GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
      setMode("error");
    } finally {
      setLoading(false);
    }
  }

  if (role === "Asistente Comercial") {
    return (
      <AppLayout>
        <Hero title="Asistente Comercial" subtitle="Este perfil alimenta las bases y no consulta información estratégica." />
        <section className="card">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-amber-600" />
            <div>
              <h2 className="text-xl font-black">Acceso restringido por rol</h2>
              <p className="mt-2 text-slate-600">Puede cargar y validar archivos. El Copiloto IA está deshabilitado para proteger la información empresarial.</p>
            </div>
          </div>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Hero
        title={`Copiloto IA para ${role}`}
        subtitle={`Hola, ${name}. Pregunte libremente: la IA interpreta la intención y usa solamente el contexto autorizado.`}
      />

      <section className="card">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-700" />
              <h2 className="text-xl font-black">Conversación empresarial libre</h2>
            </div>
            <p className="mt-2 max-w-4xl text-sm text-slate-500">{roleScopeDescription(role)}</p>
          </div>
          {mode && (
            <span className={mode === "gemini" ? "badge bg-green-50 text-green-700" : mode === "error" ? "badge bg-red-50 text-red-700" : "badge bg-amber-50 text-amber-700"}>
              {mode === "gemini" ? "Gemini conectado" : mode === "error" ? "Error de conexión" : "Motor local"}
            </span>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <textarea
            className="min-h-32 w-full resize-y bg-transparent p-2 text-base text-slate-900 outline-none"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void respond();
              }
            }}
            placeholder="Escriba cualquier pregunta sobre la empresa: resultados, riesgos, clientes, metas, cartera, inventario, usuarios, cargas o decisiones. No necesita usar una frase predefinida."
          />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-500">Enter para enviar · Shift + Enter para nueva línea</p>
            <button className="btn flex items-center gap-2" onClick={() => void respond()} disabled={loading || question.trim().length < 3}>
              <Send size={17} /> {loading ? "Analizando…" : "Consultar"}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <CheckCircle2 className="text-blue-700" />
            <h3 className="text-2xl font-black text-blue-950">Respuesta del Copiloto</h3>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><AnswerView answer={answer} /></div>
        </div>
      </section>
    </AppLayout>
  );
}
