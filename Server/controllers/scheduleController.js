const Subject = require("../models/subjectModel");
const Student = require("../models/studentModel");
const Exam = require("../models/examinationModel");
const Schedule = require("../models/scheduleModel");
const Teacher = require("../models/teacherModel");

module.exports = {
  getSchedulewithClass: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const classId = req.params.id;
      
      
      await updateScheduleStatuses(schoolId);
      
      const schedules = await Schedule.find({
        school: schoolId,
        class: classId,
        status: { $ne: 'completed' } 
      })
      .populate('teacher', 'name')
      .populate('subject', 'subjectName')
      .sort({ startTime: 1 }); 

      res.status(200).json({
        success: true,
        message: "Fetched all schedules",
        data: schedules,
      });
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res
        .status(500)
        .json({ success: false, message: "Server Error in Schedule fetching" });
    }
  },

  getScheduleById: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const scheduleId = req.params.id;
      
      const schedule = await Schedule.findOne({
        _id: scheduleId,
        school: schoolId
      })
      .populate('teacher', 'name')
      .populate('subject', 'subjectName')
      .populate('class', 'classText');

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found"
        });
      }

      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error("Error fetching schedule by ID:", error);
      res.status(500).json({
        success: false,
        message: "Server Error in fetching schedule"
      });
    }
  },

  createSchedule: async (req, res) => {
    try {
      const { teacher, subject, selectedClass, startTime, endTime, date } = req.body;
      
      console.log("Schedule creation data:", {
        teacher, 
        subject, 
        class: selectedClass, 
        date,
        startTime, 
        endTime
      });
      
      
      if (!teacher || !subject || !selectedClass || !startTime || !endTime || !date) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields for schedule creation"
        });
      }
      
      
      let formattedStartTime, formattedEndTime;
      
      try {
        
        formattedStartTime = new Date(`${date}T${startTime}`);
        formattedEndTime = new Date(`${date}T${endTime}`);
        
        
        if (isNaN(formattedStartTime.getTime()) || isNaN(formattedEndTime.getTime())) {
          throw new Error("Invalid date format");
        }
      } catch (dateError) {
        console.error("Date parsing error:", dateError);
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD for date and HH:MM for time"
        });
      }
      
      
      const now = new Date();
      if (formattedEndTime < now) {
        return res.status(400).json({
          success: false,
          message: "Cannot create schedule in the past"
        });
      }
      
      
      let status = 'active';
      
      const newSchedule = new Schedule({
        school: req.user.schoolId,
        teacher,
        subject,
        class: selectedClass,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        status
      });

      await newSchedule.save();

      res.status(201).json({ 
        success: true, 
        message: "Schedule Created",
        data: newSchedule 
      });
    } catch (err) {
      console.error("Error creating schedule:", err);
      res
        .status(500)
        .json({ 
          success: false, 
          message: "Server Error in Schedule Creation",
          error: err.message
        });
    }
  },


  deleteScheduleWithId: async (req, res) => {
    try {
      let id = req.params.id;
      let schoolId = req.user.schoolId;

      
      const existingSchedule = await Schedule.findOne({ 
        _id: id, 
        school: schoolId 
      });
      
      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found or you don't have permission to delete it"
        });
      }
      
      
      if (existingSchedule.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: "Cannot delete a completed schedule"
        });
      }

      const deletedSchedule = await Schedule.findOneAndDelete({ _id: id, school: schoolId });
      
      res.status(200).json({ 
        success: true, 
        message: "Schedule deleted",
        data: deletedSchedule._id
      });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res
        .status(500)
        .json({ success: false, message: "Server Error in Schedule deleting" });
    }
  },
  
  
  cleanupCompletedSchedules: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const result = await updateScheduleStatuses(schoolId);
      
      res.status(200).json({
        success: true,
        message: "Completed schedules updated",
        completedCount: result.completedCount,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error("Error cleaning up schedules:", error);
      res.status(500).json({
        success: false,
        message: "Server Error in schedule cleanup"
      });
    }
  },

  
  getTeacherSubjects: async (req, res) => {
    try {
      const teacherId = req.params.teacherId;
      const schoolId = req.user.schoolId;
      
      if (!teacherId) {
        return res.status(400).json({
          success: false,
          message: "Teacher ID is required"
        });
      }
      
      
      const teacher = await Teacher.findOne({
        _id: teacherId,
        school: schoolId
      }).populate('subjects');
      
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found"
        });
      }
      
      
      if (teacher.subjects && teacher.subjects.length > 0) {
        return res.status(200).json({
          success: true,
          subjects: teacher.subjects
        });
      } else {
        
        return res.status(200).json({
          success: true,
          subjects: []
        });
      }
    } catch (error) {
      console.error("Error fetching teacher subjects:", error);
      res.status(500).json({
        success: false,
        message: "Server error in fetching teacher subjects"
      });
    }
  }
};


async function updateScheduleStatuses(schoolId) {
  const now = new Date();
  
  
  const result = await Schedule.updateMany(
    {
      school: schoolId,
      status: 'active',
      endTime: { $lt: now }
    },
    {
      $set: { status: 'completed' }
    }
  );
  
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const deleteResult = await Schedule.deleteMany({
    school: schoolId,
    status: 'completed',
    endTime: { $lt: thirtyDaysAgo }
  });
  
  return {
    completedCount: result.modifiedCount,
    deletedCount: deleteResult.deletedCount
  };
}