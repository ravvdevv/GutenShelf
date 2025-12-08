import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiResponse } from "shared/dist";
import { serverCache } from "./cache";

export const app = new Hono()

.use(cors())

.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ error: err.message }, 500)
})

.get("/", (c) => {
	return c.text("Hello Hono!");
})

// Proxy search to Gutendex with server-side caching
.get("/api/books", async (c) => {
  const search = c.req.query("search") || "";
  const page = c.req.query("page") || "1";
  // Encode search term to prevent cache key collisions with special characters
  const cacheKey = `books-${encodeURIComponent(search)}-${page}`;

  // Check cache first
  const cachedData = serverCache.get(cacheKey);
  if (cachedData) {
    return c.json(cachedData, { 
      status: 200,
      headers: { "X-Cache": "HIT" }
    });
  }

  try {
    const url = `https://gutendex.com/books?search=${encodeURIComponent(search)}&page=${page}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Gutendex API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the response
    serverCache.set(cacheKey, data);
    
    return c.json(data, { 
      status: 200,
      headers: { "X-Cache": "MISS" }
    });
  } catch (error) {
    console.error("Error fetching from Gutendex:", error);
    return c.json({ 
      error: "Failed to fetch books",
      results: []
    }, 500);
  }
})





.get("/hello", async (c) => {
	const data: ApiResponse = {
		message: "Hello BHVR!",
		success: true,
	};

	return c.json(data, { status: 200 });
})

.post("/auth/login", async (c) => {
    return c.json({ message: "Login system coming soon!" }, 501);
});


export default app;