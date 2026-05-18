import { useEffect, useState } from 'react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { getAppointments, addAppointment, updateAppointment, deleteAppointment } from '../services/appointmentsService'
import { getStudents } from '../services/studentsService'
import { getServices } from '../services/servicesService'
import { Appointment, Student, Service, Professional, AppointmentStatus } from '../types'
import Button from '../components/Button'
import Input, { Select } from '../components/Input'
import Modal, { ConfirmDialog } from '../components/Modal'

const TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
]

const PROFESSIONALS: Professional[] = ['Pilates', 'Fisioterapia']

const EMPTY_FORM = {
  studentId: '',
  studentName: '',
  serviceId: '',
  serviceName: '',
  professional: 'Pilates' as Professional,
  date: format(new Date(), 'yyyy-MM-dd'),
  time: '08:00',
  status: 'Agendado' as AppointmentStatus,
}

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Appointment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  async function load() {
    setLoading(true)
    try {
      const [appts, studs, servs] = await Promise.all([
        getAppointments(),
        getStudents(),
        getServices(),
      ])
      setAppointments(appts)
      setStudents(studs.filter(s => s.status === 'Ativo'))
      setServices(servs)
    } catch {
      toast.error('Erro ao carregar agenda')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, date: selectedDate })
    setModalOpen(true)
  }

  function openEdit(appt: Appointment) {
    setEditTarget(appt)
    setForm({
      studentId: appt.studentId,
      studentName: appt.studentName,
      serviceId: appt.serviceId,
      serviceName: appt.serviceName,
      professional: appt.professional,
      date: appt.date,
      time: appt.time,
      status: appt.status,
    })
    setModalOpen(true)
  }

  function handleStudentChange(studentId: string) {
    const student = students.find(s => s.id === studentId)
    setForm(f => ({ ...f, studentId, studentName: student?.name || '' }))
  }

  function handleServiceChange(serviceId: string) {
    const service = services.find(s => s.id === serviceId)
    setForm(f => ({ ...f, serviceId, serviceName: service?.name || '' }))
  }

  async function handleSave() {
    if (!form.studentId) return toast.error('Selecione um aluno')
    if (!form.serviceId) return toast.error('Selecione um serviço')
    setSaving(true)
    try {
      if (editTarget?.id) {
        await updateAppointment(editTarget.id, form)
        toast.success('Agendamento atualizado!')
      } else {
        await addAppointment(form)
        toast.success('Aula agendada!')
      }
      setModalOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar agendamento')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await deleteAppointment(deleteTarget.id)
      toast.success('Agendamento cancelado')
      setConfirmOpen(false)
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Erro ao cancelar agendamento')
    } finally {
      setDeleting(false)
    }
  }

  const dayAppointments = appointments.filter(a => a.date === selectedDate)

  const statusColor = (status: AppointmentStatus) => {
    if (status === 'Agendado') return 'bg-blue-100 text-blue-700'
    if (status === 'Concluído') return 'bg-green-100 text-green-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Agenda</h2>
            <p className="text-gray-500 mt-1">Gerencie as aulas e horários</p>
          </div>
          <Button onClick={openNew}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agendar Aula
          </Button>
        </div>

        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => setSelectedDate(subDays(parseISO(selectedDate), 1).toISOString().slice(0, 10))}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
            <Button variant="secondary" size="sm" onClick={() => setSelectedDate(addDays(parseISO(selectedDate), 1).toISOString().slice(0, 10))}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
            <span className="text-sm font-semibold text-gray-700 capitalize">
              {format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </span>
            <span className="ml-auto text-sm text-gray-400">{dayAppointments.length} agendamento(s)</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-3">
            {TIMES.map(time => {
              const slot = dayAppointments.filter(a => a.time === time)
              return (
                <div key={time} className="card flex gap-4 items-start py-4">
                  <div className="w-14 text-sm font-bold text-primary-600 pt-0.5 shrink-0">{time}</div>
                  <div className="flex-1">
                    {slot.length === 0 ? (
                      <p className="text-xs text-gray-300 italic">Horário livre</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {slot.map(appt => (
                          <div key={appt.id} className="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center text-primary-800 font-bold text-xs">
                                {appt.studentName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{appt.studentName}</p>
                                <p className="text-xs text-gray-500">{appt.serviceName} · {appt.professional}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(appt.status)}`}>
                                {appt.status}
                              </span>
                              <Button variant="ghost" size="sm" onClick={() => openEdit(appt)}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => { setDeleteTarget(appt); setConfirmOpen(true) }}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Editar Agendamento' : 'Nova Aula'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>
              {editTarget ? 'Salvar' : 'Agendar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Aluno"
            value={form.studentId}
            onChange={e => handleStudentChange(e.target.value)}
            options={[
              { value: '', label: 'Selecione o aluno...' },
              ...students.map(s => ({ value: s.id!, label: s.name })),
            ]}
          />
          <Select
            label="Serviço"
            value={form.serviceId}
            onChange={e => handleServiceChange(e.target.value)}
            options={[
              { value: '', label: 'Selecione o serviço...' },
              ...services.map(s => ({ value: s.id!, label: s.name })),
            ]}
          />
          <Select
            label="Profissional"
            value={form.professional}
            onChange={e => setForm({ ...form, professional: e.target.value as Professional })}
            options={PROFESSIONALS.map(p => ({ value: p, label: p }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data"
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />
            <Select
              label="Horário"
              value={form.time}
              onChange={e => setForm({ ...form, time: e.target.value })}
              options={TIMES.map(t => ({ value: t, label: t }))}
            />
          </div>
          {editTarget && (
            <Select
              label="Status"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as AppointmentStatus })}
              options={[
                { value: 'Agendado', label: 'Agendado' },
                { value: 'Concluído', label: 'Concluído' },
                { value: 'Cancelado', label: 'Cancelado' },
              ]}
            />
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Cancelar Agendamento"
        message={`Deseja cancelar a aula de "${deleteTarget?.studentName}" às ${deleteTarget?.time}?`}
      />
    </div>
  )
}
