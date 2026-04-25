import { prisma } from '../../config/database.js';
import { Prisma, BudgetPeriod, BudgetStatus, ExpenseRecurrence } from '../../generated/prisma/client.js';

export class BudgetService {
  /**
   * Create a new budget
   */
  static async createBudget(
    userId: string,
    data: {
      name: string;
      description?: string;
      totalAmount: number;
      currency: string;
      period: BudgetPeriod;
      startDate: Date;
      endDate: Date;
      alertAt?: number;
      categories?: Array<{ name: string; allocatedAmount: number; icon?: string; color?: string }>;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const budget = await tx.budget.create({
        data: {
          userId,
          name: data.name,
          description: data.description,
          totalAmount: new Prisma.Decimal(data.totalAmount),
          currency: data.currency,
          period: data.period,
          startDate: data.startDate,
          endDate: data.endDate,
          alertAt: data.alertAt ?? 80,
          status: 'ACTIVE',
        },
      });

      if (data.categories && data.categories.length > 0) {
        await tx.budgetCategory.createMany({
          data: data.categories.map((cat, index) => ({
            budgetId: budget.id,
            name: cat.name,
            allocatedAmount: new Prisma.Decimal(cat.allocatedAmount),
            icon: cat.icon,
            color: cat.color,
            sortOrder: index,
          })),
        });
      }

      return BudgetService.getBudgetById(budget.id, tx);
    });
  }

  /**
   * Get budget by ID with categories and expenses
   */
  static async getBudgetById(budgetId: string, txClient?: any) {
    const db = txClient || prisma;
    return db.budget.findUnique({
      where: { id: budgetId },
      include: {
        categories: {
          include: {
            _count: { select: { expenses: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { expenses: true } },
      },
    });
  }

  /**
   * Get all budgets for a user
   */
  static async getUserBudgets(userId: string, status?: BudgetStatus) {
    const where: any = { userId };
    if (status) where.status = status;

    return prisma.budget.findMany({
      where,
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { expenses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update budget
   */
  static async updateBudget(
    userId: string,
    budgetId: string,
    data: {
      name?: string;
      description?: string;
      totalAmount?: number;
      alertAt?: number;
      status?: BudgetStatus;
    }
  ) {
    const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget || budget.userId !== userId) {
      throw new Error('Budget not found or unauthorized');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.totalAmount) updateData.totalAmount = new Prisma.Decimal(data.totalAmount);
    if (data.alertAt) updateData.alertAt = data.alertAt;
    if (data.status) updateData.status = data.status;

    return prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
      include: {
        categories: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  /**
   * Delete budget
   */
  static async deleteBudget(userId: string, budgetId: string) {
    const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget || budget.userId !== userId) {
      throw new Error('Budget not found or unauthorized');
    }

    await prisma.budget.delete({ where: { id: budgetId } });
    return { success: true, message: 'Budget deleted' };
  }

  /**
   * Add expense to budget
   */
  static async addExpense(
    userId: string,
    budgetId: string,
    data: {
      categoryId?: string;
      amount: number;
      currency: string;
      description: string;
      notes?: string;
      receiptUrl?: string;
      merchant?: string;
      location?: string;
      isRecurring?: boolean;
      recurrence?: ExpenseRecurrence;
      nextDueDate?: Date;
      expenseDate?: Date;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const budget = await tx.budget.findUnique({ where: { id: budgetId } });
      if (!budget || budget.userId !== userId) {
        throw new Error('Budget not found or unauthorized');
      }

      const expense = await tx.expense.create({
        data: {
          budgetId,
          categoryId: data.categoryId,
          userId,
          amount: new Prisma.Decimal(data.amount),
          currency: data.currency,
          description: data.description,
          notes: data.notes,
          receiptUrl: data.receiptUrl,
          merchant: data.merchant,
          location: data.location,
          isRecurring: data.isRecurring ?? false,
          recurrence: data.recurrence ?? 'NONE',
          nextDueDate: data.nextDueDate,
          expenseDate: data.expenseDate ?? new Date(),
        },
        include: {
          category: true,
        },
      });

      // Check if budget exceeded
      const totalSpent = await BudgetService.calculateTotalSpent(budgetId, tx);
      const percentageSpent = (Number(totalSpent) / Number(budget.totalAmount)) * 100;

      if (percentageSpent >= 100 && budget.status !== 'EXCEEDED') {
        await tx.budget.update({
          where: { id: budgetId },
          data: { status: 'EXCEEDED' },
        });
      }

      return { expense, percentageSpent };
    });
  }

  /**
   * Get expenses for a budget
   */
  static async getExpenses(
    budgetId: string,
    filters?: {
      categoryId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = { budgetId };
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.startDate || filters?.endDate) {
      where.expenseDate = {};
      if (filters.startDate) where.expenseDate.gte = filters.startDate;
      if (filters.endDate) where.expenseDate.lte = filters.endDate;
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: true },
        orderBy: { expenseDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total, page, limit };
  }

  /**
   * Update expense
   */
  static async updateExpense(
    userId: string,
    expenseId: string,
    data: {
      amount?: number;
      description?: string;
      notes?: string;
      categoryId?: string;
      receiptUrl?: string;
      merchant?: string;
    }
  ) {
    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense || expense.userId !== userId) {
      throw new Error('Expense not found or unauthorized');
    }

    const updateData: any = {};
    if (data.amount) updateData.amount = new Prisma.Decimal(data.amount);
    if (data.description) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;
    if (data.merchant !== undefined) updateData.merchant = data.merchant;

    return prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
      include: { category: true },
    });
  }

  /**
   * Delete expense
   */
  static async deleteExpense(userId: string, expenseId: string) {
    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense || expense.userId !== userId) {
      throw new Error('Expense not found or unauthorized');
    }

    await prisma.expense.delete({ where: { id: expenseId } });
    return { success: true, message: 'Expense deleted' };
  }

  /**
   * Get budget analytics
   */
  static async getBudgetAnalytics(budgetId: string) {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        categories: {
          include: {
            expenses: {
              where: {
                expenseDate: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
              },
            },
          },
        },
      },
    });

    if (!budget) throw new Error('Budget not found');

    const totalSpent = await BudgetService.calculateTotalSpent(budgetId);
    const remaining = Number(budget.totalAmount) - Number(totalSpent);
    const percentageSpent = (Number(totalSpent) / Number(budget.totalAmount)) * 100;

    // Category breakdown
    const categoryBreakdown = budget.categories.map(cat => {
      const spent = cat.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      return {
        categoryId: cat.id,
        name: cat.name,
        allocated: Number(cat.allocatedAmount),
        spent,
        remaining: Number(cat.allocatedAmount) - spent,
        percentage: (spent / Number(cat.allocatedAmount)) * 100,
      };
    });

    // Daily spending trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailySpending = await prisma.$queryRaw<Array<{ date: string; total: number }>>`
      SELECT 
        DATE(expense_date) as date,
        SUM(amount) as total
      FROM expenses
      WHERE budget_id = ${budgetId}
        AND expense_date >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(expense_date)
      ORDER BY date ASC
    `;

    return {
      totalBudget: Number(budget.totalAmount),
      totalSpent: Number(totalSpent),
      remaining,
      percentageSpent,
      status: budget.status,
      categoryBreakdown,
      dailySpending,
      alertThreshold: budget.alertAt,
      shouldAlert: percentageSpent >= budget.alertAt,
    };
  }

  /**
   * Calculate total spent for a budget
   */
  private static async calculateTotalSpent(budgetId: string, txClient?: any): Promise<number> {
    const db = txClient || prisma;
    const result = await db.expense.aggregate({
      where: { budgetId },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  /**
   * Get recurring expenses that are due
   */
  static async getDueRecurringExpenses(userId: string) {
    const now = new Date();
    return prisma.expense.findMany({
      where: {
        userId,
        isRecurring: true,
        nextDueDate: { lte: now },
      },
      include: {
        budget: true,
        category: true,
      },
    });
  }

  /**
   * Process recurring expense (create next occurrence)
   */
  static async processRecurringExpense(expenseId: string) {
    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({ where: { id: expenseId } });
      if (!expense || !expense.isRecurring) {
        throw new Error('Not a recurring expense');
      }

      // Create new expense occurrence
      const newExpense = await tx.expense.create({
        data: {
          budgetId: expense.budgetId,
          categoryId: expense.categoryId,
          userId: expense.userId,
          amount: expense.amount,
          currency: expense.currency,
          description: expense.description,
          notes: expense.notes,
          merchant: expense.merchant,
          location: expense.location,
          isRecurring: true,
          recurrence: expense.recurrence,
          expenseDate: new Date(),
        },
      });

      // Calculate next due date
      const nextDueDate = new Date();
      switch (expense.recurrence) {
        case 'DAILY':
          nextDueDate.setDate(nextDueDate.getDate() + 1);
          break;
        case 'WEEKLY':
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          break;
        case 'MONTHLY':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
        case 'YEARLY':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          break;
      }

      // Update original expense with next due date
      await tx.expense.update({
        where: { id: expenseId },
        data: { nextDueDate },
      });

      return newExpense;
    });
  }
}
