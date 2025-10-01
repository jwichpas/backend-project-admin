import { defineComponent, h } from 'vue'

export const Select = defineComponent({
  name: 'Select',
  setup(_, { slots }) {
    return () => slots.default?.()
  }
})

export const SelectTrigger = defineComponent({
  name: 'SelectTrigger',
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

export const SelectValue = defineComponent({
  name: 'SelectValue',
  setup(_, { slots }) {
    return () => slots.default?.()
  }
})

export const SelectContent = defineComponent({
  name: 'SelectContent',
  setup(_, { slots }) {
    return () => slots.default?.()
  }
})

export const SelectItem = defineComponent({
  name: 'SelectItem',
  props: {
    value: {
      type: String,
      required: true
    }
  },
  setup(_, { slots }) {
    return () => slots.default?.()
  }
})
