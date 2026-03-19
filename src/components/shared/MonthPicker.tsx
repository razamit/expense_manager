"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthPicker({ month, year, onChange }: MonthPickerProps) {
  function goBack() {
    if (month === 0) {
      onChange(11, year - 1);
    } else {
      onChange(month - 1, year);
    }
  }

  function goForward() {
    if (month === 11) {
      onChange(0, year + 1);
    } else {
      onChange(month + 1, year);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={goBack}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[140px] text-center">
        {MONTH_NAMES[month]} {year}
      </span>
      <Button variant="ghost" size="icon" onClick={goForward}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
