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


server.post('/participants',(request,response) => {
    
    const userSchema = joi.object({
        name: joi.string().required(),
    });

    const valid= userSchema.validate(request.body);
    console.log(valid);
    if (!valid.error){
        console.log("ok");
        const user = request.body.name;

        let teste = true;
        db.collection("users").find().toArray().then(users => {
            for (let value of users){
                {if (value === user){
                    teste = false}
                }
            }
        });
        if (teste){
            db.collection("users").insertOne({name:user,lastStatus: Date.now()});
            db.collection("messages").insertOne({from: user, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('LTS')});
            response.status(201).send();
        } else{
            response.status(409).send();
            
        }
    }else {
        response.status(422).send();
        console.log("erro!");
    }

    
}); //ta ok

server.get('/participants',(request,response) => {
    db.collection("users").find().toArray().then(users => {
		response.send(users)});
}); //ta ok

server.post('/messages',(request,response) => {
    
    const userSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),

    });

    const validate = userSchema.validate(request.body);

    let testeType = false;
    if (request.body.type === 'message' || request.body.type ==='private_message'){
        testeType = true;
    }

    let testeUser = true;
        db.collection("users").find().toArray().then(users => {
            for (let value of users){
                {if (value === request.query.User){
                    teste = false}
                }
            }
        });

    if (!validate.error && testeType && testeUser){
        const from = request.query.User;
        const to = request.body.to;
        const text = request.body.text;
        const type = request.body.type;
        db.collection("messages").insertOne({from, to, text, type, time: dayjs().format(LTS)});
        response.status(201).send();
        console.log("mensagem adicionada")
    } else{
        response.status(422).send();
        console.log('erro aqui');
    }    
    
});

server.get('/messages',(request,response) => {
    const limit = parseInt(request.query.limit);
    let listMessages = [];
    db.collection("messages").find().toArray().then(messages => {
		for (let value of messages){listMessages.push(value)}});
    if (listMessages.length <= limit){
        response.send(listMessages);
        console.log("passou pelo get de mensagens");;
    }
    else {
        let newList = [];
        for (let i=limit;i>=1;i--){
            let index = listMessages.length - i;
            newList.push(listMessages[index]);
        }
        response.send(newList);
    }
}); // ok

server.post('/status',(request,response) => {
    const activeUser = request.query.User;
    const user = db.collection("users").findOne({name:activeUser});
    if (!user) {
        response.status(404).send();
    } else{
        db.collection("users").updateOne({name:activeUser},{ $set: {lastStatus: Date.now()} });
        response.status(201).send();
    }
}); 


//setInterval(deleteUnactive,10000);

function deleteUnactive(){
    const currentTime = Date.now();
    const listUsers = [];
    db.collection("users").find().toArray().then(users => {
        for (let value of users){listUsers.push(value)}
    });
    for (let i of listUsers){
        if (i.lastStatus +10 < currentTime){
            db.collection("users").deleteOne({name:i.name});
        }
    }
}

server.get('/teste',(request,response) => {
    response.send("teste");
});

server.listen(5000);


/*correções:
substituir as buscas em listas por findOne
*/