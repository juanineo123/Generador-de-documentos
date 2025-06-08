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

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // --- CORRECCIÓN FINAL Y DEFINITIVA ---
    // Usamos el modelo 'gemini-1.5-flash-latest'. Es el más moderno, rápido y compatible 
    // para este tipo de tareas, lo que soluciona el error '404 Not Found'.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Un prompt muy específico para que la IA genere solo el cuerpo del texto.
    const prompt = `
      Eres un asistente experto en redactar el párrafo central de documentos administrativos para docentes en Perú.
      Basado en los siguientes datos, redacta únicamente el cuerpo del texto para el documento.
      Sé formal, conciso y utiliza el lenguaje apropiado para el contexto peruano.
      No incluyas el saludo inicial, el encabezado, la despedida o la firma. Solo el párrafo central.

      DATOS:
      - Tipo de Documento: ${data.docType}
      - Fecha del Evento: ${data.formattedEventDate}
      ${data.eventTime ? `- Hora del Evento: ${data.eventTime}` : ''}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Devolvemos el texto generado en un objeto JSON.
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatedText: generatedText }),
    };

  } catch (error) {
    console.error("Error en la función generate-text:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Ocurrió un error al contactar la IA." }) };
  }
};
