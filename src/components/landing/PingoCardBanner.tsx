import { useNavigate } from "react-router-dom";
import bannerImg from "@/assets/pingo-card-banner.png";

const PingoCardBanner = () => {
  const navigate = useNavigate();

  return (
    <section
      aria-label="Pingo Card - Cartão de saúde digital"
      onClick={() => navigate("/pingo-card")}
      className="relative w-full overflow-hidden cursor-pointer group"
      style={{
        backgroundImage: `url(${bannerImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "hsl(215, 80%, 10%)",
      }}
    >
      {/* Mantém proporção da arte (≈ 1920x540) */}
      <div className="w-full" style={{ aspectRatio: "1920 / 540" }} />
      <span className="sr-only">Conhecer o Pingo Card</span>
    </section>
  );
};

export default PingoCardBanner;
