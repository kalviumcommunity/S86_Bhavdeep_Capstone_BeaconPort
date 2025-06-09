const Attendance = require("../models/attendanceModel");
const Student = require("../models/studentModel");
const moment = require("moment");
const mongoose = require("mongoose");

module.exports = {
  markAttendance: async (req, res) => {
    try {
      const { studentId, date, status, classId, notes } = req.body;
      const schoolId = req.user.schoolId;
      if (!studentId || !date || !status || !classId) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields" 
        });
      }

     
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid student ID format"
        });
      }

     
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid class ID format"
        });
      }

     
      if (!['Present', 'Absent'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'Present' or 'Absent'"
        });
      }

     
      const formattedDate = moment(date, "YYYY-MM-DD", true);
      if (!formattedDate.isValid()) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }

     
      const existingAttendance = await Attendance.findOne({
        student: studentId,
        date: {
          $gte: formattedDate.startOf('day').toDate(),
          $lt: formattedDate.clone().endOf('day').toDate()
        },
        class: classId,
        school: schoolId
      });

      if (existingAttendance) {
        return res.status(409).json({
          success: false,
          message: "Attendance has already been marked for this student today",
          data: existingAttendance
        });
      }

     
      const newAttendance = new Attendance({
        student: studentId,
        date: formattedDate.toDate(),
        status,
        notes: notes || '',
        class: classId,
        school: schoolId,
      });

      await newAttendance.save();
      
      res.status(201).json({ 
        success: true, 
        message: "Attendance marked successfully",
        data: newAttendance 
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal Server Error" 
      });
    }
  },

 
  markBulkAttendance: async (req, res) => {
    try {
      const { attendanceData, classId, date } = req.body;
      const schoolId = req.user.schoolId;

     
      if (!attendanceData || !Array.isArray(attendanceData) || !classId || !date) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields"
        });
      }

     
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid class ID format"
        });
      }

     
      const formattedDate = moment(date, "YYYY-MM-DD", true);
      if (!formattedDate.isValid()) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }

     
      const existingAttendance = await Attendance.findOne({
        class: classId,
        school: schoolId,
        date: {
          $gte: formattedDate.startOf('day').toDate(),
          $lt: formattedDate.clone().endOf('day').toDate()
        }
      });

      if (existingAttendance) {
        return res.status(409).json({
          success: false,
          message: "Attendance has already been taken for this class today"
        });
      }

     
      const validAttendanceData = [];
      for (const record of attendanceData) {
        if (!record.studentId || !mongoose.Types.ObjectId.isValid(record.studentId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid student ID in attendance data"
          });
        }

        if (!['Present', 'Absent'].includes(record.status)) {
          return res.status(400).json({
            success: false,
            message: "Status must be either 'Present' or 'Absent'"
          });
        }

        validAttendanceData.push({
          student: record.studentId,
          date: formattedDate.toDate(),
          status: record.status,
          notes: record.notes || '',
          class: classId,
          school: schoolId
        });
      }

     
      const savedAttendance = await Attendance.insertMany(validAttendanceData);

      res.status(201).json({
        success: true,
        message: `Attendance marked successfully for ${savedAttendance.length} students`,
        data: savedAttendance
      });

    } catch (error) {
      console.error("Error marking bulk attendance:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  },

  getAttendance: async (req, res) => {
    try {
      const studentId = req.params.id;

     
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Valid student ID is required" 
        });
      }

      console.log(`Fetching attendance for student ID: ${studentId}`);

     
      const student = await Student.findById(studentId)
        .populate('studentClass');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

     
      const attendance = await Attendance.find({ student: studentId })
        .populate({
          path: 'class',
          select: 'classText section'
        })
        .sort({ date: -1 });

      console.log(`Found ${attendance.length} attendance records for ${student.name}`);

      res.status(200).json({ 
        success: true, 
        attendance,
        student
      });
    } catch (error) {
      console.error("Error getting attendance:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal Server Error" 
      });
    }
  },

 
  getBulkAttendance: async (req, res) => {
    try {
      const { studentIds } = req.body;
      const { startDate, endDate } = req.query;
      
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Valid student IDs array is required"
        });
      }

     
      const validIds = studentIds.every(id => mongoose.Types.ObjectId.isValid(id));
      if (!validIds) {
        return res.status(400).json({
          success: false,
          message: "One or more invalid student IDs"
        });
      }

     
      let dateFilter = {};
      if (startDate && endDate) {
        const startDateObj = moment(startDate, "YYYY-MM-DD", true);
        const endDateObj = moment(endDate, "YYYY-MM-DD", true);
        
        if (!startDateObj.isValid() || !endDateObj.isValid()) {
          return res.status(400).json({
            success: false,
            message: "Invalid date format. Use YYYY-MM-DD"
          });
        }

        dateFilter = {
          date: {
            $gte: startDateObj.startOf('day').toDate(),
            $lte: endDateObj.endOf('day').toDate()
          }
        };
      }

     
      const attendanceRecords = await Attendance.find({
        student: { $in: studentIds },
        ...dateFilter
      })
      .populate('student', 'name studentClass')
      .populate('class', 'classText section')
      .sort({ date: -1 });

     
      const groupedAttendance = {};
      attendanceRecords.forEach(record => {
        const studentId = record.student._id.toString();
        if (!groupedAttendance[studentId]) {
          groupedAttendance[studentId] = {
            student: record.student,
            attendance: []
          };
        }
        groupedAttendance[studentId].attendance.push(record);
      });

      res.status(200).json({
        success: true,
        data: groupedAttendance
      });
    } catch (error) {
      console.error("Error getting bulk attendance:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  },

  checkAttendance: async (req, res) => {
    try {
      const classId = req.params.classId;

      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Valid class ID is required" 
        });
      }

      const today = moment().startOf("day");
      const attendanceForToday = await Attendance.findOne({
        class: classId,
        date: {
          $gte: today.toDate(),
          $lt: today.clone().endOf("day").toDate(),
        },
      });

      return res.status(200).json({ 
        success: true,
        attendanceTaken: Boolean(attendanceForToday),
        message: attendanceForToday 
          ? "Attendance has already been taken for today" 
          : "Attendance has not been taken yet for today",
      });
    } catch (error) {
      console.error("Error checking attendance:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
};