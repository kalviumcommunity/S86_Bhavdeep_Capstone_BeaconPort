const express = require('express');
const authMiddleware = require('../auth/auth');
const { 
    createSchedule, 
    getSchedulewithClass, 
    deleteScheduleWithId, 
    updateScheduleWithId,
    getScheduleById,
    cleanupCompletedSchedules,
    getTeacherSubjects 
} = require('../controllers/scheduleController');

const router = express.Router();


router.post('/create', authMiddleware(['SCHOOL', 'TEACHER']), createSchedule);

router.put('/update/:id', authMiddleware(['SCHOOL', 'TEACHER']), updateScheduleWithId); 
router.delete('/delete/:id', authMiddleware(['SCHOOL','TEACHER']), deleteScheduleWithId); 
router.get('/teacher/subjects/:teacherId', authMiddleware(['SCHOOL']), getTeacherSubjects);
router.post('/cleanup', authMiddleware(['SCHOOL']), cleanupCompletedSchedules);

module.exports = router;