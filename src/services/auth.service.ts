import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

// 프론트엔드(토큰)로부터 받을 유저 정보의 타입 정의
export interface UserPayload {
  email: string;
  sub?: string;
  name?: string;
  image?: string;
}

/**
 * 주어진 이메일로 유저를 찾고, 없으면 새로 생성합니다. (Upsert 패턴)
 */
export const findOrCreateUser = async (payload: UserPayload): Promise<User> => {
  const user = await prisma.user.upsert({
    where: {
      email: payload.email
    },
    update: {
      nickname: payload.name,
      avatarEmoji: payload.image,
    },
    create: {
      email: payload.email,
      googleId: payload.sub || payload.email,
      nickname: payload.name,
      avatarEmoji: payload.image,
    },
  });

  return user;
};
