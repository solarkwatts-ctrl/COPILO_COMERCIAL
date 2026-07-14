"use client";
import Link from "next/link";
import {AppLayout} from "@/components/Layout";
import {Bot,DatabaseBackup,Globe2,Palette,ShieldCheck} from "lucide-react";

const cards=[
  [Palette,"Marca e identidad","Logo, colores y experiencia white-label","/admin"],
  [Globe2,"Localización","Moneda, idioma y zona horaria","/admin"],
  [Bot,"Inteligencia artificial","Modelo, límites y contexto empresarial","/ia"],
  [ShieldCheck,"Seguridad","Permisos, usuarios, sesiones y trazabilidad","/admin"],
  [DatabaseBackup,"Continuidad","Backups y política de recuperación","/copias-seguridad"]
] as const;

export default function Page(){return <AppLayout><div className="page-heading"><div><p className="eyebrow">Preferencias Enterprise</p><h1>Centro de configuración</h1><p>Identidad, localización, IA, seguridad y respaldos.</p></div></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{cards.map(([I,t,d,href])=><div className="enterprise-card" key={t}><div className="metric-icon"><I/></div><h2 className="mt-4">{t}</h2><p className="mt-2 text-slate-500">{d}</p><Link className="btn-secondary mt-5 inline-flex" href={href}>Configurar</Link></div>)}</div></AppLayout>}
