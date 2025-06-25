
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDashboardClick = () => {
    console.log('Dashboard button clicked, user:', user);
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleAuthClick = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <LandingHeader user={user} onDashboardClick={handleDashboardClick} onAuthClick={handleAuthClick} />
      <HeroSection user={user} onDashboardClick={handleDashboardClick} onAuthClick={handleAuthClick} />
      <FeaturesSection />
      <BenefitsSection />
      <CTASection user={user} onDashboardClick={handleDashboardClick} onAuthClick={handleAuthClick} />
      <Footer />
    </div>
  );
};

export default Landing;
