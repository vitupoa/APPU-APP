import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { BudgetService } from '../modules/budget/budget.service.js';

export function startRecurringExpenseWorker() {
  cron.schedule('0 0 * * *', async () => {
    console.log('[RecurringExpenseWorker] Running daily recurring expense check...');
    
    try {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      
      for (const user of allUsers) {
        const dueExpenses = await BudgetService.getDueRecurringExpenses(user.id);
        
        for (const expense of dueExpenses) {
          try {
            await BudgetService.processRecurringExpense(expense.id);
            console.log(`[RecurringExpenseWorker] Processed recurring expense ${expense.id}`);
          } catch (error) {
            console.error(`[RecurringExpenseWorker] Failed to process expense ${expense.id}:`, error);
          }
        }
      }
      
      console.log('[RecurringExpenseWorker] Completed');
    } catch (error) {
      console.error('[RecurringExpenseWorker] Error:', error);
    }
  });
  
  console.log('[RecurringExpenseWorker] Started - runs daily at midnight');
}
