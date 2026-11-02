import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardPagination from './DashboardPagination.vue'

const paginationStub = {
  name: 'ElPagination',
  props: ['currentPage', 'pageSize', 'total', 'layout'],
  emits: ['update:current-page', 'current-change'],
  template: '<div class="pagination-stub" />',
}

function mountPagination(page: number, pageSize: number, total: number) {
  return mount(DashboardPagination, {
    props: { page, pageSize, total },
    global: { stubs: { 'el-pagination': paginationStub } },
  })
}

describe('DashboardPagination', () => {
  it('总条数不超过每页条数时隐藏分页', () => {
    const wrapper = mountPagination(1, 12, 12)
    expect(wrapper.find('.pagination-stub').exists()).toBe(false)
  })

  it('超过一页时透传分页参数', () => {
    const wrapper = mountPagination(2, 12, 30)
    const pagination = wrapper.findComponent({ name: 'ElPagination' })

    expect(pagination.props('currentPage')).toBe(2)
    expect(pagination.props('pageSize')).toBe(12)
    expect(pagination.props('total')).toBe(30)
    expect(pagination.props('layout')).toBe('prev, pager, next, total')
  })

  it('翻页与页码更新分别向外抛出事件', () => {
    const wrapper = mountPagination(1, 12, 30)
    const pagination = wrapper.findComponent({ name: 'ElPagination' })

    pagination.vm.$emit('current-change')
    expect(wrapper.emitted('change')).toHaveLength(1)

    pagination.vm.$emit('update:current-page', 3)
    expect(wrapper.emitted('update:page')?.[0]).toEqual([3])
  })
})
