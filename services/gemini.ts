
import { GoogleGenAI, Type } from "@google/genai";
import { User, PlayerEntry, TeamDraft } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const balanceTeams = async (players: PlayerEntry[], userDetails: Record<string, User>): Promise<TeamDraft> => {
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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

  return JSON.parse(response.text);
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
    model: "gemini-3-flash-preview",
    contents: `Crie uma convocação animada e engraçada para uma pelada de futebol chamada "${matchTitle}" que vai acontecer em "${location}". Use gírias de futebol brasileiro.`,
  });
  return response.text;
};
