import 'dotenv/config'
import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken"
import { prismaClient } from "@repo/db/prismaClient";

const wss = new WebSocketServer({ port: 8080 });

interface User {
    ws: WebSocket;
    rooms: string[];
    userId : string;
}
// empty 'users' array to store the user details in memory.
const users: User[] = [];

// function to check whether the token is valid or not.
function checkUser(token: string): string | null {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        if(typeof decoded == "string") {
            return null
        }
        if(!decoded || !decoded.userId) {
            return null
        }
        return decoded.userId;
    } catch(e) {
        return null;
    }
}

wss.on("connection", function connection(ws, request) {
    const url = request.url;
    if(!url) {
        return;
    }
    // to get url from the original url
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token') || ""
    const userId = checkUser(token);

    if(userId == null) {
        ws.close();
        return null;
    }

    // if the token is valid, we will  push the userId extracted from the token to the users[].
    users.push({
        userId,
        ws,
        rooms: []
    })

    ws.on("message", async function message(data) {
        // the 'data' sent by the user will be in string hence it should be converted into json.
        const parsedData = JSON.parse(data as unknown as string);           // output: {"type": "join_room"/"leave_room", "roomId": 1}.

        if(parsedData.type == "join_room") {
            // checking whether user exist in 'users[]'.
            const user = users.find(x => x.ws === ws);
            
            if(!user) {
                return;
            }
            user.rooms.push(parsedData.roomId);
        }

        if(parsedData.type == "leave_room") {
            const user = users.find(x => x.ws === ws)

            if(!user) {
                return;
            }
            // filter the particular roomId to exit.
            user.rooms = user.rooms.filter(x => x === parsedData.room)
        }

        if(parsedData.type == "chat") {
            // checking whether user exist in 'users[]'
            const user = users.find(x => x.ws === ws);
            
            if(!user) {
                return;
            }

            const roomId = parsedData.roomId;
            const message = parsedData.message;

            // for every user's room which includes the roomId sent by user from input, send the message.
            for(const user of users){
                if(user.rooms.includes(roomId)) {
                    // dumb way of adding messages to db.
                    await prismaClient.chat.create({                           // ideally push it to the queue through pipeline to the db.
                        data: {
                            roomId,
                            message,
                            userId
                        }
                    });
                    // broadcasting messages after adding them to db.
                    user.ws.send(JSON.stringify({
                        type: "chat",
                        message,
                        roomId
                    }));
                }
            }
                
        }

    });
});