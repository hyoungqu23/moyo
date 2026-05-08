"use client";

import { Combobox, type ComboOption } from "@/components/ui/Combobox";

export function SearchInput({
  name,
  options = [],
  value,
  onValueChange,
  onSelect,
}: {
  name?: string;
  options?: ComboOption[];
  value?: string;
  onValueChange?: (next: string) => void;
  onSelect?: (option: ComboOption) => void;
}) {
  return (
    <Combobox
      label="메뉴 검색"
      name={name}
      options={options}
      placeholder="메뉴명을 검색하세요"
      value={value}
      onValueChange={onValueChange}
      onSelect={onSelect}
    />
  );
}
