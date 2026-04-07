
import { GoogleGenAI, Type } from "@google/genai";
import { User, PlayerEntry, TeamDraft } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// ─── Algoritmo local de fallback ────────────────────────────────────────────
// Usado quando a API do Gemini estiver indisponível (cota esgotada, etc.)
const balanceTeamsLocally = (
  playerData: { name: string; rating: number; position: string; weight: number }[]
): TeamDraft & { usedFallback: boolean } => {
  // Separa goleiros dos demais
  const goalkeepers = playerData.filter(p => p.position === 'Goleiro');
  const outfield = playerData.filter(p => p.position !== 'Goleiro');

  // Ordena jogadores de campo por rating decrescente para distribuição equilibrada
  outfield.sort((a, b) => b.rating - a.rating);

  const teamAmarelo: string[] = [];
  const teamLaranja: string[] = [];
  let sumAmarelo = 0;
  let sumLaranja = 0;

  // Distribui um goleiro para cada time (se houver)
  goalkeepers.forEach((gk, i) => {
    if (i % 2 === 0) teamAmarelo.push(gk.name);
    else teamLaranja.push(gk.name);
  });

  // Distribui os demais usando algoritmo greedy (sempre coloca no time com menor soma)
  outfield.forEach(p => {
    if (sumAmarelo <= sumLaranja) {
      teamAmarelo.push(p.name);
      sumAmarelo += p.rating;
    } else {
      teamLaranja.push(p.name);
      sumLaranja += p.rating;
    }
  });

  const diff = Math.abs(sumAmarelo - sumLaranja).toFixed(1);
  const justification = `Sorteio local (IA indisponível): times equilibrados por rating e posição. Diferença de habilidade: ${diff} ponto(s). Goleiros distribuídos: ${goalkeepers.length} no total.`;

  return { teamAmarelo, teamLaranja, justification, usedFallback: true };
};

// ─── Função principal ────────────────────────────────────────────────────────
export const balanceTeams = async (
  players: PlayerEntry[],
  userDetails: Record<string, User>
): Promise<TeamDraft & { usedFallback?: boolean }> => {
  const playerData = players
    .filter(p => p.status === 'confirmado')
    .map(p => {
      const details = userDetails[p.userId];
      return {
        name: p.name,
        rating: details?.rating || 3,
        position: details?.position || 'Meio',
        weight: details?.weight || 75
      };
    });

  const prompt = `
    Organize esses jogadores de futebol em dois times equilibrados (Colete Amarelo e Colete Laranja).
    REGRAS OBRIGATÓRIAS:
    1. Não permita que 2 Goleiros fiquem no mesmo time. Se houver 2 goleiros, coloque um em cada time.
    2. Equilibre os times por posição (ex: distribua os Zagueiros, Meias e Atacantes igualmente entre os times).
    3. Considere o nível de habilidade (rating de 1 a 5) para que a soma das habilidades de cada time seja o mais próxima possível.
    4. Considere o peso (weight em kg) dos jogadores, de modo a formar times fisicamente equilibrados também (distribua os jogadores mais pesados igualmente).
    
    Jogadores: ${JSON.stringify(playerData)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            teamAmarelo: { type: Type.ARRAY, items: { type: Type.STRING } },
            teamLaranja: { type: Type.ARRAY, items: { type: Type.STRING } },
            justification: { type: Type.STRING, description: "Explicação breve de por que os times estão equilibrados" }
          },
          required: ["teamAmarelo", "teamLaranja", "justification"]
        }
      }
    });

    return { ...JSON.parse(response.text), usedFallback: false };

  } catch (err: any) {
    const status = err?.status ?? err?.errorDetails?.[0]?.reason ?? '';
    const isQuota = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || String(status) === '429';

    if (isQuota) {
      console.warn('⚠️ Cota da API Gemini esgotada. Usando algoritmo local de sorteio.');
    } else {
      console.error('Erro na API Gemini:', err);
    }

    // Fallback: sorteio local
    return balanceTeamsLocally(playerData);
  }
};

export const searchLocationOnMaps = async (query: string, userCoords?: { lat: number, lng: number }) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Encontre o link oficial do Google Maps para o local de futebol: "${query}"`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: userCoords ? {
        retrievalConfig: {
          latLng: {
            latitude: userCoords.lat,
            longitude: userCoords.lng
          }
        }
      } : undefined
    },
  });

  const mapsChunk = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.find(chunk => chunk.maps);
  return {
    text: response.text,
    uri: mapsChunk?.maps?.uri || null
  };
};

export const generateMatchHype = async (matchTitle: string, location: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Crie uma convocação animada e engraçada para uma pelada de futebol chamada "${matchTitle}" que vai acontecer em "${location}". Use gírias de futebol brasileiro.`,
  });
  return response.text;
};
