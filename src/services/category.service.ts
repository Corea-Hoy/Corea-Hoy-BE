import { prisma } from '../lib/prisma';

export const getAllCategories = async () => {
  return prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });
};
