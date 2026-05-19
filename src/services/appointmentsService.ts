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
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { Appointment } from '../types'

const COLLECTION = 'appointments'

export async function getAppointments(): Promise<Appointment[]> {
  const q = query(collection(db, COLLECTION), orderBy('date'), orderBy('time'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment))
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const q = query(
    collection(db, COLLECTION),
    where('date', '==', date),
    orderBy('time'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment))
}

export async function addAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...appointment,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data)
}

export async function deleteAppointment(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
