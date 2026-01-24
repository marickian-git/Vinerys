import { editTask } from '@/utils/actions'

const EditForm = async ({task}) => {
  const {id , content, completed } = task
   return (
    <form action={editTask} className='max-w-sm p-12 boder border-base-300 rounded-lg'>
    
    <input type='hidden' value={id} name='id' /> 
    <input type='text' defaultValue={content} name='content' required className='input input-bordered w-full' /> 

    <div className=' form-control'>
      <label htmlFor='completed' className='label cursor-pointer py-6'>
        <span className='label-text'> completed</span>
        <input type="checkbox" defaultChecked={completed} id="completed" name="completed" className="checkbox checkbox-primary checkbox-sm" />
      </label>
    </div>

    <button type="submit" className="btn btn-primary btn-sm btn-block">Update</button>

    </form>
  )
}

export default EditForm