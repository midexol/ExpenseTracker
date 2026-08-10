import { z } from "zod";
import { CATEGORIES, PRIORITIES, RECURRENCE_OPTIONS } from "./constants";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  timezoneOffset: z.number().int().default(0),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const expenseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  category: z.enum(CATEGORIES),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().min(1).default("NGN"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  timezoneOffset: z.number().int().default(0),
});

export const todoSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(140),
  notes: z.string().trim().max(1000).optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  priority: z.enum(PRIORITIES).default("Med"),
  recurrence: z.enum(RECURRENCE_OPTIONS).default("NONE"),
});

export const todoUpdateSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  priority: z.enum(PRIORITIES).optional(),
  recurrence: z.enum(RECURRENCE_OPTIONS).optional(),
  completed: z.boolean().optional(),
  timezoneOffset: z.number().int().default(0),
});

export const budgetSchema = z.object({
  amount: z.number().min(0),
  period: z.enum(["Weekly", "Monthly"]),
  currency: z.string().min(1).default("NGN"),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
