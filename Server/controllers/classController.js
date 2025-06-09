const Class = require("../models/classModel");
const Student = require("../models/studentModel");
const Exam = require("../models/examinationModel");
const Schedule = require("../models/scheduleModel");
const Teacher = require("../models/teacherModel"); 

module.exports = {
  getAllClasses: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allClasses = await Class.find({ school: schoolId });

      res.status(200).json({ 
        success: true, 
        message: "Fetched all Classes", 
        data: allClasses 
      });
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ 
        success: false, 
        message: "Server Error in class fetching" 
      });
    }
  },

  getClassWithId: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const classId = req.params.id;

      
      const selectedClass = await Class.findOne({ 
        school: schoolId, 
        _id: classId 
      }).populate("attendee", "name email"); 

      if (selectedClass) {
        return res.status(200).json({ 
          success: true, 
          message: "Class Data Found", 
          data: selectedClass 
        });
      } else {
        return res.status(404).json({ 
          success: false, 
          message: "Class not found or access denied" 
        });
      }
    } catch (error) {
      console.error("Error fetching class by ID:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal Server Error" 
      });
    }
  },

  getAttendeClass: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const attendeeId = req.params.id;

      
      const selectedClass = await Class.find({ 
        school: schoolId, 
        attendee: req.user.id 
      }); 

      if (selectedClass) {
        return res.status(200).json({ 
          success: true, 
          message: "Class Data Found", 
          data: selectedClass 
        });
      } else {
        return res.status(404).json({ 
          success: false, 
          message: "Class not found or access denied" 
        });
      }
    } catch (error) {
      console.error("Error fetching class by Attendee:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal Server Error" 
      });
    }
  },

  createClass: async (req, res) => {
    try {
      
      if (!req.body.classText || !req.body.classNum) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: classText and classNum are required"
        });
      }

      
      const existingClass = await Class.findOne({
        school: req.user.schoolId,
        classNum: req.body.classNum
      });

      if (existingClass) {
        return res.status(409).json({
          success: false,
          message: "A class with this number already exists"
        });
      }

      const newClass = new Class({
        school: req.user.schoolId,
        classText: req.body.classText,
        classNum: req.body.classNum,
        attendee: req.body.attendee || null,
      });

      const savedClass = await newClass.save();

      res.status(201).json({ 
        success: true, 
        message: "Class Created",
        data: savedClass
      });
    } catch (err) {
      console.error("Error creating class:", err);
      res.status(500).json({ 
        success: false, 
        message: "Server Error in class Creation" 
      });
    }
  },

  updateClassWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;
      
      
      const existingClass = await Class.findOne({ _id: id, school: schoolId });
      
      if (!existingClass) {
        return res.status(404).json({
          success: false,
          message: "Class not found or access denied"
        });
      }

      
      if (req.body.attendee) {
        const teacherExists = await Teacher.exists({ 
          _id: req.body.attendee, 
          school: schoolId 
        });
        
        if (!teacherExists) {
          return res.status(400).json({
            success: false,
            message: "Invalid teacher ID provided"
          });
        }
      }
      
      
      await Class.findOneAndUpdate(
        { _id: id, school: schoolId }, 
        { $set: req.body },
        { new: false, runValidators: true }
      );
      
      
      const classAfterUpdate = await Class.findOne({ 
        _id: id, 
        school: schoolId 
      }).populate("attendee", "name email");
      
      res.status(200).json({
        success: true,
        message: "Class updated successfully",
        data: classAfterUpdate,
      });
    } catch (err) {
      console.error("Error updating class:", err);
      res.status(500).json({ 
        success: false, 
        message: "Server Error in class updating", 
        error: err.message 
      });
    }
  },

  deleteClassWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      
      const existingClass = await Class.findOne({ _id: id, school: schoolId });
      
      if (!existingClass) {
        return res.status(404).json({
          success: false,
          message: "Class not found or access denied"
        });
      }

      
      const classStudentCount = await Student.countDocuments({ 
        studentClass: id, 
        school: schoolId 
      });
      
      const classExamCount = await Exam.countDocuments({ 
        class: id, 
        school: schoolId 
      });
      
      const classScheduleCount = await Schedule.countDocuments({ 
        class: id, 
        school: schoolId 
      });

      if (classStudentCount > 0 || classExamCount > 0 || classScheduleCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot delete this class as it is currently in use",
          details: {
            students: classStudentCount,
            exams: classExamCount,
            schedules: classScheduleCount
          }
        });
      }

      
      await Class.findOneAndDelete({ _id: id, school: schoolId });
      
      return res.status(200).json({ 
        success: true, 
        message: "Class deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ 
        success: false, 
        message: "Server Error in class deletion",
        error: error.message
      });
    }
  },
};