import { Router } from 'express';
import { authMiddleware as requireAuth } from '../../middleware/auth.js';
import { BudgetController } from './budget.controller.js';

export const budgetRoutes = Router();

budgetRoutes.use(requireAuth);

// Budget CRUD
budgetRoutes.post('/', BudgetController.createBudget);
budgetRoutes.get('/', BudgetController.getBudgets);
budgetRoutes.get('/:id', BudgetController.getBudgetById);
budgetRoutes.put('/:id', BudgetController.updateBudget);
budgetRoutes.delete('/:id', BudgetController.deleteBudget);

// Analytics
budgetRoutes.get('/:id/analytics', BudgetController.getAnalytics);

// Expenses
budgetRoutes.post('/:id/expenses', BudgetController.addExpense);
budgetRoutes.get('/:id/expenses', BudgetController.getExpenses);
budgetRoutes.put('/expenses/:expenseId', BudgetController.updateExpense);
budgetRoutes.delete('/expenses/:expenseId', BudgetController.deleteExpense);

// Recurring expenses
budgetRoutes.get('/recurring/due', BudgetController.getDueRecurring);
