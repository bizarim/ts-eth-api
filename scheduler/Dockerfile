# node
FROM node:10

# 경로 설정
#ENV PATH=/Users/met/docker

# 경로
WORKDIR /home/ubuntu/ethScheduler

# 의존 관리 파일 복사
# COPY package.json ./
# COPY package-lock.json ./
# COPY tsconfig.json ./
# COPY tslint.json ./

# 파일 복사
COPY ./ ./

# 의존 패키지 설치
RUN npm install

# 포트 열어주고
# EXPOSE 10230

# 실행
CMD ["npm", "run", "prod"]