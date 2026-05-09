import { z } from "zod";

export const CreateUserSchema = z.object({
    username: z.string(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string(),
});

export const SigninSchema = z.object({
    username: z.string(),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(100),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
