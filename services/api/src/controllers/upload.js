import {uploadToMinio} from '@aether/utils';
import path from 'path';
import {Queue} from 'bullmq';
import fs from 'fs';

// await initMinio();

//connection to bullmq redis
const videoQueue=new Queue('video-processing',{
    connection:{
        host:process.env.REDIS_HOST||'127.0.0.1',
        port:process.env.REDIS_PORT||6379
    }
});

export const uploadVideo=async(req,res)=>{
    console.log("Hello from server\n");

    try {

        if(!req.file){
            return res.status(400).json({message:'failed to upload file'});
        }


        // console.log('contents of req.file:\n', req.file)

        const fileName=req.file.filename;

        const absoluteFilePath=path.resolve(req.file.path);

        const storageKey=`videos/raw/${fileName}`;

        await uploadToMinio(storageKey,absoluteFilePath);

        if(fs.existsSync(absoluteFilePath)){
            fs.unlinkSync(absoluteFilePath);
        }


        await videoQueue.add('transcoder',{
            storageKey:storageKey,
            name:fileName
        },{
            attempts:3,
            backoff:1000
        });

        return res.status(200).json({
            message:'Uploaded Successfully',
            fileInfo:{
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
    
}