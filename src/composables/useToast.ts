import { ref, reactive } from 'vue'

export interface ToastProps {
  id?: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface Toast extends Required<ToastProps> {
  id: string
}

const toasts = ref<Toast[]>([])

let toastCounter = 0

export const useToast = () => {
  const toast = (props: ToastProps) => {
    const id = props.id || `toast-${++toastCounter}`
    const duration = props.duration || 5000
    
    const newToast: Toast = {
      id,
      title: props.title || '',
      description: props.description || '',
      variant: props.variant || 'default',
      duration
    }
    
    toasts.value.push(newToast)
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
    
    return {
      id,
      dismiss: () => dismiss(id),
      update: (newProps: Partial<ToastProps>) => update(id, newProps)
    }
  }
  
  const dismiss = (toastId: string) => {
    const index = toasts.value.findIndex(t => t.id === toastId)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const update = (toastId: string, props: Partial<ToastProps>) => {
    const toast = toasts.value.find(t => t.id === toastId)
    if (toast) {
      Object.assign(toast, props)
    }
  }
  
  const dismissAll = () => {
    toasts.value.splice(0)
  }
  
  return {
    toast,
    toasts,
    dismiss,
    dismissAll
  }
}