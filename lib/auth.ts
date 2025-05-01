import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";

// Debug flag - set to true to enable debug logging
const DEBUG_AUTH = process.env.DEBUG_AUTH === "false" || false;

// Debug logging helper
const debugLog = (...args: any[]) => {
  if (DEBUG_AUTH) {
    console.log("[AUTH_DEBUG]", ...args);
  }
};

// Default API URL from env
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
debugLog("API_URL:", API_URL);
console.log("API_URL:", API_URL)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        debugLog("Authorizing credentials for:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          debugLog("Missing email or password");
          throw new Error("Email and password required");
        }

        try {
          debugLog("Querying user with email:", credentials.email);
          // Query the MongoDB API server to find the user
          const response = await fetch(`${API_URL}/api/users/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: { email: credentials.email, authProvider: "email" } 
            }),
          });

          const result = await response.json();
          debugLog("User query result:", result ? "Found" : "Not found");
          
          if (!result || !Array.isArray(result) || result.length === 0) {
            debugLog("No user found with email:", credentials.email);
            throw new Error("No user found with this email");
          }

          const user = result[0];
          debugLog("Found user:", user._id);

          // Verify password using bcrypt
          debugLog("Verifying password...");
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect) {
            debugLog("Password verification failed for user:", user._id);
            throw new Error("Invalid password");
          }
          
          debugLog("Password verification successful for user:", user._id);

          // Return user object without sensitive info
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            image: user.profilePicture
          };
        } catch (error) {
          debugLog("Authentication error:", error);
          console.error("Authentication error:", error);
          throw new Error(error instanceof Error ? error.message : "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      debugLog("JWT callback:", { 
        hasToken: !!token, 
        hasUser: !!user, 
        accountProvider: account?.provider 
      });
      
      // Keep existing user data when available
      if (user) {
        debugLog("Updating token with user data:", user.id);
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image || undefined; // Convert null to undefined
      }

      // If this is a Google sign-in, register or update the user in MongoDB
      if (account?.provider === "google" && token.email) {
        debugLog("Processing Google sign-in for:", token.email);
        try {
          // Check if user exists
          debugLog("Checking if Google user exists:", token.email);
          const checkResponse = await fetch(`${API_URL}/api/users/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: { 
                $and: [
                  { email: token.email },
                  { googleId: account.providerAccountId }
                ]
              }
            }),
          });
          
          const checkResult = await checkResponse.json();
          debugLog("User existence check result:", checkResult ? "Found data" : "No data");
          
          if (!checkResult || !Array.isArray(checkResult) || checkResult.length === 0) {
            // User doesn't exist, create a new one
            debugLog("Creating new Google user:", token.email);
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
              debugLog("User creation response:", newUser);
              if (newUser && newUser.user && newUser.user._id) {
                token.id = newUser.user._id;
                debugLog("Created new user with ID:", token.id);
              }
            } else {
              const errorText = await createResponse.text();
              debugLog("Failed to create Google user:", errorText);
              console.error("Failed to create Google user:", errorText);
            }
          } else {
            // User exists, update profile and last login
            const existingUser = checkResult[0];
            token.id = existingUser._id;
            debugLog("Google user exists, updating:", existingUser._id);
            
            // Update the user with latest Google profile info
            const updateResponse = await fetch(`${API_URL}/api/users/${existingUser._id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: token.name || existingUser.name,
                profilePicture: token.picture || existingUser.profilePicture,
                lastLogin: new Date().toISOString()
              }),
            });
            
            if (updateResponse.ok) {
              debugLog("Updated existing Google user successfully");
            } else {
              debugLog("Failed to update Google user:", await updateResponse.text());
            }
            
            console.log("Updated existing Google user:", existingUser._id);
          }
        } catch (error) {
          debugLog("Error managing Google user in MongoDB:", error);
          console.error("Error managing Google user in MongoDB:", error);
        }
      }

      // Handle GitHub sign-in similar to Google
      if (account?.provider === "github" && token.email) {
        debugLog("Processing GitHub sign-in for:", token.email);
        try {
          // Check if user exists by email and/or already has a GitHub connection
          const checkResponse = await fetch(`${API_URL}/api/users/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: { 
                $and: [
                  { email: token.email },
                  { githubId: account.providerAccountId }
                ]
              }
            }),
          });
          
          const checkResult = await checkResponse.json();
          //console.log("User existence check result:", checkResult ? "Found data" : "No data");
          
          if (!checkResult || !Array.isArray(checkResult) || checkResult.length === 0) {
            // User doesn't exist, create a new one
            debugLog("Creating new GitHub user:", token.email);
            console.log("Creating new GitHub user:", token.email);
            const createResponse = await fetch(`${API_URL}/api/users`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: token.email,
                name: token.name || "GitHub User",
                authProvider: "github",
                githubId: account.providerAccountId,
                profilePicture: token.picture || '/images/default-avatar.png'
              }),
            });
            console.log("createResponse:", createResponse);
            
            if (createResponse.ok) {
              const newUser = await createResponse.json();
              if (newUser && newUser.user && newUser.user._id) {
                token.id = newUser.user._id;
              }
            } else {
              const errorText = await createResponse.text();
              debugLog("Failed to create GitHub user:", errorText);
              console.log("Failed to create GitHub user:", errorText);
            }
          } else {
            // User exists, update profile and last login
            const existingUser = checkResult[0];
            token.id = existingUser._id;
            
            // Update the user with latest GitHub profile info
            const updateResponse = await fetch(`${API_URL}/api/users/${existingUser._id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: token.name || existingUser.name,
                profilePicture: token.picture || existingUser.profilePicture,
                lastLogin: new Date().toISOString(),
                // If user didn't have githubId before, add it now
                ...(existingUser.authProvider !== "github" && { githubId: account.providerAccountId }),
                ...(existingUser.authProvider === "email" && { authProvider: "multiple" })
              }),
            });
          }
        } catch (error) {
          debugLog("Error managing GitHub user in MongoDB:", error);
          console.error("Error managing GitHub user in MongoDB:", error);
        }
      }
      
      debugLog("Final token:", { id: token.id, email: token.email });
      console.log("Final token:", { id: token.id, email: token.email });
      return token;
    },
    async session({ session, token }) {
      debugLog("Session callback", { 
        hasToken: !!token, 
        hasSession: !!session,
        hasUser: !!session?.user
      });
      
      // Make sure user data is carried into the session
      console.log("SESSION CALLBACK ------------------------------------------------", { session, token });
      if (token && session.user) {
        // Only assign id if it's defined
        console.log("Assigning user ID to session:-----------------------------------------", token.id);
        if (token.id) {
          session.user.id = token.id;
          debugLog("Set user ID in session:", token.id);
          console.log("Set user ID in session:", token.id);
        }
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        
        debugLog("Updated session with token data:", {
          id: session.user.id,
          email: session.user.email,
          hasImage: !!session.user.image
        });
      }
      debugLog("Final session user:", session.user);
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
