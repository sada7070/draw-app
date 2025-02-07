import { z } from "zod";

export const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(4).max(30),
    userName: z.string().max(30)
})

export const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(4).max(30)
})

export const CreateRoomSchema = z.object({
    roomName: z.string().max(30)
})