export class CloudinaryService {
  static async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('media', file);
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  }

  static isValidFileType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    return allowedTypes.includes(file.type);
  }

  static getFileType(file: File): 'image' | 'video' {
    return file.type.startsWith('video/') ? 'video' : 'image';
  }
}
