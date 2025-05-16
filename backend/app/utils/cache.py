import time
from functools import lru_cache
from app.config import CACHE_TIMEOUT

class SimpleCache:
    """Simple in-memory cache implementation"""
    
    def __init__(self, timeout=CACHE_TIMEOUT):
        self.cache = {}
        self.timeout = timeout
    
    def get(self, key):
        """Get a value from the cache"""
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry['timestamp'] < self.timeout:
                return entry['value']
            else:
                # Entry expired
                del self.cache[key]
        return None
    
    def set(self, key, value):
        """Set a value in the cache"""
        self.cache[key] = {
            'value': value,
            'timestamp': time.time()
        }
    
    def delete(self, key):
        """Delete a value from the cache"""
        if key in self.cache:
            del self.cache[key]
    
    def clear(self):
        """Clear the entire cache"""
        self.cache = {}

# Create a global cache instance
question_cache = SimpleCache()

# LRU cache decorator for functions
def cached(maxsize=128, timeout=CACHE_TIMEOUT):
    """Decorator to cache function results with timeout"""
    def decorator(func):
        # Use functools lru_cache
        @lru_cache(maxsize=maxsize)
        def cached_func(*args, **kwargs):
            return func(*args, **kwargs)
        
        # Add a wrapper to handle timeout
        def wrapper(*args, **kwargs):
            # Use the function name and arguments as cache key
            key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            result = question_cache.get(key)
            
            if result is None:
                result = cached_func(*args, **kwargs)
                question_cache.set(key, result)
                
            return result
        
        # Add clear cache method
        wrapper.clear_cache = cached_func.cache_clear
        
        return wrapper
    return decorator
