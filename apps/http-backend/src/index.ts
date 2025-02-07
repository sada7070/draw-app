import 'dotenv/config'
import express from "express"
import jwt from "jsonwebtoken"
import brcypt from "bcrypt"
import { prismaClient } from "@repo/db/prismaClient";
import { signUpSchema, signInSchema, CreateRoomSchema } from "@repo/common/zod"

const app =  express();
app.use(express.json());

app.post("/signup", async(req, res) => {
    const parsedData = signUpSchema.safeParse(req.body);

    if(!parsedData.success) {
        res.status(411).json({
            message: "Incorrect format.",
            error: parsedData.error
        });
        return;
    }

    try{
        // password hashing.
        const hashedPassword = await brcypt.hash(parsedData.data.password, 5);

        // adding to db
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data.email,
                password: hashedPassword,
                userName: parsedData.data.userName
            }
        })
        // generating jwt token
        const token = jwt.sign({
            userId: user.id
        }, process.env.JWT_SECRET!);

        res.status(200).json({
            message: "Account created succussfully.",
            token: token
        })
    } catch {
        res.status(409).json({
            message: "Email already exist."
        })
    }
})

app.listen(3001);