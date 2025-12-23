const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    GuildID: String,
    TicketID: String,
    ChannelID: String,
    Closed: Boolean,
    Locked: Boolean,
    Type: String,
    Claimed: Boolean,
    ClaimedBy: String,
    OpenBy: String
});

module.exports = mongoose.model('Ticket', ticketSchema);
