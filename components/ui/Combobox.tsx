"use client";

import { useId, useState } from "react";

export type ComboOption = { id: string; label: string };

export function Combobox({
  label,
  options,
  placeholder,
  value: controlledValue,
  onValueChange,
  onSelect,
}: {
  label: string;
  options: ComboOption[];
  placeholder?: string;
  value?: string;
  onValueChange?: (next: string) => void;
  onSelect?: (option: ComboOption) => void;
}) {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const [internalValue, setInternalValue] = useState("");
  const value = controlledValue ?? internalValue;
  const updateValue = (next: string) => {
    if (controlledValue === undefined) setInternalValue(next);
    onValueChange?.(next);
  };
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const filtered = options
    .filter((option) =>
      option.label.toLowerCase().includes(value.toLowerCase()),
    )
    .slice(0, 5);
  const activeId =
    open && filtered[active] ? `${id}-option-${active}` : undefined;

  const commit = (option: ComboOption) => {
    updateValue(option.label);
    setOpen(false);
    onSelect?.(option);
  };

  return (
    <div className="relative w-full">
      <input
        role="combobox"
        aria-label={label}
        aria-expanded={open && filtered.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-activedescendant={activeId}
        className="h-11 w-full rounded-full border border-black/10 bg-white px-5 text-[17px]"
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          updateValue(event.target.value);
          setOpen(event.target.value.length > 0);
          setActive(0);
        }}
        onFocus={() => setOpen(value.length > 0)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((current) => Math.min(current + 1, filtered.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
          }
          if (event.key === "Enter" && open && filtered[active]) {
            event.preventDefault();
            commit(filtered[active]);
          }
          if (event.key === "Escape" || event.key === "Tab") setOpen(false);
        }}
      />
      {open && filtered.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-hairline bg-white p-2"
        >
          {filtered.map((option, index) => (
            <li
              id={`${id}-option-${index}`}
              key={option.id}
              role="option"
              aria-selected={active === index}
              className="cursor-pointer rounded-sm px-6 py-3 text-[17px] aria-selected:bg-parchment"
              onMouseDown={(event) => {
                event.preventDefault();
                commit(option);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
