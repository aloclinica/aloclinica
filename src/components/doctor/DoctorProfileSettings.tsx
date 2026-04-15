import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Camera, Save, Plus, Trash2, Loader2, User, Briefcase, Stethoscope, MapPin, Film } from "lucide-react";

interface EducationItem { institution: string; degree: string; year: string }
interface CertificationItem { name: string; issuer: string; year: string }

const BR_STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const GENDERS = [
  { v: "male", l: "Masculino" },
  { v: "female", l: "Feminino" },
  { v: "other", l: "Outro" },
  { v: "prefer_not_say", l: "Prefiro não informar" },
];
const COMMON_LANGUAGES = ["Português", "Inglês", "Espanhol", "Francês", "Italiano", "Alemão", "Libras"];
const COMMON_INSURANCE = ["Unimed", "Bradesco Saúde", "SulAmérica", "Amil", "Hapvida", "NotreDame Intermédica", "Porto Seguro", "Golden Cross"];

function resizeImage(file: File, max = 512): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target!.result as string; };
    reader.onerror = () => reject(new Error("read error"));
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = max; canvas.height = max;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, max, max);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("blob error")), "image/jpeg", 0.9);
    };
    reader.readAsDataURL(file);
  });
}

const DoctorProfileSettings = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const isDoctor = roles.includes("doctor");
  const nav = getDoctorNav("profile-settings");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);

  // Personal
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [cpf, setCpf] = useState("");

  // Professional
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("");
  const [rqe, setRqe] = useState("");
  const [specialtyId, setSpecialtyId] = useState<string>("");
  const [subSpecialties, setSubSpecialties] = useState<string[]>([]);
  const [subInput, setSubInput] = useState("");
  const [educationList, setEducationList] = useState<EducationItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);

  // Bio
  const [bio, setBio] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Português"]);
  const [yearsExperience, setYearsExperience] = useState(0);

  // Media
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [videoIntroUrl, setVideoIntroUrl] = useState("");

  // Contact & address
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrNumber, setAddrNumber] = useState("");
  const [addrComplement, setAddrComplement] = useState("");
  const [addrNeighborhood, setAddrNeighborhood] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  // Practice
  const [consultationPrice, setConsultationPrice] = useState(150);
  const [consultationDuration, setConsultationDuration] = useState(30);
  const [acceptsInsurance, setAcceptsInsurance] = useState(false);
  const [insurancePlans, setInsurancePlans] = useState<string[]>([]);
  const [availTele, setAvailTele] = useState(true);
  const [availInPerson, setAvailInPerson] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [showInDirectory, setShowInDirectory] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const [specsRes, profRes] = await Promise.all([
      db.from("specialties").select("id, name").order("name"),
      db.from("doctor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    setSpecialties((specsRes.data as any[]) || []);
    const d: any = profRes.data;
    if (d) {
      setProfileId(d.id);
      setFullName(d.full_name || "");
      setDisplayName(d.display_name || "");
      setBirthDate(d.birth_date || "");
      setGender(d.gender || "");
      setCpf(d.cpf || "");
      setCrm(d.crm || "");
      setCrmState(d.crm_state || "");
      setRqe(d.rqe || "");
      setSpecialtyId(d.specialty_id || "");
      setSubSpecialties(d.sub_specialties || []);
      setEducationList(Array.isArray(d.education_list) ? d.education_list : []);
      setCertifications(Array.isArray(d.certifications) ? d.certifications : []);
      setBio(d.bio || "");
      setShortDescription(d.short_description || "");
      setLanguages(d.languages?.length ? d.languages : ["Português"]);
      setYearsExperience(d.experience_years || 0);
      setAvatarUrl(d.avatar_url || null);
      setCoverUrl(d.cover_url || null);
      setVideoIntroUrl(d.video_intro_url || "");
      setPhone(d.phone || "");
      setWhatsapp(d.whatsapp || "");
      setAddrStreet(d.address_street || "");
      setAddrNumber(d.address_number || "");
      setAddrComplement(d.address_complement || "");
      setAddrNeighborhood(d.address_neighborhood || "");
      setAddrCity(d.address_city || "");
      setAddrState(d.address_state || "");
      setAddrZip(d.address_zip || "");
      setConsultationPrice(Number(d.consultation_price) || 150);
      setConsultationDuration(d.consultation_duration_min || 30);
      setAcceptsInsurance(!!d.accepts_insurance);
      setInsurancePlans(d.insurance_plans || []);
      setAvailTele(d.available_for_telemedicine ?? true);
      setAvailInPerson(!!d.available_for_in_person);
      setAutoConfirm(d.auto_confirm_bookings ?? true);
      setShowInDirectory(d.show_in_directory ?? true);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const lookupCep = async () => {
    const cep = addrZip.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const j = await r.json();
      if (j.erro) { toast.error("CEP não encontrado"); return; }
      setAddrStreet(j.logradouro || "");
      setAddrNeighborhood(j.bairro || "");
      setAddrCity(j.localidade || "");
      setAddrState(j.uf || "");
      toast.success("Endereço preenchido");
    } catch {
      toast.error("Erro ao consultar CEP");
    } finally { setCepLoading(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const blob = await resizeImage(file, 512);
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error } = await db.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      const { data: { publicUrl } } = db.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(publicUrl);
      await db.from("doctor_profiles").update({ avatar_url: publicUrl } as any).eq("user_id", user.id);
      await db.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      toast.success("Foto atualizada");
    } catch (err: any) {
      toast.error("Erro no upload", { description: err.message });
    } finally { setUploading(false); }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = `${user.id}/cover-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await db.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = db.storage.from("avatars").getPublicUrl(path);
      setCoverUrl(publicUrl);
      toast.success("Capa atualizada");
    } catch (err: any) {
      toast.error("Erro no upload", { description: err.message });
    } finally { setUploading(false); }
  };

  const toggleLanguage = (l: string) => setLanguages(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l]);
  const toggleInsurance = (i: string) => setInsurancePlans(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  const addEducation = () => setEducationList(p => [...p, { institution: "", degree: "", year: "" }]);
  const updateEducation = (i: number, f: keyof EducationItem, v: string) => setEducationList(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));
  const removeEducation = (i: number) => setEducationList(p => p.filter((_, idx) => idx !== i));

  const addCert = () => setCertifications(p => [...p, { name: "", issuer: "", year: "" }]);
  const updateCert = (i: number, f: keyof CertificationItem, v: string) => setCertifications(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));
  const removeCert = (i: number) => setCertifications(p => p.filter((_, idx) => idx !== i));

  const addSubSpec = () => {
    const v = subInput.trim();
    if (!v || subSpecialties.includes(v)) return;
    setSubSpecialties(p => [...p, v]);
    setSubInput("");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload: any = {
      full_name: fullName || null,
      display_name: displayName || null,
      birth_date: birthDate || null,
      gender: gender || null,
      cpf: cpf || null,
      crm: crm || null,
      crm_state: crmState || null,
      rqe: rqe || null,
      specialty_id: specialtyId || null,
      sub_specialties: subSpecialties,
      education_list: educationList.filter(e => e.institution || e.degree),
      certifications: certifications.filter(c => c.name),
      bio: bio || null,
      short_description: shortDescription || null,
      languages,
      experience_years: yearsExperience,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
      video_intro_url: videoIntroUrl || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      address_street: addrStreet || null,
      address_number: addrNumber || null,
      address_complement: addrComplement || null,
      address_neighborhood: addrNeighborhood || null,
      address_city: addrCity || null,
      address_state: addrState || null,
      address_zip: addrZip || null,
      consultation_price: consultationPrice,
      consultation_duration_min: consultationDuration,
      accepts_insurance: acceptsInsurance,
      insurance_plans: insurancePlans,
      available_for_telemedicine: availTele,
      available_for_in_person: availInPerson,
      auto_confirm_bookings: autoConfirm,
      show_in_directory: showInDirectory,
    };
    const { error } = profileId
      ? await db.from("doctor_profiles").update(payload).eq("id", profileId)
      : await db.from("doctor_profiles").insert({ ...payload, user_id: user.id });
    setSaving(false);
    if (error) toast.error("Erro ao salvar", { description: error.message });
    else toast.success("Perfil atualizado");
  };

  if (!isDoctor) {
    return <DashboardLayout title="Acesso negado" nav={[]} role="doctor"><div className="p-8">Apenas médicos podem acessar.</div></DashboardLayout>;
  }

  if (loading) {
    return <DashboardLayout title="Perfil Profissional" nav={nav} role="doctor"><div className="p-8 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div></DashboardLayout>;
  }

  const initials = (displayName || fullName || "DR").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <DashboardLayout title="Perfil Profissional" nav={nav} role="doctor">
      <div className="max-w-4xl mx-auto pb-24 md:pb-6 p-4 md:p-6">
        <button onClick={() => navigate("/dashboard?role=doctor")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary font-[Manrope]">Meu Perfil Profissional</h1>
          <p className="text-sm text-muted-foreground mt-1">Mantenha seu perfil completo para atrair mais pacientes.</p>
        </div>

        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-1 mb-6 h-auto bg-muted/30 p-1">
            <TabsTrigger value="public" className="gap-2"><User className="w-3.5 h-3.5" />Perfil Público</TabsTrigger>
            <TabsTrigger value="professional" className="gap-2"><Briefcase className="w-3.5 h-3.5" />Profissional</TabsTrigger>
            <TabsTrigger value="practice" className="gap-2"><Stethoscope className="w-3.5 h-3.5" />Atendimento</TabsTrigger>
            <TabsTrigger value="contact" className="gap-2"><MapPin className="w-3.5 h-3.5" />Contato</TabsTrigger>
            <TabsTrigger value="media" className="gap-2"><Film className="w-3.5 h-3.5" />Mídia</TabsTrigger>
          </TabsList>

          {/* Perfil Público */}
          <TabsContent value="public">
            <Card>
              <CardHeader><CardTitle>Perfil Público</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                      <AvatarImage src={avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:opacity-90 shadow-md">
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Foto de perfil</p>
                    <p className="text-xs text-muted-foreground">JPG ou PNG. Redimensionada para 512×512.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome completo</Label>
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dr. João da Silva" className="mt-1" />
                  </div>
                  <div>
                    <Label>Nome de exibição</Label>
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Dr. João" className="mt-1" />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Data de nascimento</Label>
                    <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Gênero</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {GENDERS.map(g => <SelectItem key={g.v} value={g.v}>{g.l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="mt-1" />
                  </div>
                </div>

                <div>
                  <Label>Descrição curta (headline)</Label>
                  <Input value={shortDescription} onChange={e => setShortDescription(e.target.value)} maxLength={140} placeholder="Ex: Cardiologista com foco em prevenção" className="mt-1" />
                  <p className="text-[11px] text-muted-foreground mt-0.5">{shortDescription.length}/140 caracteres</p>
                </div>

                <div>
                  <Label>Bio completa</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={5} placeholder="Conte sobre sua formação, abordagem clínica, áreas de interesse..." className="mt-1" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Anos de experiência</Label>
                    <Input type="number" min={0} max={80} value={yearsExperience} onChange={e => setYearsExperience(Number(e.target.value))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Idiomas</Label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {COMMON_LANGUAGES.map(l => (
                        <Badge key={l} variant={languages.includes(l) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleLanguage(l)}>
                          {l}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div>
                    <p className="text-sm font-semibold">Aparecer no diretório público</p>
                    <p className="text-xs text-muted-foreground">Pacientes podem encontrar seu perfil na busca.</p>
                  </div>
                  <Switch checked={showInDirectory} onCheckedChange={setShowInDirectory} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profissional */}
          <TabsContent value="professional">
            <Card>
              <CardHeader><CardTitle>Credenciais & Formação</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>CRM</Label>
                    <Input value={crm} onChange={e => setCrm(e.target.value)} placeholder="123456" className="mt-1" />
                  </div>
                  <div>
                    <Label>UF do CRM</Label>
                    <Select value={crmState} onValueChange={setCrmState}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {BR_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>RQE (opcional)</Label>
                    <Input value={rqe} onChange={e => setRqe(e.target.value)} placeholder="Ex: 12345" className="mt-1" />
                  </div>
                </div>

                <div>
                  <Label>Especialidade principal</Label>
                  <Select value={specialtyId} onValueChange={setSpecialtyId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione uma especialidade" /></SelectTrigger>
                    <SelectContent>
                      {specialties.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subespecialidades</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                    {subSpecialties.map(s => (
                      <Badge key={s} className="cursor-pointer gap-1" onClick={() => setSubSpecialties(p => p.filter(x => x !== s))}>
                        {s} ✕
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={subInput} onChange={e => setSubInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSubSpec())} placeholder="Adicionar..." />
                    <Button type="button" variant="secondary" onClick={addSubSpec}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Formação acadêmica</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addEducation}><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar</Button>
                  </div>
                  <div className="space-y-3">
                    {educationList.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma formação cadastrada.</p>}
                    {educationList.map((ed, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl border border-border/40">
                        <div className="col-span-5"><Label className="text-xs">Instituição</Label><Input value={ed.institution} onChange={e => updateEducation(i, "institution", e.target.value)} className="mt-1 h-9" /></div>
                        <div className="col-span-4"><Label className="text-xs">Grau/Curso</Label><Input value={ed.degree} onChange={e => updateEducation(i, "degree", e.target.value)} className="mt-1 h-9" /></div>
                        <div className="col-span-2"><Label className="text-xs">Ano</Label><Input value={ed.year} onChange={e => updateEducation(i, "year", e.target.value)} className="mt-1 h-9" /></div>
                        <Button type="button" size="icon" variant="ghost" className="col-span-1 h-9" onClick={() => removeEducation(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Certificações / Títulos</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addCert}><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar</Button>
                  </div>
                  <div className="space-y-3">
                    {certifications.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma certificação cadastrada.</p>}
                    {certifications.map((c, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl border border-border/40">
                        <div className="col-span-5"><Label className="text-xs">Título</Label><Input value={c.name} onChange={e => updateCert(i, "name", e.target.value)} className="mt-1 h-9" /></div>
                        <div className="col-span-4"><Label className="text-xs">Emissor</Label><Input value={c.issuer} onChange={e => updateCert(i, "issuer", e.target.value)} className="mt-1 h-9" /></div>
                        <div className="col-span-2"><Label className="text-xs">Ano</Label><Input value={c.year} onChange={e => updateCert(i, "year", e.target.value)} className="mt-1 h-9" /></div>
                        <Button type="button" size="icon" variant="ghost" className="col-span-1 h-9" onClick={() => removeCert(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Atendimento */}
          <TabsContent value="practice">
            <Card>
              <CardHeader><CardTitle>Atendimento & Preços</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Valor da consulta (R$)</Label>
                    <Input type="number" min={0} step={10} value={consultationPrice} onChange={e => setConsultationPrice(Number(e.target.value))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Duração (minutos)</Label>
                    <Select value={String(consultationDuration)} onValueChange={v => setConsultationDuration(Number(v))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[15,20,30,45,60,90].map(m => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div><p className="text-sm font-semibold">Telemedicina</p><p className="text-xs text-muted-foreground">Atendimento online por vídeo.</p></div>
                    <Switch checked={availTele} onCheckedChange={setAvailTele} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div><p className="text-sm font-semibold">Atendimento presencial</p><p className="text-xs text-muted-foreground">Consultas no consultório físico.</p></div>
                    <Switch checked={availInPerson} onCheckedChange={setAvailInPerson} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div><p className="text-sm font-semibold">Confirmação automática</p><p className="text-xs text-muted-foreground">Aceitar agendamentos sem revisão manual.</p></div>
                    <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div><p className="text-sm font-semibold">Aceita convênios</p><p className="text-xs text-muted-foreground">Pacientes com plano de saúde poderão selecionar você.</p></div>
                    <Switch checked={acceptsInsurance} onCheckedChange={setAcceptsInsurance} />
                  </div>
                </div>

                {acceptsInsurance && (
                  <div>
                    <Label>Planos aceitos</Label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {COMMON_INSURANCE.map(i => (
                        <Badge key={i} variant={insurancePlans.includes(i) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleInsurance(i)}>
                          {i}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contato & Endereço */}
          <TabsContent value="contact">
            <Card>
              <CardHeader><CardTitle>Contato & Endereço</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Telefone</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="mt-1" />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" className="mt-1" />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>CEP</Label>
                    <div className="relative mt-1">
                      <Input value={addrZip} onChange={e => setAddrZip(e.target.value)} onBlur={lookupCep} placeholder="00000-000" />
                      {cepLoading && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Rua</Label>
                    <Input value={addrStreet} onChange={e => setAddrStreet(e.target.value)} className="mt-1" />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Número</Label>
                    <Input value={addrNumber} onChange={e => setAddrNumber(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Complemento</Label>
                    <Input value={addrComplement} onChange={e => setAddrComplement(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Bairro</Label>
                    <Input value={addrNeighborhood} onChange={e => setAddrNeighborhood(e.target.value)} className="mt-1" />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label>Cidade</Label>
                    <Input value={addrCity} onChange={e => setAddrCity(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select value={addrState} onValueChange={setAddrState}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {BR_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mídia */}
          <TabsContent value="media">
            <Card>
              <CardHeader><CardTitle>Vídeo & Capa</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Foto de capa</Label>
                  <div className="mt-2 relative aspect-[4/1] rounded-xl overflow-hidden bg-muted border border-border/40">
                    {coverUrl ? <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem capa</div>}
                    <label className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-90 shadow-md">
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />} Alterar capa
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>

                <div>
                  <Label>URL do vídeo de apresentação</Label>
                  <Input value={videoIntroUrl} onChange={e => setVideoIntroUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-1" />
                  <p className="text-[11px] text-muted-foreground mt-0.5">Link do YouTube ou Vimeo com um vídeo curto (1-2 min) apresentando seu trabalho.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3 mt-6 sticky bottom-4 md:bottom-6 z-10">
          <Button onClick={handleSave} disabled={saving} size="lg" className="rounded-full shadow-lg bg-gradient-to-r from-primary to-[hsl(215,75%,40%)] text-primary-foreground font-bold px-8">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorProfileSettings;
