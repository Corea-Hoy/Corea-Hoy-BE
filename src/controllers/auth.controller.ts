import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import * as authService from '../services/auth.service';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

/**
 * 구글 ID 토큰 검증 및 로그인/회원가입
 * FE에서 직접 구글로부터 받은 id_token을 백엔드로 보냅니다.
 */
export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      res.status(400).json({ message: 'id_token이 필요합니다.' });
      return;
    }

    // 1. 구글 ID 토큰 검증
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      res.status(401).json({ message: '유효하지 않은 구글 토큰입니다.' });
      return;
    }

    // 2. 유저 조회 또는 생성 (JIT)
    const user = await authService.findOrCreateUser({
      email: payload.email,
      sub: payload.sub,
      name: payload.name,
      image: payload.picture,
    });

    // 3. 서비스 자체 JWT 발급
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' } // 예: 7일간 유효
    );

    res.status(200).json({
      message: '로그인 성공',
      user,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 내 정보 조회 API
 * 자체 발급한 JWT를 통해 유저 정보를 반환합니다.
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const decodedUser = req.user;

    if (!decodedUser || !decodedUser.email) {
      res.status(401).json({ message: '인증 정보가 없습니다.' });
      return;
    }

    // DB에서 최신 정보 조회
    const user = await authService.findOrCreateUser({
      email: decodedUser.email,
    });

    res.status(200).json({
      message: '유저 정보 조회 성공',
      user,
    });
  } catch (error) {
    next(error);
  }
};
