import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { BudgetService } from './budget.service.js';

export class BudgetController {
  static async createBudget(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const budget = await BudgetService.createBudget(userId, req.body);
      res.status(201).json({ success: true, budget });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getBudgets(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const status = req.query.status as any;
      const budgets = await BudgetService.getUserBudgets(userId, status);
      res.json({ success: true, budgets });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getBudgetById(req: AuthRequest, res: Response) {
    try {
      const budgetId = String(req.params.id);
      const budget = await BudgetService.getBudgetById(budgetId);
      if (!budget) {
        return res.status(404).json({ success: false, error: 'Budget not found' });
      }
      return res.json({ success: true, budget });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async updateBudget(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const budgetId = String(req.params.id);
      const budget = await BudgetService.updateBudget(userId, budgetId, req.body);
      res.json({ success: true, budget });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async deleteBudget(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const budgetId = String(req.params.id);
      const result = await BudgetService.deleteBudget(userId, budgetId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async addExpense(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const budgetId = String(req.params.id);
      const result = await BudgetService.addExpense(userId, budgetId, req.body);
      res.status(201).json({ success: true, ...result });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getExpenses(req: AuthRequest, res: Response) {
    try {
      const budgetId = String(req.params.id);
      const filters = {
        categoryId: req.query.categoryId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      const result = await BudgetService.getExpenses(budgetId, filters);
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async updateExpense(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const expenseId = String(req.params.expenseId);
      const expense = await BudgetService.updateExpense(userId, expenseId, req.body);
      res.json({ success: true, expense });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async deleteExpense(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const expenseId = String(req.params.expenseId);
      const result = await BudgetService.deleteExpense(userId, expenseId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getAnalytics(req: AuthRequest, res: Response) {
    try {
      const budgetId = String(req.params.id);
      const analytics = await BudgetService.getBudgetAnalytics(budgetId);
      res.json({ success: true, analytics });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getDueRecurring(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const expenses = await BudgetService.getDueRecurringExpenses(userId);
      res.json({ success: true, expenses });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }
}
