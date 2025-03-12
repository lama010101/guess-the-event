
import { supabase } from './client';

// Ensure avatars bucket exists
export const ensureAvatarsBucketExists = async () => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
    
    // If it doesn't exist, create it
    if (!avatarBucketExists) {
      // Most likely a row-level security error because we're using anon key
      // We'll handle this gracefully and just log the error
      const { error } = await supabase.storage.createBucket('avatars', {
        public: true
      });
      
      if (error) {
        // Don't throw the error since users can still use the app without avatar uploads
        console.error('Error creating avatars bucket:', error);
      }
    }
  } catch (error) {
    console.error('Error ensuring avatars bucket exists:', error);
  }
};

// Helper function to upload avatar
export const uploadAvatar = async (userId: string, file: File) => {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}.${fileExt}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      // Check if it's a storage permission error
      if (uploadError.message?.includes('row-level security policy') || 
          uploadError.message?.includes('bucket does not exist') ||
          uploadError.message?.includes('access denied')) {
        throw new Error('Permission denied: Unable to upload avatar. Please contact support.');
      }
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};
