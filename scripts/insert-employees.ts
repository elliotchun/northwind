import mongoose from "mongoose";
import { readdir } from "node:fs/promises";
import path from "path";
import { Employee } from "../src/models/employee";

const dataDir = path.join(__dirname, "..", "data", "submissions");

await mongoose.connect(process.env.MONGODB_URI!, {
    dbName: "northwind",
    bufferCommands: false,
});

const employees = [];

const dirs = await readdir(dataDir);
for (const dir of dirs) {
    const filePath = path.join(dataDir, dir, "employee_info.json");
    const content = Bun.file(filePath);
    const info = await content.json();

    employees.push({
        employee_id: info.employee_id,
        name: info.name,
        grade: info.grade,
        title: info.title,
        department: info.department,
        home_base: info.home_base,
    });
}

const result = await Employee.insertMany(employees, { ordered: false });
console.log(`Inserted ${result.length} employees`);

await mongoose.disconnect();
