import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const uploadPath=path.resolve(__dirname,'../../temp/uploads');

//multer configuration
export const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        if(!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath,{recursive:true});
        cb(null,uploadPath);
    },
    filename:(req,file,cb)=>{
        const unique_suffix=Date.now()+'_'+Math.round(Math.random() * 1E9);
        const filename=file.fieldname+'_'+unique_suffix+path.extname(file.originalname)
        cb(null,filename);
    }
});

export const upload=multer({
    storage:storage,
    limits:{fileSize : 100 * 1024 * 1024}
});