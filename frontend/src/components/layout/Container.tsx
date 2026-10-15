import React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
}

export function Container({
  as: Component = "div",
  children,
  className,
  ...props
}: ContainerProps) {
  return (
    <Component className={cn("container-custom", className)} {...props}>
      {children}
    </Component>
  );
}
