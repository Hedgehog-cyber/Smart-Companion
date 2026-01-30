'use client';

import { doc, type DocumentReference, type Firestore } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from './non-blocking-updates';
import type { Task } from '@/lib/types';

const TASK_ID = 'current_task';

/**
 * Returns a DocumentReference to the user's current task document.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @returns A DocumentReference for /users/{userId}/tasks/current_task.
 */
export function getTaskRef(firestore: Firestore, userId: string): DocumentReference {
  return doc(firestore, 'users', userId, 'tasks', TASK_ID);
}

/**
 * Saves (creates or overwrites) a task for a user.
 * This is a non-blocking "fire-and-forget" operation.
 * @param docRef The DocumentReference for the task.
 * @param task The task data to save.
 */
export function saveTask(docRef: DocumentReference, task: Task) {
    setDocumentNonBlocking(docRef, task, {});
}

/**
 * Deletes a user's task.
 * This is a non-blocking "fire-and-forget" operation.
 * @param docRef The DocumentReference for the task.
 */
export function deleteTask(docRef: DocumentReference) {
    deleteDocumentNonBlocking(docRef);
}
