import express from 'express';
import multer from 'multer';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import {v4 as uuidv4} from 'uuid'
import cors from 'cors';
import {Queue} from 'bullmq';
import {storage,upload} from './multerConfig.js';
import { uploadToMinio,initMinio } from '@aether/shared-utils';

await initMinio();
const PORT=3000
// const uploadToMinio=async(fileName,filePath)
const app=express();
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors())
// app.use(helmet())
app.use(morgan('dev'))

//connection to bullmq redis
const videoQueue=new Queue('video-processing',{
    connection:{
        host:'127.0.0.1',
        port:6379
    }
});

app.post('/api/v1/upload',upload.single('video'),async(req,res)=>{
    console.log("Hello from server\n");

    try {
        if(!req.file){
        return res.status(400).json({message:'failed to upload file'});
    }


    console.log('contents of req.file:\n', req.file)

    const fileName=req.file.filename;
    const filePath=req.file.path;
    await uploadToMinio(fileName,filePath);

    await videoQueue.add('transcoder',{
        file:filePath,
        name:fileName
    },{
        attempts:3,
        backoff:1000
    });

    return res.status(200).json({
        message:'Uploaded Successfully',
        fileInfo:{
            url:req.file.path,
            name:req.file.filename,
            size:req.file.size,
        }
    });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Error",
            error:error
        });
        
    }
    
});

app.listen(PORT,()=>{
    console.log('listening on port',PORT);
})