import { validateEmail, validatePassword, validatePhone } from './validation';

/**
 * 유틸리티 함수 테스트
 *
 * 테스트 범위:
 * - 이메일 검증
 * - 비밀번호 검증
 * - 전화번호 검증
 */
describe('validation utils', () => {
  describe('validateEmail', () => {
    test.each([
      'test@example.com',
      'user.name@domain.co.kr',
      'admin+tag@company.com',
      'test123@test-domain.com',
      'a@b.c',
    ])('유효한 이메일: %s', (email) => {
      expect(validateEmail(email)).toBe(true);
    });

    test.each([
      '',
      'invalid',
      '@example.com',
      'test@',
      'test @example.com',
      'test@domain',
      'test..double@example.com',
      'test@domain..com',
    ])('유효하지 않은 이메일: %s', (email) => {
      expect(validateEmail(email)).toBe(false);
    });

    test('null 또는 undefined는 유효하지 않음', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    describe('유효한 비밀번호', () => {
      test('8자 이상, 영문/숫자 포함', () => {
        expect(validatePassword('Password123')).toBe(true);
      });

      test('특수문자 포함', () => {
        expect(validatePassword('Password123!')).toBe(true);
      });

      test('긴 비밀번호', () => {
        expect(validatePassword('VeryLongPassword12345!')).toBe(true);
      });
    });

    describe('유효하지 않은 비밀번호', () => {
      test('8자 미만', () => {
        expect(validatePassword('Pass1')).toBe(false);
      });

      test('영문이 없음', () => {
        expect(validatePassword('12345678')).toBe(false);
      });

      test('숫자가 없음', () => {
        expect(validatePassword('Password')).toBe(false);
      });

      test('빈 문자열', () => {
        expect(validatePassword('')).toBe(false);
      });

      test('공백만 있는 경우', () => {
        expect(validatePassword('        ')).toBe(false);
      });

      test('null 또는 undefined', () => {
        expect(validatePassword(null)).toBe(false);
        expect(validatePassword(undefined)).toBe(false);
      });
    });

    describe('에지 케이스', () => {
      test('정확히 8자', () => {
        expect(validatePassword('Pass1234')).toBe(true);
      });

      test('대소문자 혼합', () => {
        expect(validatePassword('PaSsWoRd123')).toBe(true);
      });

      test('특수문자만 포함 (영문/숫자 없음)', () => {
        expect(validatePassword('!@#$%^&*')).toBe(false);
      });
    });
  });

  describe('validatePhone', () => {
    describe('유효한 전화번호', () => {
      test.each([
        '010-1234-5678',
        '010-0000-0000',
        '010-9999-9999',
        '011-123-4567',
        '016-123-4567',
        '017-123-4567',
        '018-123-4567',
        '019-123-4567',
      ])('하이픈 포함: %s', (phone) => {
        expect(validatePhone(phone)).toBe(true);
      });

      test.each([
        '01012345678',
        '01000000000',
        '01099999999',
      ])('하이픈 없음: %s', (phone) => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    describe('유효하지 않은 전화번호', () => {
      test.each([
        '',
        '010-123-456',       // 너무 짧음
        '010-12345-67890',   // 형식 오류
        '012-1234-5678',     // 유효하지 않은 국번
        '010 1234 5678',     // 공백
        '010.1234.5678',     // 점
        'abc-defg-hijk',     // 문자
      ])('잘못된 형식: %s', (phone) => {
        expect(validatePhone(phone)).toBe(false);
      });

      test('null 또는 undefined', () => {
        expect(validatePhone(null)).toBe(false);
        expect(validatePhone(undefined)).toBe(false);
      });
    });
  });
});
