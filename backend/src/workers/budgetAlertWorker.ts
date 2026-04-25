import { prisma } from '../config/database.js';
import { BudgetService } from '../modules/budget/budget.service.js';
import { FCMService } from '../services/fcm.service.js';

export function startBudgetAlertWorker() {
  cron.schedule('0 */6 * * *', async () => {
    console.log('[BudgetAlertWorker] Checking budgets for alerts...');
    
    try {
      const fcmService = FCMService.getInstance();
      const activeBudgets = await prisma.budget.findMany({
        where: { status: 'ACTIVE' },
        include: { user: true }
      });
      
      for (const budget of activeBudgets) {
        try {
          const analytics = await BudgetService.getBudgetAnalytics(budget.id);
          
          if (analytics.shouldAlert && analytics.percentageSpent >= budget.alertAt) {
            console.log(`[BudgetAlertWorker] Alert for budget ${budget.id}: ${analytics.percentageSpent}% spent`);
            
            if (budget.user.fcmToken) {
              if (analytics.percentageSpent >= 100) {
                await fcmService.sendBudgetExceeded(budget.user.fcmToken, budget.name);
              } else {
                await fcmService.sendBudgetAlert(budget.user.fcmToken, budget.name, analytics.percentageSpent);
              }
            }
          }
          
          const daysUntilEnd = Math.ceil((budget.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilEnd <= 3 && daysUntilEnd > 0) {
            console.log(`[BudgetAlertWorker] Budget ${budget.id} ending in ${daysUntilEnd} days`);
            
            if (budget.user.fcmToken) {
              await fcmService.sendBudgetEnding(budget.user.fcmToken, budget.name, daysUntilEnd);
            }
          }
        } catch (error) {
          console.error(`[BudgetAlertWorker] Failed to check budget ${budget.id}:`, error);
        }
      }
      
      console.log('[BudgetAlertWorker] Completed');
    } catch (error) {
      console.error('[BudgetAlertWorker] Error:', error);
    }
  });
  
  console.log('[BudgetAlertWorker] Started - runs every 6 hours');
}
