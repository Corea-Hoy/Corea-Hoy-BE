import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

/**
 * 유저 프로필 조회
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id: userId },
  });
};

/**
 * 유저 프로필 수정
 */
export const updateUserProfile = async (
  userId: string,
  data: { nickname?: string; avatarEmoji?: string; avatarColor?: string }
): Promise<User> => {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
};

/**
 * 회원 탈퇴
 */
export const deleteUser = async (userId: string): Promise<User> => {
  return prisma.user.delete({
    where: { id: userId },
  });
};

/**
 * 내가 좋아요 한 기사 목록 조회
 */
export const getUserLikes = async (userId: string) => {
  const likes = await prisma.like.findMany({
    where: { userId },
    include: {
      article: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Like 객체에서 Article 객체만 추출하여 반환
  return likes.map((like) => like.article);
};
