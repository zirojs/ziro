import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'prisma://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiNTkyMzZlMWItN2Q3ZS00MDA4LTkzZGItZDI1NDdkN2VjYTBkIiwidGVuYW50X2lkIjoiNDJjOGRhNWVkZmMxM2IxMWI3NDhiYjA1ZDVjOTA4YzcyZmIyNzk0ZGYyM2FiZmI3ZWRjNzM5ZmNiZDQzY2ZkOCIsImludGVybmFsX3NlY3JldCI6IjA5YmM2OTViLTNhZjgtNDgxYy04NWQxLTcxMzc5ZjRhZGQxNyJ9.qnE_u9BZjFHwJFadzZzHYWsNyGoUnSUpF9vGZbT0Hhw',
    },
  },
}).$extends(withAccelerate())
