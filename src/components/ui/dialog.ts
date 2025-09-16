// Dialog Components Export
import { defineComponent, h, computed } from 'vue'

// Main Dialog Container
export const Dialog = defineComponent({
  name: 'Dialog',
  props: {
    open: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:open'],
  setup(props, { emit, slots }) {
    const closeDialog = () => {
      emit('update:open', false)
    }

    return () => {
      if (!props.open) return null

      return h('div', {
        class: 'fixed inset-0 z-50 overflow-y-auto',
        onKeydown: (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            closeDialog()
          }
        }
      }, [
        // Backdrop
        h('div', {
          class: 'fixed inset-0 bg-black bg-opacity-50 transition-opacity',
          onClick: closeDialog
        }),
        // Dialog Container
        h('div', {
          class: 'flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'
        }, [
          h('div', {
            class: 'relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg',
            onClick: (e: Event) => e.stopPropagation()
          }, slots.default?.())
        ])
      ])
    }
  }
})

// Dialog Content Components
export const DialogContent = defineComponent({
  name: 'DialogContent',
  setup(_, { slots }) {
    return () => h('div', { class: 'bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4' }, slots.default?.())
  }
})

export const DialogHeader = defineComponent({
  name: 'DialogHeader',
  setup(_, { slots }) {
    return () => h('div', { class: 'mb-4' }, slots.default?.())
  }
})

export const DialogTitle = defineComponent({
  name: 'DialogTitle',
  setup(_, { slots }) {
    return () => h('h3', {
      class: 'text-lg font-semibold leading-6 text-gray-900',
      id: 'modal-title'
    }, slots.default?.())
  }
})

export const DialogDescription = defineComponent({
  name: 'DialogDescription',
  setup(_, { slots }) {
    return () => h('p', {
      class: 'text-sm text-gray-500 mt-2'
    }, slots.default?.())
  }
})

export const DialogFooter = defineComponent({
  name: 'DialogFooter',
  setup(_, { slots }) {
    return () => h('div', {
      class: 'bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6'
    }, slots.default?.())
  }
})

// Dialog Trigger (for completeness)
export const DialogTrigger = defineComponent({
  name: 'DialogTrigger',
  setup(_, { slots }) {
    return () => slots.default?.()
  }
})