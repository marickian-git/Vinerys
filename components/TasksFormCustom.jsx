'use client'

 import { useFormStatus} from "react-dom";
 import { useFormState } from "react-dom";
 import { createTaskCustom } from '@/utils/actions'
import { useEffect } from 'react';
import toast from 'react-hot-toast';


 const initialState = {
  message: ''
};

 const SubmitBtn =  () => {
  const { pending } = useFormStatus();

  return (<button type='submit' className='btn btn-primary join-item' disabled={pending}> { pending ? 'please wait...' : 'create task'}</button>)
 }

 const TasksForm = () => {

  const [state, formAction] = useFormState(createTaskCustom, initialState);

  useEffect(()=>{
    if (state.message == "success") {
      toast.success("Task created!")
    }

    if (state.message == "error") {
      toast.error("Error created task!")
    }
  },[state])

  return (

    <form action={formAction}>
      {/* {state.message ?  <p className='mb-2'>{state.message}</p> : null} */}
        <div className='join w-full'>
            <input  type='text' className='input input-bordered join-item w-full' placeholder='type here' name="content" required/> 
           <SubmitBtn />
        </div>
    </form>
  )
}

export default TasksForm