import express from 'express';
import multer from 'multer';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import {v4 as uuidv4} from 'uuid'
import cors from 'cors';
import {initMinio} from '@aether/infra';

await initMinio();
const PORT=process.env.PORT;
// const uploadToMinio=async(fileName,filePath)
const app=express();
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors())
// app.use(helmet())
app.use(morgan('dev'))



import v1Router from './routes/v1/routes_v1.js';
app.use('/api/v1',v1Router);


app.listen(PORT,()=>{
    console.log('listening on port',PORT);
});