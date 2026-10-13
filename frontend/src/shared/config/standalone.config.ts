// Modo "solo Epic 4": el despliegue expone únicamente la pantalla de Publicar vacante,
// sin login y sin el resto de la plataforma. Se activa con NEXT_PUBLIC_STANDALONE_EPIC4=true.
export const STANDALONE_EPIC4_HOME_PATH = "/recruiters/job-offers/new";

// Se lee en cada llamada (no al cargar el módulo) para poder probarlo; Next reemplaza
// process.env.NEXT_PUBLIC_* por su valor al compilar, también en el proxy.
export function isStandaloneEpic4(): boolean {
  return process.env.NEXT_PUBLIC_STANDALONE_EPIC4 === "true";
}
