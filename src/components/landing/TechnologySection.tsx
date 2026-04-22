import { motion } from "framer-motion";
import { Video, ShieldCheck, Cpu, Lock } from "lucide-react";
// Removido import local para usar URL externa conforme solicitado
const technologyImage = "https://cvbgrjauqjawrsyknhyj.supabase.co/storage/v1/object/public/files/uploads/0XILPRqqUbSOh99ow53X5OBDOCC3/1776865110528-nxrit-doctor-tecnologia-removebg-preview.png";

const TechnologySection = ({ config }: { config?: any }) => {
  const title = config?.title || "Inovação a serviço da sua saúde";
  const subtitle = config?.subtitle || "Utilizamos tecnologia de ponta para oferecer uma experiência médica segura e eficiente. Cada detalhe foi pensado para garantir qualidade no atendimento.";
  
  const features = [
    {
      icon: <Video className="w-5 h-5 text-primary" />,
      title: "Videochamada em HD",
      description: "Conexão estável com criptografia ponta a ponta para consultas seguras e sem interrupção.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-primary" />,
      title: "Receita Digital Válida",
      description: "Prescrições com assinatura digital certificada ICP-Brasil, aceitas em qualquer farmácia do país.",
    },
    {
      icon: <Cpu className="w-5 h-5 text-primary" />,
      title: "Inteligência Artificial",
      description: "IA para auxiliar médicos em diagnósticos, otimizar laudos e melhorar a experiência do paciente.",
    },
    {
      icon: <Lock className="w-5 h-5 text-primary" />,
      title: "Proteção de Dados (LGPD)",
      description: "Seus dados são protegidos com os mais altos padrões de segurança e em total conformidade com the LGPD.",
    },
  ];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[32px] p-8 md:p-16 shadow-xl shadow-blue-500/5 border border-blue-100/50">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              className="flex justify-center relative"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative">
                <img 
                  src={technologyImage} 
                  alt="Tecnologia de ponta" 
                  className="w-full max-w-[450px] h-auto drop-shadow-2xl select-none" 
                />
              </div>
            </motion.div>

            <div className="flex flex-col">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1E3A8A] bg-[#1E3A8A]/[0.05] px-4 py-2 rounded-full mb-6">
                  <Cpu className="w-3.5 h-3.5" /> NOSSA TECNOLOGIA
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-[#1E3A8A] leading-[1.1] mb-6">
                  {title.includes("sua") ? (
                    title.split("sua").map((part, i) => (
                      <span key={i}>
                        {part}
                        {i === 0 && <span className="text-[#3B82F6]">sua</span>}
                      </span>
                    ))
                  ) : (
                    title
                  )}
                </h2>
                <p className="text-[#64748B] text-lg leading-relaxed max-w-xl">{subtitle}</p>
              </motion.div>

              <div className="grid gap-4">
                {features.map((feature, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-5 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1E3A8A] text-lg mb-0.5">{feature.title}</h3>
                      <p className="text-sm text-[#64748B] line-clamp-2">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;