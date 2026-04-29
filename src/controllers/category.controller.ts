import { Request, Response, NextFunction } from 'express';
import { getAllCategories } from '../services/category.service';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await getAllCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};
