import {Worker} from 'bullmq';
import IORedis from 'ioredis';
import { exec,spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import {ffmpeg_args} from './constants.js';
import { downloadFromMinio,initMinio } from '@aether/shared-utils';

await initMinio();

const connection=new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest:null
});
const worker=new Worker('video-processing',async(job)=>{
    // console.log(job);

    const videoId=job.data.name.split('.')[0];
    // const inputPath=job.data.file;
    const outputPath=`processed_data/${videoId}`;

    //I have to create an API endpoint to serve the playlist URL to the frontend
    const playlistUrl=`http://localhost:3000/videos/${videoId}/index.m3u8`;

    const remoteFileName=job.data.name;
    const localDownloadPath=`raw_data/${remoteFileName.split('.')[0]}`
    await downloadFromMinio(remoteFileName,localDownloadPath);
    //0->1080 1->720 2->480
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(`${outputPath}/0`, { recursive: true });
        fs.mkdirSync(`${outputPath}/1`, { recursive: true });
        fs.mkdirSync(`${outputPath}/2`, { recursive: true });
    }

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
        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                console.log('FFmpeg finished successfully');
                resolve({ 
                    status: 'success',
                    message:'video successfully processed',
                    playlisturl:playlistUrl 
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