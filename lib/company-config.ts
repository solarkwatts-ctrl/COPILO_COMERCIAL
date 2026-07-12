export type ZoneConfig = { id:string; nombre:string; responsable:string; activo:boolean };
export type BranchConfig = { id:string; nombre:string; ciudad:string; zona:string; activo:boolean };
export type CompanyConfig = {
  nombre:string; nit:string; sector:string; ciudad:string; direccion:string; telefono:string;
  correo:string; sitioWeb:string; moneda:string; zonaHoraria:string; logoDataUrl?:string;
  zonas:ZoneConfig[]; sucursales:BranchConfig[]; demoActivo:boolean;
};
export const defaultCompanyConfig:CompanyConfig={
  nombre:'Empresa Demo',nit:'900.000.000-1',sector:'Comercial',ciudad:'Bucaramanga',direccion:'',telefono:'',correo:'',sitioWeb:'',moneda:'COP',zonaHoraria:'America/Bogota',demoActivo:true,
  zonas:[{id:'z1',nombre:'Zona Norte',responsable:'Gerencia Comercial',activo:true},{id:'z2',nombre:'Zona Centro',responsable:'Gerencia Comercial',activo:true}],
  sucursales:[{id:'s1',nombre:'Sucursal Principal',ciudad:'Bucaramanga',zona:'Zona Centro',activo:true}]
};
const KEY='copiloto_company_config';
export function loadCompanyConfig():CompanyConfig{ if(typeof window==='undefined')return defaultCompanyConfig; try{return {...defaultCompanyConfig,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return defaultCompanyConfig}}
export function saveCompanyConfig(v:CompanyConfig){ if(typeof window!=='undefined')localStorage.setItem(KEY,JSON.stringify(v)); }
