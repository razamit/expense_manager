"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface YearPickerProps {
  year: number;
  onChange: (year: number) => void;
}

export function YearPicker({ year, onChange }: YearPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => onChange(year - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[92px] text-center text-sm font-medium">{year}</span>
      <Button variant="ghost" size="icon" onClick={() => onChange(year + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}