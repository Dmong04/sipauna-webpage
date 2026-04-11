export const typeDefs = `
  type User {
    userId: ID!
    fullname: String!
    email: String!
    roleId: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Classroom {
    code: ID!
    name: String!
    capacity: Int!
  }

  type Schedule {
    id: ID!
    classroomCode: ID!
    day: String!
    startTime: String!
    endTime: String!
    subject: String!
    teacherName: String!
  }

  type Booking {
    id: ID!
    classroomCode: ID!
    requesterId: ID!
    requesterName: String!
    date: String!
    startTime: String!
    endTime: String!
    reason: String!
    status: String!
  }

  type Query {
    users: [User!]!
    user(userId: ID!): User
    classrooms: [Classroom!]!
    classroom(code: ID!): Classroom
    schedules: [Schedule!]!
    bookings: [Booking!]!
    bookingsByUser(userId: ID!): [Booking!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload
    createClassroom(code: ID!, name: String!, capacity: Int!): Classroom
    updateClassroom(code: ID!, name: String, capacity: Int): Classroom
    deleteClassroom(code: ID!): Boolean
    createBooking(
      classroomCode: ID!
      requesterId: ID!
      requesterName: String!
      date: String!
      startTime: String!
      endTime: String!
      reason: String!
    ): Booking
    updateBookingStatus(id: ID!, status: String!): Booking
  }
`