import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input(props: InputProps) {
  return <input {...props} />;
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea(props: TextareaProps) {
  return <textarea {...props} />;
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: number; label: string }[];
};

export function Select({ options, ...props }: SelectProps) {
  return (
    <select {...props}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
