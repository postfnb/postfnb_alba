import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Local 전략 (이메일/비밀번호)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // 사용자 조회
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(null, false, { message: '사용자를 찾을 수 없습니다.' });
        }

        if (!user.password) {
          return done(null, false, { message: '소셜 로그인 계정입니다.' });
        }

        // 비밀번호 검증
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }

        // 마지막 로그인 시간 업데이트
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// 2. JWT 전략 (Access Token 검증)
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
    },
    async (payload, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
        });

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// 3. Kakao 전략
passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      callbackURL: process.env.KAKAO_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const kakaoId = String(profile.id); // 숫자를 문자열로 변환
        const kakaoAccount = profile._json.kakao_account;
        const properties = profile._json.properties;
        
        // 카카오에서 제공하는 다양한 이름 필드 확인
        const email = kakaoAccount?.email;
        
        // 닉네임 추출: properties.nickname이 기본
        let nickname = properties?.nickname;
        
        // properties.nickname이 "미연동 계정"이거나 비어있으면 다른 경로 확인
        if (!nickname || nickname === '미연동 계정') {
          nickname = kakaoAccount?.profile?.nickname || 
                     kakaoAccount?.name || 
                     profile.displayName || 
                     profile.username || 
                     `카카오사용자_${kakaoId.slice(-4)}`;
        }
        
        const profileImage = properties?.profile_image || kakaoAccount?.profile?.profile_image_url;
        const phone = kakaoAccount?.phone_number || '';

        console.log('=== 카카오 프로필 정보 ===');
        console.log('ID:', kakaoId);
        console.log('Email:', email);
        console.log('Nickname:', nickname);
        console.log('Profile Image:', profileImage);
        console.log('Phone:', phone);
        console.log('Properties:', properties);
        console.log('Kakao Account:', kakaoAccount);
        console.log('Display Name:', profile.displayName);
        console.log('========================');

        // 기존 사용자 확인
        let user = await prisma.user.findUnique({
          where: {
            provider_providerId: {
              provider: 'KAKAO',
              providerId: kakaoId,
            },
          },
        });

        if (!user) {
          // 신규 사용자 생성
          user = await prisma.user.create({
            data: {
              email: email || `kakao_${kakaoId}@temp.com`,
              name: nickname,
              phone: phone,
              profileImage,
              provider: 'KAKAO',
              providerId: kakaoId,
              lastLoginAt: new Date(),
            },
          });
        } else {
          // 기존 사용자의 이름이 "미연동 계정"이면 업데이트
          const updateData: any = { lastLoginAt: new Date() };
          
          if (user.name === '미연동 계정' && nickname && nickname !== '미연동 계정') {
            updateData.name = nickname;
            console.log('기존 사용자 이름 업데이트:', user.name, '->', nickname);
          }
          
          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export default passport;
