import express,  { NextFunction, Request, Response } from 'express';
import 'dotenv/config'
import authRouter from './routes/auth.routes';
import createHttpError from 'http-errors';
import bodyParser from 'body-parser';
import profileRouter from './routes/profile.routes';
import logger from './helpers/logger';
import adminRouter from './routes/admin.routes';

const app = express();

/* logger logs handling */
app.use((req, res, next) => {
  logger.info(`Incoming request`, { method: req.method, url: req.url });
  next();
});

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


//route all requests with a specific endpoint
app.use('/auth', authRouter)
app.use('/profile', profileRouter)
app.use("/admin", adminRouter)

//handle endpoints not found: 404
app.use(async (req, res, next) => {
  next(createHttpError.NotFound("Route not found"))
})

//errors from controllers send via next(error) is catched by this.
app.use((err: any, req:Request, res:Response, next: NextFunction) => {
  res.status(err.status || 500)
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  })
})

app.listen(process.env.PORT, () => console.log("server running at " + process.env.PORT))