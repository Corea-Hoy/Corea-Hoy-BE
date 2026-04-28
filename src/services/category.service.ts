import { prisma } from '../lib/prisma';

export const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
};
