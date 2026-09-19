import { useRef, type KeyboardEvent } from "react";

type RadioValue = string | number;

type UseRadioGroupOptions<T extends RadioValue> = {
  values: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
};

export const useRadioGroup = <T extends RadioValue>({
  values,
  value,
  onChange,
}: UseRadioGroupOptions<T>) => {
  const elements = useRef(new Map<T, HTMLButtonElement | null>());

  const moveBy = (offset: number) => {
    if (values.length === 0) return;

    const current = value === null ? -1 : values.indexOf(value);
    const from = current === -1 ? 0 : current;
    const next = values[(from + offset + values.length) % values.length];
    if (next === undefined) return;

    onChange(next);
    elements.current.get(next)?.focus();
  };

  const tabbableValue =
    value !== null && values.includes(value) ? value : values[0];

  const getRadioProps = (radioValue: T) => ({
    role: "radio",
    "aria-checked": radioValue === value,
    tabIndex: radioValue === tabbableValue ? 0 : -1,
    ref: (element: HTMLButtonElement | null) => {
      elements.current.set(radioValue, element);
    },
    onClick: () => onChange(radioValue),
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        moveBy(1);
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        moveBy(-1);
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        onChange(radioValue);
      }
    },
  });

  return { getRadioProps };
};
