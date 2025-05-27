import { supabase } from '../supabase-client';
import type { Cafe, CafeLocation } from '../data/cafes';

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
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
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
      .list(folderPath);
    
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

// Transform Supabase cafe data to our application's Cafe format
// Export this so it can be used by other services
export const transformCafeData = async (supaCafe: any): Promise<Cafe> => {
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
      
      const { data: cafesData, error } = await supabase
        .from(CAFES_TABLE)
        .select('*')
        .order('name');
      
      if (error) {
        return handleSupabaseError(error, 'getAllCafes');
      }
      
      if (!cafesData || cafesData.length === 0) {
        console.log('No cafes found');
        return [];
      }
      
      // Transform each cafe to our application format
      const cafes = await Promise.all(cafesData.map(cafe => transformCafeData(cafe)));
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
      console.log(`Fetching cafe with ID ${id} from Supabase...`);
      const { data: cafeData, error } = await supabase
        .from(CAFES_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return handleSupabaseError(error, `getCafeById-${id}`);
      }
      
      if (!cafeData) {
        console.error('No data returned for cafe ID:', id);
        return null;
      }
      
      // Transform the cafe data to our application format
      return await transformCafeData(cafeData);
    } catch (error) {
      console.error(`Error fetching cafe with ID ${id}:`, error);
      return null;
    }
  },
  
  // Search cafes by query
  searchCafes: async (query: string): Promise<Cafe[]> => {
    try {
      console.log(`Searching cafes for query: ${query}`);
      const { data: cafesData, error } = await supabase
        .from(CAFES_TABLE)
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      
      if (error) {
        return handleSupabaseError(error, `searchCafes-${query}`);
      }
      
      if (!cafesData || cafesData.length === 0) {
        console.log('No matching cafes found for query:', query);
        return [];
      }
      
      // Transform each cafe to our application format
      return await Promise.all(cafesData.map(cafe => transformCafeData(cafe)));
    } catch (error) {
      console.error('Error searching cafes:', error);
      return [];
    }
  },
  
  // Upvote a cafe
  upvoteCafe: async (cafeId: number): Promise<boolean> => {
    try {
      // First get the current upvote count
      const { data: cafeData, error: getError } = await supabase
        .from(CAFES_TABLE)
        .select('upvotes')
        .eq('id', cafeId)
        .single();
      
      if (getError) {
        return handleSupabaseError(getError, `upvoteCafe-get-${cafeId}`);
      }
      
      if (!cafeData) {
        console.error('No cafe found with ID:', cafeId);
        return false;
      }
      
      // Increment the upvote count
      const newUpvotes = (cafeData.upvotes || 0) + 1;
      
      // Update the cafe with the new upvote count
      const { error: updateError } = await supabase
        .from(CAFES_TABLE)
        .update({ upvotes: newUpvotes })
        .eq('id', cafeId);
      
      if (updateError) {
        return handleSupabaseError(updateError, `upvoteCafe-update-${cafeId}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error upvoting cafe with ID ${cafeId}:`, error);
      return false;
    }
  },
  
  // Get upvoted cafes - this would require a separate table for user upvotes
  // For now, we'll just return all cafes with upvotes > 0
  getUpvotedCafes: async (): Promise<Cafe[]> => {
    try {
      console.log('Fetching upvoted cafes...');
      const { data: cafesData, error } = await supabase
        .from(CAFES_TABLE)
        .select('*')
        .gt('upvotes', 0)
        .order('upvotes', { ascending: false });
      
      if (error) {
        return handleSupabaseError(error, 'getUpvotedCafes');
      }
      
      if (!cafesData || cafesData.length === 0) {
        console.log('No upvoted cafes found');
        return [];
      }
      
      return await Promise.all(cafesData.map(cafe => transformCafeData(cafe)));
    } catch (error) {
      console.error('Error fetching upvoted cafes:', error);
      return [];
    }
  },
  
  // Check if a cafe is upvoted - implemented in upvoteService
  isCafeUpvoted: async (cafeId: number): Promise<boolean> => {
    // This functionality is now implemented in upvoteService
    // Importing it here would create a circular dependency
    // This method is kept for API compatibility
    return false;
  }
};

export default cafeService;
