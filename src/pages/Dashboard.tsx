import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getAppointmentsByDate } from '../services/appointmentsService'
import { getStudents } from '../services/studentsService'
import { getPayments } from '../services/paymentsService'
import { Appointment, Payment } from '../types'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color: string
  icon: React.ReactNode
}

function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [appts, students, payments] = await Promise.all([
        getAppointmentsByDate(today),
        getStudents(),
        getPayments(),
      ])
      setTodayAppointments(appts)
      setTotalStudents(students.filter(s => s.status === 'Ativo').length)
      setPendingPayments(payments.filter(p => p.status === 'Pendente' || p.status === 'Atrasado'))
      setLoading(false)
    }
    load()
  }, [today])

  const totalPendingAmount = pendingPayments.reduce((acc, p) => acc + p.amount, 0)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-500 mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <StatCard
            label="Aulas Hoje"
            value={todayAppointments.length}
            sub={`${todayAppointments.filter(a => a.status === 'Agendado').length} confirmadas`}
            color="bg-primary-100 text-primary-700"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Alunos Ativos"
            value={totalStudents}
            color="bg-green-100 text-green-700"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            label="A Receber"
            value={`R$ ${totalPendingAmount.toFixed(2).replace('.', ',')}`}
            sub={`${pendingPayments.length} pagamentos pendentes`}
            color="bg-yellow-100 text-yellow-700"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Aulas de Hoje</h3>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">Nenhuma aula agendada para hoje</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayAppointments.map(appt => (
                <div key={appt.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-bold text-sm">
                      {appt.time}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{appt.studentName}</p>
                      <p className="text-xs text-gray-500">{appt.serviceName} · {appt.professional}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    appt.status === 'Agendado' ? 'bg-blue-100 text-blue-700' :
                    appt.status === 'Concluído' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
