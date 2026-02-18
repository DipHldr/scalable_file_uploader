import { minioClient,BUCKET_NAME } from "./minioSetup";
import path from 'path';
import fs from 'fs';

const uploadToMinio=async(fileName,filePath)=>{
    try {
        const metaData={
            'Content-Type':'video/mp4'
        }
        const objInfo=await minioClient.fPutObject({
            BUCKET_NAME,
            fileName,
            filePath,
            metaData
        });

        console.log('From upload to minio',objInfo);
        return fileName
    } catch (error) {
        console.log('error uploading file',error);
        throw error;        
    }

}

const downloadFromMinio=async(remoteFilename,localDownloadPath)=>{
    try {
        const dir=path.dirname(localDownloadPath);
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir,{recursive:true});
        }
        console.log(`fetching from [${remoteFilename}] -> [${localDownloadPath}]`);
        await minioClient.fGetObject(BUCKET_NAME,remoteFilename,localDownloadPath);
        console.log(`download Complete ${localDownloadPath}`);
        return localDownloadPath;
    } catch (error) {
        console.log("Error fetching file: ",error);
        throw error;        
    }
}

export {downloadFromMinio,uploadToMinio};