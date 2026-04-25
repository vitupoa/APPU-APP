import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { prisma } from '../../config/database.js';
import { Response } from 'express';

const router = Router();

router.post('/register-token', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { deviceToken, platform } = req.body;

    if (!deviceToken || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Device token and platform are required',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deviceToken,
        devicePlatform: platform,
      } as any,
    });

    return res.json({
      success: true,
      message: 'Device token registered successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/unregister-token', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    await prisma.user.update({
      where: { id: userId },
      data: {
        deviceToken: null,
        devicePlatform: null,
      } as any,
    });

    return res.json({
      success: true,
      message: 'Device token unregistered successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
