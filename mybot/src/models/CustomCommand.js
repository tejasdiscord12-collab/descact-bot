const mongoose = require('mongoose');

const customCommandSchema = new mongoose.Schema({
    GuildID: String,
    CommandName: String,
    Response: String
});

module.exports = mongoose.model('CustomCommand', customCommandSchema);
