import express from "express";
import { signUpSchema, signInSchema, CreateRoomSchema } from "@repo/common/zod"

const app =  express();

app.get("/signup", (req, res) => {
    const[email, password, userName] = req.body;

    const parseData = signUpSchema.safeParse(req.body);

    if(!parseData.success) {
        res.status(411).json({
            message: "Incorrect format.",
            error: parseData.error
        });
        return;
    }
})

app.listen(3001);