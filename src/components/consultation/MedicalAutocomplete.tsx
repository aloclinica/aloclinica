import { useState, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { db } from "@/integrations/supabase/untyped";

interface MedicalAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  field: "diagnosis" | "notes";
  placeholder?: string;
  className?: string;
}

const MedicalAutocomplete = ({ value, onChange, field, placeholder, className }: MedicalAutocompleteProps) => {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestion = useCallback(async (text: string) => {
    if (text.length < 10) { setSuggestion(""); return; }
    setLoading(true);
    try {
      const { data, error } = await db.functions.invoke("medical-autocomplete", {
        body: { text, field },
      });
      if (!error && data?.suggestion) {
        setSuggestion(data.suggestion);
      } else {
        setSuggestion("");
      }
    } catch {
      setSuggestion("");
    }
    setLoading(false);
  }, [field]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setSuggestion("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestion(newValue), 1500);
  };

  const acceptSuggestion = () => {
    if (suggestion) {
      const separator = value.endsWith(" ") || value.endsWith(".") ? " " : " ";
      onChange(value + separator + suggestion);
      setSuggestion("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && suggestion) {
      e.preventDefault();
      acceptSuggestion();
    }
  };

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {suggestion && (
        <div className="mt-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Sugestão da IA — pressione <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px] font-mono">Tab</kbd> para aceitar</p>
              <p className="text-sm text-foreground/80">{suggestion}</p>
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className="absolute top-2 right-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default MedicalAutocomplete;
