const PHONE = "+256745368426";
const MSG = "Hello TennaHub Technologies, I'd like to inquire about your services for our school management system.";
const WA_URL = `https://wa.me/${PHONE.replace(/\D/g, "")}?text=${encodeURIComponent(MSG)}`;

interface Props {
  variant?: "footer" | "print";
}

export const PoweredBy = ({ variant = "footer" }: Props) => {
  if (variant === "print") {
    return (
      <div className="powered-by hidden print:block mt-8 pt-4 border-t border-slate-300 text-center">
        <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="no-underline">
          <h1 className="text-base font-bold text-slate-800 m-0">
            Powered By TennaHub Technologies Limited
          </h1>
          <p className="text-xs text-slate-600 mt-1">{PHONE}</p>
        </a>
      </div>
    );
  }
  return (
    <footer className="powered-by mt-12 border-t border-border/60 pt-6 pb-8 text-center">
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block group transition-transform hover:scale-[1.02]"
      >
        <h1 className="text-sm md:text-base font-extrabold tracking-tight bg-gradient-to-r from-primary via-emerald-500 to-primary bg-clip-text text-transparent group-hover:from-emerald-600 group-hover:to-primary">
          Powered By TennaHub Technologies Limited
        </h1>
        <p className="text-[11px] text-muted-foreground mt-1 tracking-wide">
          Tap to chat on WhatsApp · {PHONE}
        </p>
      </a>
    </footer>
  );
};
