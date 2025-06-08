// Importamos solo lo necesario para esta función.
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Esta función recibe los datos del formulario y devuelve solo el texto generado por la IA.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API Key de Gemini no encontrada." }) };
  }

  try {
    const data = JSON.parse(event.body);

    // --- LÓGICA DE CONTEXTO TEMPORAL ---
    // 1. Obtenemos la fecha de hoy y la fecha del evento, normalizadas para una comparación justa.
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignoramos la hora para comparar solo el día.
    
    const eventDate = new Date(data.eventDate);
    eventDate.setHours(0, 0, 0, 0); // Normalizamos también la fecha del evento.

    // 2. Determinamos el contexto temporal.
    let timeContext;
    if (eventDate < today) {
      timeContext = "pasado";
    } else if (eventDate > today) {
      timeContext = "futuro";
    } else {
      timeContext = "presente (hoy)";
    }
    // --- FIN DE LA LÓGICA TEMPORAL ---

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // --- PROMPT PROFESIONAL CON CONCIENCIA TEMPORAL ---
    // Ahora le pasamos el contexto del tiempo a la IA.
    const prompt = `
      Actúa como un asistente administrativo experto en redactar documentos para docentes en Perú. Tu tarea es generar el párrafo principal (el cuerpo) de una solicitud o justificación. El tono debe ser formal y respetuoso.

      La estructura del párrafo debe ser la siguiente:
      1. Inicia con la palabra "Que,".
      2. Expón claramente el motivo principal del documento, usando los datos proporcionados.
      3. Menciona la fecha clave del evento.
      4. Concluye con la acción que se solicita o se justifica.

      DATOS PARA LA REDACCIÓN:
      - Motivo Principal: ${data.sumilla}
      - Fecha Clave: ${data.formattedEventDate}
      ${data.eventTime ? `- Hora Clave: ${data.eventTime}` : ''}
      - CONTEXTO TEMPORAL: El evento es en el ${timeContext}. Por favor, ajusta los verbos y la redacción a este contexto. Por ejemplo, si es en el pasado, usa "el día de ayer solicité" o "incurrí en una falta"; si es en el futuro, usa "solicito permiso para el día de mañana" o "me ausentaré".

      Basado en estos datos, genera ÚNICAMENTE el párrafo del cuerpo del texto. No incluyas "Yo, [nombre]...", ni el saludo, ni la despedida.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Devolvemos el texto generado en un objeto JSON.
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatedText: generatedText.trim() }),
    };

  } catch (error) {
    console.error("Error en la función generate-text:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Ocurrió un error al contactar la IA." }) };
  }
};
