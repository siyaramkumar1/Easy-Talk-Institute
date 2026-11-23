import cloudinary from '../config/cloudinary';

export const deleteCloudinaryAsset = async (publicIdOrUrl: string) => {
  try {
    if (publicIdOrUrl) {
      let publicId = publicIdOrUrl;
      // If it's a URL, extract the public ID
      if (publicIdOrUrl.startsWith('http')) {
        if (!publicIdOrUrl.includes('cloudinary.com')) {
          return; // Not a Cloudinary asset, safely skip
        }
        const urlParts = publicIdOrUrl.split('/');
        // Cloudinary URL format usually looks like:
        // https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/EasyTalk/folder/filename.jpg
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
           // parts after version
           const relevantParts = urlParts.slice(uploadIndex + 2);
           const idWithExtension = relevantParts.join('/');
           publicId = idWithExtension.substring(0, idWithExtension.lastIndexOf('.'));
        }
      }
      
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting image from cloudinary:', error);
  }
};
