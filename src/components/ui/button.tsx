import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
}

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2";

  const variants = {
    default: "bg-emerald-500 text-white hover:bg-emerald-600",
    outline: "border border-gray-300 bg-white hover:bg-gray-100",
    ghost: "hover:bg-gray-100",
    destructive: "bg-red-500 text-white hover:bg-red-600"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className || ""}`}
      {...props}
    />
  );
}
