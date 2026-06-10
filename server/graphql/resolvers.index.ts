import { authMutations } from './resolvers/resolvers.auth'
import { userQueries, userMutations } from './resolvers/resolvers.users'
import { professorQueries, professorMutations } from './resolvers/resolvers.professors'
import { classroomQueries, classroomMutations } from './resolvers/resolvers.classrooms'
import { scheduleQueries, scheduleMutations } from './resolvers/resolvers.schedules'
import { loanQueries, loanMutations } from './resolvers/resolvers.loans'
import { importMutations } from './resolvers/resolvers.import'
import { profileMutations } from './resolvers/resolvers.profile'

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
    ...profileMutations,
    ...professorMutations,
  },
}