export const typeDefs = `
  # ── Types ────────────────────────────────────────────────────────────────────

  type User {
    userId:   ID!
    email:    String!
    fullname: String!
    roleId:   String!
    roleName: String!
  }

  type Role {
    roleId: ID!
    name:   String!
  }

  type AuthPayload {
    token: String!
    user:  User!
  }

  type Classroom {
    classroomId: ID!
    code:        String!
    capacity:    Int!
  }

  type Schedule {
    scheduleId:    ID!
    classroomCode: String!
    day:           String!
    startTime:     String!
    endTime:       String!
    subject:       String!
    teacherName:   String!
  }

  type Loan {
    loanId:        ID!
    classroomCode: String!
    userId:        ID!
    requesterName: String!
    loanDate:      String!
    startTime:     String!
    endTime:       String!
    reason:        String!
    status:        String!
  }

  # ── Queries ──────────────────────────────────────────────────────────────────

  type Query {
    users:                       [User!]!
    user(userId: ID!):           User
    roles:                       [Role!]!
    classrooms:                  [Classroom!]!
    classroom(classroomId: ID!): Classroom
    schedules:                   [Schedule!]!
    loans:                       [Loan!]!
    loansByUser(userId: ID!):    [Loan!]!
  }

  # ── Mutations ────────────────────────────────────────────────────────────────

  type Mutation {
    login(email: String!, password: String!): AuthPayload
    register(fullname: String!, email: String!, password: String!, roleName: String): AuthPayload

    createUser(fullname: String!, email: String!, password: String!, roleName: String!, legalId: String!): User
    updateUserRole(userId: ID!, roleName: String!): User
    deleteUser(userId: ID!): Boolean

    createClassroom(code: String!, capacity: Int!): Classroom
    updateClassroom(classroomId: ID!, code: String, capacity: Int): Classroom
    deleteClassroom(classroomId: ID!): Boolean

    createLoan(
      classroomCode: String!
      loanDate:      String!
      startTime:     String!
      endTime:       String!
      reason:        String!
    ): Loan

    updateLoanStatus(loanId: ID!, status: String!): Loan
  }
`
