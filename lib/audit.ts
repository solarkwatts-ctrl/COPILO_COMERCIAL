export type AuditEvent={id:string;fecha:string;usuario:string;rol:string;modulo:string;accion:string;detalle:string};
const KEY='copiloto_audit_log';
export function loadAudit():AuditEvent[]{if(typeof window==='undefined')return[];try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
export function registerAudit(e:Omit<AuditEvent,'id'|'fecha'>){if(typeof window==='undefined')return;const rows=loadAudit();rows.unshift({id:crypto.randomUUID(),fecha:new Date().toISOString(),...e});localStorage.setItem(KEY,JSON.stringify(rows.slice(0,1000)));}
export function clearAudit(){if(typeof window!=='undefined')localStorage.removeItem(KEY)}
