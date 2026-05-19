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
import { Service } from '../types'

const COLLECTION = 'services'

export async function getServices(): Promise<Service[]> {
  const q = query(collection(db, COLLECTION), orderBy('name'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Service))
}

export async function addService(service: Omit<Service, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...service,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateService(id: string, data: Partial<Service>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data)
}

export async function deleteService(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
