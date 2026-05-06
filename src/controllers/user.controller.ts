import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';

/**
 * 내 프로필 조회
 */
export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: '인증이 필요합니다.' });
      return;
    }

    const user = await userService.getUserProfile(userId);

    if (!user) {
      res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
      return;
    }

    res.status(200).json({
      message: '프로필 조회 성공',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 내 프로필 수정
 */
export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { nickname, avatarEmoji, avatarColor } = req.body;

    if (!userId) {
      res.status(401).json({ message: '인증이 필요합니다.' });
      return;
    }

    const updatedUser = await userService.updateUserProfile(userId, {
      nickname,
      avatarEmoji,
      avatarColor,
    });

    res.status(200).json({
      message: '프로필 수정 성공',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 회원 탈퇴
 */
export const deleteMyAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: '인증이 필요합니다.' });
      return;
    }

    await userService.deleteUser(userId);

    res.status(200).json({
      message: '회원 탈퇴 성공',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 내가 좋아요 한 콘텐츠 목록 조회
 */
export const getMyLikes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: '인증이 필요합니다.' });
      return;
    }

    const likedArticles = await userService.getUserLikes(userId);

    res.status(200).json({
      message: '좋아요 한 콘텐츠 목록 조회 성공',
      articles: likedArticles,
    });
  } catch (error) {
    next(error);
  }
};
