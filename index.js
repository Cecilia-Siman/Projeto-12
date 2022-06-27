import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from 'joi'

const server = express();
server.use(cors());
server.use(express.json());
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URL);

let db;
mongoClient.connect().then(() => {
	db = mongoClient.db("chat");
});


server.post('/participants',async (request,response) => {
    
    const userSchema = joi.object({
        name: joi.string().required(),
    });

    const valid= userSchema.validate(request.body);
    if (!valid.error){
        const user = request.body.name;

        let teste = true;
        await db.collection("users").find().toArray().then(users => {
            for (let value of users){
                {if (value === user){
                    teste = false}
                }
            }
        });
        if (teste){
            await db.collection("users").insertOne({name:user,lastStatus: Date.now()});
            await db.collection("messages").insertOne({from: user, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss')});
            response.status(201).send();
        } else{
            response.status(409).send();
            
        }
    }else {
        response.status(422).send();
    }

    
}); //ta ok

server.get('/participants',(request,response) => {
    db.collection("users").find().toArray().then(users => {
		response.send(users)});
}); //ta ok

server.post('/messages', async (request,response) => {
    
    const messageSchema = joi.object({
        to: joi.string().required(),
        type: joi.string().required(),
        text: joi.string().required(),

    });

    const validate = messageSchema.validate(request.body);
    let testeType = false;
    if (request.body.type === 'message' || request.body.type ==='private_message'){
        testeType = true;
    }

    let testeUser = true;
        await db.collection("users").find().toArray().then(users => {
            for (let value of users){
                {if (value === request.query.User){
                    teste = false}
                }
            }
        });

    if (!validate.error && testeType && testeUser){
        const from = request.headers.user;
        const to = request.body.to;
        const text = request.body.text;
        const type = request.body.type;
        await db.collection("messages").insertOne({from, to, text, type, time: dayjs().format('HH:mm:ss')});
        response.status(201).send();
    } else{
        response.status(422).send();
    }    
    
});

server.get('/messages', async (request,response) => {
    const limit = parseInt(request.query.limit);
    let listMessages = [];
    await db.collection("messages").find().toArray().then(messages => {
		for (let value of messages){listMessages.push(value)}});
    if (listMessages.length <= limit){

        response.send(listMessages);
    }
    else {
        let newList = [];
        for (let i=limit;i>=1;i--){
            let index = listMessages.length - i;
            newList.push(listMessages[index]);
        }
        response.send(newList);
    }
});

server.post('/status', async (request,response) => {
    const activeUser = request.headers.user;
    const user = await db.collection("users").findOne({name:activeUser});
    if (!user) {
        response.status(404).send();
    } else{
        await db.collection("users").updateOne({name:activeUser},{ $set: {lastStatus: Date.now()} });
        response.status(201).send();
    }
}); 


setInterval(deleteUnactive,10000);

function deleteUnactive(){
    const currentTime = Date.now();
    const listUsers = [];
    db.collection("users").find().toArray().then(users => {
        for (let value of users){
            if (value.lastStatus+15 < currentTime){
                db.collection("users").deleteOne({name:value.name});
                db.collection("messages").insertOne({from: value.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: 'HH:MM:SS'});
            }
    }
    });
}

server.listen(5000);
