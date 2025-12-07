const fs = require('fs');
const path = require('path');
const Record = require('./schema');
const recordUtils = require('./record');
const vaultEvents = require('../events');
const connectDB = require('./mongo');
// Connect to MongoDB
connectDB();
// Ensure backups directory exists
const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}
// Helper to format date for outputs (YYYY-MM-DD)
const formatDate = (date) => new Date(date).toISOString().split('T')[0];
async function addRecord({ name, value }) {
  recordUtils.validateRecord({ name, value });
  const newRecord = new Record({
    id: recordUtils.generateId(),
    name,
    value,
    created: new Date()
  });
  await newRecord.save();
  vaultEvents.emit('recordAdded', newRecord.toObject());
  await backupData(); // Feature: Automatic Backup
  return newRecord;
}
async function listRecords() {
  return await Record.find({});
}
async function updateRecord(id, newName, newValue) {
  const record = await Record.findOne({ id });
  if (!record) return null;
  
  record.name = newName;
  record.value = newValue;
  await record.save();
  
  vaultEvents.emit('recordUpdated', record.toObject());
  await backupData(); // Feature: Automatic Backup
  return record;
}
async function deleteRecord(id) {
  const record = await Record.findOneAndDelete({ id });
  if (record) {
    vaultEvents.emit('recordDeleted', record.toObject());
    await backupData(); // Feature: Automatic Backup
  }
  return record;
}
// Feature: Search Functionality
async function searchRecords(query) {
  const regex = new RegExp(query, 'i');
  const isNum = !isNaN(query);
  const conditions = [{ name: regex }];
  if (isNum) conditions.push({ id: Number(query) });
  
  return await Record.find({ $or: conditions });
}
// Feature: Sorting Capability
async function sortRecords(sortBy, order) {
  const sortObj = {};
  // Sort by 'name' or 'created' (date)
  const field = sortBy === 'name' ? 'name' : 'created';
  sortObj[field] = order === 'asc' ? 1 : -1;
  return await Record.find({}).sort(sortObj);
}
// Feature: Export Data
async function exportData() {
  const data = await listRecords();
  const now = new Date().toLocaleString();
  let content = `Export Date: ${now}\nTotal Records: ${data.length}\nFile: export.txt\n\n`;
  content += `--------------------------------------------------\n`;
  data.forEach(r => {
    content += `ID: ${r.id} | Name: ${r.name} | Value: ${r.value} | Created: ${formatDate(r.created)}\n`;
  });
  
  const exportPath = path.join(__dirname, '..', 'export.txt');
  fs.writeFileSync(exportPath, content);
  return exportPath;
}
// Feature: Automatic Backup
async function backupData() {
  const data = await listRecords();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `backup_${dateStr}_${timeStr}.json`;
  const backupPath = path.join(backupsDir, filename);
  
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
  return filename;
}
// Feature: Display Data Statistics
async function getStatistics() {
  const data = await listRecords();
  if (data.length === 0) return null;
  const totalRecords = data.length;
  let longestName = '';
  let earliestRecord = null;
  let latestRecord = null;
  data.forEach(r => {
    if (r.name.length > longestName.length) longestName = r.name;
    const createdTime = new Date(r.created).getTime();
    if (!earliestRecord || createdTime < new Date(earliestRecord.created).getTime()) earliestRecord = r;
    if (!latestRecord || createdTime > new Date(latestRecord.created).getTime()) latestRecord = r;
  });
  return {
    totalRecords,
    lastModified: latestRecord ? latestRecord.created.toLocaleString() : new Date().toLocaleString(),
    longestName: `${longestName} (${longestName.length} characters)`,
    earliestRecord: earliestRecord ? formatDate(earliestRecord.created) : 'N/A',
    latestRecord: latestRecord ? formatDate(latestRecord.created) : 'N/A'
  };
}
module.exports = { 
  addRecord, listRecords, updateRecord, deleteRecord,
  searchRecords, sortRecords, exportData, backupData, getStatistics
};
