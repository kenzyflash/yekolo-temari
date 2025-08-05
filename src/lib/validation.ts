import { z } from 'zod';

// Blog post validation schema
export const blogPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional(),
  
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters'),
  
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters'),
  
  tags: z.array(z.string().max(30, 'Tags must be less than 30 characters each'))
    .max(10, 'Maximum 10 tags allowed'),
  
  status: z.enum(['draft', 'pending', 'published'])
});

// User profile validation schema
export const userProfileSchema = z.object({
  first_name: z.string()
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'First name can only contain letters and spaces')
    .optional(),
  
  last_name: z.string()
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'Last name can only contain letters and spaces')
    .optional(),
  
  bio: z.string()
    .max(1000, 'Bio must be less than 1000 characters')
    .optional(),
  
  phone: z.string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
    .optional()
});

// Authentication validation schema
export const authSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email must be less than 254 characters'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  first_name: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'First name can only contain letters and spaces'),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'Last name can only contain letters and spaces'),
  
  phone: z.string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
    .optional()
});

// Event validation schema
export const eventSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  
  event_date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  
  event_time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters'),
  
  event_type: z.string()
    .min(1, 'Event type is required')
    .max(50, 'Event type must be less than 50 characters')
});

// Project validation schema
export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  
  github_url: z.string()
    .url('Invalid GitHub URL')
    .refine((url) => url.includes('github.com'), 'Must be a GitHub URL'),
  
  language: z.string()
    .max(30, 'Language must be less than 30 characters')
    .optional(),
  
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters'),
  
  tags: z.array(z.string().max(30, 'Tags must be less than 30 characters each'))
    .max(10, 'Maximum 10 tags allowed')
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type AuthInput = z.infer<typeof authSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;