import { supabase } from '../supabase-client';
import type { Cafe, CafeLocation } from '../data/cafes';

// Define types for Supabase storage
interface StorageBucket {
  name: string;
  [key: string]: any;
}

interface StorageFile {
  name: string;
  [key: string]: any;
}

// Supabase table names
const CAFES_TABLE = 'cafes';

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase error (${context}):`, error.message);
  if (error.details) {
    console.error('Details:', error.details);
  }
  if (error.hint) {
    console.error('Hint:', error.hint);
  }
  return Promise.reject(error);
};

// Ensure image URLs are properly formatted
const ensureFullImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '/images/placeholder.svg';
  
  // If it's already a full URL or a local path starting with '/'
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // Otherwise, assume it's a relative path and add the base URL
  return `/images/${imageUrl}`;
};



/**
 * Fetches all image URLs for a specific cafe from Supabase Storage
 */
const getCafeImageUrls = async (cafeId: number): Promise<string[]> => {
  try {
    // First, check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets() as { data: StorageBucket[] | null; error: any };
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
      return ['/images/no-image.svg'];
    }
    
    // Check if our bucket exists
    const cafeBucket = buckets?.find(bucket => bucket.name === 'cafe-images');
    if (!cafeBucket) {
      return ['/images/no-image.svg'];
    }
    
    // List all files in the cafe's folder
    const folderPath = `cafe-${cafeId}`;
    const { data: files, error } = await supabase.storage
      .from('cafe-images')
      .list(folderPath) as { data: StorageFile[] | null; error: any };
    
    if (error) {
      console.error(`Error listing images for cafe ${cafeId}:`, error);
      return ['/images/no-image.svg'];
    }
    
    // Filter out non-image files and the .emptyFolderPlaceholder
    const imageFiles = files?.filter(file => 
      file.name !== '.emptyFolderPlaceholder' && 
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name)
    ) || [];
    
    if (!imageFiles.length) {
      return ['/images/no-image.svg'];
    }
    
    // Get public URLs for all valid image files
    const imageUrls = imageFiles.map(file => {
      const fullPath = `${folderPath}/${file.name}`;
      const { data: { publicUrl } } = supabase.storage
        .from('cafe-images')
        .getPublicUrl(fullPath);
      
      return publicUrl;
    });
    
    return imageUrls;
  } catch (error) {
    console.error('Error in getCafeImageUrls:', error);
    return ['/images/no-image.svg'];
  }
};

// Define the shape of cafe data from Supabase
export interface SupabaseCafe {
  id: number;
  name: string;
  description?: string | Record<string, any> | null;
  location: CafeLocation | null;
  images?: string[] | null;
  wifi?: boolean;
  power_outlets?: boolean;
  seating_capacity?: number | null;
  noise_level?: string | null;
  price_range?: string | null;
  upvotes?: number;
  downvotes?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // For any additional properties
}

// Transform Supabase cafe data to our application's Cafe format
// Export this function so it can be used by other services
export const transformCafeData = async (supaCafe: SupabaseCafe | null): Promise<Cafe> => {
  try {
    console.log('Transforming Supabase cafe data:', supaCafe);
    
    // Handle both single item and collection responses
    // First, check if we're dealing with a valid object
    if (!supaCafe || typeof supaCafe !== 'object') {
      console.error('Invalid cafe data:', supaCafe);
      // Return a minimal valid cafe object with required fields
      return {
        id: 0,
        created_at: new Date().toISOString(),
        name: 'Invalid Cafe',
        description: 'This cafe has invalid data',
        location: {
          city: 'Unknown',
          address: 'Unknown',
          country: 'Unknown'
        },
        wifi: false,
        powerOutletAvailable: false,
        upvotes: 0,
        downvotes: 0,
        imageUrls: []
      };
    }
    
    // Get image URLs for the cafe
    console.log(`Getting image URLs for cafe ID ${supaCafe.id}...`);
    const imageUrls = await getCafeImageUrls(supaCafe.id);
    console.log(`Retrieved ${imageUrls.length} image URLs for cafe ID ${supaCafe.id}:`, imageUrls);
    
    // For Supabase, the data structure is flatter than Strapi
    // We need to ensure we have the basic required fields
    if (supaCafe.id === undefined) {
      console.error('Missing required id field:', supaCafe);
      throw new Error('Invalid cafe data: missing id');
    }
    
    // Parse location data which is stored as a JSON string in Supabase
    let locationData: CafeLocation = {
      city: '',
      address: '',
      country: ''
    };
    
    try {
      // Location might be a string (JSON) or already an object
      if (typeof supaCafe.location === 'string') {
        locationData = JSON.parse(supaCafe.location);
      } else if (supaCafe.location && typeof supaCafe.location === 'object') {
        locationData = supaCafe.location;
      }
    } catch (error) {
      console.error('Error parsing location data:', error);
      // Keep the default empty location
    }
    
    // Generate a Google Maps URL from the location data
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${locationData.address || ''}, ${locationData.city || ''}, ${locationData.country || ''}`
    )}`;
    
    // Handle image URL - ensure it's a full URL
    const imageUrl = ensureFullImageUrl(supaCafe.image);
    
    // Create a gallery array from the main image and any additional images
    const gallery: string[] = [];
    if (imageUrl) gallery.push(imageUrl);
    
    // Add any additional images from the gallery field if it exists
    if (supaCafe.gallery && Array.isArray(supaCafe.gallery)) {
      supaCafe.gallery.forEach((img: string) => {
        if (img) gallery.push(ensureFullImageUrl(img));
      });
    }
    
    // Construct the final cafe object with all the extracted data
    // Use default values for any missing properties to prevent undefined errors
    const cafe: Cafe = {
      id: supaCafe.id,
      created_at: supaCafe.created_at || new Date().toISOString(),
      name: supaCafe.name || supaCafe.Name || supaCafe.title || 'Unnamed Cafe',
      description: typeof supaCafe.description === 'string' ? supaCafe.description : 
                  (Array.isArray(supaCafe.Description) ? supaCafe.Description.map((d: any) => d.children?.map((c: any) => c.text).join('') || '').join('\n') : ''),
      location: locationData,
      wifi: supaCafe.wifi || supaCafe.hasWifi || false,
      powerOutletAvailable: supaCafe.powerOutletAvailable || supaCafe.hasPower || false,
      seatingCapacity: supaCafe.seatingCapacity,
      noiseLevel: supaCafe.noiseLevel,
      priceRange: supaCafe.priceRange,
      upvotes: supaCafe.upvotes || 0,
      downvotes: supaCafe.downvotes || 0,
      imageUrls: imageUrls.length > 0 ? imageUrls : supaCafe.image ? [supaCafe.image] : [],
      
      // Legacy fields for compatibility
      documentId: supaCafe.documentId || `cafe-${supaCafe.id}`,
      Name: supaCafe.name || 'Unknown Cafe',
      title: supaCafe.name || 'Unknown Cafe',
      image: imageUrls.length > 0 ? imageUrls[0] : supaCafe.image || '',
      Description: [{ 
        type: 'paragraph', 
        children: [{ 
          type: 'text', 
          text: supaCafe.description || 'No description available' 
        }] 
      }],
      hasWifi: Boolean(supaCafe.wifi),
      hasPower: Boolean(supaCafe.powerOutletAvailable),
      createdAt: supaCafe.created_at || new Date().toISOString(),
      updatedAt: supaCafe.updated_at || new Date().toISOString(),
      Location: {
        latitude: locationData.latitude || 0,
        longitude: locationData.longitude || 0,
        address: locationData.address || '',
        city: locationData.city || '',
        country: locationData.country || ''
      },
      location_legacy: {
        address: locationData.address || '',
        googleMapsUrl: googleMapsUrl
      },
      gallery: gallery,
      reviews: supaCafe.reviews || []
    };
    
    console.log('Transformed cafe:', cafe);
    return cafe;
  } catch (error) {
    console.error('Error transforming cafe data:', error);
    // Return a minimal valid cafe object to prevent crashes
    return {
      id: 0,
      created_at: new Date().toISOString(),
      name: 'Error Loading Cafe',
      description: 'There was an error loading this cafe. Please try again later.',
      location: {
        city: '',
        address: '',
        country: ''
      },
      imageUrls: [],
      wifi: false,
      powerOutletAvailable: false,
      upvotes: 0,
      downvotes: 0,
      
      // Legacy fields
      Name: 'Error Loading Cafe',
      image: '/images/placeholder.svg',
      hasWifi: false,
      hasPower: false
    };
  }
};

const cafeService = {
  // Make the transform function available
  transformCafeData,
  
  // Get all cafes
  getAllCafes: async (): Promise<Cafe[]> => {
    try {
      console.log('Fetching all cafes from Supabase...');
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise<{data: null, error: Error}>((resolve) => {
        setTimeout(() => {
          console.warn('Cafe query timed out after 10 seconds');
          resolve({
            data: null,
            error: new Error('Query timeout exceeded')
          });
        }, 10000); // 10 second timeout
      });
      
      console.log('test - Starting cafe query');
      
      // Create the actual query promise
      const queryPromise = supabase
        .from(CAFES_TABLE)
        .select('*')
        .order('name');
      
      // Race the query against the timeout
      const { data: cafesData, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);
      
      if (error) {
        console.error('Error fetching cafes:', error);
        return handleSupabaseError(error, 'getAllCafes');
      }
      
      if (!cafesData || cafesData.length === 0) {
        console.log('No cafes found or query timed out');
        return [];
      }
      
      // Transform each cafe to our application format with individual timeouts
      const transformPromises: Promise<Cafe>[] = cafesData.map(cafe => {
        console.log(`Starting transform for cafe ${cafe.id}`);
        const startTime = Date.now();
        
        return new Promise<Cafe>((resolve) => {
          // Create a timeout reference
          const timeoutId = setTimeout(() => {
            const duration = Date.now() - startTime;
            console.warn(`Transform for cafe ${cafe.id} timed out after ${duration}ms`);
            resolve({
              id: cafe.id || 0,
              name: cafe.name || 'Loading...',
              description: 'Loading cafe data...',
              location: { city: '', address: '', country: '' },
              wifi: false,
              powerOutletAvailable: false,
              upvotes: 0,
              downvotes: 0,
              imageUrls: ['/images/placeholder.svg'],
              created_at: new Date().toISOString()
            });
          }, 10000); // 10 second timeout

          // Start the transformation
          transformCafeData(cafe)
            .then(result => {
              clearTimeout(timeoutId);
              console.log(`Transform completed for cafe ${cafe.id} in ${Date.now() - startTime}ms`);
              resolve(result);
            })
            .catch(error => {
              console.error(`Error transforming cafe ${cafe.id}:`, error);
              clearTimeout(timeoutId);
              resolve({
                id: cafe.id || 0,
                name: cafe.name || 'Error Loading',
                description: 'Failed to load cafe data',
                location: { city: '', address: '', country: '' },
                wifi: false,
                powerOutletAvailable: false,
                upvotes: 0,
                downvotes: 0,
                imageUrls: ['/images/placeholder.svg'],
                created_at: new Date().toISOString()
              });
            });
        });
      });
      
      const cafes = await Promise.all(transformPromises);
      console.log(`Fetched ${cafes.length} cafes`);
      return cafes;
    } catch (error) {
      console.error('Error fetching cafes:', error);
      return [];
    }
  },
  
  // Get cafe by ID
  getCafeById: async (id: number): Promise<Cafe | null> => {
    try {
      console.log(`Fetching cafe with ID ${id}`);
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise<{data: null, error: Error}>((resolve) => {
        setTimeout(() => {
          console.warn(`Cafe ID ${id} query timed out after 10 seconds`);
          resolve({
            data: null,
            error: new Error(`Query timeout for cafe ID ${id}`)
          });
        }, 10000); // 10 second timeout
      });
      
      // Create the actual query promise
      const queryPromise = supabase
        .from(CAFES_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      
      // Race the query against the timeout
      const { data: cafeData, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);
      
      if (error) {
        console.error(`Error fetching cafe ID ${id}:`, error);
        return handleSupabaseError(error, `getCafeById-${id}`);
      }
      
      if (!cafeData) {
        console.error('No data returned for cafe ID:', id);
        return null;
      }
      
      // Transform the cafe data with timeout protection
      const transformPromise = transformCafeData(cafeData);
      const transformTimeoutPromise = new Promise<Cafe>((resolve) => {
        setTimeout(() => {
          console.warn(`Transform for cafe ID ${id} timed out, using fallback`);
          resolve({
            id: id,
            name: 'Timeout Error',
            description: 'This cafe data took too long to load',
            location: { city: '', address: '', country: '' },
            wifi: false,
            powerOutletAvailable: false,
            upvotes: 0,
            downvotes: 0,
            imageUrls: ['/images/placeholder.svg'],
            created_at: new Date().toISOString()
          });
        }, 5000); // 5 second timeout
      });
      
      // Race the transform against a timeout
      return await Promise.race([transformPromise, transformTimeoutPromise]);
    } catch (error) {
      console.error(`Error fetching cafe with ID ${id}:`, error);
      return null;
    }
  },
  
  // Search functionality has been moved to searchService.ts
  }


export default cafeService;
