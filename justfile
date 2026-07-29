set dotenv-load := true

default:
  @just --list

setup:
  npm ci

start:
  npm start

ios:
  npm run ios

check:
  npm run check

test:
  npm test

format:
  npm run format

doctor:
  npm run expo:doctor

build-ios profile="development-simulator":
  npx eas-cli build --platform ios --profile {{ profile }}
