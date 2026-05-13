import { Router, Response } from 'express';
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
      display_name,
      parent_id,
      continent,
      country,
      country_code,
      region,
      city,
      latitude,
      longitude,
      population,
    } = req.body;

    const location = await prisma.location_master.create({
      data: {
        scope,
        scope_value: scopeValue,
        display_name,
        parent_id,
        continent,
        country,
        country_code,
        region,
        city,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        population: population ? parseInt(population) : null,
        is_active: true,
      },
    });

    res.status(201).json(location);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scope, parent_id, search, country_code } = req.query;

    const where: any = { is_active: true };

    if (scope) where.scope = getQueryString(scope);
    if (parent_id) where.parent_id = getQueryString(parent_id);
    if (country_code) where.country_code = getQueryString(country_code);
    if (search) {
      where.display_name = {
        contains: getQueryString(search),
        mode: 'insensitive',
      };
    }

    const locations = await prisma.location_master.findMany({
      where,
      orderBy: { display_name: 'asc' },
    });

    res.json(locations);
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const location = await prisma.location_master.findUnique({
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
    if (!req.is_admin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const location = await prisma.location_master.update({
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
    if (!req.is_admin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.location_master.update({
      where: { id: req.params.id as string },
      data: { is_active: false },
    });

    res.json({ message: 'Location deleted' });
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/hierarchy/:countryCode', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hierarchy = await prisma.location_master.findMany({
      where: {
        country_code: req.params.countryCode as string,
        is_active: true,
      },
      orderBy: [{ scope: 'asc' }, { display_name: 'asc' }],
    });

    res.json(hierarchy);
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
