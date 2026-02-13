import express from 'express';
import multer from 'multer';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import {v4 as uuidv4} from 'uuid'
import {Queue} from 'bullmq';

const app=express();
app.use(express.static());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors())
app.use(helmet())
app.use(morgan())

//connection to bullmq redis
const videoQueue=new Queue('video-processing',{
    connection:{
        host:'127.0.0.1',
        port:6379
    }
});

//multer configuration
const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        const uploadPath='./upload'
        if(!fs.exixtsSync(uploadPath)) fs.mkdirSync(uploadPath);
        cb(null,uploadPath);
    },
    filename:(req,file,cb)=>{
        const unique_suffix=Date.now()+'_'+Math.round(Math.random() * 1E9);
        const filename=file.fieldname+'_'+unique_suffix+path.extname(file.originalname)
        cb(null,filename);
    }
});

const upload=multer({
    storage:storage,
    limits:{fileSize : 100 * 1024 * 1024}
});


app.use('/api/v1/upload',upload.single('video'),async(req,res)=>{
    if(!req.file){
        return res.status(201).json({message:'failed to upload file'});
    }

    console.log('contents of req.file:\n', req.file)

    await videoQueue.add('transcoder',{
        file:req.file.path,
        name:req.file.name
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
});

app.listen(PORT,()=>{
    console.log('listening on port',PORT);
})