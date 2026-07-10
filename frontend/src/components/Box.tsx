import React from "react";

type PolymorphicProps<T extends React.ElementType> = {
  as?: T;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<T>;

export function Box<T extends React.ElementType = "div">({
  as,
  children,
  ...props
}: PolymorphicProps<T>) {
  const Component = as || "div";
  return <Component {...props}>{children}</Component>;
}
