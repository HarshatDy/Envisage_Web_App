import { connectToDatabase } from "../../utils/mongodb";

export default async function handler(req, res) {
  try {
    console.log("API request received. Connecting to the database...");
    const { db } = await connectToDatabase();
    console.log("Database connection successful. Fetching news...");
    const news = await db.collection("news").find({}).toArray();
    console.log("News fetched successfully:", news);
    res.status(200).json({ data: news });
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
}
