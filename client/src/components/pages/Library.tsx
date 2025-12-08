import BookCard from "@/components/BookCard";
import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Frown, BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { memo } from "react";
import { apiCache } from "@/lib/cache";

const SkeletonCard = () => (
  <div className="rounded-lg shadow overflow-hidden">
    <Skeleton className="h-64 w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

const ErrorState = ({ error }: { error: string }) => (
  <div className="text-center py-20 text-red-500">
    <Frown className="w-12 h-12 mx-auto mb-4" />
    <p className="text-xl font-semibold">Something broke 😵</p>
    <p className="text-sm text-gray-500 mt-1">{error}</p>
  </div>
);

const NoResultsState = ({ searchTerm }: { searchTerm: string }) => (
  <div className="text-center py-20 text-gray-500">
    <Search className="w-12 h-12 mx-auto mb-4" />
    <p className="text-lg font-semibold">No results for "{searchTerm}"</p>
    <p className="text-sm text-gray-400">Try a different keyword.</p>
  </div>
);

const EmptyLibraryState = () => (
  <div className="text-center py-20 text-gray-500">
    <BookOpen className="w-12 h-12 mx-auto mb-4" />
    <p className="text-lg font-semibold">Library is empty</p>
    <p className="text-sm text-gray-400">Check back soon for book drops!</p>
  </div>
);

const BookGrid = memo(({ books }: { books: any[] }) => (
  <motion.div
    layout
    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
  >
    <AnimatePresence>
      {books.map((book) => (
        <motion.div
          key={book.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <BookCard book={book} />
        </motion.div>
      ))}
    </AnimatePresence>
  </motion.div>
));

export default function Library() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 🔄 Debounce Search Input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  // 📚 Fetch Books
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchBooks = async () => {
      // Check cache first
      const cacheKey = `books-${debouncedTerm}`;
      const cachedData = apiCache.get<any[]>(cacheKey);
      
      if (cachedData) {
        setBooks(cachedData);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://gutendex.com/books?search=${debouncedTerm}`,
          { signal: abortController.signal }
        );
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        const results = data.results || [];
        
        // Cache the results
        apiCache.set(cacheKey, results);
        setBooks(results);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error(err);
        setError("Could not fetch books. Try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooks();
    
    // Cleanup: abort fetch on unmount or when debouncedTerm changes
    return () => {
      abortController.abort();
    };
  }, [debouncedTerm]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Our Library</h1>

      <div className="relative mb-10 max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input
          type="text"
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 py-3 text-lg"
        />
      </div>
        {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : books.length > 0 ? (
        <BookGrid books={books} />
      ) : searchTerm ? (
        <NoResultsState searchTerm={searchTerm} />
      ) : (
        <EmptyLibraryState />
      )}
    </div>
  );
}
