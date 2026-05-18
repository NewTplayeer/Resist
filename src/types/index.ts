import { Timestamp } from 'firebase/firestore'

export interface Student {
  id?: string
  name: string
  cpf: string
  phone: string
  email: string
  birthDate: string
  healthNotes: string
  status: 'Ativo' | 'Inativo'
  createdAt?: Timestamp
}

export interface Service {
  id?: string
  name: string
  basePrice: number
  createdAt?: Timestamp
}

export type AppointmentStatus = 'Agendado' | 'Cancelado' | 'Concluído'
export type Professional = 'Pilates' | 'Fisioterapia'

export interface Appointment {
  id?: string
  studentId: string
  studentName: string
  serviceId: string
  serviceName: string
  professional: Professional
  date: string
  time: string
  status: AppointmentStatus
  createdAt?: Timestamp
}

export type PaymentStatus = 'Pago' | 'Pendente' | 'Atrasado'

export interface Payment {
  id?: string
  studentId: string
  studentName: string
  serviceId: string
  serviceName: string
  amount: number
  status: PaymentStatus
  dueDate: string
  paidAt?: string
  description: string
  createdAt?: Timestamp
}
