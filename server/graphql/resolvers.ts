import { users } from "./data/users";
import { classrooms as cla } from "./data/classrooms";

let mockUsers = [...users]
let mockClassrooms=[...cla]


//Posiblemente haya que dividir el resolver o quizas no
export const resolvers = {
    Query: {
        users: () => mockUsers,
        user: (_: any, { userId }: any) => mockUsers.find(u => u.userId === userId) ?? null,
        classrooms:()=>mockClassrooms,
        classroom:(_:any,{code}:any)=>mockClassrooms.find(c=>c.code===code)??null,
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

