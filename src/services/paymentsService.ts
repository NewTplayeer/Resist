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
import { Payment } from '../types'

const COLLECTION = 'payments'

export async function getPayments(): Promise<Payment[]> {
  const q = query(collection(db, COLLECTION), orderBy('dueDate', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment))
}

export async function getPaymentsByPeriod(startDate: string, endDate: string): Promise<Payment[]> {
  const q = query(
    collection(db, COLLECTION),
    where('dueDate', '>=', startDate),
    where('dueDate', '<=', endDate),
    orderBy('dueDate'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment))
}

export async function addPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...payment,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updatePayment(id: string, data: Partial<Payment>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data)
}

export async function deletePayment(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
