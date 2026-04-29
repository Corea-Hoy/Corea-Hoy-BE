import { prisma } from '../lib/prisma';
import { FeedbackCategory } from '@prisma/client';

interface CreateFeedbackParams {
  category: FeedbackCategory;
  otherCategory?: string;
  body: string;
  email?: string;
  submittedBy: string;
  userId?: string;
}

export const createFeedback = async (params: CreateFeedbackParams) => {
  return prisma.feedback.create({
    data: {
      category: params.category,
      otherCategory: params.otherCategory,
      body: params.body,
      email: params.email,
      submittedBy: params.submittedBy,
      userId: params.userId ?? null,
    },
  });
};
