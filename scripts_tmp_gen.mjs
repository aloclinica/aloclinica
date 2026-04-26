import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

const doc = new jsPDF();
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();

// Header azul
doc.setFillColor(30, 64, 175);
doc.rect(0, 0, pageWidth, 28, "F");

// Logo
try {
  const logoPath = path.resolve("/dev-server/src/assets/logo.png");
  const logoB64 = fs.readFileSync(logoPath).toString("base64");
  doc.addImage(`data:image/png;base64,${logoB64}`, "PNG", pageWidth - 45, 6, 30, 16);
} catch (e) { console.log("logo err", e.message); }

// Título header
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.text("RECEITUÁRIO MÉDICO", 15, 14);
doc.setFontSize(9);
doc.setFont("helvetica", "normal");
doc.text("AloClínica - Telemedicina", 15, 21);

// Identificação plataforma
doc.setTextColor(0, 0, 0);
doc.setFontSize(8);
doc.text("AloClínica Telemedicina LTDA  •  CNPJ: 00.000.000/0001-00  •  www.aloclinica.com.br", 15, 34);

// Médico
let y = 44;
doc.setDrawColor(200, 200, 200);
doc.line(15, y, pageWidth - 15, y);
y += 6;
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.text("Dr. Carlos Eduardo Silva", 15, y);
y += 5;
doc.setFont("helvetica", "normal");
doc.setFontSize(9);
doc.text("CRM: 123456/SP  •  CPF: 123.456.789-00", 15, y);
y += 4;
doc.text("Especialidade: Clínico Geral", 15, y);

// Paciente
y += 10;
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.text("PACIENTE", 15, y);
y += 5;
doc.setFont("helvetica", "normal");
doc.setFontSize(9);
doc.text("Nome: Maria Aparecida Souza", 15, y);
y += 4;
doc.text("CPF: 987.654.321-00  •  Data de Nasc.: 12/03/1985", 15, y);
y += 4;
doc.text(`Data da emissão: ${new Date().toLocaleDateString("pt-BR")}`, 15, y);

// Diagnóstico
y += 10;
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.text("DIAGNÓSTICO (CID-10: J20.9)", 15, y);
y += 5;
doc.setFont("helvetica", "normal");
doc.setFontSize(9);
doc.text("Bronquite aguda não especificada", 15, y);

// Prescrição
y += 10;
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.text("PRESCRIÇÃO", 15, y);
y += 2;
doc.setDrawColor(30, 64, 175);
doc.setLineWidth(0.5);
doc.line(15, y, pageWidth - 15, y);
y += 6;

const meds = [
  { name: "Amoxicilina 500mg", dosage: "1 comprimido", frequency: "8 em 8 horas", duration: "7 dias", inst: "Tomar após as refeições com bastante água." },
  { name: "Paracetamol 750mg", dosage: "1 comprimido", frequency: "Se dor ou febre, até 6/6h", duration: "Conforme necessidade", inst: "Não exceder 4 comprimidos em 24 horas." },
  { name: "Xarope expectorante (Ambroxol)", dosage: "10 ml", frequency: "3 vezes ao dia", duration: "5 dias", inst: "Agitar antes de usar." },
];

doc.setFontSize(10);
meds.forEach((m, i) => {
  doc.setFont("helvetica", "bold");
  doc.text(`${i + 1}. ${m.name}`, 15, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Posologia: ${m.dosage} - ${m.frequency}`, 20, y);
  y += 4;
  doc.text(`Duração: ${m.duration}`, 20, y);
  y += 4;
  const wrapped = doc.splitTextToSize(`Orientações: ${m.inst}`, pageWidth - 40);
  doc.text(wrapped, 20, y);
  y += wrapped.length * 4 + 4;
  doc.setFontSize(10);
});

// Observações
y += 4;
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.text("OBSERVAÇÕES", 15, y);
y += 5;
doc.setFont("helvetica", "normal");
doc.setFontSize(9);
const obs = doc.splitTextToSize("Repouso por 48 horas. Hidratação abundante. Retornar em caso de piora dos sintomas, falta de ar ou febre persistente acima de 38,5°C.", pageWidth - 30);
doc.text(obs, 15, y);
y += obs.length * 4;

// Assinatura digital - bloco
y = pageHeight - 50;
doc.setDrawColor(30, 64, 175);
doc.setFillColor(240, 247, 255);
doc.rect(15, y, pageWidth - 30, 30, "FD");
doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.setTextColor(30, 64, 175);
doc.text("✓ DOCUMENTO ASSINADO DIGITALMENTE - ICP-BRASIL (PAdES)", 18, y + 6);
doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.setTextColor(0, 0, 0);
doc.text("Assinante: Dr. Carlos Eduardo Silva  •  CPF: 123.456.789-00  •  Tipo: e-CPF A1", 18, y + 12);
doc.text(`Carimbo de tempo: ${new Date().toLocaleString("pt-BR")}`, 18, y + 17);
const code = "RX-AB12CD34";
doc.text(`Código de verificação: ${code}`, 18, y + 22);
doc.text(`Validar em: aloclinica.com.br/validar/${code}`, 18, y + 27);

// Rodapé
doc.setFontSize(7);
doc.setTextColor(120, 120, 120);
doc.text("Conforme Resolução CFM nº 2.299/2021 e MP 2.200-2/2001 (ICP-Brasil)", pageWidth / 2, pageHeight - 8, { align: "center" });

doc.save("/mnt/documents/receita_exemplo.pdf");
console.log("OK");
