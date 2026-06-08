import jsPDF from "jspdf";

const fmt = (v: number | null | undefined) => (v != null ? String(v) : "—");

export function generateOphthalmologyPrescriptionPDF(rx: any, doctorName: string, doctorCRM: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Receita Oftalmológica", w / 2, y, { align: "center" });
  y += 10;

  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(0.8);
  doc.line(15, y, w - 15, y);
  y += 10;

  // Patient
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Paciente:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(rx.patient_name, 42, y);
  y += 7;

  if (rx.patient_cpf) {
    doc.setFont("helvetica", "bold");
    doc.text("CPF:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(rx.patient_cpf, 28, y);
    y += 7;
  }

  y += 5;

  // Table header
  const cols = ["", "Esférico", "Cilíndrico", "Eixo", "Adição", "Prisma", "Base"];
  const colX = [15, 40, 65, 90, 110, 135, 155];

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  cols.forEach((c, i) => doc.text(c, colX[i], y));
  y += 2;
  doc.line(15, y, w - 15, y);
  y += 6;

  // OD
  doc.setFont("helvetica", "normal");
  const odRow = ["OD", fmt(rx.od_spherical), fmt(rx.od_cylindrical), fmt(rx.od_axis), fmt(rx.od_addition), fmt(rx.od_prism), rx.od_prism_base ?? "—"];
  odRow.forEach((v, i) => doc.text(v, colX[i], y));
  y += 7;

  // OE
  const oeRow = ["OE", fmt(rx.oe_spherical), fmt(rx.oe_cylindrical), fmt(rx.oe_axis), fmt(rx.oe_addition), fmt(rx.oe_prism), rx.oe_prism_base ?? "—"];
  oeRow.forEach((v, i) => doc.text(v, colX[i], y));
  y += 10;

  doc.line(15, y, w - 15, y);
  y += 8;

  // Lens specs
  if (rx.interpupillary_distance || rx.lens_type || rx.lens_material || rx.lens_treatment) {
    doc.setFont("helvetica", "bold");
    doc.text("Especificações da Lente", 15, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    if (rx.interpupillary_distance) { doc.text(`DNP: ${rx.interpupillary_distance} mm`, 15, y); y += 6; }
    if (rx.lens_type) { doc.text(`Tipo: ${rx.lens_type}`, 15, y); y += 6; }
    if (rx.lens_material) { doc.text(`Material: ${rx.lens_material}`, 15, y); y += 6; }
    if (rx.lens_treatment) { doc.text(`Tratamento: ${rx.lens_treatment}`, 15, y); y += 6; }
    y += 4;
  }

  // Observations
  if (rx.observations) {
    doc.setFont("helvetica", "bold");
    doc.text("Observações:", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(rx.observations, w - 30);
    doc.text(lines, 15, y);
    y += lines.length * 5 + 5;
  }

  // Signature
  y = Math.max(y + 15, 220);
  doc.line(w / 2 - 40, y, w / 2 + 40, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(doctorName, w / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(`CRM ${doctorCRM}`, w / 2, y, { align: "center" });
  y += 5;

  const now = new Date();
  doc.setFontSize(8);
  doc.text(
    `Emitido em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    w / 2,
    y + 5,
    { align: "center" }
  );

  doc.save(`receita-oftalmologica-${rx.patient_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
