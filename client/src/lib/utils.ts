import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateComplaintId() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `BC-${year}-${randomNum}`;
}

export function categoryDisplayName(category: string) {
  const categoryMap: Record<string, string> = {
    noise: 'Noise Complaint',
    garbage: 'Garbage Collection',
    lighting: 'Street Lighting',
    road: 'Road Repair',
    water: 'Water Supply',
    peace: 'Peace & Order',
    business: 'Business Permit',
    other: 'Other',
  };
  
  return categoryMap[category] || category;
}
