import fs from 'fs';
import {Worker} from 'bullmq';
import IORedis from 'ioredis';
import { exec,spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import {ffmpeg_args} from './constants.js';
import { initMinio} from '@aether/infra';
import {downloadFromMinio,uploadDirectoryToMinio} from '@aether/utils';
import path from 'path';
import {fileURLToPath} from 'url';


await initMinio();

const __dirname=path.dirname(fileURLToPath(import.meta.url));

const connection=new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest:null
});

const worker=new Worker('video-processing',async(job)=>{
    // console.log(job);

    const videoId=job.data.name.split('.')[0];
    // const inputPath=job.data.file;
    
    //I have to create an API endpoint to serve the playlist URL to the frontend
    // const playlistUrl=`http://localhost:3000/videos/${videoId}/index.m3u8`;
    
    const rootDir=path.resolve(__dirname,'../.');
    const localDownloadPath=path.resolve(rootDir,'temp/raw',job.data.name);
    const remoteFileName=job.data.storageKey;
    const outputPath=path.join(rootDir,'temp/processed',videoId);
    const storageKey=`videos/processed/${videoId}`
    
    if(!fs.existsSync(path.dirname(localDownloadPath))){
        fs.mkdirSync(path.dirname(localDownloadPath),{recursive:true});
    }

    //0->1080 1->720 2->480
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(`${outputPath}/0`, { recursive: true });
        fs.mkdirSync(`${outputPath}/1`, { recursive: true });
        fs.mkdirSync(`${outputPath}/2`, { recursive: true });
    }

    await downloadFromMinio(remoteFileName,localDownloadPath);

    return new Promise((resolve,reject)=>{

        const ffmpegProcess=spawn('ffmpeg',ffmpeg_args(localDownloadPath,outputPath));


        // console.log('test ->\n',ffmpegProcess.stderr);
        // Capturing stderr to track progress
        ffmpegProcess.stderr.on('data',(data)=>{
            const output=data.toString();
            console.log(output);
            //FFmpeg sends strings like "time=00:00:15.24"
            //using regex to get timestamp
            const timeMatch = output.match(/time=(\d{2}:\d{2}:\d{2}.\d{2})/);
            if (timeMatch) {
                const elapsed = timeMatch[1];
                console.log(`[Job ${job.id}] Progress: ${elapsed}`);
                
                //updating the BullMQ progress here
                job.updateProgress({ time: elapsed });
            }

        });
        //Handling process completion
        ffmpegProcess.on('close', async (code) => {
            if (code === 0) {
                console.log('FFmpeg finished successfully');
                await uploadDirectoryToMinio(storageKey,outputPath);

                
                if(fs.existsSync(localDownloadPath)){
                    fs.rmSync(localDownloadPath,{force:true})
                }
                if(fs.existsSync(outputPath)){
                    fs.rmSync(outputPath,{recursive:true,force:true});
                }
                const hls_url=`${storageKey}/index.m3u8`;
                resolve({ 
                    status: 'success',
                    message:'video successfully processed',
                    playlisturl:hls_url
                });
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });

        //Handling process errors (like "ffmpeg not found")
        ffmpegProcess.on('error', (err) => {
            reject(err);
        });

    });


},{connection})