// Motor heredado deshabilitado.
// La IA Enterprise obtiene el contexto real desde buildStrictRoleContext y Supabase.
export type AnalysisUser={nombre?:string;rol?:string;comercial?:string};
export function buildEnterpriseAnalysis(question:string,user:AnalysisUser){
  return {role:user.rol||"Usuario",date:new Date().toISOString(),question,indicators:{},findings:[],priorities:[],risks:[],opportunities:[],decisionSuggestion:"Consulte los datos reales de la empresa activa."};
}
