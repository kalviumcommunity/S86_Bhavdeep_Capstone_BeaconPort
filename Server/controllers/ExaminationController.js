const Examination = require("../models/examinationModel");
const Teacher = require("../models/teacherModel");
const Student = require("../models/studentModel");


const SCHOOL_ONLY_EXAM_TYPES = ['Mid Term', 'Final Term', 'Annual Exam', 'Semester Exam'];
const TEACHER_ALLOWED_EXAM_TYPES = ['Quiz', 'Class Test', 'Pop Quiz', 'Unit Test', 'Weekly Test', 'Slip Test'];

module.exports = {
  createExamination: async (req, res) => {
    try {
      const { role, schoolId, id } = req.user;
      const { date, subjectId, examType, classId, startTime, endTime, duration } = req.body;
      
      
      if (!date || !subjectId || !examType || !classId || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: "All fields are required: date, subjectId, examType, classId, startTime, endTime"
        });
      }

      
      if (role === 'TEACHER' && SCHOOL_ONLY_EXAM_TYPES.includes(examType)) {
        return res.status(403).json({
          success: false,
          message: `Teachers cannot create ${examType} exams. Only Quiz, Class Test, Pop Quiz, Unit Test, Weekly Test, and Slip Test are allowed.`
        });
      }

      
      const examDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (examDate < today) {
        return res.status(400).json({
          success: false,
          message: "Exam date cannot be in the past"
        });
      }

      
      const calculatedDuration = calculateExamDuration(startTime, endTime);
      if (calculatedDuration.error) {
        return res.status(400).json({
          success: false,
          message: calculatedDuration.error
        });
      }

      
      if (role === 'TEACHER') {
        const teacher = await Teacher.findById(id)
          .populate('subjects')
          .populate('teacherClasses');
        
        if (!teacher) {
          return res.status(404).json({
            success: false,
            message: "Teacher not found"
          });
        }

        
        const hasSubject = teacher.subjects.some(subject => subject._id.toString() === subjectId);
        if (!hasSubject) {
          return res.status(403).json({
            success: false,
            message: "You can only create exams for subjects assigned to you"
          });
        }

        
        const hasClass = teacher.teacherClasses.some(cls => cls._id.toString() === classId);
        if (!hasClass) {
          return res.status(403).json({
            success: false,
            message: "You can only create exams for classes assigned to you"
          });
        }
      }

      
      const existingExam = await Examination.findOne({
        school: schoolId,
        class: classId,
        examDate: new Date(date),
        $or: [
          {
            startTime: { $lte: endTime },
            endTime: { $gte: startTime }
          }
        ]
      });

      if (existingExam) {
        return res.status(400).json({
          success: false,
          message: "Another exam is already scheduled at this time for this class"
        });
      }
      
      
      let createdBy, createdByModel;
      if (role === 'SCHOOL') {
        createdBy = schoolId;
        createdByModel = 'School';
      } else if (role === 'TEACHER') {
        createdBy = id;
        createdByModel = 'Teacher';
      }
      
      const newExamination = new Examination({
        school: schoolId,
        examDate: new Date(date),
        subject: subjectId,
        examType: examType,
        class: classId,
        startTime: startTime,
        endTime: endTime,
        duration: duration || calculatedDuration.duration,
        createdBy: createdBy,
        createdByModel: createdByModel,
        creatorRole: role
      });

      await newExamination.save();
      
      
      const populatedExam = await Examination.findById(newExamination._id)
        .populate('subject', 'subjectName')
        .populate('class', 'classText')
        .populate('createdBy', 'name schoolName');

      res.status(201).json({
        success: true,
        message: "Successfully created Exam",
        data: populatedExam,
      });
    } catch (error) {
      console.error("Create examination error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getAllExamination: async (req, res) => {
    try {
      const { role, schoolId, id } = req.user;
      let query = { school: schoolId };
      
      
      if (role === 'TEACHER') {
        const teacher = await Teacher.findById(id).populate('teacherClasses');
        
        if (!teacher) {
          return res.status(404).json({
            success: false,
            message: "Teacher not found"
          });
        }
        
        const teacherClassIds = teacher.teacherClasses.map(cls => cls._id);
        
        query = {
          school: schoolId,
          class: { $in: teacherClassIds }
        };
      }
      
      
      if (role === 'STUDENT') {
        const student = await Student.findById(id);
        if (!student) {
          return res.status(404).json({
            success: false,
            message: "Student not found"
          });
        }
        
        query = {
          school: schoolId,
          class: student.studentClass
        };
      }
      
      const examinations = await Examination.find(query)
        .populate('subject', 'subjectName')
        .populate('class', 'classText')
        .populate('createdBy', 'name schoolName')
        .sort({ examDate: 1, startTime: 1 });

      res.status(200).json({ 
        success: true, 
        data: examinations,
        count: examinations.length
      });
    } catch (error) {
      console.error("Get all examinations error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getExaminationByClass: async (req, res) => {
    try {
      const { role, schoolId, id } = req.user;
      const classId = req.params.id;
      
      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "Class ID is required"
        });
      }

      let query = { school: schoolId, class: classId };
      
      
      if (role === 'STUDENT') {
        const student = await Student.findById(id);
        if (!student) {
          return res.status(404).json({
            success: false,
            message: "Student not found"
          });
        }
        
        if (student.studentClass.toString() !== classId) {
          return res.status(403).json({
            success: false,
            message: "You can only view exams for your class"
          });
        }
      }
      
      
      if (role === 'TEACHER') {
        const teacher = await Teacher.findById(id).populate('teacherClasses');
        
        if (!teacher) {
          return res.status(404).json({
            success: false,
            message: "Teacher not found"
          });
        }
        
        const hasClass = teacher.teacherClasses.some(cls => cls._id.toString() === classId);
        
        if (!hasClass) {
          return res.status(403).json({
            success: false,
            message: "You can only view exams for classes assigned to you"
          });
        }
      }
      
      const classExaminations = await Examination.find(query)
        .populate('subject', 'subjectName')
        .populate('class', 'classText')
        .populate('createdBy', 'name schoolName')
        .sort({ examDate: 1, startTime: 1 });
        
      res.status(200).json({ 
        success: true, 
        data: classExaminations,
        count: classExaminations.length
      });
    } catch (error) {
      console.error("Get examinations by class error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  updateExaminationWithId: async (req, res) => {
    try {
      const { role, schoolId, id } = req.user;
      const examId = req.params.id;
      const { date, subjectId, examType, startTime, endTime, duration } = req.body;

      if (!examId) {
        return res.status(400).json({
          success: false,
          message: "Examination ID is required"
        });
      }

      
      const examination = await Examination.findOne({ 
        _id: examId, 
        school: schoolId 
      });

      if (!examination) {
        return res.status(404).json({
          success: false,
          message: "Examination not found"
        });
      }

      
      if (role === 'TEACHER') {
        
        if (examination.createdBy.toString() !== id || examination.creatorRole !== 'TEACHER') {
          return res.status(403).json({
            success: false,
            message: "You can only edit examinations that you created"
          });
        }
        
        
        if (examType && SCHOOL_ONLY_EXAM_TYPES.includes(examType)) {
          return res.status(403).json({
            success: false,
            message: `Teachers cannot set exam type to ${examType}`
          });
        }

        
        if (subjectId) {
          const teacher = await Teacher.findById(id)
            .populate('subjects')
            .populate('teacherClasses');
          
          if (!teacher) {
            return res.status(404).json({
              success: false,
              message: "Teacher not found"
            });
          }
          
          const currentSubjectId = subjectId || examination.subject.toString();
          const currentClassId = examination.class.toString();

          const hasSubject = teacher.subjects.some(subject => subject._id.toString() === currentSubjectId);
          const hasClass = teacher.teacherClasses.some(cls => cls._id.toString() === currentClassId);

          if (!hasSubject) {
            return res.status(403).json({
              success: false,
              message: "You can only update exams for subjects assigned to you"
            });
          }

          if (!hasClass) {
            return res.status(403).json({
              success: false,
              message: "You can only update exams for classes assigned to you"
            });
          }
        }
      }

      
      if (date) {
        const examDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (examDate < today) {
          return res.status(400).json({
            success: false,
            message: "Exam date cannot be in the past"
          });
        }
      }

      
      let calculatedDuration;
      if (startTime && endTime) {
        calculatedDuration = calculateExamDuration(startTime, endTime);
        if (calculatedDuration.error) {
          return res.status(400).json({
            success: false,
            message: calculatedDuration.error
          });
        }
      }

      
      if (date || startTime || endTime) {
        const conflictQuery = {
          school: schoolId,
          class: examination.class,
          _id: { $ne: examId },
          examDate: new Date(date || examination.examDate)
        };

        if (startTime && endTime) {
          conflictQuery.$or = [{
            startTime: { $lte: endTime },
            endTime: { $gte: startTime }
          }];
        }

        const existingExam = await Examination.findOne(conflictQuery);
        if (existingExam) {
          return res.status(400).json({
            success: false,
            message: "Another exam is already scheduled at this time for this class"
          });
        }
      }

      const updateData = {};
      if (date) updateData.examDate = new Date(date);
      if (subjectId) updateData.subject = subjectId;
      if (examType) updateData.examType = examType;
      if (startTime) updateData.startTime = startTime;
      if (endTime) updateData.endTime = endTime;
      if (duration) updateData.duration = duration;
      else if (calculatedDuration) updateData.duration = calculatedDuration.duration;
      
      updateData.updatedAt = new Date();

      const updatedExam = await Examination.findByIdAndUpdate(
        examId, 
        { $set: updateData },
        { new: true }
      ).populate('subject', 'subjectName')
       .populate('class', 'classText')
       .populate('createdBy', 'name schoolName');

      res.status(200).json({ 
        success: true, 
        message: "Examination details updated successfully",
        data: updatedExam
      });
    } catch (error) {
      console.error("Update examination error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  deleteExaminationWithId: async (req, res) => {
    try {
      const { role, schoolId, id } = req.user;
      const examId = req.params.id;
      
      if (!examId) {
        return res.status(400).json({
          success: false,
          message: "Examination ID is required"
        });
      }

      
      const examination = await Examination.findOne({ 
        _id: examId, 
        school: schoolId 
      });

      if (!examination) {
        return res.status(404).json({
          success: false,
          message: "Examination not found"
        });
      }

      
      if (role === 'TEACHER') {
        
        if (examination.createdBy.toString() !== id || examination.creatorRole !== 'TEACHER') {
          return res.status(403).json({
            success: false,
            message: "You can only delete examinations that you created"
          });
        }
      }

      await Examination.findByIdAndDelete(examId);
      
      res.status(200).json({
        success: true, 
        message: "Examination deleted successfully"
      });
    } catch (error) {
      console.error("Delete examination error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  calculateDuration: async (req, res) => {
    try {
      const { startTime, endTime } = req.body;
      
      if (!startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: "Both start time and end time are required"
        });
      }
      
      const result = calculateExamDuration(startTime, endTime);
      
      if (result.error) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }
      
      res.status(200).json({ 
        success: true, 
        data: { duration: result.duration }
      });
    } catch (error) {
      console.error("Calculate duration error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  
  getAvailableExamTypes: async (req, res) => {
    try {
      const { role } = req.user;
      
      let availableTypes;
      if (role === 'SCHOOL') {
        availableTypes = [...SCHOOL_ONLY_EXAM_TYPES, ...TEACHER_ALLOWED_EXAM_TYPES];
      } else if (role === 'TEACHER') {
        availableTypes = TEACHER_ALLOWED_EXAM_TYPES;
      } else {
        availableTypes = [];
      }
      
      res.status(200).json({
        success: true,
        data: availableTypes
      });
    } catch (error) {
      console.error("Get exam types error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};


function calculateExamDuration(startTime, endTime) {
  try {
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return { error: "Invalid time format. Please use HH:MM format" };
    }

    
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    
    if (end <= start) {
      return { error: "End time must be after start time" };
    }
    
    
    const diffMs = end - start;
    
    
    const durationMinutes = Math.round(diffMs / 60000);
    
    
    if (durationMinutes < 15 || durationMinutes > 480) {
      return { error: "Exam duration must be between 15 minutes and 8 hours" };
    }
    
    return { duration: durationMinutes };
  } catch (error) {
    return { error: "Error calculating duration" };
  }
}