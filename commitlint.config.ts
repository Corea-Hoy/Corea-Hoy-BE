import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 새 기능
        'fix',      // 버그 수정
        'docs',     // 문서 수정
        'style',    // 포맷팅 (로직 변경 없음)
        'refactor', // 리팩토링
        'chore',    // 패키지, 설정 변경
      ],
    ],
    'subject-min-length': [2, 'always', 2],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
  },
};

export default config;
