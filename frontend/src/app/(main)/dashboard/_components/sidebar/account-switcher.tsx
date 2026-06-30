"use client";

import { useState } from "react";

import { BadgeCheck, Bell, CreditCard, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { AuthService } from "@/features/auth/api/auth.service";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials } from "@/lib/utils";

export function AccountSwitcher() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
    } catch (e) {
      console.error("Logout API failed", e);
    } finally {
      localStorage.removeItem("refresh_token");
      logout();
      router.push("/auth/v1/login");
    }
  };

  const displayName = `${user.firstName} ${user.lastName}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <DropdownMenuItem
          className="p-0 bg-accent/50"
          aria-current="true"
        >
          <div className="flex w-full items-center gap-2 px-1 py-1.5">
            <Avatar className="size-9 rounded-lg">
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{displayName}</span>
              <span className="truncate text-xs capitalize text-muted-foreground">{user.userType.replace('_', ' ').toLowerCase()}</span>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50">
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
