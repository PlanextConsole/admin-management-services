import { Router, Request, Response } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { jwtAuth, requireRole, requirePermission } from '../../middleware/authMiddleware';
import { getAuthSub, clientIp } from '../../http/adminHttp';
import { CatalogAdminService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCatalogServiceDto } from './dto/create-catalog-service.dto';
import { UpdateCatalogServiceDto } from './dto/update-catalog-service.dto';

export function createCatalogAdminRoutes(): Router {
  const r = Router();
  const svc = new CatalogAdminService();
  r.use(jwtAuth);
  r.use(requireRole('ADMIN'));
  r.use(requirePermission('catalog.admin.manage'));

  const listCategories = async (req: Request, res: Response) => {
    try {
      const all = req.query.purpose === 'all' || req.query.includeInactive === 'true';
      const items = await svc.listCategories(all);
      res.json({ items });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  };
  r.get('/categories/all', listCategories);
  r.get('/categories', listCategories);

  r.get('/categories/:id', async (req: Request, res: Response) => {
    try {
      const row = await svc.getCategory(req.params.id);
      if (!row) return res.status(404).json({ message: 'Category not found' });
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  r.delete('/categories/:id', async (req: Request, res: Response) => {
    try {
      await svc.deleteCategory(req.params.id, getAuthSub(req), clientIp(req));
      res.status(204).send();
    } catch (e: any) {
      const status = e.message === 'Category not found' ? 404 : 400;
      res.status(status).json({ message: e.message });
    }
  });

  const createCategory = async (req: Request, res: Response) => {
    try {
      const dto = plainToClass(CreateCategoryDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        const msgs = errors.map(e => Object.values(e.constraints || {})).flat();
        return res.status(400).json({ message: msgs.join(', ') });
      }
      const row = await svc.createCategory(dto, getAuthSub(req), clientIp(req));
      res.status(201).json(row);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  };
  r.post('/add_categories', createCategory);
  r.post('/categories', createCategory);

  const patchCategory = async (req: Request, res: Response) => {
    try {
      const dto = plainToClass(UpdateCategoryDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        const msgs = errors.map(e => Object.values(e.constraints || {})).flat();
        return res.status(400).json({ message: msgs.join(', ') });
      }
      const row = await svc.updateCategory(req.params.id, dto, getAuthSub(req), clientIp(req));
      res.json(row);
    } catch (e: any) {
      const status = e.message === 'Category not found' ? 404 : 400;
      res.status(status).json({ message: e.message });
    }
  };
  r.patch('/categories/:id', patchCategory);
  r.patch('/category/:id', patchCategory);

  const listServices = async (req: Request, res: Response) => {
    try {
      const all = req.query.purpose === 'all' || req.query.includeInactive === 'true';
      const items = await svc.listServices(all);
      res.json({ items });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  };
  r.get('/services/all', listServices);
  r.get('/services', listServices);

  r.get('/services/:id', async (req: Request, res: Response) => {
    try {
      const row = await svc.getService(req.params.id);
      if (!row) return res.status(404).json({ message: 'Service not found' });
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const createService = async (req: Request, res: Response) => {
    try {
      const dto = plainToClass(CreateCatalogServiceDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        const msgs = errors.map(e => Object.values(e.constraints || {})).flat();
        return res.status(400).json({ message: msgs.join(', ') });
      }
      const row = await svc.createService(dto, getAuthSub(req), clientIp(req));
      res.status(201).json(row);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  };
  r.post('/add_services', createService);
  r.post('/services', createService);

  r.patch('/services/batch/:categoryId', async (req: Request, res: Response) => {
    try {
      const body = await svc.batchUnlinkServicesForCategory(req.params.categoryId, getAuthSub(req), clientIp(req));
      res.json(body);
    } catch (e: any) {
      const status = e.message === 'Category not found' ? 404 : 400;
      res.status(status).json({ message: e.message });
    }
  });

  const patchService = async (req: Request, res: Response) => {
    try {
      const dto = plainToClass(UpdateCatalogServiceDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        const msgs = errors.map(e => Object.values(e.constraints || {})).flat();
        return res.status(400).json({ message: msgs.join(', ') });
      }
      const row = await svc.updateService(req.params.id, dto, getAuthSub(req), clientIp(req));
      res.json(row);
    } catch (e: any) {
      const status = e.message === 'Service not found' ? 404 : 400;
      res.status(status).json({ message: e.message });
    }
  };
  r.patch('/services/individual/:id', patchService);
  r.patch('/services/:id', patchService);

  const deleteService = async (req: Request, res: Response) => {
    try {
      await svc.deleteService(req.params.id, getAuthSub(req), clientIp(req));
      res.status(204).send();
    } catch (e: any) {
      const status = e.message === 'Service not found' ? 404 : 400;
      res.status(status).json({ message: e.message });
    }
  };
  r.delete('/service/:id', deleteService);
  r.delete('/services/:id', deleteService);

  r.patch('/products/batchCategory/:categoryId', (req: Request, res: Response) => {
    res.json(svc.batchProductsByCategoryStub(req.params.categoryId));
  });

  return r;
}
