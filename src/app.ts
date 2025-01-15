import express,  { Request, Response } from 'express';
import 'dotenv/config'

const app = express();
console.log("Hello world");

app.get("/test", (_req: Request, res: Response) => {
    res.send({message: "This is a test route", route: "/test"});
})

app.listen(process.env.PORT || 5000, () => console.log("server running@5000"))