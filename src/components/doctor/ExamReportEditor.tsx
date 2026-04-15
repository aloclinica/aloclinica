import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, FileSignature, Download, Save, Upload,
  Mic, MicOff, Sparkles, Wand2, BookText, ChevronDown, Lightbulb,
  ZoomIn, ZoomOut, RotateCw, Contrast, Maximize2, Sun, Move, Ruler,
  ArrowLeft, ChevronLeft, ChevronRight, Grid3X3, Monitor, Eye,
  Crosshair, RotateCcw, FlipHorizontal, FlipVertical, Pencil,
  Type, Play, MoreHorizontal, FileText, Clock, AlertTriangle,
  Info, Clipboard, ListChecks, GitBranch, ImageIcon
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gerarHashDocumento, gerarCodigoVerificacao } from "@/lib/signature";
import { REPORT_MACROS, findMacro, applyMacro } from "@/lib/report-macros";
const TipTapEditor = lazy(() => import("@/components/telelaudo/TipTapEditor"));
import jsPDF from "jspdf";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import type { ExamRequest, ExamReport, ReportTemplate } from "@/types/domain";
import { LaudoValidator } from "@/components/laudista/LaudoValidator";

// ==================== WL PRESETS ====================
const WL_PRESETS = [
  { label: "Default", ww: 0, wl: 0, icon: "🔄" },
  { label: "Osso", ww: 2500, wl: 480, icon: "🦴" },
  { label: "Pulmão", ww: 1500, wl: -600, icon: "🫁" },
  { label: "Abdômen", ww: 400, wl: 50, icon: "🫃" },
  { label: "Cérebro", ww: 80, wl: 40, icon: "🧠" },
  { label: "Mediastino", ww: 350, wl: 50, icon: "❤️" },
  { label: "Fígado", ww: 150, wl: 30, icon: "🫀" },
  { label: "Tecido Mole", ww: 400, wl: 40, icon: "💪" },
];

type Measurement = {
  id: string;
  type: "length" | "angle" | "ellipse" | "rectangle" | "bidirectional";
  points: { x: number; y: number }[];
  value?: string;
};

type Annotation = {
  id: string;
  x: number;
  y: number;
  text: string;
};

// ==================== PACS VIEWER ====================
const PacsViewer = ({
  fileUrls,
  examRequest,
  onFilesUploaded,
}: {
  fileUrls: string[];
  examRequest: ExamRequest | null;
  onFilesUploaded?: (newUrls: string[]) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<"pan" | "zoom" | "wl" | "measure" | "angle" | "ellipse" | "rectangle" | "bidirectional" | "annotate" | "magnify" | "stackScroll" | "windowROI">("pan");
  const [showMeasurementsPanel, setShowMeasurementsPanel] = useState(false);
  const [dicomInfo, setDicomInfo] = useState<Record<string, string>>({});
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showOverlays, setShowOverlays] = useState(true);
  const [magnifyPos, setMagnifyPos] = useState<{ x: number; y: number } | null>(null);
  const magnifyCanvasRef = useRef<HTMLCanvasElement>(null);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [invert, setInvert] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; hu?: number } | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeMeasurement, setActiveMeasurement] = useState<Measurement | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [activePreset, setActivePreset] = useState("Default");
  const [cinePlay, setCinePlay] = useState(false);
  const [cineSpeed, setCineSpeed] = useState(200);
  const cineRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pixelDataRef = useRef<{ values: Float32Array; rows: number; cols: number } | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const [dualView, setDualView] = useState(false);
  const [dualIndex, setDualIndex] = useState(1);
  const [imageNaturalSize, setImageNaturalSize] = useState({ w: 0, h: 0 });

  // Annotation dialog states
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false);
  const [annotationInput, setAnnotationInput] = useState("");
  const [pendingAnnotationPos, setPendingAnnotationPos] = useState<{ x: number; y: number } | null>(null);

  const activeUrl = fileUrls[activeIndex] || null;

  // CINE playback
  useEffect(() => {
    if (cinePlay && fileUrls.length > 1) {
      cineRef.current = setInterval(() => {
        setActiveIndex(i => (i + 1) % fileUrls.length);
      }, cineSpeed);
    } else {
      if (cineRef.current) clearInterval(cineRef.current);
    }
    return () => { if (cineRef.current) clearInterval(cineRef.current); };
  }, [cinePlay, fileUrls.length, cineSpeed]);

  useEffect(() => {
    if (!activeUrl) return;
    loadImage(activeUrl);
  }, [activeUrl]);

  // Scroll wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (tool === "stackScroll" && fileUrls.length > 1) {
      if (e.deltaY > 0) setActiveIndex(i => Math.min(fileUrls.length - 1, i + 1));
      else setActiveIndex(i => Math.max(0, i - 1));
    } else {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.max(0.1, Math.min(10, z + delta)));
    }
  }, [tool, fileUrls.length]);

  const loadImage = async (url: string) => {
    setLoading(true);
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const isDicom =
        bytes.length > 132 &&
        bytes[128] === 0x44 && bytes[129] === 0x49 &&
        bytes[130] === 0x43 && bytes[131] === 0x4d;

      if (isDicom) {
        await parseDicom(bytes);
      } else {
        const blob = new Blob([arrayBuffer]);
        const imgUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.drawImage(img, 0, 0);
          setDicomInfo({ Formato: "Imagem" });
          setImageNaturalSize({ w: img.width, h: img.height });
          pixelDataRef.current = null;
          setLoading(false);
        };
        img.onerror = () => { setLoading(false); };
        img.src = imgUrl;
      }
    } catch {
      setLoading(false);
    }
  };

  const parseDicom = async (bytes: Uint8Array) => {
    try {
      const info: Record<string, string> = {};
      let offset = 132;
      let rows = 0, cols = 0, bitsAllocated = 16, bitsStored = 12;
      let pixelDataOffset = -1, samplesPerPixel = 1;
      let photometric = "MONOCHROME2", wc = 0, ww = 0;
      let pixelRep = 0, intercept = 0, slope = 1;

      const readUint16 = (o: number) => bytes[o] | (bytes[o + 1] << 8);
      const readUint32 = (o: number) => bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24);
      const readString = (o: number, len: number) => {
        let str = "";
        for (let i = 0; i < len; i++) {
          const ch = bytes[o + i];
          if (ch === 0) break;
          str += String.fromCharCode(ch);
        }
        return str.trim();
      };

      while (offset < bytes.length - 8) {
        const group = readUint16(offset);
        const element = readUint16(offset + 2);
        const vr = readString(offset + 4, 2);
        let dataOffset: number, dataLength: number;
        const longVRs = ["OB", "OD", "OF", "OL", "OW", "SQ", "UC", "UN", "UR", "UT"];
        if (longVRs.includes(vr)) { dataLength = readUint32(offset + 8); dataOffset = offset + 12; }
        else if (vr.match(/^[A-Z]{2}$/)) { dataLength = readUint16(offset + 6); dataOffset = offset + 8; }
        else { dataLength = readUint32(offset + 4); dataOffset = offset + 8; }

        if (dataLength === 0xFFFFFFFF || dataLength < 0) {
          if (group === 0x7FE0 && element === 0x0010) { pixelDataOffset = dataOffset; break; }
          offset = dataOffset; continue;
        }

        const tag = `${group.toString(16).padStart(4, "0")}${element.toString(16).padStart(4, "0")}`;
        switch (tag) {
          case "00100010": info["Paciente"] = readString(dataOffset, dataLength); break;
          case "00100020": info["ID"] = readString(dataOffset, dataLength); break;
          case "00100030": info["Nascimento"] = readString(dataOffset, dataLength); break;
          case "00100040": info["Sexo"] = readString(dataOffset, dataLength); break;
          case "00080060": info["Modalidade"] = readString(dataOffset, dataLength); break;
          case "00081030": info["Estudo"] = readString(dataOffset, dataLength); break;
          case "0008103e": info["Série"] = readString(dataOffset, dataLength); break;
          case "00080020": info["Data Estudo"] = readString(dataOffset, dataLength); break;
          case "00080030": info["Hora Estudo"] = readString(dataOffset, dataLength); break;
          case "00080080": info["Instituição"] = readString(dataOffset, dataLength); break;
          case "00080090": info["Médico Ref."] = readString(dataOffset, dataLength); break;
          case "00181030": info["Protocolo"] = readString(dataOffset, dataLength); break;
          case "00200013": info["Instância"] = readString(dataOffset, dataLength); break;
          case "00280010": rows = readUint16(dataOffset); break;
          case "00280011": cols = readUint16(dataOffset); break;
          case "00280100": bitsAllocated = readUint16(dataOffset); break;
          case "00280101": bitsStored = readUint16(dataOffset); break;
          case "00280002": samplesPerPixel = readUint16(dataOffset); break;
          case "00280004": photometric = readString(dataOffset, dataLength); break;
          case "00281050": wc = parseFloat(readString(dataOffset, dataLength)) || 0; break;
          case "00281051": ww = parseFloat(readString(dataOffset, dataLength)) || 0; break;
          case "00280103": pixelRep = readUint16(dataOffset); break;
          case "00281052": intercept = parseFloat(readString(dataOffset, dataLength)) || 0; break;
          case "00281053": slope = parseFloat(readString(dataOffset, dataLength)) || 1; break;
          case "00280030": info["Pixel Spacing"] = readString(dataOffset, dataLength); break;
          case "00180050": info["Espessura"] = readString(dataOffset, dataLength) + " mm"; break;
        }
        if (group === 0x7FE0 && element === 0x0010) { pixelDataOffset = dataOffset; break; }
        offset = dataOffset + dataLength;
        if (offset % 2 !== 0) offset++;
      }

      info["Formato"] = "DICOM";
      info["Dimensões"] = `${cols}×${rows}`;
      setImageNaturalSize({ w: cols, h: rows });
      info["Bits"] = `${bitsStored}/${bitsAllocated}`;
      if (wc) info["WC"] = String(Math.round(wc));
      if (ww) info["WW"] = String(Math.round(ww));
      setDicomInfo(info);

      if (pixelDataOffset > 0 && rows > 0 && cols > 0) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = cols;
        canvas.height = rows;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const imgData = ctx.createImageData(cols, rows);
        const totalPixels = rows * cols;

        if (samplesPerPixel === 3) {
          for (let i = 0; i < totalPixels; i++) {
            imgData.data[i * 4] = bytes[pixelDataOffset + i * 3];
            imgData.data[i * 4 + 1] = bytes[pixelDataOffset + i * 3 + 1];
            imgData.data[i * 4 + 2] = bytes[pixelDataOffset + i * 3 + 2];
            imgData.data[i * 4 + 3] = 255;
          }
          pixelDataRef.current = null;
        } else {
          const pixelValues = new Float32Array(totalPixels);
          let min = Infinity, max = -Infinity;
          for (let i = 0; i < totalPixels; i++) {
            let rawValue: number;
            if (bitsAllocated === 16) {
              const idx = pixelDataOffset + i * 2;
              rawValue = bytes[idx] | (bytes[idx + 1] << 8);
              if (pixelRep === 1 && rawValue > (1 << (bitsStored - 1))) rawValue -= (1 << bitsStored);
            } else { rawValue = bytes[pixelDataOffset + i]; }
            const hu = rawValue * slope + intercept;
            pixelValues[i] = hu;
            if (hu < min) min = hu;
            if (hu > max) max = hu;
          }
          pixelDataRef.current = { values: pixelValues, rows, cols };

          const center = wc || (min + max) / 2;
          const width = ww || (max - min) || 1;
          const lower = center - width / 2;
          const upper = center + width / 2;
          const isMono1 = photometric.includes("MONOCHROME1");
          for (let i = 0; i < totalPixels; i++) {
            let val = ((pixelValues[i] - lower) / (upper - lower)) * 255;
            val = Math.max(0, Math.min(255, val));
            if (isMono1) val = 255 - val;
            imgData.data[i * 4] = val;
            imgData.data[i * 4 + 1] = val;
            imgData.data[i * 4 + 2] = val;
            imgData.data[i * 4 + 3] = 255;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    } catch { /* parse error */ }
    setLoading(false);
  };

  const applyPreset = (preset: typeof WL_PRESETS[0]) => {
    setActivePreset(preset.label);
    if (preset.label === "Default") {
      setBrightness(100); setContrast(100);
    } else {
      const normBrightness = Math.max(20, Math.min(300, 100 + (preset.wl / 10)));
      const normContrast = Math.max(20, Math.min(300, 50 + (preset.ww / 20)));
      setBrightness(normBrightness);
      setContrast(normContrast);
    }
    setShowPresets(false);
    toast.success(`Preset: ${preset.icon} ${preset.label}`);
  };

  const resetView = () => {
    setZoom(1); setRotation(0); setBrightness(100); setContrast(100);
    setFlipH(false); setFlipV(false); setInvert(false);
    setActivePreset("Default"); setPanOffset({ x: 0, y: 0 });
    setMeasurements([]); setAnnotations([]);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (tool === "pan" || tool === "stackScroll") {
      isPanningRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    } else if (tool === "measure" || tool === "angle" || tool === "bidirectional") {
      const newM: Measurement = {
        id: crypto.randomUUID(),
        type: tool === "measure" ? "length" : tool === "angle" ? "angle" : "bidirectional",
        points: [{ x, y }],
      };
      setActiveMeasurement(newM);
    } else if (tool === "ellipse" || tool === "rectangle" || tool === "windowROI") {
      const newM: Measurement = {
        id: crypto.randomUUID(),
        type: tool === "ellipse" ? "ellipse" : "rectangle",
        points: [{ x, y }],
      };
      setActiveMeasurement(newM);
    } else if (tool === "annotate") {
      setPendingAnnotationPos({ x, y });
      setAnnotationInput("");
      setAnnotationDialogOpen(true);
    }
  };

  const handleConfirmAnnotation = () => {
    if (annotationInput.trim() && pendingAnnotationPos) {
      setAnnotations(prev => [...prev, {
        id: crypto.randomUUID(),
        x: pendingAnnotationPos.x,
        y: pendingAnnotationPos.y,
        text: annotationInput.trim(),
      }]);
    }
    setAnnotationDialogOpen(false);
    setAnnotationInput("");
    setPendingAnnotationPos(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);

    if (pixelDataRef.current) {
      const { values, rows, cols } = pixelDataRef.current;
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        setCursorPos({ x, y, hu: Math.round(values[y * cols + x]) });
      } else {
        setCursorPos({ x, y });
      }
    } else {
      setCursorPos({ x, y });
    }

    if (isPanningRef.current && tool === "pan") {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    } else if (isPanningRef.current && tool === "stackScroll" && fileUrls.length > 1) {
      const dy = e.clientY - lastMouseRef.current.y;
      if (Math.abs(dy) > 15) {
        if (dy > 0) setActiveIndex(i => Math.min(fileUrls.length - 1, i + 1));
        else setActiveIndex(i => Math.max(0, i - 1));
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    } else if (isPanningRef.current && tool === "wl") {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      setBrightness(b => Math.max(0, Math.min(300, b - dy)));
      setContrast(c => Math.max(0, Math.min(300, c + dx)));
      setActivePreset("Custom");
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }

    if (activeMeasurement) {
      const updatedPoints = [...activeMeasurement.points];
      if (updatedPoints.length === 1) {
        updatedPoints.push({ x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom });
      } else {
        updatedPoints[updatedPoints.length - 1] = { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
      }
      setActiveMeasurement({ ...activeMeasurement, points: updatedPoints });
    }
  };

  const handleCanvasMouseUp = () => {
    isPanningRef.current = false;
    if (activeMeasurement && activeMeasurement.points.length >= 2) {
      const p = activeMeasurement.points;
      let value = "";
      const spacing = dicomInfo["Pixel Spacing"];
      const getScale = () => {
        if (!spacing) return null;
        const [sy, sx] = spacing.split("\\").map(Number);
        return { sx, sy, avg: (sx + sy) / 2 };
      };
      const scale = getScale();

      if (activeMeasurement.type === "length") {
        const dx = p[1].x - p[0].x;
        const dy = p[1].y - p[0].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        value = scale ? `${(dist * scale.avg).toFixed(1)} mm` : `${dist.toFixed(1)} px`;
      } else if (activeMeasurement.type === "angle" && p.length >= 2) {
        value = `${Math.round(Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x) * 180 / Math.PI)}°`;
      } else if (activeMeasurement.type === "ellipse") {
        const rx = Math.abs(p[1].x - p[0].x);
        const ry = Math.abs(p[1].y - p[0].y);
        const area = Math.PI * rx * ry;
        value = scale ? `Área: ${(area * scale.sx * scale.sy).toFixed(0)} mm²` : `Área: ${area.toFixed(0)} px²`;
        if (pixelDataRef.current) {
          const { values, rows, cols } = pixelDataRef.current;
          const cx = (p[0].x + p[1].x) / 2;
          const cy = (p[0].y + p[1].y) / 2;
          let sum = 0, count = 0;
          const x0 = Math.max(0, Math.floor(cx - rx));
          const x1 = Math.min(cols - 1, Math.ceil(cx + rx));
          const y0 = Math.max(0, Math.floor(cy - ry));
          const y1 = Math.min(rows - 1, Math.ceil(cy + ry));
          for (let py = y0; py <= y1; py++) {
            for (let px = x0; px <= x1; px++) {
              const dx2 = ((px - cx) / rx) ** 2;
              const dy2 = ((py - cy) / ry) ** 2;
              if (dx2 + dy2 <= 1) { sum += values[py * cols + px]; count++; }
            }
          }
          if (count > 0) value += ` | HU médio: ${Math.round(sum / count)}`;
        }
      } else if (activeMeasurement.type === "rectangle") {
        const w = Math.abs(p[1].x - p[0].x);
        const h = Math.abs(p[1].y - p[0].y);
        const area = w * h;
        value = scale
          ? `${(w * scale.sx).toFixed(1)}×${(h * scale.sy).toFixed(1)} mm — Área: ${(area * scale.sx * scale.sy).toFixed(0)} mm²`
          : `${w.toFixed(0)}×${h.toFixed(0)} px — Área: ${area.toFixed(0)} px²`;
        if (pixelDataRef.current) {
          const { values, rows, cols } = pixelDataRef.current;
          const x0 = Math.max(0, Math.floor(Math.min(p[0].x, p[1].x)));
          const x1 = Math.min(cols - 1, Math.ceil(Math.max(p[0].x, p[1].x)));
          const y0 = Math.max(0, Math.floor(Math.min(p[0].y, p[1].y)));
          const y1 = Math.min(rows - 1, Math.ceil(Math.max(p[0].y, p[1].y)));
          let sum = 0, count = 0;
          for (let py = y0; py <= y1; py++) {
            for (let px = x0; px <= x1; px++) { sum += values[py * cols + px]; count++; }
          }
          if (count > 0) value += ` | HU médio: ${Math.round(sum / count)}`;
        }
      } else if (activeMeasurement.type === "bidirectional") {
        const dx = p[1].x - p[0].x;
        const dy = p[1].y - p[0].y;
        const major = Math.sqrt(dx * dx + dy * dy);
        value = scale ? `Maior: ${(major * scale.avg).toFixed(1)} mm` : `Maior: ${major.toFixed(1)} px`;
      }
      setMeasurements(prev => [...prev, { ...activeMeasurement, value }]);
      setActiveMeasurement(null);
    }
  };

  // Draw measurement overlays
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    const main = canvasRef.current;
    if (!overlay || !main) return;
    overlay.width = main.width || 512;
    overlay.height = main.height || 512;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const allMeasurements = [...measurements, ...(activeMeasurement ? [activeMeasurement] : [])];

    allMeasurements.forEach(m => {
      if (m.points.length < 2) return;
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);

      if (m.type === "length") {
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        ctx.lineTo(m.points[1].x, m.points[1].y);
        ctx.stroke();
        [m.points[0], m.points[1]].forEach(p => {
          ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = "#00ff00"; ctx.fill();
        });
      } else if (m.type === "ellipse") {
        const cx = (m.points[0].x + m.points[1].x) / 2;
        const cy = (m.points[0].y + m.points[1].y) / 2;
        const rx = Math.abs(m.points[1].x - m.points[0].x) / 2;
        const ry = Math.abs(m.points[1].y - m.points[0].y) / 2;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (m.type === "rectangle") {
        const x0 = Math.min(m.points[0].x, m.points[1].x);
        const y0 = Math.min(m.points[0].y, m.points[1].y);
        const w = Math.abs(m.points[1].x - m.points[0].x);
        const h = Math.abs(m.points[1].y - m.points[0].y);
        ctx.strokeRect(x0, y0, w, h);
      } else if (m.type === "bidirectional") {
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        ctx.lineTo(m.points[1].x, m.points[1].y);
        ctx.stroke();
        const cx = (m.points[0].x + m.points[1].x) / 2;
        const cy = (m.points[0].y + m.points[1].y) / 2;
        const dx = m.points[1].x - m.points[0].x;
        const dy = m.points[1].y - m.points[0].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpLen = len * 0.3;
        const nx = -dy / len * perpLen;
        const ny = dx / len * perpLen;
        ctx.beginPath(); ctx.moveTo(cx + nx, cy + ny); ctx.lineTo(cx - nx, cy - ny); ctx.stroke();
        [m.points[0], m.points[1], { x: cx + nx, y: cy + ny }, { x: cx - nx, y: cy - ny }].forEach(p => {
          ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = "#00ff00"; ctx.fill();
        });
      } else if (m.type === "angle") {
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        ctx.lineTo(m.points[1].x, m.points[1].y);
        ctx.stroke();
      }

      if (m.value) {
        const labelX = (m.points[0].x + m.points[1].x) / 2;
        const labelY = (m.points[0].y + m.points[1].y) / 2 - 8;
        ctx.font = "bold 12px monospace";
        ctx.fillStyle = "#00ff00";
        ctx.fillText(m.value, labelX, labelY);
      }
    });

    annotations.forEach(a => {
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "#ffff00";
      ctx.fillText(a.text, a.x, a.y);
      ctx.beginPath(); ctx.arc(a.x - 4, a.y - 4, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffff00"; ctx.fill();
    });
  }, [measurements, activeMeasurement, annotations]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `exam-${activeIndex + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Imagem baixada!");
  };

  const toolButtons: { id: typeof tool; icon: typeof Move; label: string }[] = [
    { id: "stackScroll", icon: ChevronDown, label: "Stack Scroll" },
    { id: "pan", icon: Move, label: "Arrastar (Pan)" },
    { id: "zoom", icon: ZoomIn, label: "Zoom" },
    { id: "wl", icon: Sun, label: "Janela/Nível (W/L)" },
    { id: "measure", icon: Ruler, label: "Medição Linear" },
    { id: "bidirectional", icon: Pencil, label: "Bidirecional" },
    { id: "angle", icon: Crosshair, label: "Ângulo" },
    { id: "ellipse", icon: Eye, label: "ROI Elíptica" },
    { id: "rectangle", icon: Grid3X3, label: "Retângulo ROI" },
    { id: "windowROI", icon: Monitor, label: "Janela ROI" },
    { id: "magnify", icon: ZoomIn, label: "Lupa (2x)" },
    { id: "annotate", icon: Type, label: "Anotação" },
  ];

  // Magnify lens effect
  const handleMagnify = useCallback((e: React.MouseEvent) => {
    if (tool !== "magnify") { setMagnifyPos(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMagnifyPos({ x, y });

    const mag = magnifyCanvasRef.current;
    const src = canvasRef.current;
    if (!mag || !src) return;
    const magCtx = mag.getContext("2d");
    if (!magCtx) return;
    const size = 160;
    mag.width = size;
    mag.height = size;
    const scale = 2.5;
    const sx = (x / zoom) - (size / scale / 2);
    const sy = (y / zoom) - (size / scale / 2);
    magCtx.clearRect(0, 0, size, size);
    magCtx.save();
    magCtx.beginPath();
    magCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    magCtx.clip();
    magCtx.drawImage(src, sx, sy, size / scale, size / scale, 0, 0, size, size);
    magCtx.restore();
    magCtx.strokeStyle = "#f59e0b";
    magCtx.lineWidth = 2;
    magCtx.beginPath();
    magCtx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    magCtx.stroke();
  }, [tool, zoom]);

  return (
    <div className="flex flex-col h-full bg-black text-white/80">
      {/* PACS Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-[#1a2332] border-b border-white/10 text-[11px] flex-wrap">
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-0.5 mr-1">
            <Tooltip><TooltipTrigger asChild>
              <Button size="icon" aria-label="Anterior" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setActiveIndex(i => Math.max(0, i - 1))} disabled={activeIndex === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Série anterior</TooltipContent></Tooltip>
            <span className="text-[10px] text-white/50 min-w-[36px] text-center font-mono">
              {fileUrls.length > 0 ? `${activeIndex + 1}/${fileUrls.length}` : "—"}
            </span>
            <Tooltip><TooltipTrigger asChild>
              <Button size="icon" aria-label="Próximo" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setActiveIndex(i => Math.min(fileUrls.length - 1, i + 1))} disabled={activeIndex >= fileUrls.length - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Próxima série</TooltipContent></Tooltip>
          </div>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-0.5" />

          {toolButtons.map(t => (
            <Tooltip key={t.id}><TooltipTrigger asChild>
              <Button size="icon" variant="ghost"
                className={`h-7 w-7 ${tool === t.id ? "bg-primary/30 text-primary ring-1 ring-primary/50" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                onClick={() => setTool(t.id)}>
                <t.icon className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">{t.label}</TooltipContent></Tooltip>
          ))}

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-0.5" />

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" aria-label="Ampliar" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setZoom(z => Math.min(z + 0.25, 8))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Zoom +</TooltipContent></Tooltip>
          <span className="text-[9px] text-white/40 min-w-[28px] text-center font-mono">{Math.round(zoom * 100)}%</span>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" aria-label="Reduzir" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.1))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Zoom −</TooltipContent></Tooltip>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-0.5" />

          <Popover open={showPresets} onOpenChange={setShowPresets}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-white/60 hover:text-white hover:bg-white/10 px-2">
                <Contrast className="w-3.5 h-3.5 mr-1" /> {activePreset}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1 bg-[#1a2332] border-white/20" align="start">
              {WL_PRESETS.map(p => (
                <Button key={p.label} variant="ghost" size="sm"
                  className={`w-full justify-start text-[11px] h-7 ${activePreset === p.label ? "bg-primary/20 text-primary" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                  onClick={() => applyPreset(p)}>
                  <span className="mr-2">{p.icon}</span> {p.label}
                  {p.ww > 0 && <span className="ml-auto text-[9px] text-white/30">{p.ww}/{p.wl}</span>}
                </Button>
              ))}
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-0.5">
            <Sun className="w-3 h-3 text-white/30" />
            <input type="range" min="0" max="300" value={brightness}
              onChange={e => { setBrightness(+e.target.value); setActivePreset("Custom"); }}
              className="w-12 h-1 accent-primary cursor-pointer" />
          </div>
          <div className="flex items-center gap-0.5">
            <Contrast className="w-3 h-3 text-white/30" />
            <input type="range" min="0" max="300" value={contrast}
              onChange={e => { setContrast(+e.target.value); setActivePreset("Custom"); }}
              className="w-12 h-1 accent-primary cursor-pointer" />
          </div>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-0.5" />

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" aria-label="Rotacionar" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setRotation(r => (r + 90) % 360)}>
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Rotacionar 90°</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${flipH ? "bg-primary/30 text-primary" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setFlipH(f => !f)}>
              <FlipHorizontal className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Espelhar H</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${flipV ? "bg-primary/30 text-primary" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setFlipV(f => !f)}>
              <FlipVertical className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Espelhar V</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${invert ? "bg-yellow-500/30 text-yellow-400" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setInvert(i => !i)}>
              <Contrast className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Inverter</TooltipContent></Tooltip>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-0.5" />

          {fileUrls.length > 1 && (
            <>
              <Tooltip><TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className={`h-7 w-7 ${cinePlay ? "bg-green-500/30 text-green-400 animate-pulse" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                  onClick={() => setCinePlay(p => !p)}>
                  <Play className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger><TooltipContent side="bottom">{cinePlay ? "Parar CINE" : "CINE Play"}</TooltipContent></Tooltip>
              {cinePlay && (
                <input type="range" min="50" max="1000" value={cineSpeed}
                  onChange={e => setCineSpeed(+e.target.value)}
                  className="w-16 h-1 accent-green-400 cursor-pointer" />
              )}
              <Tooltip><TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className={`h-7 w-7 ${dualView ? "bg-primary/30 text-primary" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                  onClick={() => setDualView(d => !d)}>
                  <Grid3X3 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger><TooltipContent side="bottom">Dual View</TooltipContent></Tooltip>
            </>
          )}

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" aria-label="Rotacionar" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={resetView}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Restaurar</TooltipContent></Tooltip>

          {measurements.length > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 px-2"
              onClick={() => { setMeasurements([]); setAnnotations([]); }}>
              Limpar ({measurements.length})
            </Button>
          )}

          <div className="flex-1" />

          {/* Toggle thumbnails */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${showThumbnails ? "bg-amber-500/20 text-amber-400" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setShowThumbnails(p => !p)}>
              <ImageIcon className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Thumbnails</TooltipContent></Tooltip>
          {/* Toggle overlays */}
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" aria-label="Visualizar" variant="ghost" className={`h-7 w-7 ${showOverlays ? "bg-amber-500/20 text-amber-400" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setShowOverlays(p => !p)}>
              <Eye className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Overlays DICOM</TooltipContent></Tooltip>

          <Separator orientation="vertical" className="h-5 bg-white/10 mx-0.5" />

          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" aria-label="Baixar" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={handleDownloadImage}><Download className="w-3.5 h-3.5" /></Button>
          </TooltipTrigger><TooltipContent side="bottom">Baixar</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${showMeasurementsPanel ? "bg-primary/30 text-primary" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setShowMeasurementsPanel(p => !p)}>
              <Ruler className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Medições</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={`h-7 w-7 ${showInfoPanel ? "bg-primary/30 text-primary" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setShowInfoPanel(p => !p)}>
              <FileText className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Info DICOM</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" aria-label="Tela cheia" variant="ghost" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => containerRef.current?.requestFullscreen?.()}>
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Tela Cheia</TooltipContent></Tooltip>
        </TooltipProvider>
      </div>

      {/* Canvas area with thumbnails */}
      <div className="flex flex-1 min-h-0">
        {/* Thumbnail sidebar */}
        {showThumbnails && fileUrls.length > 0 && (
          <div className="w-20 border-r border-white/10 bg-[#0a0f18] overflow-y-auto flex-shrink-0">
            <div className="p-1 text-[8px] text-white/30 uppercase tracking-wider text-center border-b border-white/5 font-semibold">
              Séries ({fileUrls.length})
            </div>
            <div className="p-1 space-y-1">
              {fileUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-full aspect-square rounded overflow-hidden border-2 transition-all relative group ${
                    activeIndex === i
                      ? "border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <img src={url} alt="Imagem do exame" className="w-full h-full object-cover" style={{ filter: "brightness(0.7)" }} loading="lazy" decoding="async" />
                  <div className={`absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold ${
                    activeIndex === i ? "text-amber-400" : "text-white/50"
                  }`}>
                    {i + 1}
                  </div>
                  {activeIndex === i && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`flex-1 flex ${dualView ? "flex-row" : ""}`}>
          <div ref={containerRef} className={`relative overflow-hidden bg-black flex-1 select-none ${
            tool === "pan" ? "cursor-grab active:cursor-grabbing" :
            tool === "measure" || tool === "angle" || tool === "bidirectional" ? "cursor-crosshair" :
            tool === "annotate" ? "cursor-text" :
            tool === "wl" ? "cursor-ns-resize" :
            tool === "zoom" ? "cursor-zoom-in" :
            tool === "magnify" ? "cursor-none" :
            "cursor-default"
          }`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={(e) => { handleCanvasMouseMove(e); handleMagnify(e); }}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={() => { handleCanvasMouseUp(); setMagnifyPos(null); }}
            onWheel={handleWheel}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            {!activeUrl && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                <Upload className="w-12 h-12 mb-2" />
                <p className="text-sm">Nenhuma imagem</p>
              </div>
            )}
            <div className="w-full h-full flex items-center justify-center" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
              <div style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? "invert(1)" : ""}`,
                transformOrigin: "center",
              }}>
                <canvas ref={canvasRef} className="max-w-none" />
                <canvas ref={overlayCanvasRef} className="absolute top-0 left-0 pointer-events-none max-w-none"
                  style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }} />
              </div>
            </div>

            {/* ═══ OsiriX-style DICOM Overlays (Amber) ═══ */}
            {showOverlays && activeUrl && (
              <>
                {/* Top-Left: Patient Info */}
                <div className="absolute top-2 left-2 pointer-events-none font-mono text-[10px] leading-tight" style={{ color: '#f59e0b', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  {dicomInfo["Paciente"] && <div className="font-bold text-[11px]">{dicomInfo["Paciente"]}</div>}
                  {dicomInfo["ID"] && <div>ID: {dicomInfo["ID"]}</div>}
                  {dicomInfo["Nascimento"] && <div>DOB: {dicomInfo["Nascimento"]}</div>}
                  {dicomInfo["Sexo"] && <div>Sex: {dicomInfo["Sexo"]}</div>}
                </div>

                {/* Top-Right: Study Info */}
                <div className="absolute top-2 right-2 pointer-events-none font-mono text-[10px] leading-tight text-right" style={{ color: '#f59e0b', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  {dicomInfo["Instituição"] && <div>{dicomInfo["Instituição"]}</div>}
                  {dicomInfo["Modalidade"] && <div className="font-bold">{dicomInfo["Modalidade"]}</div>}
                  {dicomInfo["Data Estudo"] && <div>{dicomInfo["Data Estudo"]}</div>}
                  {dicomInfo["Hora Estudo"] && <div>{dicomInfo["Hora Estudo"]}</div>}
                  {dicomInfo["Estudo"] && <div className="max-w-[200px] truncate">{dicomInfo["Estudo"]}</div>}
                </div>

                {/* Bottom-Left: Image/Technical Info */}
                <div className="absolute bottom-6 left-2 pointer-events-none font-mono text-[10px] leading-tight" style={{ color: '#f59e0b', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  {dicomInfo["Série"] && <div>Se: {dicomInfo["Série"]}</div>}
                  {dicomInfo["Instância"] && <div>Im: {dicomInfo["Instância"]}</div>}
                  {dicomInfo["Espessura"] && <div>Th: {dicomInfo["Espessura"]}</div>}
                  {dicomInfo["Protocolo"] && <div>{dicomInfo["Protocolo"]}</div>}
                  {fileUrls.length > 1 && <div>Frame: {activeIndex + 1}/{fileUrls.length}</div>}
                </div>

                {/* Bottom-Right: Window/Level + Zoom */}
                <div className="absolute bottom-6 right-2 pointer-events-none font-mono text-[10px] leading-tight text-right" style={{ color: '#f59e0b', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  <div>W: {Math.round(contrast * 10)} L: {Math.round(brightness * 5 - 250)}</div>
                  <div>Zoom: {Math.round(zoom * 100)}%</div>
                  {dicomInfo["Dimensões"] && <div>{dicomInfo["Dimensões"]}</div>}
                  {dicomInfo["Pixel Spacing"] && <div>PS: {dicomInfo["Pixel Spacing"]}</div>}
                  {rotation !== 0 && <div>Rot: {rotation}°</div>}
                  {(flipH || flipV) && <div>{flipH ? "H↔" : ""}{flipV ? "V↕" : ""}</div>}
                </div>
              </>
            )}

            {/* Cursor position / HU overlay */}
            {cursorPos && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono px-2 py-0.5 rounded" style={{ color: '#f59e0b', background: 'rgba(0,0,0,0.7)' }}>
                ({cursorPos.x}, {cursorPos.y}){cursorPos.hu !== undefined && ` HU: ${cursorPos.hu}`}
              </div>
            )}

            {/* Magnifying Glass Lens */}
            {tool === "magnify" && magnifyPos && (
              <div className="absolute pointer-events-none z-30" style={{
                left: magnifyPos.x - 80,
                top: magnifyPos.y - 80,
              }}>
                <canvas ref={magnifyCanvasRef} width={160} height={160} className="rounded-full" style={{
                  boxShadow: '0 0 12px rgba(245,158,11,0.4), inset 0 0 20px rgba(0,0,0,0.3)',
                }} />
              </div>
            )}
          </div>

          {/* Dual view */}
          {dualView && fileUrls.length > 1 && (
            <div className="flex-1 relative overflow-hidden bg-black border-l border-white/10">
              <img src={fileUrls[dualIndex] || ""} alt="Imagem do exame" className="w-full h-full object-contain"
                style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? "invert(1)" : ""}` }} loading="lazy" decoding="async" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                <Button size="icon" aria-label="Anterior" variant="ghost" className="h-5 w-5 text-white/50"
                  onClick={() => setDualIndex(i => Math.max(0, i - 1))} disabled={dualIndex === 0}>
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="text-[9px] text-white/40 font-mono">{dualIndex + 1}/{fileUrls.length}</span>
                <Button size="icon" aria-label="Próximo" variant="ghost" className="h-5 w-5 text-white/50"
                  onClick={() => setDualIndex(i => Math.min(fileUrls.length - 1, i + 1))} disabled={dualIndex >= fileUrls.length - 1}>
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* DICOM Info Panel */}
        {showInfoPanel && (
          <div className="w-56 border-l border-white/10 bg-[#0d1117] overflow-y-auto flex-shrink-0">
            <div className="p-1.5 text-[9px] text-white/40 uppercase tracking-wider px-2 py-1.5 border-b border-white/5 font-semibold flex items-center justify-between">
              DICOM Tags
              <Button size="icon" variant="ghost" className="h-5 w-5 text-white/30 hover:text-white" onClick={() => setShowInfoPanel(false)}>×</Button>
            </div>
            <div className="p-2 space-y-1">
              {Object.entries(dicomInfo).map(([key, val]) => (
                <div key={key} className="flex justify-between text-[10px]">
                  <span className="text-white/40">{key}</span>
                  <span className="text-white/70 font-mono text-right max-w-[120px] truncate">{val}</span>
                </div>
              ))}
              {Object.keys(dicomInfo).length === 0 && (
                <p className="text-[10px] text-white/20 text-center py-4">Sem informações DICOM</p>
              )}
            </div>
          </div>
        )}

        {/* Measurements Panel */}
        {showMeasurementsPanel && (
          <div className="w-56 border-l border-white/10 bg-[#0d1117] overflow-y-auto flex-shrink-0">
            <div className="p-1.5 text-[9px] text-white/40 uppercase tracking-wider px-2 py-1.5 border-b border-white/5 font-semibold flex items-center justify-between">
              Medições
              <Button size="icon" variant="ghost" className="h-5 w-5 text-white/30 hover:text-white" onClick={() => setShowMeasurementsPanel(false)}>×</Button>
            </div>
            {measurements.length === 0 ? (
              <div className="p-4 text-center text-[10px] text-white/20">
                <Ruler className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nenhuma medição
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {measurements.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between gap-1 text-[10px] py-1 px-1.5 rounded bg-white/5 hover:bg-white/10 group">
                    <span className="text-white/50">{i + 1}. {m.type}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-green-400/90 text-[9px]">{m.value}</span>
                      <Button size="icon" variant="ghost" className="h-4 w-4 opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400"
                        onClick={() => setMeasurements(prev => prev.filter(x => x.id !== m.id))}>×</Button>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-[10px] h-6 text-red-400/60 hover:text-red-400"
                  onClick={() => { setMeasurements([]); setAnnotations([]); }}>
                  Limpar tudo
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Annotation Dialog */}
      <Dialog open={annotationDialogOpen} onOpenChange={(open) => {
        if (!open) { setAnnotationDialogOpen(false); setPendingAnnotationPos(null); }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Anotação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Texto da anotação..."
              value={annotationInput}
              onChange={(e) => setAnnotationInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfirmAnnotation(); }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setAnnotationDialogOpen(false); setPendingAnnotationPos(null); }}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleConfirmAnnotation} disabled={!annotationInput.trim()}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ==================== MAIN EDITOR ====================
const ExamReportEditor = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLaudista = location.pathname.includes("/laudista/");
  const backRoute = isLaudista ? "/dashboard/laudista/queue?role=laudista" : "/dashboard/doctor/report-queue?role=doctor";
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [signing, setSigning] = useState(false);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sign confirmation dialog
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [panelDirection, setPanelDirection] = useState<"horizontal" | "vertical">(() => {
    try { return (localStorage.getItem("laudo-panel-dir") as "horizontal" | "vertical") || "horizontal"; } catch { return "horizontal"; }
  });

  const togglePanelDirection = () => {
    const next = panelDirection === "horizontal" ? "vertical" : "horizontal";
    setPanelDirection(next);
    try { localStorage.setItem("laudo-panel-dir", next); } catch {}
  };
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<Record<string, unknown> | null>(null);
  const [interimText, setInterimText] = useState("");

  // AI
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiMode, setAiMode] = useState<"structure" | "improve" | "suggest_conclusion" | "differential" | "checklist">("structure");

  // Macros
  const [showMacros, setShowMacros] = useState(false);
  const macroCategories = [...new Set(REPORT_MACROS.map((m) => m.category))];

  // SLA timer
  const [slaRemaining, setSlaRemaining] = useState<string | null>(null);

  // Word count
  const plainText = useMemo(() => {
    if (!content) return "";
    return content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
  }, [content]);

  const wordCount = useMemo(() => {
    if (!plainText) return 0;
    return plainText.split(/\s+/).filter(Boolean).length;
  }, [plainText]);

  const charCount = plainText.length;

  // ---- SLA countdown ----
  useEffect(() => {
    const examData = queryClient.getQueryData<ExamRequest>(["exam-request-detail", examId]);
    const deadline = examData?.sla_deadline;
    if (!deadline) return;

    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setSlaRemaining("ESTOURADO");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setSlaRemaining(`${h}h ${m}min`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [examId, queryClient]);

  // ---- Speech Recognition ----
  useEffect(() => {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceSupported(false); return; }

    let audioStream: MediaStream | null = null;
    const initNoiseFilter = async () => {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch { /* fallback */ }
    };

    const recognition = new (SpeechRecognition as unknown as { new(): { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: SpeechRecognitionEvent) => void) | null; onerror: ((e: SpeechRecognitionErrorEvent) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void } })();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "", finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + " ";
        else interim += transcript;
      }
      setInterimText(interim);
      if (finalText.trim()) {
        setContent(prev => {
          const newContent = prev ? prev + " " + finalText.trim() : finalText.trim();
          const macro = findMacro(newContent);
          if (macro) { toast("📝 Macro aplicada", { description: macro.label }); return applyMacro(newContent, macro); }
          return newContent;
        });
      }
    };
    recognition.onerror = () => { setListening(false); setInterimText(""); };
    recognition.onend = () => {
      const ref = recognitionRef.current;
      if (ref?._shouldRestart) { try { recognition.start(); } catch {} }
      else { setListening(false); setInterimText(""); }
    };

    recognitionRef.current = recognition as unknown as Record<string, unknown>;
    (recognitionRef.current as Record<string, unknown>)._initNoise = initNoiseFilter;

    return () => {
      try { (recognition as { stop: () => void }).stop(); } catch {}
      if (audioStream) audioStream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleListening = useCallback(async () => {
    const ref = recognitionRef.current;
    if (!ref) return;
    if (listening) {
      ref._shouldRestart = false;
      (ref as unknown as { stop: () => void }).stop();
      setListening(false); setInterimText("");
    } else {
      try {
        if (typeof ref._initNoise === "function") {
          await (ref._initNoise as () => Promise<void>)();
          ref._initNoise = null;
        }
        ref._shouldRestart = true;
        (ref as unknown as { start: () => void }).start();
        setListening(true);
        toast("🎙️ Ditado ativado", { description: "Fale agora — filtro de ruído ativo." });
      } catch { /* fail */ }
    }
  }, [listening]);

  // ---- Queries ----
  const { data: doctorProfile } = useQuery({
    queryKey: ["doctor-profile-editor", user?.id],
    queryFn: async () => {
      const { data } = await db.from("doctor_profiles").select("id, crm, crm_state").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-editor", user?.id],
    queryFn: async () => {
      const { data } = await db.from("profiles").select("first_name, last_name").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: examRequest, isLoading: loadingExam } = useQuery({
    queryKey: ["exam-request-detail", examId],
    queryFn: async () => {
      const { data, error } = await db.from("exam_requests" as never).select("*").eq("id", examId!).maybeSingle();
      if (error) throw error;
      return data as unknown as ExamRequest | null;
    },
    enabled: !!examId,
  });

  const { data: existingReport } = useQuery({
    queryKey: ["exam-report-existing", examId],
    queryFn: async () => {
      const { data } = await db.from("exam_reports" as never).select("*").eq("exam_request_id", examId!).maybeSingle();
      return data as unknown as ExamReport | null;
    },
    enabled: !!examId,
  });

  const { data: templates } = useQuery({
    queryKey: ["report-templates"],
    queryFn: async () => {
      const { data } = await db.from("report_templates" as never).select("*").eq("is_active", true).order("title");
      return (data ?? []) as unknown as ReportTemplate[];
    },
  });

  // Requesting clinic name
  const { data: requestingClinic } = useQuery({
    queryKey: ["requesting-clinic-name", examRequest?.requesting_clinic_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_profiles")
        .select("name")
        .eq("id", examRequest!.requesting_clinic_id!)
        .maybeSingle();
      return data;
    },
    enabled: !!examRequest?.requesting_clinic_id,
  });

  // ---- Auto-claim exam on open ----
  useEffect(() => {
    if (!examRequest || !doctorProfile?.id) return;
    if (examRequest.status === "pending" && !examRequest.assigned_to) {
      db.from("exam_requests" as any)
        .update({ status: "in_review", assigned_to: doctorProfile.id } as any)
        .eq("id", examId!)
        .then(({ error }) => {
          if (!error) {
            toast.info("Exame assumido por você", { description: "Status → Em revisão" });
            queryClient.invalidateQueries({ queryKey: ["exam-request-detail", examId] });
            queryClient.invalidateQueries({ queryKey: ["exam-requests-queue"] });
          }
        });
    } else if (examRequest.status === "pending" && examRequest.assigned_to === doctorProfile.id) {
      db.from("exam_requests" as any)
        .update({ status: "in_review" } as any)
        .eq("id", examId!)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["exam-request-detail", examId] });
        });
    }
  }, [examRequest?.id, doctorProfile?.id]);

  // ---- Auto-save ----
  const autoSaveDraft = useCallback(async (text: string) => {
    if (!doctorProfile?.id || !examId || !text.trim()) return;
    setAutoSaveStatus("saving");
    try {
      if (existingReport?.id) {
        await db.from("exam_reports" as any).update({ content_text: text } as any).eq("id", existingReport.id);
      } else {
        await db.from("exam_reports" as any).insert({ exam_request_id: examId, reporter_id: doctorProfile.id, content_text: text } as any);
        queryClient.invalidateQueries({ queryKey: ["exam-report-existing", examId] });
      }
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    } catch { setAutoSaveStatus("idle"); }
  }, [doctorProfile?.id, examId, existingReport?.id, queryClient]);

  const handleContentChange = (newContent: string) => {
    const macro = findMacro(newContent);
    if (macro) {
      const applied = applyMacro(newContent, macro);
      setContent(applied);
      toast("📝 Macro aplicada", { description: macro.label });
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => autoSaveDraft(applied), 5000);
      return;
    }
    setContent(newContent);
    // Debounced auto-save
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => autoSaveDraft(newContent), 5000);
  };

  useEffect(() => {
    if (existingReport?.content_text) {
      setContent(existingReport.content_text);
    }
  }, [existingReport?.content_text]);

  useEffect(() => {
    if (!existingReport || !doctorProfile) return;
    if (existingReport.reporter_id && existingReport.reporter_id !== doctorProfile.id) {
      toast.error("Acesso negado"); navigate(backRoute);
    }
  }, [existingReport, doctorProfile]);

  // ---- File URLs ----
  useEffect(() => {
    if (!examRequest?.file_urls) return;
    const urls = examRequest.file_urls as string[];
    if (!urls.length) return;
    Promise.all(
      urls.map(async (path: string) => {
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        if (path.startsWith("/")) return path;
        const { data } = await db.storage.from("exam-files").createSignedUrl(path, 3600);
        return data?.signedUrl || "";
      })
    ).then(resolved => setFileUrls(resolved.filter(Boolean)));
  }, [examRequest]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates?.find((t: { id: string; body_text: string }) => t.id === templateId);
    if (tpl) {
      setContent(tpl.body_text);
    }
  };

  // ---- AI ----
  const handleAiProcess = async (mode: "structure" | "improve" | "suggest_conclusion" | "differential" | "checklist") => {
    if (!content.trim()) { toast.error("Texto vazio"); return; }
    setAiProcessing(true); setAiMode(mode);
    try {
      const { data, error } = await db.functions.invoke("structure-report", {
        body: { raw_text: plainText, exam_type: examRequest?.exam_type || "", clinical_info: examRequest?.clinical_info || "", mode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.structured_text) {
        const newContent = (mode === "suggest_conclusion" || mode === "differential" || mode === "checklist")
          ? content + "\n\n" + data.structured_text
          : data.structured_text;
        setContent(newContent);
        toast.success("✨ IA aplicada", {
          description: mode === "structure" ? "Laudo estruturado" :
            mode === "improve" ? "Redação melhorada" :
            mode === "suggest_conclusion" ? "Conclusão sugerida" :
            mode === "differential" ? "Diferenciais gerados" :
            "Checklist gerada"
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tente novamente.";
      if (msg.includes("Rate limited") || msg.includes("429")) {
        toast.error("IA sobrecarregada", { description: "Aguarde um momento e tente novamente." });
      } else if (msg.includes("402") || msg.includes("Créditos")) {
        toast.error("Créditos insuficientes", { description: "Adicione créditos na sua conta." });
      } else {
        toast.error("Erro na IA", { description: msg });
      }
    } finally { setAiProcessing(false); }
  };

  const insertMacro = (macroId: string) => {
    const macro = REPORT_MACROS.find(m => m.id === macroId);
    if (!macro) return;
    const newContent = content ? `${content}\n\n${macro.text}` : macro.text;
    setContent(newContent);
    setShowMacros(false);
    toast("📝 Macro inserida", { description: macro.label });
  };

  // ---- Sign (actual logic, called from AlertDialog confirm) ----
  const executeSignAndFinalize = async () => {
    if (!doctorProfile?.id || !content.trim()) { toast.error("Preencha o laudo antes de assinar."); return; }

    setSigning(true);
    try {
      const contentForPdf = content
        .replace(/<h[1-3][^>]*>/gi, "\n")
        .replace(/<\/h[1-3]>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<li[^>]*>/gi, "• ")
        .replace(/<\/li>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<strong>|<\/strong>|<em>|<\/em>|<u>|<\/u>/gi, "")
        .replace(/<mark[^>]*>|<\/mark>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/\n{3,}/g, "\n\n").trim();
      const documentHash = await gerarHashDocumento(contentForPdf);
      const verificationCode = gerarCodigoVerificacao();
      const doctorName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
      const patientDisplayName = examRequest?.patient_name || "Paciente";

      // ============ GENERATE PROFESSIONAL CLINICAL PDF ============
      const pdf = new jsPDF();
      const pageW = 210;
      const marginL = 15;
      const marginR = 15;
      const contentW = pageW - marginL - marginR;
      const pageH = 297;
      let y = 0;

      // ---- Helper: add footer to every page ----
      const addFooter = (pageNum: number, totalPages: number) => {
        pdf.setFontSize(7);
        pdf.setTextColor(120, 120, 120);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(marginL, 278, pageW - marginR, 278);
        pdf.text("Allo Médico — Plataforma de Telemedicina", marginL, 282);
        pdf.text(`Página ${pageNum} de ${totalPages}`, pageW - marginR, 282, { align: "right" });
        pdf.text(`Código de Verificação: ${verificationCode}`, marginL, 286);
        pdf.text(`Hash SHA-256: ${documentHash.substring(0, 48)}...`, marginL, 290);
        pdf.text(`Verificar: allomedico.com/validar?code=${verificationCode}`, marginL, 294);
        pdf.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pageW - marginR, 290, { align: "right" });
      };

      // ---- Helper: check page break ----
      const checkPage = (needed: number) => {
        if (y + needed > 270) {
          pdf.addPage();
          y = 20;
        }
      };

      // ---- PAGE HEADER ----
      // Green header bar
      pdf.setFillColor(0, 102, 68);
      pdf.rect(0, 0, pageW, 30, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("LAUDO MÉDICO", pageW / 2, 12, { align: "center" });
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Laudo de ${examRequest?.exam_type || "Exame"}`, pageW / 2, 19, { align: "center" });
      pdf.setFontSize(7);
      pdf.text("Allo Médico — Plataforma de Telemedicina", pageW / 2, 26, { align: "center" });
      pdf.setTextColor(0, 0, 0);

      y = 36;

      // ---- Accent line ----
      pdf.setDrawColor(0, 102, 68);
      pdf.setLineWidth(1);
      pdf.line(marginL, y, pageW - marginR, y);
      y += 6;

      // ---- PATIENT IDENTIFICATION TABLE ----
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setFillColor(245, 245, 245);
      pdf.setDrawColor(200, 200, 200);

      const examAny = examRequest as any;
      const patientBirthDate = examAny?.patient_birth_date
        ? new Date(examAny.patient_birth_date).toLocaleDateString("pt-BR")
        : "—";
      const patientSex = examAny?.patient_sex === "M" ? "Masculino" : examAny?.patient_sex === "F" ? "Feminino" : "—";
      const patientAge = examAny?.patient_birth_date
        ? `${Math.floor((Date.now() - new Date(examAny.patient_birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} anos`
        : "—";
      const examDate = examAny?.exam_date
        ? new Date(examAny.exam_date).toLocaleDateString("pt-BR")
        : "—";
      const modality = (examRequest?.exam_type || "DX").substring(0, 2).toUpperCase();
      const laudoDate = new Date().toLocaleDateString("pt-BR");

      // Table rows
      const tableRows = [
        [
          { label: "Paciente:", value: patientDisplayName },
          { label: "Nascimento:", value: patientBirthDate },
          { label: "Sexo:", value: patientSex },
          { label: "Idade:", value: patientAge },
        ],
        [
          { label: "Nº Exame:", value: examId?.substring(0, 12) || "—" },
          { label: "Data Exame:", value: examDate },
          { label: "Modalidade:", value: modality },
          { label: "Data Laudo:", value: laudoDate },
        ],
      ];

      const colW = contentW / 4;
      const rowH = 10;

      tableRows.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          const x = marginL + ci * colW;
          pdf.setFillColor(ri % 2 === 0 ? 245 : 252, ri % 2 === 0 ? 245 : 252, ri % 2 === 0 ? 245 : 252);
          pdf.rect(x, y, colW, rowH, "FD");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7);
          pdf.text(cell.label, x + 2, y + 4);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.text(cell.value, x + 2, y + 8);
        });
        y += rowH;
      });

      // Urgency badge row
      if (examRequest?.priority === "urgent") {
        pdf.setFillColor(255, 230, 230);
        pdf.rect(marginL, y, contentW, 8, "FD");
        pdf.setTextColor(200, 0, 0);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text("⚠ URGENTE", marginL + 4, y + 5.5);
        pdf.setTextColor(0, 0, 0);
        y += 8;
      }

      y += 4;

      // ---- CLINICAL INFO ----
      if (examRequest?.clinical_info) {
        pdf.setFillColor(240, 248, 255);
        pdf.setDrawColor(0, 102, 68);
        const clinicalLines = pdf.splitTextToSize(examRequest.clinical_info, contentW - 8);
        const boxH = 10 + clinicalLines.length * 4;
        pdf.roundedRect(marginL, y, contentW, boxH, 2, 2, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text("INDICAÇÃO CLÍNICA", marginL + 4, y + 5);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(clinicalLines, marginL + 4, y + 10);
        y += boxH + 4;
      }

      // ---- SEPARATOR ----
      pdf.setDrawColor(0, 102, 68);
      pdf.setLineWidth(0.5);
      pdf.line(marginL, y, pageW - marginR, y);
      y += 6;

      // ---- REPORT BODY ----
      // Parse HTML into formatted PDF sections
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;

      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = (node.textContent || "").trim();
          if (!text) return;
          checkPage(6);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          const lines = pdf.splitTextToSize(text, contentW - 4);
          for (const line of lines) {
            checkPage(5);
            pdf.text(line, marginL + 2, y);
            y += 4.2;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();

          if (tag === "h1") {
            checkPage(10);
            y += 3;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(14);
            pdf.text(el.textContent || "", marginL, y);
            y += 7;
          } else if (tag === "h2") {
            checkPage(10);
            y += 2;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(12);
            const h2Text = el.textContent || "";
            pdf.text(h2Text, marginL, y);
            // Underline
            const tw = pdf.getTextWidth(h2Text);
            pdf.setLineWidth(0.3);
            pdf.line(marginL, y + 1, marginL + tw, y + 1);
            y += 6;
          } else if (tag === "h3") {
            checkPage(8);
            y += 1;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.text(el.textContent || "", marginL, y);
            y += 5.5;
          } else if (tag === "strong" || tag === "b") {
            const text = (el.textContent || "").trim();
            if (text) {
              checkPage(5);
              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(9);
              pdf.text(text, marginL + 2, y);
              y += 4.2;
              pdf.setFont("helvetica", "normal");
            }
          } else if (tag === "em" || tag === "i") {
            const text = (el.textContent || "").trim();
            if (text) {
              checkPage(5);
              pdf.setFont("helvetica", "italic");
              pdf.setFontSize(9);
              pdf.text(text, marginL + 2, y);
              y += 4.2;
              pdf.setFont("helvetica", "normal");
            }
          } else if (tag === "li") {
            checkPage(5);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            const liText = `• ${(el.textContent || "").trim()}`;
            const liLines = pdf.splitTextToSize(liText, contentW - 10);
            for (const line of liLines) {
              checkPage(5);
              pdf.text(line, marginL + 6, y);
              y += 4.2;
            }
          } else if (tag === "br") {
            y += 2;
          } else if (tag === "p") {
            el.childNodes.forEach(processNode);
            y += 2;
          } else if (tag === "table") {
            // Simple table rendering
            checkPage(15);
            const rows = el.querySelectorAll("tr");
            rows.forEach((tr, ri) => {
              const cells = tr.querySelectorAll("th, td");
              const cellW = contentW / Math.max(cells.length, 1);
              cells.forEach((td, ci) => {
                const x = marginL + ci * cellW;
                pdf.setFillColor(ri === 0 ? 230 : 250, ri === 0 ? 230 : 250, ri === 0 ? 230 : 250);
                pdf.rect(x, y, cellW, 7, "FD");
                pdf.setFontSize(7);
                pdf.setFont("helvetica", ri === 0 ? "bold" : "normal");
                pdf.text((td.textContent || "").trim().substring(0, 30), x + 1, y + 5);
              });
              y += 7;
              checkPage(8);
            });
            y += 2;
          } else {
            el.childNodes.forEach(processNode);
          }
        }
      };

      tempDiv.childNodes.forEach(processNode);

      // ---- DIGITAL SIGNATURE ----
      checkPage(35);
      y = Math.max(y + 12, 220);
      if (y > 255) { pdf.addPage(); y = 40; }

      pdf.setDrawColor(0, 102, 68);
      pdf.setLineWidth(0.5);
      pdf.line(55, y, 155, y);
      y += 5;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(`Dr(a). ${doctorName}`, pageW / 2, y, { align: "center" });
      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`CRM: ${doctorProfile.crm}/${doctorProfile.crm_state}`, pageW / 2, y, { align: "center" });
      y += 4;
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.text("Médico Laudista — Allo Médico Telelaudo", pageW / 2, y, { align: "center" });
      pdf.setTextColor(0, 0, 0);
      y += 4;
      pdf.setFontSize(7);
      pdf.text(`Assinado digitalmente em ${new Date().toLocaleString("pt-BR")}`, pageW / 2, y, { align: "center" });

      // ---- ADD FOOTERS TO ALL PAGES ----
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i, totalPages);
      }

      const pdfBlob = pdf.output("blob");
      const pdfPath = `reports/${examId}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await db.storage.from("prescriptions").upload(pdfPath, pdfBlob, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      if (existingReport?.id) {
        const { error } = await db.from("exam_reports" as any).update({
          content_text: content, template_id: selectedTemplateId || null, pdf_url: pdfPath,
          document_hash: documentHash, verification_code: verificationCode, signed_at: new Date().toISOString(),
        } as any).eq("id", existingReport.id);
        if (error) throw error;
      } else {
        const { error } = await db.from("exam_reports" as any).insert({
          exam_request_id: examId, reporter_id: doctorProfile.id, content_text: content,
          template_id: selectedTemplateId || null, pdf_url: pdfPath, document_hash: documentHash,
          verification_code: verificationCode, signed_at: new Date().toISOString(),
        } as any);
        if (error) throw error;
      }

      await db.from("exam_requests" as any).update({ status: "reported" } as any).eq("id", examId);

      // Try ICP-Brasil digital signature (only if VIDaaS token is available)
      try {
        const vidaasToken = sessionStorage.getItem("vidaas_access_token");
        if (vidaasToken) {
          await db.functions.invoke("vidaas-sign", {
            body: {
              action: "sign",
              access_token: vidaasToken,
              hashes: [{ id: `report-${examId}`, alias: `Laudo - ${patientDisplayName}`, hash: documentHash }],
              document_type: "exam_report",
              doctor_name: doctorName,
              doctor_crm: `${doctorProfile.crm}/${doctorProfile.crm_state}`,
              verification_code: verificationCode,
            },
          });
        }
      } catch {}

      // Document verification record
      await db.from("document_verifications").insert({
        doctor_name: doctorName, doctor_crm: `${doctorProfile.crm}/${doctorProfile.crm_state}`,
        patient_name: patientDisplayName, document_type: "exam_report", document_hash: documentHash, verification_code: verificationCode,
      });

      // Notifications
      if (examRequest?.requesting_doctor_id) {
        const { data: reqDoctor } = await db.from("doctor_profiles").select("user_id").eq("id", examRequest.requesting_doctor_id).maybeSingle();
        if (reqDoctor?.user_id) {
          await db.from("notifications").insert({ user_id: reqDoctor.user_id, title: "📋 Laudo Concluído", message: `O laudo do exame ${examRequest.exam_type} foi finalizado.`, type: "exam_report", link: `/dashboard/doctor/report-editor/${examId}?role=doctor` });
        }
      }
      if (examRequest?.patient_id) {
        const { data: patientProfile } = await db.from("profiles").select("user_id, first_name, phone").eq("user_id", examRequest.patient_id).maybeSingle();
        if (patientProfile) {
          await db.from("notifications").insert({ user_id: patientProfile.user_id, title: "📋 Seu laudo está pronto!", message: `O laudo do exame ${examRequest.exam_type} foi concluído.`, type: "exam_report", link: "/dashboard/health" });
          if (patientProfile.phone) {
            const doctorNameForWA = doctorName;
            db.functions.invoke("send-whatsapp", { body: { phone: patientProfile.phone, message: `🩺 *Allo Médico* — Laudo Pronto!\n\nOlá, ${patientProfile.first_name}!\nSeu laudo de *${examRequest.exam_type}* foi finalizado pelo Dr(a). ${doctorNameForWA}.\n\nCódigo: ${verificationCode}\nVerifique em: allomedico.com/validar` } }).catch((err) => { logError("[ExamReportEditor] send-whatsapp failed", err); });
          }
        }
      }

      // Notificar clínica se o exame veio de uma clínica
      if (examRequest?.requesting_clinic_id) {
        const { data: clinicData } = await supabase
          .from("clinic_profiles")
          .select("user_id")
          .eq("id", examRequest!.requesting_clinic_id)
          .maybeSingle();
        if (clinicData?.user_id) {
          await db.from("notifications").insert({
            user_id: clinicData.user_id,
            title: "📋 Laudo Concluído",
            message: `O laudo do exame ${examRequest.exam_type}${examRequest?.patient_name ? ` — ${examRequest?.patient_name}` : ""} foi finalizado.`,
            type: "exam_report",
            link: `/dashboard/clinic/my-exams?role=clinic`,
          });
        }
      }

      toast.success("Laudo assinado e finalizado!", { description: `Código: ${verificationCode}` });
      queryClient.invalidateQueries({ queryKey: ["exam-requests-queue"] });
      navigate(backRoute);
    } catch (err: unknown) {
      toast.error("Erro ao assinar", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally { setSigning(false); }
  };

  // ---- Keyboard shortcuts ----
  // Force dark theme for workstation
  useEffect(() => {
    document.documentElement.classList.add('laudo-workspace');
    return () => document.documentElement.classList.remove('laudo-workspace');
  }, []);

  const slaPercent = useMemo(() => {
    if (!examRequest?.sla_deadline || !examRequest?.created_at) return null;
    const total = new Date(examRequest.sla_deadline).getTime() - new Date(examRequest.created_at).getTime();
    const elapsed = Date.now() - new Date(examRequest.created_at).getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [examRequest?.sla_deadline, examRequest?.created_at]);

  const isReported = examRequest?.status === "reported" && existingReport?.signed_at;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (content.trim()) autoSaveDraft(content);
        toast.success("Salvo!");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isReported) setShowSignDialog(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [content, autoSaveDraft, isReported]);

  if (loadingExam) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'hsl(220 20% 8%)' }}>
      {/* ═══ TOPBAR — Compact workstation header ═══ */}
      <div className="flex items-center gap-2 px-3 h-11 shrink-0" style={{ background: 'hsl(220 18% 13%)', borderBottom: '1px solid hsl(220 15% 20%)' }}>
        {/* Back + Breadcrumb */}
        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/5" onClick={() => navigate(backRoute)}>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'hsl(220 8% 50%)' }}>
          <span>AloMédico</span>
          <ChevronRight className="w-3 h-3" />
          <span>Laudos</span>
          <ChevronRight className="w-3 h-3" />
          <span style={{ color: 'hsl(220 10% 85%)' }}>{examRequest?.exam_type || "Editor"}</span>
        </div>

        {/* Right-side indicators */}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {/* Urgent badge */}
          {examRequest?.priority === "urgent" && (
            <Badge className="bg-red-600/20 text-red-400 border-red-600/30 animate-pulse text-[10px] px-2 py-0.5">
              <AlertTriangle className="w-3 h-3 mr-1" /> URGENTE
            </Badge>
          )}

          {/* SLA countdown */}
          {slaRemaining && (
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(220 15% 20%)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${slaPercent ?? 0}%`,
                    background: (slaPercent ?? 0) > 80 ? 'hsl(0 90% 60%)' : (slaPercent ?? 0) > 50 ? 'hsl(38 95% 55%)' : 'hsl(142 70% 48%)',
                  }}
                />
              </div>
              <span className="text-[10px] font-mono" style={{
                color: slaRemaining === "ESTOURADO" ? 'hsl(0 90% 60%)' : (slaPercent ?? 0) > 50 ? 'hsl(38 95% 55%)' : 'hsl(142 70% 48%)',
              }}>
                <Clock className="w-3 h-3 inline mr-0.5" />{slaRemaining}
              </span>
            </div>
          )}

          {/* Word count */}
          {wordCount > 0 && !isReported && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: 'hsl(220 8% 50%)' }}>
              <span>{wordCount}w · {charCount}c</span>
              <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(220 15% 20%)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (wordCount / 150) * 100)}%`,
                    background: wordCount >= 150 ? 'hsl(142 70% 48%)' : wordCount >= 50 ? 'hsl(38 95% 55%)' : 'hsl(0 90% 60%)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Auto-save status */}
          <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'hsl(220 8% 50%)' }}>
            {autoSaveStatus === "saving" && <><Loader2 className="w-3 h-3 animate-spin" style={{ color: 'hsl(195 80% 55%)' }} /> Salvando</>}
            {autoSaveStatus === "saved" && <><Save className="w-3 h-3" style={{ color: 'hsl(142 70% 48%)' }} /> Salvo</>}
            {autoSaveStatus === "idle" && !isReported && <><Save className="w-3 h-3 opacity-40" /></>}
          </div>

          {/* Quick actions */}
          {!isReported && (
            <div className="flex items-center gap-0.5 ml-1" style={{ borderLeft: '1px solid hsl(220 15% 20%)', paddingLeft: '8px' }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/5 text-[10px]" onClick={() => { if (content.trim()) autoSaveDraft(content); toast.success("Salvo!"); }}>
                    <Save className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px]">Salvar (Ctrl+S)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/5" onClick={() => setShowSignDialog(true)} disabled={!content.trim() || wordCount < 5}>
                    <FileSignature className="w-3.5 h-3.5" style={{ color: wordCount >= 150 ? 'hsl(142 70% 48%)' : undefined }} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px]">Assinar (Ctrl+Enter)</TooltipContent>
              </Tooltip>
            </div>
          )}

          <span className="hidden lg:inline text-[9px] font-mono" style={{ color: 'hsl(220 8% 40%)' }}>Ctrl+S · Ctrl+⏎</span>

          {/* Orientation toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" aria-label="Sistema" variant="ghost" className="h-7 w-7 hover:bg-white/5" onClick={togglePanelDirection}>
                {panelDirection === "horizontal" ? <Grid3X3 className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">{panelDirection === "horizontal" ? "Layout Vertical" : "Layout Horizontal"}</TooltipContent>
          </Tooltip>

          {/* Shortcuts help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/5 font-bold text-sm" onClick={() => setShowShortcuts(true)}>
                ?
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Atalhos de Teclado</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Main content */}
      <motion.div
        className="flex-1 min-h-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ResizablePanelGroup direction={panelDirection} key={panelDirection}>
          <ResizablePanel defaultSize={55} minSize={30}>
            <PacsViewer fileUrls={fileUrls} examRequest={examRequest || null} onFilesUploaded={(newUrls) => setFileUrls(prev => [...prev, ...newUrls])} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={45} minSize={25}>
            <div className="flex flex-col h-full bg-card">
              {/* Clinical info */}
              {examRequest?.clinical_info && (
                <div className="px-3 py-2 border-b border-border bg-warning/5">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-warning uppercase tracking-wider">Informações Clínicas</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{examRequest.clinical_info}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient / Clinic info panel */}
              <div className="px-3 py-2 border-b border-border bg-muted/30 space-y-0.5">
                <div className="flex items-center gap-2">
                  <Clipboard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[11px] font-semibold text-foreground">
                    {examRequest?.patient_name
                      ? examRequest?.patient_name
                      : examRequest?.patient_id
                      ? "Paciente cadastrado"
                      : "Paciente não informado"}
                  </span>
                  {examRequest?.priority === "urgent" && (
                    <span className="text-destructive ml-1 font-bold text-[10px]">● URGENTE</span>
                  )}
                </div>
                {requestingClinic?.name && (
                  <div className="flex items-center gap-2 pl-5">
                    <span className="text-[10px] text-muted-foreground">
                      Clínica: <strong>{requestingClinic.name}</strong>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 pl-5">
                  <span className="text-[10px] text-muted-foreground">
                    Exame: <strong>{examRequest?.exam_type}</strong>
                  </span>
                </div>
              </div>

              {/* Editor header */}
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{isReported ? "Laudo Finalizado" : "Redigir Laudo"}</span>
                </div>
                <div className="flex items-center gap-1">
                  {autoSaveStatus !== "idle" && !isReported && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-2">
                      {autoSaveStatus === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Salvando...</>}
                      {autoSaveStatus === "saved" && <><Save className="w-3 h-3 text-green-500" /> Salvo</>}
                    </div>
                  )}
                </div>
              </div>

              {/* Editor toolbar */}
              {!isReported && (
                <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 border-b border-border bg-muted/30">
                  {templates && templates.length > 0 && (
                    <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                      <SelectTrigger className="h-7 text-[11px] w-auto min-w-[120px]">
                        <SelectValue placeholder="Template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t: { id: string; title: string; exam_type: string }) => (
                          <SelectItem key={t.id} value={t.id}>{t.title} ({t.exam_type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {voiceSupported && (
                    <Button type="button" variant={listening ? "destructive" : "outline"} size="sm"
                      onClick={toggleListening} className="h-7 text-[11px] px-2">
                      {listening ? <><MicOff className="w-3 h-3 mr-1" /><span className="animate-pulse">Ditando</span></> :
                        <><Mic className="w-3 h-3 mr-1" />Ditar</>}
                    </Button>
                  )}

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" disabled={aiProcessing}>
                        {aiProcessing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        IA <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-1.5" align="start">
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => handleAiProcess("structure")} disabled={aiProcessing}>
                        <Wand2 className="w-3 h-3 mr-2" /> Estruturar Laudo
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => handleAiProcess("improve")} disabled={aiProcessing}>
                        <Sparkles className="w-3 h-3 mr-2" /> Melhorar Redação
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => handleAiProcess("suggest_conclusion")} disabled={aiProcessing}>
                        <Lightbulb className="w-3 h-3 mr-2" /> Sugerir Conclusão
                      </Button>
                      <Separator className="my-1" />
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => handleAiProcess("differential")} disabled={aiProcessing}>
                        <GitBranch className="w-3 h-3 mr-2" /> Diagnósticos Diferenciais
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => handleAiProcess("checklist")} disabled={aiProcessing}>
                        <ListChecks className="w-3 h-3 mr-2" /> Checklist de Revisão
                      </Button>
                      <p className="text-[9px] text-muted-foreground mt-1 px-1">DeepSeek + Gemini fallback. Revise sempre.</p>
                    </PopoverContent>
                  </Popover>

                </div>
              )}

              {/* Voice interim */}
              {listening && interimText && (
                <div className="mx-3 mt-1.5 bg-primary/5 border border-primary/20 rounded px-2 py-1 text-xs text-primary animate-pulse">
                  🎙️ {interimText}
                </div>
              )}

              {/* Editor area — TipTap rich text */}
              <div className="flex-1 relative min-h-0">
                <TipTapEditor
                  content={content}
                  onChange={handleContentChange}
                  disabled={!!isReported}
                />
                {aiProcessing && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-md">
                    <div className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2 shadow-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm">
                        {aiMode === "structure" ? "Estruturando..." :
                         aiMode === "improve" ? "Melhorando..." :
                         aiMode === "suggest_conclusion" ? "Gerando conclusão..." :
                         aiMode === "differential" ? "Analisando diferenciais..." :
                         "Gerando checklist..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quality indicators */}
              {!isReported && wordCount > 20 && (
                <div className="px-3 py-2 border-t text-[10px] space-y-1" style={{ borderColor: 'hsl(220 15% 20%)', background: 'hsl(220 18% 10%)' }}>
                  <p className="font-semibold text-[9px] uppercase tracking-wider" style={{ color: 'hsl(220 8% 50%)' }}>Qualidade do Laudo</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <span>{plainText.match(/t[ée]cnica/i) ? "✅" : "❌"} Técnica descrita</span>
                    <span>{plainText.match(/achados/i) ? "✅" : "❌"} Achados documentados</span>
                    <span>{plainText.match(/impress[ãa]o|conclus[ãa]o/i) ? "✅" : "⚠️"} Impressão/Conclusão</span>
                    <span>{plainText.match(/recomend/i) ? "✅" : "ℹ️"} Recomendações</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span>{wordCount}w</span>
                    <span>Score: {[/t[ée]cnica/i, /achados/i, /impress[ãa]o|conclus[ãa]o/i, /recomend/i].filter(r => r.test(plainText)).length}/4</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-3 py-2 border-t" style={{ borderColor: 'hsl(220 15% 20%)' }}>
                {isReported ? (
                  <div className="space-y-1.5">
                    <Badge className="bg-primary/10 text-primary border-primary/30" variant="outline">
                      ✅ Assinado em {existingReport?.signed_at ? new Date(existingReport.signed_at).toLocaleString("pt-BR") : ""}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground">
                      Código: {existingReport?.verification_code} | Hash: {existingReport?.document_hash?.substring(0, 16)}...
                    </p>
                    {existingReport?.pdf_url && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        const { data } = await db.storage.from("prescriptions").createSignedUrl(existingReport.pdf_url!, 3600);
                        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      }}>
                        <Download className="w-3 h-3 mr-1" /> Baixar PDF
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <Button onClick={() => setShowSignDialog(true)} disabled={signing || !content.trim() || wordCount < 5}
                      className="w-full h-9" style={{ background: wordCount >= 150 ? 'hsl(142 70% 48%)' : undefined }}>
                      {signing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSignature className="w-4 h-4 mr-2" />}
                      {signing ? "Assinando..." : "Assinar e Finalizar Laudo"}
                    </Button>
                    {wordCount > 0 && wordCount < 50 && (
                      <p className="text-[10px] mt-1 text-center" style={{ color: 'hsl(38 95% 55%)' }}>
                        ⚠ Laudo muito curto — recomendado mínimo 50 palavras
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </motion.div>

      {/* ═══ STATUS BAR — VS Code style ═══ */}
      <div className="flex items-center gap-4 px-3 h-6 shrink-0 font-mono text-[10px] select-none" style={{ background: 'hsl(220 20% 7%)', borderTop: '1px solid hsl(220 15% 16%)', color: 'hsl(220 8% 50%)' }}>
        <span>{isReported ? "🔒 Leitura" : "✏️ Edição"}</span>
        <span>PT-BR</span>
        {fileUrls.length > 0 && <span>Imagens: {fileUrls.length}</span>}
        {examRequest?.exam_type && <span>Exame: {examRequest.exam_type}</span>}
        {wordCount > 0 && <span>{wordCount} palavras</span>}
        <div className="flex-1" />
        {profile && <span>Dr(a). {profile.first_name} {profile.last_name}</span>}
        {doctorProfile?.crm && <span>CRM {doctorProfile.crm}/{doctorProfile.crm_state}</span>}
      </div>

      {/* ═══ SHORTCUTS DIALOG ═══ */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">⌨️ Atalhos de Teclado</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="overflow-x-auto -mx-0.5 rounded-xl">

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Atalho</TableHead>
                  <TableHead className="font-semibold">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["Ctrl+S", "Salvar rascunho"],
                  ["Ctrl+Enter", "Abrir diálogo de assinatura"],
                  ["Ctrl+D", "Toggle ditado por voz"],
                  ["Ctrl+M", "Abrir painel de macros"],
                  ["Ctrl+Z / Ctrl+Y", "Desfazer / Refazer"],
                  ["Ctrl+B / I / U", "Negrito / Itálico / Sublinhado"],
                  ["[ / ]", "Imagem anterior / próxima"],
                  ["+ / -", "Zoom in / out no viewer"],
                  ["R", "Rotacionar imagem 90°"],
                  ["I", "Inverter imagem"],
                  ["Esc", "Cancelar ferramenta ativa"],
                  ["F", "Tela cheia no viewer"],
                  ["Space", "Play/Pause CINE"],
                ].map(([key, action]) => (
                  <TableRow key={key}>
                    <TableCell>
                      <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border">{key}</kbd>
                    </TableCell>
                    <TableCell className="text-sm">{action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Confirmation AlertDialog */}
      <AlertDialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Assinar Laudo</AlertDialogTitle>
            <AlertDialogDescription>
              Validação automática e confirmação de assinatura. Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Automatic Validation */}
          <div className="my-4">
            <LaudoValidator
              laudoText={content.replace(/<[^>]+>/g, "").trim()}
              examType={examRequest?.exam_type}
              isLoading={signing}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={signing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={signing}
              onClick={() => {
                setShowSignDialog(false);
                executeSignAndFinalize();
              }}
            >
              {signing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sim, Assinar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExamReportEditor;
