import { users } from "./data/users";

let mockUsers = [...users]

export const resolvers = {
    Query: {
        users: () => mockUsers,
        user: (_: any, { userId }: any) => mockUsers.find(u => u.userId === userId) ?? null,
    },

    Mutation: {
        login: (_: any, { email, password }: any) => {
            const user = mockUsers.find(u => u.email === email && u.password === password);
            if (!user) throw new Error("Invalid crtedentials");
            const token = `mock-token-${user.userId}`;
            return {
                token,
                user
            }
        }
    }
}