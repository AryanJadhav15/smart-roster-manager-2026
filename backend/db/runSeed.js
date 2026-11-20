import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
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
        const seedPath = path.join(__dirname, "seed.sql");
        const sql = fs.readFileSync(seedPath, "utf8");

        await connection.query(sql);
        console.log("seed.sql executed successfully!");

        const [counts] = await connection.query(`
        SELECT
        (SELECT COUNT(*) FROM Pod) AS pods,
        (SELECT COUNT(*) FROM Employee) AS employees,
        (SELECT COUNT(*) FROM Process) AS processes,
        (SELECT COUNT(*) FROM Brand) AS brands,
        (SELECT COUNT(*) FROM Brand_Process) AS brand_processes,
        (SELECT COUNT(*) FROM Employee_Allocation) AS allocations,
        (SELECT COUNT(*) FROM Public_Holidays) AS holidays,
        (SELECT COUNT(*) FROM Employee_Leaves) AS leaves
    `);
        console.log("Row counts in TiDB:", counts[0]);
    } catch (err) {
        console.error("Error running seed.sql:", err.message);
    } finally {
        await connection.end();
    }
}

runSeed();
