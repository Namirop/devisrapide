"use client";

import { SignOut } from "@phosphor-icons/react";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  email: string;
  firstName: string | null;
};

function initials(firstName: string | null, email: string): string {
  if (firstName && firstName.trim().length > 0) {
    return firstName.trim().slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

/**
 * Menu utilisateur du TopBar admin. Sobre : avatar charcoal + label
 * "Espace Admin" (au lieu du nom commercial cote pro). Dropdown unique
 * action : se deconnecter.
 */
export function AdminUserMenu({ email, firstName }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-slate-100">
        <Avatar className="h-9 w-9">
          <AvatarFallback
            className="text-[13px] font-semibold text-white"
            style={{ backgroundColor: "#1a1f2e" }}
          >
            {initials(firstName, email)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-[14px] font-semibold text-slate-900">
            {firstName ?? "Admin"}
          </span>
          <span className="text-[12px] text-slate-500">Espace Admin</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col px-2 py-1.5">
          <span className="text-[13px] font-semibold text-slate-900">
            {firstName ?? "Admin"}
          </span>
          <span className="text-[12px] font-normal text-slate-500">
            {email}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-rose-600 focus:text-rose-600"
          onClick={() => {
            void signOut({ callbackUrl: "/" });
          }}
        >
          <SignOut size={16} weight="regular" aria-hidden />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
