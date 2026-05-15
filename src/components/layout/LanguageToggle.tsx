import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className="gap-2"
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">{language === "en" ? "العربية" : "English"}</span>
    </Button>
  );
};
