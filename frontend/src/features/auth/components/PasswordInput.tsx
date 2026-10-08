"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icons";
export function PasswordInput({id,name,label,autoComplete}:{id:string;name:string;label:string;autoComplete:string}){const [visible,setVisible]=useState(false);return <label className="field" htmlFor={id}><span>{label}</span><span className="input-wrap"><Icon name="lock"/><input id={id} name={name} type={visible?"text":"password"} autoComplete={autoComplete} required/><button type="button" aria-label={visible?"Ẩn mật khẩu":"Hiện mật khẩu"} onClick={()=>setVisible(!visible)}><Icon name={visible?"eyeOff":"eye"}/></button></span></label>}
