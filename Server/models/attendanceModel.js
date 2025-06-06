const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    school: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "School",
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Student",
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Class",
        required: true
    },
    date: {
        type: Date, 
        required: true
    },
    status: {
        type: String, 
        enum: ['Present', 'Absent'], 
        default: 'Absent'
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date, 
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


attendanceSchema.index({ 
    student: 1, 
    class: 1, 
    date: 1 
}, { 
    unique: true,
    name: 'unique_student_class_date_attendance'
});


attendanceSchema.index({ class: 1, date: 1 });
attendanceSchema.index({ school: 1, date: 1 });
attendanceSchema.index({ student: 1, date: -1 });


attendanceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});


attendanceSchema.statics.checkAttendanceExists = async function(classId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const attendance = await this.findOne({
        class: classId,
        date: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    });
    
    return !!attendance;
};


attendanceSchema.statics.getAttendanceSummary = async function(classId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const attendanceRecords = await this.find({
        class: classId,
        date: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }).populate('student', 'name');
    
    const summary = {
        totalStudents: attendanceRecords.length,
        present: attendanceRecords.filter(record => record.status === 'Present').length,
        absent: attendanceRecords.filter(record => record.status === 'Absent').length,
        attendanceRecords
    };
    
    return summary;
};

module.exports = mongoose.model("Attendance", attendanceSchema);