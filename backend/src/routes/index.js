import { Router } from 'express';
import { authenticate, requireAdmin, hideProfitFromStaff } from '../middleware/auth.js';

import * as auth from '../controllers/authController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as inventory from '../controllers/inventoryController.js';
import * as invoice from '../controllers/invoiceController.js';
import * as customer from '../controllers/customerController.js';
import * as roznamcha from '../controllers/roznamchaController.js';
import * as master from '../controllers/masterDataController.js';
import * as reports from '../controllers/reportsController.js';
import * as backup from '../controllers/backupController.js';
import * as salary from '../controllers/salaryController.js';

const router = Router();

// Auth
router.post('/auth/login', auth.login);
router.get('/auth/profile', authenticate, auth.getProfile);
router.put('/auth/password', authenticate, auth.changePassword);

// Dashboard
router.get('/dashboard', authenticate, dashboard.getDashboard);

// Master Data
router.get('/designs', authenticate, master.getDesigns);
router.post('/designs', authenticate, requireAdmin, master.createDesign);
router.put('/designs/:id', authenticate, requireAdmin, master.updateDesign);
router.delete('/designs/:id', authenticate, requireAdmin, master.deleteDesign);

router.get('/colors', authenticate, master.getColors);
router.post('/colors', authenticate, requireAdmin, master.createColor);
router.put('/colors/:id', authenticate, requireAdmin, master.updateColor);
router.delete('/colors/:id', authenticate, requireAdmin, master.deleteColor);

router.get('/sizes', authenticate, master.getSizes);
router.post('/sizes', authenticate, requireAdmin, master.createSize);
router.put('/sizes/:id', authenticate, requireAdmin, master.updateSize);
router.delete('/sizes/:id', authenticate, requireAdmin, master.deleteSize);

router.get('/settings', authenticate, master.getSettings);
router.put('/settings', authenticate, requireAdmin, master.updateSettings);

// Inventory
router.get('/inventory', authenticate, inventory.getInventory);
router.get('/inventory/:id', authenticate, inventory.getInventoryItem);
router.post('/inventory', authenticate, requireAdmin, inventory.createInventory);
router.put('/inventory/:id', authenticate, requireAdmin, inventory.updateInventory);
router.delete('/inventory/:id', authenticate, requireAdmin, inventory.deleteInventory);
router.post('/inventory/:id/add-stock', authenticate, requireAdmin, inventory.addStock);

// Customers & Khata
router.get('/customers', authenticate, customer.getCustomers);
router.get('/customers/:id', authenticate, customer.getCustomer);
router.post('/customers', authenticate, customer.createCustomer);
router.put('/customers/:id', authenticate, customer.updateCustomer);
router.delete('/customers/:id', authenticate, requireAdmin, customer.deleteCustomer);
router.post('/customers/:id/payments', authenticate, customer.addPayment);

// Invoices
router.get('/invoices', authenticate, hideProfitFromStaff, invoice.getInvoices);
router.get('/invoices/:id', authenticate, hideProfitFromStaff, invoice.getInvoice);
router.post('/invoices', authenticate, invoice.createInvoice);
router.delete('/invoices/:id', authenticate, invoice.deleteInvoice);

// Employee Salaries
router.get('/salaries', authenticate, salary.getSalaries);
router.post('/salaries', authenticate, salary.createSalary);
router.get('/salaries/:id', authenticate, salary.getSalary);
router.put('/salaries/:id', authenticate, salary.updateSalary);
router.delete('/salaries/:id', authenticate, requireAdmin, salary.deleteSalary);
router.post('/salaries/:id/monthly', authenticate, salary.createMonthlyRecord);
router.put('/salaries/:id/monthly/:recordId', authenticate, salary.updateMonthlyRecord);
router.delete('/salaries/:id/monthly/:recordId', authenticate, requireAdmin, salary.deleteMonthlyRecord);

// Roznamcha
router.get('/roznamcha', authenticate, roznamcha.getEntries);
router.get('/roznamcha/monthly', authenticate, roznamcha.getMonthlyTotals);
router.post('/roznamcha', authenticate, roznamcha.createEntry);
router.put('/roznamcha/:id', authenticate, roznamcha.updateEntry);
router.delete('/roznamcha/:id', authenticate, roznamcha.deleteEntry);

// Reports
router.get('/reports/daily-sales', authenticate, reports.getDailySales);
router.get('/reports/monthly-sales', authenticate, reports.getMonthlySales);
router.get('/reports/profit', authenticate, requireAdmin, reports.getProfitReport);
router.get('/reports/stock', authenticate, reports.getStockReport);
router.get('/reports/customer-balances', authenticate, reports.getCustomerBalances);
router.get('/reports/best-selling', authenticate, reports.getBestSellingDesigns);
router.get('/reports/export/:type', authenticate, reports.exportExcel);

// Backup
router.get('/backup/status', authenticate, requireAdmin, backup.getBackupStatus);
router.post('/backup', authenticate, requireAdmin, backup.createBackup);
router.get('/backup', authenticate, requireAdmin, backup.listBackups);
router.post('/backup/restore', authenticate, requireAdmin, backup.restoreBackup);
router.get('/backup/download/:filename', authenticate, requireAdmin, backup.downloadBackup);

export default router;
