import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { db } from "@/lib/db"
import { compare, hash } from "bcryptjs"
import { Role } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
        name: { label: "Name", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        })
        

        if (!user) {
          try {
            if (!["Student", "Professor"].includes(credentials.role)) {
              throw new Error("Invalid role")
            }
            
            const hashedPassword = await hash(credentials.password, 10)
            
            const createdUser = await db.user.create({
              data: {
                name: credentials.name,
                email: credentials.email,
                password: hashedPassword,
                role: credentials.role as Role,
                ...(credentials.role === "Student"
                  ? { student: { create: {} } }
                  : { professor: { create: {} } }),
              },
            })
            return {
              id: createdUser.id,
              email: createdUser.email,
              name: createdUser.name,
              role: createdUser.role,
            }
          } catch (error) {
            console.error("Error creating user:", error)
            return null
          }
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.role = token.role as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
  },
}
