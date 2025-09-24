import { createClientComponentClient } from './supabase'

export class StorageService {
  private supabase = createClientComponentClient()
  private bucketName = 'ticket-attachments'

  async uploadFile(file: File, ticketId?: string): Promise<string | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Failed to upload file:', error)
      return null
    }
  }

  async deleteFile(url: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const urlParts = url.split('/')
      const fileName = urlParts.slice(-2).join('/') // user_id/filename

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([fileName])

      if (error) {
        console.error('Delete error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to delete file:', error)
      return false
    }
  }

  async uploadMultipleFiles(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file))
    const results = await Promise.all(uploadPromises)
    return results.filter(url => url !== null) as string[]
  }

  getFileNameFromUrl(url: string): string {
    const parts = url.split('/')
    return parts[parts.length - 1]
  }

  isImage(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    return imageExtensions.some(ext => url.toLowerCase().includes(ext))
  }
}

export const storageService = new StorageService()
