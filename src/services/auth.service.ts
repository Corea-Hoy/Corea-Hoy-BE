import { prisma } from '../lib/prisma';
import { users } from '@prisma/client';

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
export const findOrCreateUser = async (payload: UserPayload): Promise<users> => {
  const user = await prisma.users.upsert({
    where: {
      email: payload.email
    },
    update: {
      nickname: payload.name,
      avatar_emoji: payload.image,
    },
    create: {
      email: payload.email,
      google_id: payload.sub || payload.email, // google_id는 필수이므로 sub가 없으면 email을 대용합니다.
      nickname: payload.name,
      avatar_emoji: payload.image,
    },
  });

  return user;
};
