const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');

// Initialize DB file if not exists
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ warns: [], tickets: [], customCommands: [], welcomeSettings: [], statusSettings: {}, invites: [], giveaways: [], ticketSettings: [] }, null, 4));
}

const defaultDB = {
    warns: [],
    tickets: [],
    customCommands: [],
    welcomeSettings: [],
    statusSettings: {},
    invites: [],
    giveaways: [],
    ticketSettings: [],
    ticketSupportRoles: []
};

function readDB() {
    try {
        if (!fs.existsSync(dbPath)) return { ...defaultDB };
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        return { ...defaultDB, ...data };
    } catch (e) {
        console.error('Error reading database, returning defaults:', e);
        return { ...defaultDB };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 4));
    } catch (e) {
        console.error('Error writing database:', e);
    }
}

module.exports = {
    // Warns
    addWarn: (guildId, userId, userTag, executerId, executerTag, reason) => {
        const db = readDB();
        if (!db.warns) db.warns = [];

        let userWarns = db.warns.find(w => w.GuildID === guildId && w.UserID === userId);

        const newWarn = {
            ExecuterID: executerId,
            ExecuterTag: executerTag,
            Reason: reason,
            Date: new Date().toLocaleString()
        };

        if (userWarns) {
            userWarns.Content.push(newWarn);
        } else {
            db.warns.push({
                GuildID: guildId,
                UserID: userId,
                UserTag: userTag,
                Content: [newWarn]
            });
        }
        writeDB(db);
    },
    getWarns: (guildId, userId) => {
        const db = readDB();
        return db.warns ? db.warns.find(w => w.GuildID === guildId && w.UserID === userId) : null;
    },

    // Tickets
    createTicket: (ticketData) => {
        const db = readDB();
        if (!db.tickets) db.tickets = [];
        db.tickets.push(ticketData);
        writeDB(db);
    },
    getTicketByOpener: (guildId, userId) => {
        const db = readDB();
        return db.tickets ? db.tickets.find(t => t.GuildID === guildId && t.OpenBy === userId && !t.Closed) : null;
    },
    getTicketByChannel: (channelId) => {
        const db = readDB();
        return db.tickets ? db.tickets.find(t => t.ChannelID === channelId) : null;
    },
    closeTicket: (channelId) => {
        const db = readDB();
        if (!db.tickets) return;
        const ticket = db.tickets.find(t => t.ChannelID === channelId);
        if (ticket) {
            ticket.Closed = true;
            writeDB(db);
        }
    },
    claimTicket: (channelId, userId) => {
        const db = readDB();
        if (!db.tickets) return;
        const ticket = db.tickets.find(t => t.ChannelID === channelId);
        if (ticket) {
            ticket.Claimed = true;
            ticket.ClaimedBy = userId;
            writeDB(db);
        }
    },
    lockTicket: (channelId) => {
        const db = readDB();
        if (!db.tickets) return;
        const ticket = db.tickets.find(t => t.ChannelID === channelId);
        if (ticket) {
            ticket.Locked = true;
            writeDB(db);
        }
    },
    unlockTicket: (channelId) => {
        const db = readDB();
        if (!db.tickets) return;
        const ticket = db.tickets.find(t => t.ChannelID === channelId);
        if (ticket) {
            ticket.Locked = false;
            writeDB(db);
        }
    },

    // Ticket Settings
    setTicketCategory: (guildId, categoryId) => {
        const db = readDB();
        if (!db.ticketSettings) db.ticketSettings = [];
        const index = db.ticketSettings.findIndex(s => s.GuildID === guildId);
        if (index !== -1) {
            db.ticketSettings[index].CategoryID = categoryId;
        } else {
            db.ticketSettings.push({ GuildID: guildId, CategoryID: categoryId });
        }
        writeDB(db);
    },
    getTicketCategory: (guildId) => {
        const db = readDB();
        if (!db.ticketSettings) return null;
        const settings = db.ticketSettings.find(s => s.GuildID === guildId);
        return settings ? settings.CategoryID : null;
    },

    // Ticket Support Roles
    addTicketSupportRole: (guildId, roleId) => {
        const db = readDB();
        if (!db.ticketSupportRoles) db.ticketSupportRoles = [];
        let guildSettings = db.ticketSupportRoles.find(s => s.GuildID === guildId);
        if (guildSettings) {
            if (!guildSettings.RoleIDs) {
                guildSettings.RoleIDs = guildSettings.RoleID ? [guildSettings.RoleID] : [];
                delete guildSettings.RoleID;
            }
            if (!guildSettings.RoleIDs.includes(roleId)) {
                guildSettings.RoleIDs.push(roleId);
            }
        } else {
            db.ticketSupportRoles.push({ GuildID: guildId, RoleIDs: [roleId] });
        }
        writeDB(db);
    },
    removeTicketSupportRole: (guildId, roleId) => {
        const db = readDB();
        if (!db.ticketSupportRoles) return;
        const guildSettings = db.ticketSupportRoles.find(s => s.GuildID === guildId);
        if (guildSettings) {
            if (!guildSettings.RoleIDs && guildSettings.RoleID) {
                guildSettings.RoleIDs = [guildSettings.RoleID];
                delete guildSettings.RoleID;
            }
            if (guildSettings.RoleIDs) {
                guildSettings.RoleIDs = guildSettings.RoleIDs.filter(id => id !== roleId);
                writeDB(db);
            }
        }
    },
    getTicketSupportRoles: (guildId) => {
        const db = readDB();
        if (!db.ticketSupportRoles) return [];
        const settings = db.ticketSupportRoles.find(s => s.GuildID === guildId);
        if (!settings) return [];
        if (settings.RoleIDs) return settings.RoleIDs;
        if (settings.RoleID) return [settings.RoleID];
        return [];
    },

    // Custom Commands
    addCustomCommand: (guildId, name, response) => {
        const db = readDB();
        if (!db.customCommands) db.customCommands = [];
        db.customCommands.push({ GuildID: guildId, CommandName: name, Response: response });
        writeDB(db);
    },
    removeCustomCommand: (guildId, name) => {
        const db = readDB();
        if (!db.customCommands) return;
        const searchName = name.toLowerCase().trim();
        db.customCommands = db.customCommands.filter(c => !(c.GuildID === guildId && c.CommandName.toLowerCase() === searchName));
        writeDB(db);
    },
    getCustomCommand: (guildId, name) => {
        const db = readDB();
        const searchName = name.toLowerCase().trim();
        return (db.customCommands || []).find(c => c.GuildID === guildId && (c.CommandName || '').toLowerCase() === searchName) || null;
    },
    getAllCustomCommands: (guildId) => {
        const db = readDB();
        return db.customCommands ? db.customCommands.filter(c => c.GuildID === guildId) : [];
    },

    // Welcome Settings
    setWelcomeChannel: (guildId, channelId) => {
        const db = readDB();
        if (!db.welcomeSettings) db.welcomeSettings = [];
        const index = db.welcomeSettings.findIndex(s => s.GuildID === guildId);
        if (index !== -1) {
            db.welcomeSettings[index].ChannelID = channelId;
        } else {
            db.welcomeSettings.push({ GuildID: guildId, ChannelID: channelId });
        }
        writeDB(db);
    },
    getWelcomeChannel: (guildId) => {
        const db = readDB();
        if (!db.welcomeSettings) return null;
        const settings = db.welcomeSettings.find(s => s.GuildID === guildId);
        return settings ? settings.ChannelID : null;
    },

    // Status Settings
    setStatusSettings: (guildId, channelId, messageId) => {
        const db = readDB();
        if (!db.statusSettings) db.statusSettings = {};
        db.statusSettings[guildId] = { ChannelID: channelId, MessageID: messageId };
        writeDB(db);
    },
    getStatusSettings: (guildId) => {
        const db = readDB();
        return db.statusSettings ? db.statusSettings[guildId] : null;
    },
    getAllStatusSettings: () => {
        const db = readDB();
        return db.statusSettings || {};
    },

    // Invites
    addInvite: (guildId, userId, amount, type) => {
        const db = readDB();
        if (!db.invites) db.invites = [];
        let userInvites = db.invites.find(i => i.GuildID === guildId && i.UserID === userId);
        if (!userInvites) {
            userInvites = { GuildID: guildId, UserID: userId, Regular: 0, Fake: 0, Left: 0, Total: 0 };
            db.invites.push(userInvites);
        }
        if (type === 'regular') userInvites.Regular += amount;
        else if (type === 'fake') userInvites.Fake += amount;
        else if (type === 'left') userInvites.Left += amount;
        userInvites.Total = userInvites.Regular - userInvites.Fake - userInvites.Left;
        writeDB(db);
    },
    getInvites: (guildId, userId) => {
        const db = readDB();
        if (!db.invites) return { Regular: 0, Fake: 0, Left: 0, Total: 0 };
        return db.invites.find(i => i.GuildID === guildId && i.UserID === userId) || { Regular: 0, Fake: 0, Left: 0, Total: 0 };
    },

    // Giveaways
    createGiveaway: (giveawayData) => {
        const db = readDB();
        if (!db.giveaways) db.giveaways = [];
        db.giveaways.push(giveawayData);
        writeDB(db);
    },
    getGiveaways: () => {
        const db = readDB();
        return db.giveaways || [];
    },
    endGiveaway: (messageId) => {
        const db = readDB();
        if (!db.giveaways) return;
        db.giveaways = db.giveaways.filter(g => g.MessageID !== messageId);
        writeDB(db);
    }
};
