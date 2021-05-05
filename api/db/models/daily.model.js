const mongoose = require('mongoose');

const DailySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
})

const Daily = mongoose.model('Daily', DailySchema);

module.exports = { Daily }