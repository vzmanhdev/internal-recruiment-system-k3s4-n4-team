import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children:ReactNode; href?:string; variant?:"primary"|"secondary" };
export function Button({ children, href, variant="primary", className="", ...props }: Props) {
  const classes = `button button--${variant} ${className}`;
  return href ? <Link className={classes} href={href}>{children}</Link> : <button className={classes} {...props}>{children}</button>;
}
