import { z } from "zod";

export const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(4).max(20)
})

export const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(4).max(20)
})

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20)
})