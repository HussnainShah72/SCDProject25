const readline = require('readline');
const db = require('./db');
const path = require('path');
require('./events/logger');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const formatDate = (date) => new Date(date).toISOString().split('T')[0];
function menu() {
  console.log(`
===== NodeVault =====
1. Add Record
2. List Records
3. Update Record
4. Delete Record
5. Search Records
6. Sort Records
7. Export Data
8. View Vault Statistics
9. Exit
=====================
  `);
  rl.question('Choose option: ', async ans => {
    switch (ans.trim()) {
      case '1':
        rl.question('Enter name: ', name => {
          rl.question('Enter value: ', async value => {
            await db.addRecord({ name, value });
            console.log('✅ Record added successfully!');
            menu();
          });
        });
        break;
      case '2':
        const records = await db.listRecords();
        if (records.length === 0) console.log('No records found.');
        else records.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`));
        menu();
        break;
      case '3':
        rl.question('Enter record ID to update: ', id => {
          rl.question('New name: ', name => {
            rl.question('New value: ', async value => {
              const updated = await db.updateRecord(Number(id), name, value);
              console.log(updated ? '✅ Record updated!' : '❌ Record not found.');
              menu();
            });
          });
        });
        break;
      case '4':
        rl.question('Enter record ID to delete: ', async id => {
          const deleted = await db.deleteRecord(Number(id));
          console.log(deleted ? '🗑️ Record deleted!' : '❌ Record not found.');
          menu();
        });
        break;
      case '5': // Search Implementation
        rl.question('Enter search keyword: ', async query => {
          const results = await db.searchRecords(query);
          if (results.length === 0) console.log('No records found.');
          else {
            console.log(`Found ${results.length} matching records:`);
            results.forEach((r, index) => {
              console.log(`${index + 1}. ID: ${r.id} | Name: ${r.name} | Created: ${formatDate(r.created)}`);
            });
          }
          menu();
        });
        break;
      case '6': // Sort Implementation
        rl.question('Choose field to sort by (Name/Date): ', field => {
          const sortField = field.toLowerCase().includes('name') ? 'name' : 'date';
          rl.question('Choose order (Ascending/Descending): ', async order => {
            const sortOrder = order.toLowerCase().startsWith('asc') ? 'asc' : 'desc';
            const sorted = await db.sortRecords(sortField, sortOrder);
            console.log('Sorted Records:');
            sorted.forEach((r, index) => {
              console.log(`${index + 1}. ID: ${r.id} | Name: ${r.name}`);
            });
            menu();
          });
        });
        break;
      case '7': // Export Implementation
        const exportFile = await db.exportData();
        console.log(`Data exported successfully to ${path.basename(exportFile)}`);
        menu();
        break;
      case '8': // Statistics Implementation
        const stats = await db.getStatistics();
        if (!stats) console.log('No records available for statistics.');
        else {
          console.log('Vault Statistics:');
          console.log('--------------------------');
          console.log(`Total Records: ${stats.totalRecords}`);
          console.log(`Last Modified: ${stats.lastModified}`);
          console.log(`Longest Name: ${stats.longestName}`);
          console.log(`Earliest Record: ${stats.earliestRecord}`);
          console.log(`Latest Record: ${stats.latestRecord}`);
        }
        menu();
        break;
      case '9':
        console.log('👋 Exiting NodeVault...');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid option.');
        menu();
    }
  });
}
menu();
