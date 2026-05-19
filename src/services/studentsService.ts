import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { Student } from '../types'

const COLLECTION = 'students'

export async function getStudents(): Promise<Student[]> {
  const q = query(collection(db, COLLECTION), orderBy('name'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student))
}

export async function addStudent(student: Omit<Student, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...student,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data)
}

export async function deleteStudent(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
