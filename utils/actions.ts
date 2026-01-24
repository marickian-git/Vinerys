"use server";

import { revalidatePath } from "next/cache";
import prisma from "./db";
import { redirect } from "next/navigation";
import { z } from "zod";

export const getAllTasks = async () => {
  return await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
};

export const createTask = async (formdata) => {
  const content = formdata.get("content");
  await prisma.task.create({
    data: {
      content,
    },
  });
  revalidatePath("/tasks");
};

export const createTaskCustom = async (currentState, formdata) => {
  const content = formdata.get("content");
  const taskSchema = z.object({
    content: z.string().min(5),
  });

  try {
    taskSchema.parse({ content });
    await prisma.task.create({
      data: {
        content,
      },
    });
    revalidatePath("/tasks");
    return { message: "success" };
  } catch (error) {
    console.log(error);
    return { message: "error" };
  }
};
export const deleteTask = async (formdata) => {
  const id = formdata.get("id");
  await prisma.task.delete({
    where: {
      id,
    },
  });
  revalidatePath("/tasks");
};

export const getTask = async (id) => {
  return await prisma.task.findUnique({
    where: {
      id,
    },
  });
};

export const editTask = async (formdata) => {
  const id = formdata.get("id");
  const content = formdata.get("content");
  const completed = formdata.get("completed");

  await prisma.task.update({
    data: {
      content,
      completed: completed == "false" ? false : true,
    },
    where: {
      id,
    },
  });
  redirect("/tasks");
};
