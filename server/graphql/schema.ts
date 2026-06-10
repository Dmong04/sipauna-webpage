export const typeDefs = `
scalar Upload
# ── Types ─────────────────────────────────────────────────────────────────────

type User {
  userId: ID!
  email: String!
  fullname: String!
  roleId: String!
  roleName: String!
}

type Role {
  roleId: ID!
  name: String!
}

type ProfessorProfile {
  userId: ID
  fullName: String!
}

type AuthPayload {
  token: String!
  user: User!
}

type Classroom {
  classroomId: ID!
  code: String!
  capacity: Int!
}

type Schedule {
  scheduleId: ID!
  classroomCode: String!
  day: String!
  startTime: String!
  endTime: String!
  subject: String!
  teacherName: String!
}

type Loan {
  loanId: ID!
  classroomCode: String!
  userId: ID!
  requesterName: String!
  loanDate: String!
  startTime: String!
  endTime: String!
  reason: String!
  status: String!
}

type ImportResult {
  success: Boolean!
  professors: Int!
  areas: Int!
  classrooms: Int!
  courses: Int!
  schedules: Int!
  skipped: Int!
  errors: [String!]!
}

type StudentProfile {
  userId: ID
  fullName: String!
}

type GuestProfile {
  userId: ID
  fullname: String!
}

# ── Queries ───────────────────────────────────────────────────────────────────

type Query {
  users: [User!]!
  user(userId: ID!): User
  roles: [Role!]!
  professors: [ProfessorProfile!]!
  classrooms: [Classroom!]!
  classroom(classroomId: ID!): Classroom
  schedules: [Schedule!]!
  loans(loanDate: String): [Loan!]!
  loansByUser(userId: ID!): [Loan!]!
  checkProfessorByLegalId(legalId: String!): ProfessorProfile
  checkProfessorExists(fullName: String!): Boolean!
  checkStudentByLegalId(legalId: String!): StudentProfile
  checkGuestByLegalId(legalId: String!): GuestProfile
}

# ── Mutations ─────────────────────────────────────────────────────────────────

type Mutation {
  login(email: String!, password: String!): AuthPayload
  register(
    fullname: String!
    email: String!
    password: String!
    roleName: String
    legalId: String
  ): AuthPayload

  createUser(
    fullname: String!
    email: String!
    password: String!
    roleName: String!
    legalId: String!
  ): User
  updateUserRole(userId: ID!, roleName: String!): User
  deleteUser(userId: ID!): Boolean

  createClassroom(code: String!, capacity: Int!): Classroom
  updateClassroom(classroomId: ID!, code: String, capacity: Int): Classroom
  deleteClassroom(classroomId: ID!): Boolean
  importExcel(file: Upload!): ImportResult!

  createSchedule(
    classroomCode: String!
    subject: String!
    professorUserId: ID!
    day: String!
    startTime: String!
    endTime: String!
  ): Schedule

  deleteSchedule(scheduleId: ID!): Boolean

  createLoan(
    classroomCode: String!
    userId: ID!
    loanDate: String!
    startTime: String!
    endTime: String!
    reason: String!
  ): Loan

  updateLoanStatus(loanId: ID!, status: String!): Loan
}
`
