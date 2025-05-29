const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    schoolName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    ownerName: { type: String, required: true },
    schoolImg: { type: String, required: true }, // Now stores Cloudinary URL
    schoolImgPublicId: { type: String }, // Stores Cloudinary public ID for deletion
    password: { type: String, required: true },
        
    isOAuthUser: { type: Boolean, default: false },
    oauthProvider: { 
        type: String, 
        enum: ['google', null], 
        default: null 
    },
    oauthId: { type: String, default: null },
        
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    
    createdAt: { type: Date, default: new Date() }
});

schoolSchema.index({ email: 1, oauthProvider: 1 });
schoolSchema.index({ resetPasswordToken: 1 });

module.exports = mongoose.model("School", schoolSchema);