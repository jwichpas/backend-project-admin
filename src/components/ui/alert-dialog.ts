import { defineComponent, h } from 'vue'

// AlertDialog Components
export const AlertDialog = defineComponent({
  name: 'AlertDialog',
  props: {
    open: {
      type: Boolean,
      default: false
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
        class: 'fixed inset-0 z-50 flex items-center justify-center',
        onKeydown: (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            closeDialog()
          }
        }
      }, [
        h('div', {
          class: 'fixed inset-0 bg-black/50 transition-opacity',
          onClick: closeDialog
        }),
        h('div', {
          class: 'relative z-50',
          onClick: (e: Event) => e.stopPropagation()
        }, slots.default?.())
      ])
    }
  }
})

export const AlertDialogTrigger = defineComponent({
  name: 'AlertDialogTrigger',
  props: {
    asChild: {
      type: Boolean,
      default: false
    }
  },
  setup(_, { slots }) {
    return () => slots.default?.()
  }
})

export const AlertDialogContent = defineComponent({
  name: 'AlertDialogContent',
  setup(_, { slots }) {
    return () => h('div', {
      class: 'bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4'
    }, slots.default?.())
  }
})

export const AlertDialogHeader = defineComponent({
  name: 'AlertDialogHeader',
  setup(_, { slots }) {
    return () => h('div', {
      class: 'space-y-2'
    }, slots.default?.())
  }
})

export const AlertDialogTitle = defineComponent({
  name: 'AlertDialogTitle',
  setup(_, { slots }) {
    return () => h('h2', {
      class: 'text-lg font-semibold text-gray-900'
    }, slots.default?.())
  }
})

export const AlertDialogDescription = defineComponent({
  name: 'AlertDialogDescription',
  setup(_, { slots }) {
    return () => h('p', {
      class: 'text-sm text-gray-500'
    }, slots.default?.())
  }
})

export const AlertDialogFooter = defineComponent({
  name: 'AlertDialogFooter',
  setup(_, { slots }) {
    return () => h('div', {
      class: 'flex gap-2 justify-end'
    }, slots.default?.())
  }
})

export const AlertDialogCancel = defineComponent({
  name: 'AlertDialogCancel',
  props: {
    onClick: {
      type: Function,
      default: () => {}
    }
  },
  setup(props, { slots }) {
    return () => h('button', {
      type: 'button',
      class: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
      onClick: props.onClick
    }, slots.default?.())
  }
})

export const AlertDialogAction = defineComponent({
  name: 'AlertDialogAction',
  props: {
    onClick: {
      type: Function,
      default: () => {}
    }
  },
  setup(props, { slots, attrs }) {
    return () => h('button', {
      type: 'button',
      class: attrs.class || 'px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
      onClick: props.onClick
    }, slots.default?.())
  }
})
