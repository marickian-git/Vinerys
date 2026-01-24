import prisma from '@/utils/db'


const prismaHandlers = async () => {
  // await prisma.task.create({ data: { content: 'wake up' } })
  console.log("prisma example")
  const alltasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return alltasks
}

const PrismaExample = async () => {

  const tasks = await prismaHandlers();
  return (
    <div>
      {
        tasks.map(task => {
          return <h2 key={task.id} className='tet-xl py2 '>🤥
            {task.content} </h2>
        })
      }

    </div>
  )
}

export default PrismaExample