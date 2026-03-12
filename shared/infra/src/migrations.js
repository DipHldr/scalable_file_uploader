import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {pool} from './dbSetup.js';

const __dirname=path.dirname(fileURLToPath(import.meta.url));

export const runMigrations = async () =>{
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations(
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
        );
    `);
    const migrationsDir = path.resolve(__dirname,'../../../infra/migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for(const file of files){
        const {rowCount}=await pool.query(
            `SELECT 1 FROM schema_migrations WHERE version =$1`,
            [file]
        );
        if(rowCount === 0){
            console.log(`Applying migrations ${file}`);

            const sql=fs.readFileSync(path.join(migrationsDir,file),'utf8');

            const client = await pool.connect();

            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('INSERT INTO schema_migrations (version) VALUES ($1)',[file]);
                await client.query('COMMIT');
                console.log(`${file} applied`)
            } catch (error) {
                await client.query('ROLLBACK');
                console.log(`Failed applying ${file}: `,error);
                throw error;
            }finally{
                client.release();
            }
        }
    }
}