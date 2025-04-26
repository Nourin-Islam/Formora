import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function camelToPascal(str: string) {
  if (!str) return str; // Handle empty string
  return str.charAt(0).toUpperCase() + str.slice(1);
}
