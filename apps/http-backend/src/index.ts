import 'dotenv/config'
import express from "express"
import jwt from "jsonwebtoken"
import brcypt from "bcrypt"
import { prismaClient } from "@repo/db/prismaClient";
import { signUpSchema, signInSchema, CreateRoomSchema } from "@repo/common/zod"
import { userMiddleware } from './middleware';
import AuthenticatedRequest from './middleware';

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
            message: "Signup succussful.",
            token: token
        })
    } catch {
        res.status(409).json({
            message: "Email already exist."
        })
    }
})

app.post("/signin", async (req, res) => {
    const parsedData = signInSchema.safeParse(req.body);

    if(!parsedData.success) {
        res.status(411).json({
            message: "Incorrect credentials."
        })
        return;
    }

    // finding user in db
    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.email
        }
    })

    if(!user) {
        res.status(401).json({
            message: "Incorrect email."
        })
        return;
    }

    // comparing entered password with hashed password
    const matchedPassword = await brcypt.compare(parsedData.data.password, user.password);

    if(matchedPassword) {
        const token = jwt.sign({
            userId: user.id
        }, process.env.JWT_SECRET!);
    
        res.status(200).json({
            message: "Signin succussful.",
            token: token
        })
    } else {             
        res.status(401).json({
            messaage: "Incorrect password."
        })
        return;
    }
})

app.post("/room", userMiddleware, async(req: AuthenticatedRequest, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);

    if(!parsedData.success) {
        res.status(411).json({
            message: "Invalid input."
        })
        return;
    }

    const userId = req.userId;

    try{
        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data.roomName,
                adminId: userId!
            }
        })
    
        res.status(200).json({
            roomId: room.id,
            message: "Room created succussfully."
        })
    } catch {
        res.status(409).json({
            message: "Room name already exists."
        })
    }
})

app.listen(3001);