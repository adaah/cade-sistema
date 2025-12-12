/**
 * Sistema de Deep Fetching Recursivo
 * 
 * Este serviço busca recursivamente todos os links encontrados nos JSONs da API,
 * seguindo cada URL até encontrar todos os dados relacionados antes de exibir para o usuário.
 */

const EXTERNAL_API_BASE = 'https://FormigTeen.github.io/sigaa-static/api/v1';
const API_BASE_URL = '/sigaa-api';

// Converte URL externa para usar proxy
function toProxyUrl(url: string): string {
  if (url.startsWith(EXTERNAL_API_BASE)) {
    return url.replace(EXTERNAL_API_BASE, API_BASE_URL);
  }
  if (url.startsWith('https://FormigTeen.github.io/sigaa-static/api/v1')) {
    return url.replace('https://FormigTeen.github.io/sigaa-static/api/v1', API_BASE_URL);
  }
  return url;
}

// Cache global para evitar requisições duplicadas
const globalCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 dias – evita refetch enquanto não houver troca de curso

// Set para rastrear URLs já processadas (evita loops infinitos)
const processedUrls = new Set<string>();

// Callback para reportar progresso
type ProgressCallback = (current: number, total: number, currentUrl: string) => void;

export interface DeepFetchOptions {
  /** Quando true, não limpa o estado de URLs processadas antes de iniciar */
  reuseCache?: boolean;
  /** Chave usada para persistir/restaurar o cache no localStorage */
  persistKey?: string;
  /** Quando true, mantém os URLs processados anteriores; default é limpar */
  clearProcessed?: boolean;
}

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
const PERSIST_VERSION = 1;

interface PersistedCacheEntry {
  url: string;
  data: any;
  timestamp: number;
}

interface PersistedCacheSnapshot {
  version: number;
  savedAt: number;
  entries: PersistedCacheEntry[];
  processed: string[];
}

/**
 * Verifica se uma string é uma URL válida
 */
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Verifica se um campo é uma URL (termina com _url ou é uma URL válida)
 */
function isUrlField(key: string, value: any): boolean {
  if (typeof value !== 'string') return false;
  return key.endsWith('_url') || isValidUrl(value);
}

function persistDeepFetchCache(key: string) {
  if (!isBrowser) return;

  const snapshot: PersistedCacheSnapshot = {
    version: PERSIST_VERSION,
    savedAt: Date.now(),
    entries: Array.from(globalCache.entries()).map(([url, value]) => ({
      url,
      data: value.data,
      timestamp: value.timestamp,
    })),
    processed: Array.from(processedUrls.values()),
  };

  try {
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Não foi possível persistir o cache do deep fetch', error);
  }
}

function loadPersistedDeepFetchCache(key: string): boolean {
  if (!isBrowser) return false;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as PersistedCacheSnapshot;
    if (!parsed?.entries || parsed.version !== PERSIST_VERSION) return false;

    globalCache.clear();
    processedUrls.clear();

    parsed.entries.forEach((entry) => {
      globalCache.set(entry.url, { data: entry.data, timestamp: entry.timestamp });
      processedUrls.add(entry.url);
    });

    if (Array.isArray(parsed.processed)) {
      parsed.processed.forEach((url) => processedUrls.add(url));
    }

    return true;
  } catch (error) {
    console.warn('Falha ao restaurar cache persistido do deep fetch', error);
    return false;
  }
}

/**
 * Extrai todas as URLs de um objeto recursivamente
 */
function extractUrls(obj: any, baseUrl: string = API_BASE_URL): string[] {
  const urls: string[] = [];

  if (!obj || typeof obj !== 'object') return urls;

  // Se for array, processar cada item
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      urls.push(...extractUrls(item, baseUrl));
    });
    return urls;
  }

  // Processar cada propriedade do objeto
  for (const [key, value] of Object.entries(obj)) {
    if (isUrlField(key, value)) {
      // É uma URL, adicionar à lista
      urls.push(value as string);
    } else if (typeof value === 'object' && value !== null) {
      // É um objeto aninhado, buscar URLs dentro dele
      urls.push(...extractUrls(value, baseUrl));
    }
  }

  return urls;
}

/**
 * Busca um JSON de uma URL com cache
 */
async function fetchJson(url: string): Promise<any> {
  const proxyUrl = toProxyUrl(url);
  
  // Verificar cache (usando URL original como chave)
  const cached = globalCache.get(url) || globalCache.get(proxyUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Se já foi processado nesta sessão, retornar do cache ou fazer nova requisição
  if (processedUrls.has(url) || processedUrls.has(proxyUrl)) {
    if (cached) return cached.data;
  }

  try {
    console.log(`Deep fetch: ${proxyUrl}`);
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      console.warn(`Falha ao carregar ${proxyUrl}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // Armazenar no cache (usando URL original como chave)
    globalCache.set(url, { data, timestamp: Date.now() });
    processedUrls.add(url);

    return data;
  } catch (error) {
    console.warn(`Erro ao buscar ${proxyUrl}:`, error);
    return null;
  }
}

/**
 * Busca recursiva profunda: segue todos os links encontrados
 */
async function deepFetchRecursive(
  url: string,
  visited: Set<string> = new Set(),
  progressCallback?: ProgressCallback,
  totalUrls?: number
): Promise<any> {
  // Evitar loops infinitos
  if (visited.has(url)) {
    return globalCache.get(url)?.data || null;
  }

  visited.add(url);

  // Buscar o JSON
  const data = await fetchJson(url);
  if (!data) return null;

  // Extrair todas as URLs deste JSON
  const foundUrls = extractUrls(data);
  
  // Filtrar URLs que ainda não foram visitadas e são da mesma base
  const newUrls = foundUrls.filter(
    u => !visited.has(u) && u.startsWith(API_BASE_URL)
  );

  // Atualizar progresso
  if (progressCallback && totalUrls) {
    const current = visited.size;
    progressCallback(current, totalUrls, url);
  }

  // Buscar recursivamente todas as URLs encontradas
  if (newUrls.length > 0) {
    const results = await Promise.all(
      newUrls.map(newUrl => 
        deepFetchRecursive(newUrl, visited, progressCallback, totalUrls)
      )
    );
    
    // Os resultados já estão no cache, não precisamos retorná-los
    // mas garantimos que foram buscados
  }

  return data;
}

/**
 * Estima o total de URLs que serão buscadas (para progresso)
 */
async function estimateTotalUrls(startUrls: string[]): Promise<number> {
  const visited = new Set<string>();
  const queue = [...startUrls];
  let estimated = startUrls.length;

  // Fazer uma passada rápida para estimar
  while (queue.length > 0 && estimated < 1000) { // Limite para não demorar muito
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const data = await fetchJson(url);
      if (data) {
        const urls = extractUrls(data).filter(
          u => !visited.has(u) && u.startsWith(API_BASE_URL)
        );
        estimated += urls.length;
        queue.push(...urls.slice(0, 10)); // Limitar para não demorar
      }
    } catch {
      // Ignorar erros na estimativa
    }
  }

  return Math.min(estimated, 2000); // Limite máximo razoável
}

/**
 * Função principal: busca profunda de todas as informações relacionadas
 * 
 * @param startUrls URLs iniciais para começar a busca (ex: programs.json, courses.json, sections.json)
 * @param progressCallback Callback opcional para reportar progresso
 * @returns Promise que resolve quando todas as informações foram buscadas
 */
export async function deepFetchAll(
  startUrls: string[],
  progressCallback?: ProgressCallback,
  options?: DeepFetchOptions
): Promise<{
  programs: any[];
  courses: any[];
  sections: any[];
  allData: Map<string, any>;
}> {
  const { reuseCache = false, persistKey, clearProcessed = true } = options || {};

  // Se existir cache persistido associado, tentar restaurar antes de decidir buscar
  if (persistKey && (!reuseCache || globalCache.size === 0)) {
    loadPersistedDeepFetchCache(persistKey);
  }

  // Limpar cache de processamento se não for reutilizar
  if (!reuseCache && clearProcessed) {
  processedUrls.clear();
  }

  // Adicionar URLs principais se não foram fornecidas
  const urls = startUrls.length > 0 
    ? startUrls 
    : [
        `${API_BASE_URL}/programs.json`,
        `${API_BASE_URL}/courses.json`,
        `${API_BASE_URL}/sections.json`,
      ];

  // Estimar total para progresso
  let totalEstimated = urls.length;
  if (progressCallback) {
    progressCallback(0, totalEstimated, 'Estimando...');
    totalEstimated = await estimateTotalUrls(urls);
  }

  // Buscar recursivamente todas as URLs
  const visited = new Set<string>();
  const allData = new Map<string, any>();

  // Primeiro, buscar as URLs principais
  const mainData = await Promise.all(
    urls.map(url => deepFetchRecursive(url, visited, progressCallback, totalEstimated))
  );

  // Agora, buscar todas as URLs encontradas nos dados principais
  const allFoundUrls = new Set<string>();
  mainData.forEach(data => {
    if (data) {
      const urls = extractUrls(data);
      urls.forEach(u => {
        if (u.startsWith(API_BASE_URL) && !visited.has(u)) {
          allFoundUrls.add(u);
        }
      });
    }
  });

  // Buscar todas as URLs encontradas
  if (allFoundUrls.size > 0) {
    await Promise.all(
      Array.from(allFoundUrls).map(url => 
        deepFetchRecursive(url, visited, progressCallback, totalEstimated)
      )
    );
  }

  // Coletar todos os dados do cache
  globalCache.forEach((value, url) => {
    allData.set(url, value.data);
  });

  // Separar por tipo
  const programs: any[] = [];
  const courses: any[] = [];
  const sections: any[] = [];

  allData.forEach((data, url) => {
    if (url.includes('/program/')) {
      programs.push(data);
    } else if (url.includes('/course/') || url.includes('/courses.json')) {
      if (Array.isArray(data)) {
        courses.push(...data);
      } else {
        courses.push(data);
      }
    } else if (url.includes('/section/') || url.includes('/sections.json')) {
      if (Array.isArray(data)) {
        sections.push(...data);
      } else {
        sections.push(data);
      }
    }
  });

  // Reportar conclusão
  if (progressCallback) {
    progressCallback(visited.size, visited.size, 'Concluído!');
  }

  const result = {
    programs,
    courses,
    sections,
    allData,
  };

  // Persistir snapshot completo se solicitado
  if (persistKey) {
    persistDeepFetchCache(persistKey);
  }

  return result;
}

/**
 * Busca profunda de uma URL específica e todos os seus links relacionados
 */
export async function deepFetchOne(
  url: string,
  progressCallback?: ProgressCallback
): Promise<any> {
  const visited = new Set<string>();
  const data = await deepFetchRecursive(url, visited, progressCallback, 100);
  return data;
}

/**
 * Limpa o cache global
 */
export function clearDeepFetchCache() {
  globalCache.clear();
  processedUrls.clear();
}

/**
 * Obtém estatísticas do cache
 */
export function getCacheStats() {
  return {
    cachedUrls: globalCache.size,
    processedUrls: processedUrls.size,
    cacheSize: Array.from(globalCache.values()).reduce(
      (acc, val) => acc + JSON.stringify(val.data).length,
      0
    ),
  };
}

/**
 * Verifica se uma URL está no cache do deep fetch
 */
export function getCachedData(url: string): any | null {
  const cached = globalCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

/**
 * Verifica se uma URL já foi processada
 */
export function isUrlProcessed(url: string): boolean {
  return processedUrls.has(url);
}

/**
 * Exporta o cache atual para o localStorage usando a chave informada
 */
export function persistDeepFetch(key: string) {
  persistDeepFetchCache(key);
}

/**
 * Restaura o cache a partir de um snapshot persistido
 */
export function hydrateDeepFetch(key: string): boolean {
  return loadPersistedDeepFetchCache(key);
}

