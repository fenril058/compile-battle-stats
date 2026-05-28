import type { GroupBase } from "react-select";
import Select from "react-select";
import type { ProtocolGroup } from "../config";
import type { Protocol } from "../types";

type Option = { value: string; label: string };

type Props = {
  value: Protocol;
  onChange: (v: Protocol) => void;
  protocolGroups: readonly ProtocolGroup[];
  disabled?: boolean;
  ariaLabel?: string;
};

export function ProtocolSelect({
  value,
  onChange,
  protocolGroups,
  disabled = false,
  ariaLabel,
}: Props) {
  const options: GroupBase<Option>[] = protocolGroups.map((group) => ({
    label: group.label,
    options: group.protocols.map((p) => ({ value: p, label: p })),
  }));

  return (
    <div className="w-full mb-1">
      <Select<Option, false, GroupBase<Option>>
        options={options}
        value={{ value, label: value }}
        onChange={(selected) => {
          if (selected) onChange(selected.value as Protocol);
        }}
        isDisabled={disabled}
        isSearchable
        unstyled
        aria-label={ariaLabel}
        noOptionsMessage={() => "一致するプロトコルがありません"}
        styles={{
          menu: (base) => ({ ...base, zIndex: 50 }),
        }}
        classNames={{
          control: ({ isFocused }) =>
            `bg-zinc-800 border rounded p-1 text-sm cursor-pointer ${
              isFocused ? "border-zinc-500" : "border-zinc-700"
            }`,
          valueContainer: () => "px-1",
          singleValue: () => "text-zinc-100",
          input: () => "text-zinc-100",
          placeholder: () => "text-zinc-400",
          indicatorsContainer: () => "px-1",
          dropdownIndicator: () => "text-zinc-400",
          indicatorSeparator: () => "hidden",
          menu: () =>
            "mt-1 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl",
          menuList: () => "max-h-52 overflow-y-auto py-1",
          groupHeading: () =>
            "sticky top-0 px-3 py-1 text-xs font-semibold text-zinc-400 bg-zinc-700 uppercase tracking-wide",
          option: ({ isSelected, isFocused }) =>
            `px-4 py-1.5 text-sm cursor-pointer ${
              isFocused
                ? "bg-zinc-500"
                : isSelected
                  ? "bg-zinc-700 font-semibold"
                  : ""
            }`,
          noOptionsMessage: () => "px-3 py-2 text-sm text-zinc-400 text-center",
        }}
      />
    </div>
  );
}
