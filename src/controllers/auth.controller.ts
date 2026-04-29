import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

/**
 * 내 정보 조회 및 자동 회원가입 API
 * 프론트엔드(NextAuth)가 보낸 JWT를 기반으로 DB 유저를 반환합니다.
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // authMiddleware를 통과했다면 req.user에 토큰 해독 정보가 들어있습니다.
    const decodedUser = req.user;

    if (!decodedUser || !decodedUser.email) {
      res.status(400).json({ message: '토큰에서 이메일 정보를 찾을 수 없습니다.' });
      return;
    }

    // Service 호출하여 DB 확인 및 생성
    const user = await authService.findOrCreateUser({
      email: decodedUser.email,
      sub: decodedUser.sub,
      name: decodedUser.name || decodedUser.email.split('@')[0], // 이름이 없으면 이메일 앞자리 사용
      image: decodedUser.picture || decodedUser.image, // 구글은 picture, NextAuth는 image로 줄 수 있음
    });

    res.status(200).json({
      message: '유저 정보 조회 성공',
      user,
    });
  } catch (error) {
    next(error); // 에러 핸들러로 전달
  }
};
