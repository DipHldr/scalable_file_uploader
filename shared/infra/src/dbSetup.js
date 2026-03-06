import pkg from 'pg';

const {Pool}=pkg

export const pool=new Pool({
    host:process.env.DB_HOST || 'localhost',
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    port:process.env.DB_PORT,
    max:20,
    idleTimeoutMillis:30000
});

export const query = (text,params)=>pool.query(text,params); 

