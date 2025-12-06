const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const vaultEvents = require('../events'); // your existing events

// ------------------- Schema -------------------
const recordSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  value: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update updatedAt
recordSchema.pre('save', function () {
  this.updatedAt = new Date();
});


const Record = mongoose.model('Record', recordSchema);

// ------------------- Backup -------------------
function createBackup(records) {
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

  const timestamp = new Date().toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .replace(/\..+/, '');
  const filename = `backup_${timestamp}.json`;
  const filepath = path.join(backupsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(records, null, 2));
  console.log(`💾 Backup created: ${filename}`);
}

// ------------------- Utility -------------------
function generateId() {
  return Math.floor(Math.random() * 1000000); // simple unique ID
}

// ------------------- CRUD Functions -------------------
async function addRecord({ name, value }) {
  const id = generateId();
  const newRecord = new Record({ id, name, value });
  await newRecord.save();

  const allRecords = await listRecords();
  createBackup(allRecords);

  vaultEvents.emit('recordAdded', newRecord);
  return newRecord;
}

async function listRecords() {
  return await Record.find().lean();
}

async function updateRecord(id, newName, newValue) {
  const record = await Record.findOne({ id });
  if (!record) return null;

  record.name = newName;
  record.value = newValue;
  await record.save();

  vaultEvents.emit('recordUpdated', record);
  return record;
}

async function deleteRecord(id) {
  const record = await Record.findOneAndDelete({ id });
  if (!record) return null;

  const allRecords = await listRecords();
  createBackup(allRecords);

  vaultEvents.emit('recordDeleted', record);
  return record;
}

module.exports = {
  addRecord,
  listRecords,
  updateRecord,
  deleteRecord
};

