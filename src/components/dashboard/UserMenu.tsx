"use client";

import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
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
  companyName: string;
  email: string;
};

// Initiales (2 premieres lettres) du companyName pour l'avatar.
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function UserMenu({ companyName, email }: Props) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-slate-100">
        <Avatar className="h-9 w-9">
          <AvatarFallback
            className="text-[13px] font-semibold text-white"
            style={{ backgroundColor: "#1e3a8a" }}
          >
            {initials(companyName)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-[14px] font-semibold text-slate-900">
            {companyName}
          </span>
          <span className="text-[12px] text-slate-500">Espace artisan</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Header de menu : remplace DropdownMenuLabel (qui exige un
            parent <Menu.Group> en base-ui — non utilise ici) par un
            simple div stylé. */}
        <div className="flex flex-col px-2 py-1.5">
          <span className="text-[13px] font-semibold text-slate-900">
            {companyName}
          </span>
          <span className="text-[12px] font-normal text-slate-500">
            {email}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push("/dashboard/profil")}
        >
          <UserIcon className="h-4 w-4" aria-hidden />
          Mon profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-rose-600 focus:text-rose-600"
          onClick={() => {
            void signOut({ callbackUrl: "/" });
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
