const express = require('express');
const authMiddleware = require('../auth/auth');
const { 
  getAllClasses, 
  createClass, 
  updateClassWithId, 
  deleteClassWithId, 
  getClassWithId, 
  getAttendeClass
} = require('../controllers/classController');
const router = express.Router();



router.get('/attendee', authMiddleware(['TEACHER']), getAttendeClass);
router.get('/:id', authMiddleware(['SCHOOL']), getClassWithId);
router.put('/update/:id', authMiddleware(['SCHOOL']), updateClassWithId); 
router.delete('/delete/:id', authMiddleware(['SCHOOL']), deleteClassWithId); 

module.exports = router;