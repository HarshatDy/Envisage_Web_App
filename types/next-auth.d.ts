import { DefaultSession } from "next-auth"

// Extend the session types
declare module "next-auth" {
  /**
   * Extends the built-in session with custom properties
   */
  interface Session {
    user: {
      id?: string  // Make id optional
    } & DefaultSession["user"]
  }
}

// Extend the JWT type to include the custom properties we're using
declare module "next-auth/jwt" {
  /** Extends the built-in JWT with custom properties */
  interface JWT {
    id?: string
    picture?: string
  }
}
