import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { prisma } from '../../config/database.js';

const router = Router();

router.post('/register-token', authenticate, async (req, res) => {
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
        fcmToken: deviceToken,
        devicePlatform: platform,
      },
    });

    res.json({
      success: true,
      message: 'Device token registered successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/unregister-token', authenticate, async (req, res) => {
  try {
    const userId = req.userId!;

    await prisma.user.update({
      where: { id: userId },
      data: {
        fcmToken: null,
        devicePlatform: null,
      },
    });

    res.json({
      success: true,
      message: 'Device token unregistered successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
