// Importamos solo lo necesario para esta función: la librería docx.
const docx = require("docx");
const { Packer, Paragraph, TextRun, AlignmentType } = docx;

// Esta función recibe TODOS los datos (formulario + texto de la IA) y devuelve un archivo .docx.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { generatedText } = data; // Extraemos el texto que generó la primera función.

    // Función auxiliar para formatear la fecha de redacción.
    const formatDateForDoc = (dateStr) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('es-ES', options);
    };

    const doc = new docx.Document({
      styles: { paragraph: { run: { font: "Times New Roman", size: 24 } } }, // 12pt por defecto
      sections: [{
        children: [
            // --- CAMBIO CLAVE: Formato específico para el nombre del año ---
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [
                    new TextRun({
                        text: `"${data.yearName.toUpperCase()}"`,
                        bold: true,
                        size: 22, // Tamaño 11pt (11 * 2)
                        font: "Times New Roman"
                    })
                ]
            }),
            new Paragraph({ children: [ new TextRun({ text: "SOLICITO: ", bold: true }), new TextRun(data.sumilla.toUpperCase()) ], style: "paragraph", spacing: { after: 400 } }),
            new Paragraph({ text: `SEÑOR(A):`, style: "paragraph", bold: true, spacing: { after: 100 } }),
            new Paragraph({ text: data.recipientName.toUpperCase(), style: "paragraph", bold: true, spacing: { after: 50 } }),
            new Paragraph({ text: `${data.recipientTitle.toUpperCase()} DE LA ${data.teacherSchool.toUpperCase()}`, style: "paragraph", bold: true, spacing: { after: 400 } }),
            new Paragraph({ text: "Presente.-", style: "paragraph", spacing: { after: 400 } }),
            new Paragraph({ alignment: AlignmentType.JUSTIFIED, style: "paragraph", indent: { firstLine: 708 }, spacing: { after: 240 }, children: [ new TextRun("Yo, "), new TextRun({ text: `${data.teacherName.toUpperCase()}`, bold: true }), new TextRun(", identificado(a) con DNI N° "), new TextRun({ text: data.teacherDNI, bold: true }), new TextRun(`, docente de esta prestigiosa institución educativa; ante usted con el debido respeto me presento y expongo:`)] }),
            // Usamos el texto generado por la IA que recibimos.
            new Paragraph({ text: generatedText, alignment: AlignmentType.JUSTIFIED, style: "paragraph", indent: { firstLine: 708 }, spacing: { after: 400 } }),
            new Paragraph({ text: "POR LO EXPUESTO:", style: "paragraph", spacing: { after: 240 } }),
            new Paragraph({ text: `Ruego a usted, Señor(a) ${data.recipientTitle}, acceder a mi petición por ser de justicia.`, alignment: AlignmentType.JUSTIFIED, style: "paragraph", indent: { firstLine: 708 }, spacing: { after: 600 } }),
            new Paragraph({ text: `${data.requestCity}, ${formatDateForDoc(new Date())}`, alignment: AlignmentType.RIGHT, style: "paragraph", spacing: { after: 800 } }),
            new Paragraph({ text: `\n\n...........................................................`, alignment: AlignmentType.CENTER, style: "paragraph" }),
            new Paragraph({ text: data.teacherName.toUpperCase(), bold: true, alignment: AlignmentType.CENTER, style: "paragraph", spacing: { after: 50 } }),
            new Paragraph({ text: `DNI: ${data.teacherDNI}`, bold: true, alignment: AlignmentType.CENTER, style: "paragraph" }),
        ],
      }],
    });

    // Convertimos el documento a un buffer para enviarlo.
    const buffer = await Packer.toBuffer(doc);

    // Retornamos el archivo .docx para que se descargue en el navegador.
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="solicitud_${data.docType}.docx"`,
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("Error en la función generate-word:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Ocurrió un error al crear el archivo Word." }) };
  }
};
