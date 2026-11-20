import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import "dotenv/config";

// In ES Modules, __dirname doesn't exist by default, so we recreate it:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 4000,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true,
        ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
        },
    });

    try {
        const schemaPath = path.join(__dirname, "schema.sql");
        const sql = fs.readFileSync(schemaPath, "utf8");

        await connection.query(sql);
        console.log("All 11 tables created successfully!");

        const [tables] = await connection.query("SHOW TABLES");
        console.log(
            "Tables in TiDB:",
            tables.map((row) => Object.values(row)[0]),
        );
    } catch (err) {
        console.error("Error initializing schema:", err.message);
    } finally {
        await connection.end();
    }
}

initDb();
