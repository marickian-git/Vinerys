import TasksForm from '@/components/TasksForm'
import TasksFormCustom from '@/components/TasksFormCustom'
export const dynamic = 'force-dynamic'

import TasksList from '@/components/TasksList'
import React from 'react'

const Tasks = () => {
  return (
    <div className='max-w-lg'>
      {/* <TasksForm></TasksForm> */}
      <TasksFormCustom></TasksFormCustom>
      <TasksList></TasksList>
    </div>
  )
}

export default Tasks