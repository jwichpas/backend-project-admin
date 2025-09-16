import { supabase } from '@/lib/supabase'

export const ensureInvoicesBucketExists = async (): Promise<void> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }

    const invoicesBucket = buckets?.find(bucket => bucket.name === 'invoices')

    if (!invoicesBucket) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket('invoices', {
        public: true,
        allowedMimeTypes: ['application/xml', 'application/zip', 'text/xml'],
        fileSizeLimit: 10485760 // 10MB
      })

      if (createError) {
        console.error('Error creating invoices bucket:', createError)
      } else {
        console.log('Invoices bucket created successfully')
      }
    }
  } catch (error) {
    console.error('Error ensuring invoices bucket exists:', error)
  }
}

export const generateInvoiceFileName = (series: string, number: string, type: 'xml' | 'cdr'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const extension = type === 'xml' ? 'xml' : 'zip'
  return `${series}-${number}-${timestamp}${type === 'cdr' ? '-cdr' : ''}.${extension}`
}