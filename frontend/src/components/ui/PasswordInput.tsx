import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "./Input";

export type PasswordInputProps = Omit<InputProps, "type" | "rightIcon">;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleShowPassword = () => {
      setShowPassword((prev) => !prev);
    };

    const toggleButton = (
      <button
        type="button"
        onClick={toggleShowPassword}
        tabIndex={-1}
        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-[var(--color-heading)] focus:outline-none transition-colors rounded-lg"
      >
        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
      </button>
    );

    return (
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        rightIcon={toggleButton}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";
