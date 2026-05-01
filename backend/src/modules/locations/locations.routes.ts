import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/', authenticate, async (req, res) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
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
        createdBy: req.user!.id,
      },
    });

    res.status(201).json(location);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { scope, parentId, search, countryCode } = req.query;

    const where: any = { isActive: true };

    if (scope) where.scope = scope;
    if (parentId) where.parentId = parentId;
    if (countryCode) where.countryCode = countryCode;
    if (search) {
      where.displayName = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const locations = await prisma.locationMaster.findMany({
      where,
      orderBy: { displayName: 'asc' },
    });

    res.json(locations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const location = await prisma.locationMaster.findUnique({
      where: { id: req.params.id },
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const location = await prisma.locationMaster.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(location);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.locationMaster.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'Location deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/hierarchy/:countryCode', authenticate, async (req, res) => {
  try {
    const { countryCode } = req.params;

    const hierarchy = await prisma.locationMaster.findMany({
      where: {
        countryCode,
        isActive: true,
      },
      orderBy: [{ scope: 'asc' }, { displayName: 'asc' }],
    });

    res.json(hierarchy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
