import { z } from 'zod';

// Contact form validation schema
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .refine((val) => val.length > 0, "Name cannot be empty"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  message: z
    .string()
    .trim()
    .max(1000, "Message must be less than 1000 characters")
    .optional(),
  interests: z
    .array(z.string())
    .max(10, "Too many interests selected")
    .optional()
    .default([])
});

// Event form validation schema
export const eventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(2000, "Description must be less than 2000 characters"),
  event_date: z
    .string()
    .min(1, "Event date is required")
    .refine((date) => {
      const eventDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    }, "Event date cannot be in the past"),
  event_time: z
    .string()
    .trim()
    .min(1, "Event time is required")
    .max(50, "Event time must be less than 50 characters"),
  location: z
    .string()
    .trim()
    .max(200, "Location must be less than 200 characters")
    .default(""),
  event_type: z
    .enum(['CTF', 'Workshop', 'Conference', 'Meetup'], {
      errorMap: () => ({ message: "Please select a valid event type" })
    }),
  status: z
    .enum(['upcoming', 'completed', 'cancelled'], {
      errorMap: () => ({ message: "Please select a valid status" })
    })
});

// Blog form validation schema
export const blogSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  excerpt: z
    .string()
    .trim()
    .max(300, "Excerpt must be less than 300 characters")
    .optional(),
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(50000, "Content is too long"),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(50, "Category must be less than 50 characters"),
  tags: z
    .array(z.string().trim().max(30, "Tag must be less than 30 characters"))
    .max(10, "Too many tags")
    .optional()
    .default([]),
  status: z
    .enum(['draft', 'published', 'rejected'], {
      errorMap: () => ({ message: "Please select a valid status" })
    })
});

// Project form validation schema
export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(1000, "Description must be less than 1000 characters"),
  github_url: z
    .string()
    .trim()
    .url("Invalid GitHub URL")
    .refine((url) => url.includes('github.com'), "Must be a GitHub URL"),
  language: z
    .string()
    .trim()
    .max(50, "Language must be less than 50 characters")
    .optional(),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(50, "Category must be less than 50 characters"),
  tags: z
    .array(z.string().trim().max(30, "Tag must be less than 30 characters"))
    .max(10, "Too many tags")
    .optional()
    .default([])
});

// Authentication validation schema
export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .refine((password) => /[A-Z]/.test(password), "Password must contain at least one uppercase letter")
    .refine((password) => /[a-z]/.test(password), "Password must contain at least one lowercase letter")
    .refine((password) => /[0-9]/.test(password), "Password must contain at least one number"),
  confirmPassword: z
    .string()
    .optional(),
  firstName: z
    .string()
    .trim()
    .max(50, "First name must be less than 50 characters")
    .optional(),
  lastName: z
    .string()
    .trim()
    .max(50, "Last name must be less than 50 characters")
    .optional()
}).refine((data) => {
  if (data.confirmPassword !== undefined) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Profile update validation schema
export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .max(50, "First name must be less than 50 characters")
    .optional(),
  lastName: z
    .string()
    .trim()
    .max(50, "Last name must be less than 50 characters")
    .optional(),
  bio: z
    .string()
    .trim()
    .max(500, "Bio must be less than 500 characters")
    .optional(),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number must be less than 20 characters")
    .optional()
});

// Type exports
export type ContactFormData = z.infer<typeof contactSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type BlogFormData = z.infer<typeof blogSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type AuthFormData = z.infer<typeof authSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;