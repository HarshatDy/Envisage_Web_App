import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";

// Default API URL from env
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          // Query the MongoDB API server to find the user
          const response = await fetch(`${API_URL}/api/users/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: { email: credentials.email, authProvider: "email" } 
            }),
          });

          const result = await response.json();
          
          if (!result || !Array.isArray(result) || result.length === 0) {
            throw new Error("No user found with this email");
          }

          const user = result[0];

          // Verify password using bcrypt
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect) {
            throw new Error("Invalid password");
          }

          // Return user object without sensitive info
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            image: user.profilePicture
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error(error instanceof Error ? error.message : "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Keep existing user data when available
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image || undefined; // Convert null to undefined
      }

      // If this is a Google sign-in, register or update the user in MongoDB
      if (account?.provider === "google" && token.email) {
        try {
          // Check if user exists
          const checkResponse = await fetch(`${API_URL}/api/users/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: { email: token.email } 
            }),
          });
          
          const checkResult = await checkResponse.json();
          
          if (!checkResult || !Array.isArray(checkResult) || checkResult.length === 0) {
            // User doesn't exist, create a new one
            console.log("Creating new Google user:", token.email);
            const createResponse = await fetch(`${API_URL}/api/users`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: token.email,
                name: token.name || "Google User",
                authProvider: "google",
                googleId: account.providerAccountId,
                profilePicture: token.picture || '/images/default-avatar.png'
              }),
            });
            
            if (createResponse.ok) {
              const newUser = await createResponse.json();
              if (newUser && newUser.user && newUser.user._id) {
                token.id = newUser.user._id;
                console.log("Created new user with ID:", token.id);
              }
            } else {
              console.error("Failed to create Google user:", await createResponse.text());
            }
          } else {
            // User exists, update profile and last login
            const existingUser = checkResult[0];
            token.id = existingUser._id;
            
            // Update the user with latest Google profile info
            await fetch(`${API_URL}/api/users/${existingUser._id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: token.name || existingUser.name,
                profilePicture: token.picture || existingUser.profilePicture,
                lastLogin: new Date().toISOString()
              }),
            });
            console.log("Updated existing Google user:", existingUser._id);
          }
        } catch (error) {
          console.error("Error managing Google user in MongoDB:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Make sure user data is carried into the session
      if (token && session.user) {
        // Only assign id if it's defined
        if (token.id) {
          session.user.id = token.id;
        }
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
