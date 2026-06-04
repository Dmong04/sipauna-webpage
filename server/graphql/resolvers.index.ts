import { authMutations } from './resolvers/resolvers.auth'
import { userQueries, userMutations } from './resolvers/resolvers.users'
import { professorQueries } from './resolvers/resolvers.professors'
import { classroomQueries, classroomMutations } from './resolvers/resolvers.classrooms'
import { scheduleQueries, scheduleMutations } from './resolvers/resolvers.schedules'
import { loanQueries, loanMutations } from './resolvers/resolvers.loans'
import { importMutations } from './resolvers/resolvers.import'

export const resolvers = {
  Query: {
    ...userQueries,
    ...professorQueries,
    ...classroomQueries,
    ...scheduleQueries,
    ...loanQueries,
  },
  Mutation: {
    ...authMutations,
    ...userMutations,
    ...classroomMutations,
    ...scheduleMutations,
    ...loanMutations,
    ...importMutations,
  },
}