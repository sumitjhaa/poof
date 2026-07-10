import React from "react";

type SecretDisplayProps = {
  secret: string;
  label?: string;
};

export function SecretDisplay({ secret, label = "Your secret:" }: SecretDisplayProps) {
  return (
    <div className="secret-box">
      <p>{label}</p>
      <pre>{secret}</pre>
    </div>
  );
}
