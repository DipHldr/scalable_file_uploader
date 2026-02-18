import multer from 'multer';
//multer configuration
export const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        const uploadPath='./upload'
        if(!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
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