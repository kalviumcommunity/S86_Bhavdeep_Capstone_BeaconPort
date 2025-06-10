require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cron = require("node-cron");
const path = require("path");
const Schedule = require("./models/scheduleModel");


const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}



function setupScheduleCleanupJob() {
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        console.log("Running schedule cleanup job...");
        const now = new Date();

        const updateResult = await Schedule.updateMany(
          {
            status: "active",
            endTime: { $lt: now },
          },
          {
            $set: { status: "completed" },
          }
        );

        console.log(
          `Marked ${updateResult.modifiedCount} schedules as completed`
        );

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deleteResult = await Schedule.deleteMany({
          status: "completed",
          endTime: { $lt: thirtyDaysAgo },
        });

        console.log(
          `Deleted ${deleteResult.deletedCount} old completed schedules`
        );
      } catch (error) {
        console.error("Error in schedule cleanup job:", error);
      }
    },
    {
      scheduled: true,
      timezone: "UTC",
    }
  );
}





app.get('/', (req,res) => {
    res.send("Hello! Welcome to School Management System")
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
