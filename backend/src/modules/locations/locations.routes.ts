import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { prisma } from '../../config/database.js';
import { getQueryString } from '../../utils/queryParams.js';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const {
      scope,
      scopeValue,
      displayName,
      parentId,
      continent,
      country,
      countryCode,
      region,
      city,
      latitude,
      longitude,
      population,
    } = req.body;

    const location = await prisma.locationMaster.create({
      data: {
        scope,
        scopeValue,
        displayName,
        parentId,
        continent,
        country,
        countryCode,
        region,
        city,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        population: population ? parseInt(population) : null,
        isActive: true,
        createdBy: req.userId!,
      },
    });

    res.status(201).json(location);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scope, parentId, search, countryCode } = req.query;

    const where: any = { isActive: true };

    if (scope) where.scope = getQueryString(scope);
    if (parentId) where.parentId = getQueryString(parentId);
    if (countryCode) where.countryCode = getQueryString(countryCode);
    if (search) {
      where.displayName = {
        contains: getQueryString(search),
        mode: 'insensitive',
      };
    }

    const locations = await prisma.locationMaster.findMany({
      where,
      orderBy: { displayName: 'asc' },
    });

    res.json(locations);
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const location = await prisma.locationMaster.findUnique({
      where: { id: req.params.id as string },
    });

    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    res.json(location);
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const location = await prisma.locationMaster.update({
      where: { id: req.params.id as string },
      data: req.body,
    });

    res.json(location);
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.locationMaster.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });

    res.json({ message: 'Location deleted' });
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/hierarchy/:countryCode', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hierarchy = await prisma.locationMaster.findMany({
      where: {
        countryCode: req.params.countryCode as string,
        isActive: true,
      },
      orderBy: [{ scope: 'asc' }, { displayName: 'asc' }],
    });

    res.json(hierarchy);
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
