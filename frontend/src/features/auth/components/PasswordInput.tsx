"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icons";
export function PasswordInput({id,name,label,autoComplete}:{id:string;name:string;label:string;autoComplete:string}){const [showPassword,setShowPassword]=useState(false);return <label className="field" htmlFor={id}><span>{label}</span><span className="input-wrap"><Icon name="lock"/><input id={id} name={name} type={showPassword?"text":"password"} autoComplete={autoComplete} required/><button type="button" aria-label={showPassword?"Ẩn mật khẩu":"Hiện mật khẩu"} onClick={()=>setShowPassword(!showPassword)} className="cursor-pointer"><Icon name={showPassword?"eye":"eyeOff"}/></button></span></label>}
